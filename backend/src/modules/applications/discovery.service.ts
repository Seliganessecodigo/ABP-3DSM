import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly dataSource: DataSource,
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
  ) {}

  async discover(cycleId: string): Promise<number> {
    const services = await this.adapter.fetchServices()
    const observedAt = new Date()
    return this.dataSource.transaction(async (manager) => {
      let discovered = 0
      for (const service of services) {
        const inserted = await this.applications.insertIfAbsent(manager, {
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
        })
        if (!inserted) continue
        await this.events.appendInTransaction(manager, {
          applicationId: service.id,
          cycleId,
          kind: 'discovered',
          actor: 'system',
          occurredAt: observedAt,
          details: null,
        })
        discovered++
      }
      return discovered
    })
  }
}
