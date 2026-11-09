import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ApplicationState } from "../../database/entities/application-state";
import { ApplicationEventsRepository } from "../../database/repositories/application-events.repository";
import { MetricsAggregatorAdapter } from "../../integrations/metrics-aggregator.adapter";
import { ApplicationsRepository } from "./applications.repository";

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly dataSource: DataSource,
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
  ) {}

  async discover(
    cycleId: string,
    services?: Awaited<ReturnType<MetricsAggregatorAdapter["fetchServices"]>>,
    signal?: AbortSignal,
  ): Promise<number> {
    const snapshot = services ?? (await this.adapter.fetchServices(signal));
    const observedAt = new Date();
    return this.dataSource.transaction(async (manager) => {
      const insertedIds = await this.applications.insertManyIfAbsent(
        manager,
        snapshot.map((service) => ({
          id: service.id,
          name: service.name,
          metricsPath: service.metricsPath,
          location: null,
          regionCode: service.location.regionCode,
          country: service.location.country,
          region: service.location.region,
          city: service.location.city,
          latitude: service.location.latitude,
          longitude: service.location.longitude,
          state: ApplicationState.AVAILABLE,
          firstSeenAt: observedAt,
          lastCheckedAt: observedAt,
          removedAt: null,
        })),
      );
      await this.events.appendManyInTransaction(
        manager,
        insertedIds.map((applicationId) => ({
          applicationId,
          cycleId,
          kind: "discovered",
          actor: "system",
          occurredAt: observedAt,
          details: null,
        })),
      );
      return insertedIds.length;
    });
  }
}
