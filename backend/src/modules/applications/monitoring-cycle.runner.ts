import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { ApplicationState } from "../../database/entities/application-state";
import { ApplicationStateReason } from "../../database/entities/application-state-reason";
import { ApplicationEntity } from "../../database/entities/application.entity";
import { MonitoringCycleStatus } from "../../database/entities/monitoring-cycle.entity";
import { CollectionsRepository } from "../../database/repositories/collections.repository";
import { MonitoringCyclesRepository } from "../../database/repositories/monitoring-cycles.repository";
import { IntegrationError } from "../../integrations/integration-error";
import {
  MetricsAggregatorAdapter,
  ServiceSummary,
} from "../../integrations/metrics-aggregator.adapter";
import { ApplicationsRepository } from "./applications.repository";
import { DiscoveryService } from "./discovery.service";
import { MetadataSyncService } from "./metadata-sync.service";
import { RemovalService } from "./removal.service";
import { ReturnService } from "./return.service";
import { StatusClassificationService } from "./status-classification.service";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { MonitoringIntegration } from "../../database/entities/monitoring-incident.entity";
import {
  CarbonFactorPersistenceError,
  CarbonFactorService,
} from "../../integrations/carbon-factor.service";
import { MonitoringCycleLock } from "./monitoring-cycle.lock";
import { type StatusEvidence } from "./application-status-classifier";

interface CycleCounts {
  discoveredCount: number;
  processedCount: number;
  failedCount: number;
  persistedCount: number;
}

@Injectable()
export class MonitoringCycleRunner implements OnApplicationShutdown {
  private activeController: AbortController | null = null;
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly cycles: MonitoringCyclesRepository,
    private readonly discovery: DiscoveryService,
    private readonly metadata: MetadataSyncService,
    private readonly removal: RemovalService,
    private readonly returns: ReturnService,
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
    private readonly statuses: StatusClassificationService,
    @Inject("MONITORING_METRICS_CONCURRENCY")
    private readonly concurrency: number,
    private readonly incidents: MonitoringIncidentsService,
    private readonly carbonFactors: CarbonFactorService,
    private readonly cycleLock: MonitoringCycleLock,
  ) {}

  async run(): Promise<void> {
    if (!this.cycleLock.acquire()) return;
    this.activeController = new AbortController();
    try {
      await this.runCycle(this.activeController.signal);
    } finally {
      this.activeController = null;
      this.cycleLock.release();
    }
  }

  async recordDelayedCycle(skippedAt: Date): Promise<void> {
    let applications: ApplicationEntity[];
    try {
      applications = await this.applications.findForCollection();
    } catch {
      this.logPersistenceFailure(
        null,
        null,
        "load-scheduler-delay-applications",
      );
      return;
    }

    await this.forEachLimited(applications, async (application) => {
      if (
        application.lastCheckedAt &&
        application.lastCheckedAt.getTime() >= skippedAt.getTime()
      )
        return;
      try {
        await this.statuses.record(
          application.id,
          {
            kind: "source_failure",
            reason: ApplicationStateReason.MONITORING_CYCLE_DELAYED,
            observedAt: skippedAt,
          },
          null,
        );
      } catch {
        this.logPersistenceFailure(
          application.id,
          null,
          "record-scheduler-delay-status",
        );
      }
    });
  }

  onApplicationShutdown(): void {
    this.activeController?.abort();
  }

  private async runCycle(signal: AbortSignal): Promise<void> {
    const cycle = await this.cycles.start({ source: "scheduled-monitoring" });
    const counts: CycleCounts = {
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 0,
      persistedCount: 0,
    };
    let hasUsefulResult = false;
    const failures: Array<{
      applicationId: string | null;
      errorCode: string;
      integration?: string;
    }> = [];
    let snapshot: ServiceSummary[];

    try {
      snapshot = await this.adapter.fetchServices(signal);
    } catch (error) {
      if (signal.aborted || this.isCancellation(error)) {
        await this.finishCancelled(cycle.id, counts);
        return;
      }
      const incidentPersisted = await this.incidents.recordFailure(
        {
          source: "metrics-aggregator",
          applicationId: null,
          integration: MonitoringIntegration.SERVICES,
        },
        this.getSafeReason(error, MonitoringIntegration.SERVICES),
        cycle.id,
        new Date(),
        this.getHttpAttempts(error),
      );
      counts.failedCount = incidentPersisted ? 1 : 2;
      await this.finish(cycle.id, counts, MonitoringCycleStatus.FAILED, error);
      throw error;
    }

    try {
      counts.discoveredCount = await this.discovery.discover(
        cycle.id,
        snapshot,
      );
      await this.metadata.reconcile(cycle.id, snapshot);
      await this.returns.reconcile(cycle.id, snapshot);
      await this.removal.reconcile(cycle.id, snapshot);
      const incidentPersisted = await this.incidents.recordSuccess(
        {
          source: "metrics-aggregator",
          applicationId: null,
          integration: MonitoringIntegration.SERVICES,
        },
        cycle.id,
        new Date(),
      );
      if (!incidentPersisted) {
        failures.push({
          applicationId: null,
          errorCode: "DATABASE_WRITE_FAILED",
          integration: "incident-persistence",
        });
      }
    } catch (error) {
      await this.finish(cycle.id, counts, MonitoringCycleStatus.FAILED, error);
      throw error;
    }

    let targets: ApplicationEntity[];
    try {
      const eligible = await this.applications.findForCollection();
      const eligibleIds = new Set(snapshot.map((service) => service.id));
      targets = eligible.filter((application) =>
        eligibleIds.has(application.id),
      );
    } catch (error) {
      await this.finish(cycle.id, counts, MonitoringCycleStatus.FAILED, error);
      throw error;
    }
    counts.processedCount = targets.length;
    await this.forEachLimited(targets, async (application) => {
      let observation:
        | Awaited<ReturnType<MetricsAggregatorAdapter["fetchMetrics"]>>
        | undefined;
      let metricsFailed = false;
      let metricsError: unknown;
      try {
        observation = await this.adapter.fetchMetrics(application.id, signal);
      } catch (error) {
        metricsFailed = true;
        metricsError = error;
      }

      let carbonFactorAvailable = false;
      if (application.regionCode) {
        try {
          await this.carbonFactors.capture(application.regionCode, signal);
          carbonFactorAvailable = true;
          hasUsefulResult = true;
        } catch (error) {
          if (signal.aborted || this.isCancellation(error)) return;
          const persistenceFailure =
            error instanceof CarbonFactorPersistenceError;
          failures.push({
            applicationId: application.id,
            errorCode: persistenceFailure
              ? "DATABASE_WRITE_FAILED"
              : this.getErrorCode(error),
            integration: "carbon-factor",
          });
          if (persistenceFailure) {
            this.logPersistenceFailure(
              application.id,
              cycle.id,
              "persist-carbon-factor",
            );
          } else {
            const incidentPersisted = await this.incidents.recordFailure(
              {
                source: "carbon-intensity",
                applicationId: application.id,
                integration: MonitoringIntegration.CARBON_FACTOR,
              },
              this.getSafeReason(error, MonitoringIntegration.CARBON_FACTOR),
              cycle.id,
              new Date(),
              this.getHttpAttempts(error),
            );
            if (!incidentPersisted) {
              failures.push({
                applicationId: application.id,
                errorCode: "DATABASE_WRITE_FAILED",
                integration: "incident-persistence",
              });
            }
          }
        }
        if (carbonFactorAvailable) {
          const incidentPersisted = await this.incidents.recordSuccess(
            {
              source: "carbon-intensity",
              applicationId: application.id,
              integration: MonitoringIntegration.CARBON_FACTOR,
            },
            cycle.id,
            new Date(),
          );
          if (!incidentPersisted) {
            failures.push({
              applicationId: application.id,
              errorCode: "DATABASE_WRITE_FAILED",
              integration: "incident-persistence",
            });
          }
        }
      }

      if (metricsFailed) {
        if (signal.aborted || this.isCancellation(metricsError)) return;
        failures.push({
          applicationId: application.id,
          errorCode: this.getErrorCode(metricsError),
          integration: "metrics",
        });
        const incidentPersisted = await this.incidents.recordFailure(
          {
            source: "metrics-aggregator",
            applicationId: application.id,
            integration: MonitoringIntegration.METRICS,
          },
          this.getSafeReason(metricsError, MonitoringIntegration.METRICS),
          cycle.id,
          new Date(),
          this.getHttpAttempts(metricsError),
        );
        if (!incidentPersisted) {
          failures.push({
            applicationId: application.id,
            errorCode: "DATABASE_WRITE_FAILED",
            integration: "incident-persistence",
          });
        }
        try {
          await this.statuses.record(
            application.id,
            this.getFailureEvidence(metricsError, new Date()),
            cycle.id,
          );
        } catch {
          this.logPersistenceFailure(
            application.id,
            cycle.id,
            "record-metric-failure-status",
          );
          failures.push({
            applicationId: application.id,
            errorCode: "DATABASE_WRITE_FAILED",
            integration: "status",
          });
        }
        return;
      }

      if (!observation) return;

      try {
        const intervalEnd = observation.receivedAt;
        const intervalStart = new Date(
          intervalEnd.getTime() - observation.collectionIntervalSeconds * 1000,
        );
        const existing =
          await this.collections.findByApplicationAndIntervalStart(
            application.id,
            intervalStart,
          );
        if (!existing) {
          await this.collections.append({
            applicationId: application.id,
            intervalStart,
            intervalEnd,
            collectedAt: observation.receivedAt,
            metrics: {
              cpuPercent: observation.metrics.cpuPercent,
              memoryGb: observation.metrics.memoryGb,
              diskGb: observation.metrics.diskGb,
              networkGb: observation.metrics.networkGb,
              collectionIntervalSeconds: observation.collectionIntervalSeconds,
            },
            metricUnits: {
              cpuPercent: "%",
              memoryGb: "GB",
              diskGb: "GB",
              networkGb: "GB",
            },
            state: ApplicationState.AVAILABLE,
            reason: null,
          });
          counts.persistedCount++;
        }
        hasUsefulResult = true;
        await this.statuses.record(
          application.id,
          {
            kind: "metrics",
            result: "valid",
            observedAt: observation.receivedAt,
            carbonFactorAvailable,
          },
          cycle.id,
        );
        const incidentPersisted = await this.incidents.recordSuccess(
          {
            source: "metrics-aggregator",
            applicationId: application.id,
            integration: MonitoringIntegration.METRICS,
          },
          cycle.id,
          observation.receivedAt,
        );
        if (!incidentPersisted) {
          failures.push({
            applicationId: application.id,
            errorCode: "DATABASE_WRITE_FAILED",
            integration: "incident-persistence",
          });
        }
      } catch {
        failures.push({
          applicationId: application.id,
          errorCode: "DATABASE_WRITE_FAILED",
          integration: "metrics-persistence",
        });
        this.logPersistenceFailure(
          application.id,
          cycle.id,
          "persist-metric-observation",
        );
      }
    });

    if (signal.aborted) {
      await this.finishCancelled(cycle.id, counts);
      return;
    }

    const status =
      failures.length + counts.failedCount === 0
        ? MonitoringCycleStatus.SUCCEEDED
        : !hasUsefulResult
          ? MonitoringCycleStatus.FAILED
          : MonitoringCycleStatus.PARTIAL;
    counts.failedCount += failures.length;
    await this.cycles.finish(cycle.id, {
      ...counts,
      status,
      details: { source: "scheduled-monitoring", failures },
    });
  }

  private async forEachLimited<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
  ): Promise<void> {
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        await operation(items[index]);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, items.length) }, worker),
    );
  }

  private async finish(
    cycleId: string,
    counts: CycleCounts,
    status: MonitoringCycleStatus,
    error: unknown,
  ): Promise<void> {
    await this.cycles.finish(cycleId, {
      ...counts,
      status,
      failedCount: Math.max(counts.failedCount, 1),
      details: {
        source: "scheduled-monitoring",
        errorCode: this.getErrorCode(error),
      },
    });
  }

  private getErrorCode(error: unknown): string {
    return error instanceof IntegrationError ? error.code : "UNEXPECTED_ERROR";
  }

  private getSafeReason(
    error: unknown,
    integration: MonitoringIntegration,
  ): string {
    if (!(error instanceof IntegrationError)) return "UPSTREAM_UNAVAILABLE";
    if (error.code === "REQUEST_CANCELLED") return "CYCLE_CANCELLED";
    if (error.code === "UPSTREAM_TIMEOUT") return "TIMEOUT";
    if (error.code === "INVALID_UPSTREAM_RESPONSE") return "INVALID_RESPONSE";
    if (error.status === 408) return "TIMEOUT";
    if (error.status === 404) {
      if (integration === MonitoringIntegration.CARBON_FACTOR)
        return "FACTOR_UNAVAILABLE";
      if (integration === MonitoringIntegration.METRICS)
        return "MISSING_METRICS";
      return "UPSTREAM_REJECTED";
    }
    if (error.status === 429) return "RATE_LIMITED";
    if (error.status && error.status >= 400 && error.status < 500)
      return "UPSTREAM_REJECTED";
    return "UPSTREAM_UNAVAILABLE";
  }

  private getHttpAttempts(error: unknown): number {
    return error instanceof IntegrationError ? error.httpAttempts : 1;
  }

  private getFailureEvidence(
    error: unknown,
    observedAt: Date,
  ): Exclude<StatusEvidence, { kind: "removal_confirmed" }> {
    if (
      error instanceof IntegrationError &&
      error.code === "INVALID_UPSTREAM_RESPONSE"
    )
      return {
        kind: "metrics",
        result: "invalid",
        observedAt,
        carbonFactorAvailable: false,
      };
    if (
      error instanceof IntegrationError &&
      (error.code === "UPSTREAM_TIMEOUT" || error.status === 408)
    )
      return {
        kind: "source_failure",
        reason: ApplicationStateReason.SOURCE_TIMEOUT,
        observedAt,
      };
    if (error instanceof IntegrationError && error.status === 404)
      return {
        kind: "metrics",
        result: "missing",
        observedAt,
        carbonFactorAvailable: false,
      };
    return {
      kind: "source_failure",
      reason: ApplicationStateReason.SOURCE_ERROR,
      observedAt,
    };
  }

  private logPersistenceFailure(
    applicationId: string | null,
    cycleId: string | null,
    operation: string,
  ): void {
    console.error(
      JSON.stringify({
        event: "monitoring_persistence_failed",
        applicationId,
        cycleId,
        operation,
        errorCode: "DATABASE_WRITE_FAILED",
      }),
    );
  }

  private isCancellation(error: unknown): boolean {
    return (
      error instanceof IntegrationError && error.code === "REQUEST_CANCELLED"
    );
  }

  private async finishCancelled(
    cycleId: string,
    counts: CycleCounts,
  ): Promise<void> {
    await this.cycles.finish(cycleId, {
      ...counts,
      status: MonitoringCycleStatus.FAILED,
      details: {
        source: "scheduled-monitoring",
        errorCode: "CYCLE_CANCELLED",
      },
    });
  }
}
