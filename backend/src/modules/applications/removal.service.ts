import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'

@Injectable()
export class RemovalService {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly dataSource: DataSource,
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
  ) {}

  async reconcile(cycleId: string): Promise<number> {
    const snapshot = await this.adapter.fetchServices()
    const observedAt = new Date()
    const currentIds = snapshot.map((service) => service.id)
    return this.dataSource.transaction(async (manager) => {
      const missing = await this.applications.findMissingForUpdate(
        manager,
        currentIds,
      )
      for (const application of missing) {
        await this.applications.markRemoved(manager, application.id, observedAt)
        await this.events.appendInTransaction(manager, {
          applicationId: application.id,
          cycleId,
          kind: 'removed',
          actor: 'system',
          occurredAt: observedAt,
          details: {
            source: 'metrics-aggregator',
            observedAt: observedAt.toISOString(),
            confirmedAt: observedAt.toISOString(),
          },
        })
      }
      return missing.length
    })
  }
}
