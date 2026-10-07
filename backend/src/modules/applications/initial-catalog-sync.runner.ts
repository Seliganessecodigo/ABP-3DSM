import { Injectable } from '@nestjs/common'
import {
  MonitoringCycleStatus,
} from '../../database/entities/monitoring-cycle.entity'
import { MonitoringCyclesRepository } from '../../database/repositories/monitoring-cycles.repository'
import { IntegrationError } from '../../integrations/integration-error'
import { DiscoveryService } from './discovery.service'

@Injectable()
export class InitialCatalogSyncRunner {
  private readonly source = 'startup-catalog-discovery'

  constructor(
    private readonly cycles: MonitoringCyclesRepository,
    private readonly discovery: DiscoveryService,
  ) {}

  async run(): Promise<number> {
    const cycle = await this.cycles.start({ source: this.source })

    try {
      const discoveredCount = await this.discovery.discover(cycle.id)
      await this.cycles.finish(cycle.id, {
        status: MonitoringCycleStatus.SUCCEEDED,
        discoveredCount,
        processedCount: discoveredCount,
        failedCount: 0,
        persistedCount: discoveredCount,
        details: { source: this.source },
      })
      return discoveredCount
    } catch (error) {
      await this.cycles.finish(cycle.id, {
        status: MonitoringCycleStatus.FAILED,
        discoveredCount: 0,
        processedCount: 0,
        failedCount: 1,
        persistedCount: 0,
        details: {
          source: this.source,
          errorCode:
            error instanceof IntegrationError ? error.code : 'UNEXPECTED_ERROR',
        },
      })
      throw error
    }
  }
}
