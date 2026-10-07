import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'

@Injectable()
export class ReturnService {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly dataSource: DataSource,
    private readonly applications: ApplicationsRepository,
    private readonly events: ApplicationEventsRepository,
  ) {}

  async reconcile(cycleId: string): Promise<number> {
    const snapshot = await this.adapter.fetchServices()
    const observedAt = new Date()
    return this.dataSource.transaction(async (manager) => {
      const returned = await this.applications.findReturnedForUpdate(
        manager,
        snapshot.map((service) => service.id),
      )
      for (const application of returned) {
        await this.applications.restore(
          manager,
          application.id,
          ApplicationState.UNAVAILABLE,
          observedAt,
        )
        await this.events.appendInTransaction(manager, {
          applicationId: application.id,
          cycleId,
          kind: 'returned',
          actor: 'system',
          occurredAt: observedAt,
          details: { source: 'metrics-aggregator' },
        })
      }
      return returned.length
    })
  }
}
