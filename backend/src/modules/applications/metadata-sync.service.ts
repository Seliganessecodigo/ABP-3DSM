import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'

@Injectable()
export class MetadataSyncService {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly dataSource: DataSource,
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
  ) {}

  async reconcile(cycleId: string): Promise<number> {
    const snapshot = await this.adapter.fetchServices()
    const observedAt = new Date()
    const byId = new Map(snapshot.map((service) => [service.id, service]))
    return this.dataSource.transaction(async (manager) => {
      const known = await this.applications.findByIdsForUpdate(manager, [
        ...byId.keys(),
      ])
      let changed = 0
      for (const application of known) {
        const source = byId.get(application.id)
        if (!source) continue
        const before = {
          name: application.name,
          location: {
            regionCode: application.regionCode,
            country: application.country,
            region: application.region,
            city: application.city,
            latitude: application.latitude,
            longitude: application.longitude,
          },
        }
        const after = { name: source.name, location: source.location }
        if (JSON.stringify(before) === JSON.stringify(after)) continue
        await this.applications.updateMetadata(manager, application.id, {
          name: source.name,
          regionCode: source.location.regionCode,
          country: source.location.country,
          region: source.location.region,
          city: source.location.city,
          latitude: source.location.latitude,
          longitude: source.location.longitude,
        })
        await this.events.appendInTransaction(manager, {
          applicationId: application.id,
          cycleId,
          kind: 'registration_changed',
          actor: 'system',
          occurredAt: observedAt,
          details: { before, after },
        })
        changed++
      }
      return changed
    })
  }
}
