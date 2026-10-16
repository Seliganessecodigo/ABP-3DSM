import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { MonitoringCycleStatus } from "../../database/entities/monitoring-cycle.entity";
import { MonitoringCyclesRepository } from "../../database/repositories/monitoring-cycles.repository";
import { IntegrationError } from "../../integrations/integration-error";
import { MonitoringCycleLock } from "./monitoring-cycle.lock";
import { DiscoveryService } from "./discovery.service";
import { MetricsStatusObservationService } from "./metrics-status-observation.service";
import {
  MetricsAggregatorAdapter,
  ServiceSummary,
} from "../../integrations/metrics-aggregator.adapter";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { MonitoringIntegration } from "../../database/entities/monitoring-incident.entity";

@Injectable()
export class InitialCatalogSyncRunner implements OnApplicationShutdown {
  private readonly source = "startup-catalog-discovery";
  private activeController: AbortController | null = null;

  constructor(
    private readonly cycles: MonitoringCyclesRepository,
    private readonly discovery: DiscoveryService,
    private readonly observations: MetricsStatusObservationService,
    private readonly cycleLock: MonitoringCycleLock,
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly incidents: MonitoringIncidentsService,
  ) {}

  onApplicationShutdown(): void {
    this.activeController?.abort();
  }

  async run(): Promise<number> {
    if (!this.cycleLock.acquire()) return 0;
    this.activeController = new AbortController();
    const signal = this.activeController.signal;
    let cycle;
    try {
      cycle = await this.cycles.start({ source: this.source });
    } catch (error) {
      this.activeController = null;
      this.cycleLock.release();
      throw error;
    }

    let discoveredCount = 0;
    let processedCount = 0;
    let failedCount = 0;
    try {
      let snapshot: ServiceSummary[];
      try {
        snapshot = await this.adapter.fetchServices(signal);
      } catch (error) {
        if (signal.aborted || this.isCancellation(error)) {
          await this.finishCancelled(cycle.id, 0, 0, 0);
          return 0;
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
          error instanceof IntegrationError ? error.httpAttempts : 1,
        );
        if (!incidentPersisted) failedCount++;
        throw error;
      }
      discoveredCount = await this.discovery.discover(cycle.id, snapshot);
      if (
        !(await this.incidents.recordSuccess(
          {
            source: "metrics-aggregator",
            applicationId: null,
            integration: MonitoringIntegration.SERVICES,
          },
          cycle.id,
          new Date(),
        ))
      )
        failedCount++;
      const {
        processedCount: observedProcessedCount,
        failedCount: observedFailedCount,
        successfulOperationCount,
        cancelled,
      } = await this.observations.observeAll(cycle.id, signal);
      processedCount = observedProcessedCount;
      failedCount += observedFailedCount;
      if (cancelled || signal.aborted) {
        await this.finishCancelled(
          cycle.id,
          discoveredCount,
          processedCount,
          failedCount,
        );
        return discoveredCount;
      }
      await this.cycles.finish(cycle.id, {
        status:
          failedCount === 0
            ? MonitoringCycleStatus.SUCCEEDED
            : successfulOperationCount > 0
              ? MonitoringCycleStatus.PARTIAL
              : MonitoringCycleStatus.FAILED,
        discoveredCount,
        processedCount,
        failedCount,
        persistedCount: 0,
        details: { source: this.source },
      });
      return discoveredCount;
    } catch (error) {
      if (signal.aborted || this.isCancellation(error)) {
        await this.finishCancelled(
          cycle.id,
          discoveredCount,
          processedCount,
          failedCount,
        );
        return 0;
      }
      await this.cycles.finish(cycle.id, {
        status: MonitoringCycleStatus.FAILED,
        discoveredCount,
        processedCount,
        failedCount: failedCount + 1,
        persistedCount: 0,
        details: {
          source: this.source,
          errorCode:
            error instanceof IntegrationError ? error.code : "UNEXPECTED_ERROR",
        },
      });
      throw error;
    } finally {
      this.activeController = null;
      this.cycleLock.release();
    }
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
    if (error.code === "UPSTREAM_TIMEOUT") return "TIMEOUT";
    if (error.code === "INVALID_UPSTREAM_RESPONSE") return "INVALID_RESPONSE";
    if (error.status === 408) return "TIMEOUT";
    if (error.status === 404) {
      if (integration === MonitoringIntegration.CARBON_FACTOR)
        return "FACTOR_UNAVAILABLE";
      if (integration === MonitoringIntegration.METRICS) return "MISSING_METRICS";
      return "UPSTREAM_REJECTED";
    }
    if (error.status === 429) return "RATE_LIMITED";
    if (error.status && error.status >= 400 && error.status < 500)
      return "UPSTREAM_REJECTED";
    return "UPSTREAM_UNAVAILABLE";
  }

  private finishCancelled(
    cycleId: string,
    discoveredCount: number,
    processedCount: number,
    failedCount: number,
  ) {
    return this.cycles.finish(cycleId, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount,
      processedCount,
      failedCount,
      persistedCount: 0,
      details: { source: this.source, errorCode: "CYCLE_CANCELLED" },
    });
  }
}
