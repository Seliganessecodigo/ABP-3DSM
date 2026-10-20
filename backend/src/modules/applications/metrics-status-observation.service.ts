import { Inject, Injectable } from "@nestjs/common";
import { ApplicationsRepository } from "./applications.repository";
import { StatusClassificationService } from "./status-classification.service";
import { ApplicationStateReason } from "../../database/entities/application-state-reason";
import {
  CarbonFactorPersistenceError,
  CarbonFactorService,
} from "../../integrations/carbon-factor.service";
import { IntegrationError } from "../../integrations/integration-error";
import { MetricsAggregatorAdapter } from "../../integrations/metrics-aggregator.adapter";
import { type StatusEvidence } from "./application-status-classifier";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { MonitoringIntegration } from "../../database/entities/monitoring-incident.entity";

interface ObservationCounts {
  processedCount: number;
  failedCount: number;
  successfulOperationCount: number;
  cancelled: boolean;
}

type MetricsResult =
  | { kind: "valid"; observedAt: Date }
  | {
      kind: "failed";
      error: unknown;
      evidence: Exclude<StatusEvidence, { kind: "removal_confirmed" }>;
    }
  | { kind: "cancelled" };

@Injectable()
export class MetricsStatusObservationService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly metrics: MetricsAggregatorAdapter,
    private readonly carbonFactors: CarbonFactorService,
    private readonly classification: StatusClassificationService,
    private readonly incidents: MonitoringIncidentsService,
    @Inject("MONITORING_METRICS_CONCURRENCY")
    private readonly concurrency: number,
  ) {}

  async observeAll(
    cycleId: string,
    signal?: AbortSignal,
  ): Promise<{
    processedCount: number;
    failedCount: number;
    successfulOperationCount: number;
    cancelled?: boolean;
  }> {
    const applications = await this.applications.findForCollection();
    const counts: ObservationCounts = {
      processedCount: 0,
      failedCount: 0,
      successfulOperationCount: 0,
      cancelled: false,
    };
    await this.forEachLimited(applications, (application) =>
      this.observeApplication(application, cycleId, signal, counts),
    );
    const { cancelled, ...result } = counts;
    return cancelled ? { ...result, cancelled: true } : result;
  }

  private async observeApplication(
    application: Awaited<
      ReturnType<ApplicationsRepository["findForCollection"]>
    >[number],
    cycleId: string,
    signal: AbortSignal | undefined,
    counts: ObservationCounts,
  ): Promise<void> {
    if (signal?.aborted || counts.cancelled) {
      counts.cancelled = true;
      return;
    }
    counts.processedCount++;
    const checkedAt = new Date();
    const metrics = await this.fetchMetrics(application.id, checkedAt, signal);
    if (metrics.kind === "cancelled") {
      counts.cancelled = true;
      return;
    }
    const carbonFactorAvailable = await this.captureCarbonFactor(
      application.id,
      application.regionCode,
      cycleId,
      signal,
      counts,
    );
    if (counts.cancelled) return;

    const evidence =
      metrics.kind === "valid"
        ? {
            kind: "metrics" as const,
            result: "valid" as const,
            observedAt: metrics.observedAt,
            carbonFactorAvailable,
          }
        : metrics.evidence;
    if (metrics.kind === "failed") {
      counts.failedCount++;
      if (
        !(await this.incidents.recordFailure(
          {
            source: "metrics-aggregator",
            applicationId: application.id,
            integration: MonitoringIntegration.METRICS,
          },
          this.getSafeReason(metrics.error, MonitoringIntegration.METRICS),
          cycleId,
          checkedAt,
          this.getHttpAttempts(metrics.error),
        ))
      )
        counts.failedCount++;
    }

    try {
      await this.classification.record(application.id, evidence, cycleId);
    } catch {
      counts.failedCount++;
      this.logPersistenceFailure(
        application.id,
        cycleId,
        "record-operational-status",
      );
      return;
    }
    if (metrics.kind === "valid") {
      counts.successfulOperationCount++;
      if (
        !(await this.incidents.recordSuccess(
          {
            source: "metrics-aggregator",
            applicationId: application.id,
            integration: MonitoringIntegration.METRICS,
          },
          cycleId,
          metrics.observedAt,
        ))
      )
        counts.failedCount++;
    }
  }

  private async fetchMetrics(
    applicationId: string,
    checkedAt: Date,
    signal?: AbortSignal,
  ): Promise<MetricsResult> {
    try {
      const observation = await this.metrics.fetchMetrics(
        applicationId,
        signal,
      );
      return { kind: "valid", observedAt: observation.receivedAt };
    } catch (error) {
      if (signal?.aborted || this.isCancellation(error))
        return { kind: "cancelled" };
      return {
        kind: "failed",
        error,
        evidence: this.getFailureEvidence(error, checkedAt),
      };
    }
  }

  private getFailureEvidence(
    error: unknown,
    observedAt: Date,
  ): Exclude<StatusEvidence, { kind: "removal_confirmed" }> {
    if (
      error instanceof IntegrationError &&
      error.code === "INVALID_UPSTREAM_RESPONSE"
    ) {
      return {
        kind: "metrics",
        result: "invalid",
        observedAt,
        carbonFactorAvailable: false,
      };
    }
    if (error instanceof IntegrationError && error.status === 404) {
      return {
        kind: "metrics",
        result: "missing",
        observedAt,
        carbonFactorAvailable: false,
      };
    }
    if (
      error instanceof IntegrationError &&
      (error.code === "UPSTREAM_TIMEOUT" || error.status === 408)
    ) {
      return {
        kind: "source_failure",
        reason: ApplicationStateReason.SOURCE_TIMEOUT,
        observedAt,
      };
    }
    return {
      kind: "source_failure",
      reason: ApplicationStateReason.SOURCE_ERROR,
      observedAt,
    };
  }

  private async captureCarbonFactor(
    applicationId: string,
    regionCode: string | null,
    cycleId: string,
    signal: AbortSignal | undefined,
    counts: ObservationCounts,
  ): Promise<boolean> {
    if (!regionCode) return false;
    try {
      await this.carbonFactors.capture(regionCode, signal);
    } catch (error) {
      if (signal?.aborted || this.isCancellation(error)) {
        counts.cancelled = true;
        return false;
      }
      counts.failedCount++;
      if (error instanceof CarbonFactorPersistenceError) {
        this.logPersistenceFailure(
          applicationId,
          cycleId,
          "persist-carbon-factor",
        );
      } else if (
        !(await this.incidents.recordFailure(
          {
            source: "carbon-intensity",
            applicationId,
            integration: MonitoringIntegration.CARBON_FACTOR,
          },
          this.getSafeReason(error, MonitoringIntegration.CARBON_FACTOR),
          cycleId,
          new Date(),
          this.getHttpAttempts(error),
        ))
      )
        counts.failedCount++;
      return false;
    }
    counts.successfulOperationCount++;
    if (
      !(await this.incidents.recordSuccess(
        {
          source: "carbon-intensity",
          applicationId,
          integration: MonitoringIntegration.CARBON_FACTOR,
        },
        cycleId,
        new Date(),
      ))
    )
      counts.failedCount++;
    return true;
  }

  private async forEachLimited<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
  ): Promise<void> {
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
      if (nextIndex >= items.length) return;
      const index = nextIndex++;
      await operation(items[index]);
      return worker();
    };
    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, items.length) }, worker),
    );
  }

  private isCancellation(error: unknown): boolean {
    return (
      error instanceof IntegrationError && error.code === "REQUEST_CANCELLED"
    );
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
    if (error.status === 404)
      return integration === MonitoringIntegration.CARBON_FACTOR
        ? "FACTOR_UNAVAILABLE"
        : "MISSING_METRICS";
    if (error.status === 429) return "RATE_LIMITED";
    if (error.status && error.status >= 400 && error.status < 500)
      return "UPSTREAM_REJECTED";
    return "UPSTREAM_UNAVAILABLE";
  }

  private getHttpAttempts(error: unknown): number {
    return error instanceof IntegrationError ? error.httpAttempts : 1;
  }

  private logPersistenceFailure(
    applicationId: string,
    cycleId: string,
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
}
