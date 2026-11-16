import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ApplicationEventsRepository } from "../../database/repositories/application-events.repository";
import {
  MetricsAggregatorAdapter,
  type ServiceSummary,
} from "../../integrations/metrics-aggregator.adapter";
import { IntegrationError } from "../../integrations/integration-error";
import { ApplicationsRepository } from "./applications.repository";

export interface RemovalReconciliation {
  removedCount: number;
  retainedServices: ServiceSummary[];
  failures: { applicationId: string; error: unknown }[];
}

@Injectable()
export class RemovalService {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly dataSource: DataSource,
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
  ) {}

  async reconcile(
    cycleId: string,
    snapshot?: Awaited<ReturnType<MetricsAggregatorAdapter["fetchServices"]>>,
    signal?: AbortSignal,
  ): Promise<RemovalReconciliation> {
    const services = snapshot ?? (await this.adapter.fetchServices(signal));
    const currentIds = services.map((service) => service.id);
    const current = new Set(currentIds);
    const candidates = (await this.applications.findForCollection()).filter(
      (application) => !current.has(application.id),
    );
    const { confirmed, failures, retainedServices } =
      await this.confirmAbsences(
        candidates.map((application) => application.id),
        signal,
      );
    if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");
    if (confirmed.size === 0)
      return { removedCount: 0, failures, retainedServices };
    const observedAt = new Date();
    const removedCount = await this.dataSource.transaction(async (manager) => {
      const missing = await this.applications.findMissingForUpdate(
        manager,
        currentIds,
      );
      const removals = missing.filter((application) =>
        confirmed.has(application.id),
      );
      for (const application of removals) {
        await this.applications.markRemoved(
          manager,
          application.id,
          observedAt,
        );
        await this.events.appendInTransaction(manager, {
          applicationId: application.id,
          cycleId,
          kind: "removed",
          actor: "system",
          occurredAt: observedAt,
          details: {
            source: "metrics-aggregator",
            observedAt: observedAt.toISOString(),
            confirmedAt: observedAt.toISOString(),
            confirmation: "service-detail-404",
          },
        });
      }
      return removals.length;
    });
    return { removedCount, failures, retainedServices };
  }

  private async confirmAbsences(ids: string[], signal?: AbortSignal) {
    const confirmed = new Set<string>();
    const failures: RemovalReconciliation["failures"] = [];
    const retainedServices: ServiceSummary[] = [];
    for (const applicationId of ids) {
      try {
        // Confirm sequentially to bound upstream concurrency, without holding database locks.
        const service = await this.fetchRegisteredService(
          applicationId,
          signal,
        );
        if (service === null) confirmed.add(applicationId);
        else retainedServices.push(service);
      } catch (error) {
        if (
          signal?.aborted ||
          (error instanceof IntegrationError &&
            error.code === "REQUEST_CANCELLED")
        )
          throw new IntegrationError("REQUEST_CANCELLED");
        failures.push({ applicationId, error });
      }
    }
    return { confirmed, failures, retainedServices };
  }

  private async fetchRegisteredService(
    id: string,
    signal?: AbortSignal,
  ): Promise<ServiceSummary | null> {
    try {
      return await this.adapter.fetchService(id, signal);
    } catch (error) {
      if (
        error instanceof IntegrationError &&
        error.code === "UPSTREAM_UNAVAILABLE" &&
        error.status === 404
      )
        return null;
      throw error;
    }
  }
}
