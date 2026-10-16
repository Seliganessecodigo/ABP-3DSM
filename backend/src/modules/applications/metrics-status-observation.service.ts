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
    let processedCount = 0;
    let failedCount = 0;
    let successfulOperationCount = 0;
    let cancelled = false;

    await this.forEachLimited(applications, async (application) => {
      if (signal?.aborted || cancelled) {
        cancelled = true;
        return;
      }
      processedCount++;
      const checkedAt = new Date();
      let evidence: Exclude<StatusEvidence, { kind: "removal_confirmed" }> = {
        kind: "source_failure",
        reason: ApplicationStateReason.SOURCE_ERROR,
        observedAt: checkedAt,
      };
      let metricsValid = false;
      let metricsFailed = false;
      let carbonFactorAvailable = false;
      let metricsObservedAt = checkedAt;
      let metricsError: unknown;
      try {
        const observation = await this.metrics.fetchMetrics(
          application.id,
          signal,
        );
        metricsValid = true;
        metricsObservedAt = observation.receivedAt;
      } catch (error) {
        if (signal?.aborted || this.isCancellation(error)) {
          cancelled = true;
          return;
        }
        metricsFailed = true;
        metricsError = error;
        evidence =
          error instanceof IntegrationError &&
          error.code === "INVALID_UPSTREAM_RESPONSE"
            ? {
                kind: "metrics" as const,
                result: "invalid" as const,
                observedAt: checkedAt,
                carbonFactorAvailable: false,
              }
            : error instanceof IntegrationError && error.status === 404
              ? {
                  kind: "metrics" as const,
                  result: "missing" as const,
                  observedAt: checkedAt,
                  carbonFactorAvailable: false,
                }
              : error instanceof IntegrationError &&
                  (error.code === "UPSTREAM_TIMEOUT" || error.status === 408)
                ? {
                    kind: "source_failure" as const,
                    reason: ApplicationStateReason.SOURCE_TIMEOUT,
                    observedAt: checkedAt,
                  }
                : {
                    kind: "source_failure" as const,
                    reason: ApplicationStateReason.SOURCE_ERROR,
                    observedAt: checkedAt,
                  };
      }

      if (application.regionCode) {
        try {
          await this.carbonFactors.capture(application.regionCode, signal);
          carbonFactorAvailable = true;
          successfulOperationCount++;
          if (
            !(await this.incidents.recordSuccess(
              {
                source: "carbon-intensity",
                applicationId: application.id,
                integration: MonitoringIntegration.CARBON_FACTOR,
              },
              cycleId,
              new Date(),
            ))
          )
            failedCount++;
        } catch (error) {
          if (signal?.aborted || this.isCancellation(error)) {
            cancelled = true;
            return;
          }
          failedCount++;
          if (error instanceof CarbonFactorPersistenceError) {
            this.logPersistenceFailure(
              application.id,
              cycleId,
              "persist-carbon-factor",
            );
          } else if (
            !(await this.incidents.recordFailure(
              {
                source: "carbon-intensity",
                applicationId: application.id,
                integration: MonitoringIntegration.CARBON_FACTOR,
              },
              this.getSafeReason(error, MonitoringIntegration.CARBON_FACTOR),
              cycleId,
              new Date(),
              this.getHttpAttempts(error),
            ))
          ) {
            failedCount++;
          }
        }
      }

      if (metricsFailed) {
        failedCount++;
        if (
          !(await this.incidents.recordFailure(
            {
              source: "metrics-aggregator",
              applicationId: application.id,
              integration: MonitoringIntegration.METRICS,
            },
            this.getSafeReason(metricsError, MonitoringIntegration.METRICS),
            cycleId,
            checkedAt,
            this.getHttpAttempts(metricsError),
          ))
        )
          failedCount++;
      } else {
        evidence = {
          kind: "metrics",
          result: "valid",
          observedAt: metricsObservedAt,
          carbonFactorAvailable,
        };
      }

      try {
        await this.classification.record(application.id, evidence, cycleId);
      } catch {
        failedCount++;
        this.logPersistenceFailure(
          application.id,
          cycleId,
          "record-operational-status",
        );
        return;
      }
      if (metricsValid) {
        successfulOperationCount++;
        if (
          !(await this.incidents.recordSuccess(
            {
              source: "metrics-aggregator",
              applicationId: application.id,
              integration: MonitoringIntegration.METRICS,
            },
            cycleId,
            metricsObservedAt,
          ))
        )
          failedCount++;
      }
    });

    return cancelled
      ? {
          processedCount,
          failedCount,
          successfulOperationCount,
          cancelled: true,
        }
      : { processedCount, failedCount, successfulOperationCount };
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
