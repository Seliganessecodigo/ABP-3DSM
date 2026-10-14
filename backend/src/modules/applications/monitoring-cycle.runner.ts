import { Inject, Injectable } from '@nestjs/common'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { MonitoringCycleStatus } from '../../database/entities/monitoring-cycle.entity'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { MonitoringCyclesRepository } from '../../database/repositories/monitoring-cycles.repository'
import { IntegrationError } from '../../integrations/integration-error'
import {
  MetricsAggregatorAdapter,
  ServiceSummary,
} from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'
import { DiscoveryService } from './discovery.service'
import { MetadataSyncService } from './metadata-sync.service'
import { RemovalService } from './removal.service'
import { ReturnService } from './return.service'
import { StatusClassificationService } from './status-classification.service'

interface CycleCounts {
  discoveredCount: number
  processedCount: number
  failedCount: number
  persistedCount: number
}

@Injectable()
export class MonitoringCycleRunner {
  constructor(
    private readonly adapter: MetricsAggregatorAdapter,
    private readonly cycles: MonitoringCyclesRepository,
    private readonly discovery: DiscoveryService,
    private readonly metadata: MetadataSyncService,
    private readonly removal: RemovalService,
    private readonly returns: ReturnService,
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
    private readonly statuses: StatusClassificationService,
    @Inject('MONITORING_METRICS_CONCURRENCY')
    private readonly concurrency: number,
  ) {}

  async run(): Promise<void> {
    const cycle = await this.cycles.start({ source: 'scheduled-monitoring' })
    const counts: CycleCounts = {
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 0,
      persistedCount: 0,
    }
    let snapshot: ServiceSummary[]

    try {
      snapshot = await this.adapter.fetchServices()
    } catch (error) {
      await this.finish(cycle.id, counts, MonitoringCycleStatus.FAILED, error)
      throw error
    }

    try {
      counts.discoveredCount = await this.discovery.discover(cycle.id, snapshot)
      await this.metadata.reconcile(cycle.id, snapshot)
      await this.returns.reconcile(cycle.id, snapshot)
      await this.removal.reconcile(cycle.id, snapshot)
    } catch (error) {
      await this.finish(cycle.id, counts, MonitoringCycleStatus.FAILED, error)
      throw error
    }

    let targets: ApplicationEntity[]
    try {
      const eligible = await this.applications.findForCollection()
      const eligibleIds = new Set(snapshot.map((service) => service.id))
      targets = eligible.filter((application) =>
        eligibleIds.has(application.id),
      )
    } catch (error) {
      await this.finish(cycle.id, counts, MonitoringCycleStatus.FAILED, error)
      throw error
    }
    counts.processedCount = targets.length
    const failures: Array<{
      applicationId: string
      errorCode: string
      statusWriteError?: string
    }> = []

    await this.forEachLimited(targets, async (application) => {
      try {
        const observation = await this.adapter.fetchMetrics(application.id)
        const intervalEnd = observation.receivedAt
        const intervalStart = new Date(
          intervalEnd.getTime() - observation.collectionIntervalSeconds * 1000,
        )
        const existing =
          await this.collections.findByApplicationAndIntervalStart(
            application.id,
            intervalStart,
          )
        if (!existing) {
          await this.collections.append({
            applicationId: application.id,
            intervalStart,
            intervalEnd,
            collectedAt: observation.receivedAt,
            metrics: {
              cpuPercent: observation.metrics.cpuPercent,
              memoryGb: observation.metrics.memoryGb,
              diskGb: observation.metrics.diskGb,
              networkGb: observation.metrics.networkGb,
              collectionIntervalSeconds: observation.collectionIntervalSeconds,
            },
            metricUnits: {
              cpuPercent: '%',
              memoryGb: 'GB',
              diskGb: 'GB',
              networkGb: 'GB',
            },
            state: ApplicationState.AVAILABLE,
            reason: null,
          })
          counts.persistedCount++
        }
        await this.statuses.record(
          application.id,
          {
            kind: 'metrics',
            result: 'valid',
            observedAt: observation.receivedAt,
            carbonFactorAvailable: false,
          },
          cycle.id,
        )
      } catch (error) {
        const errorCode = this.getErrorCode(error)
        const failure: {
          applicationId: string
          errorCode: string
          statusWriteError?: string
        } = { applicationId: application.id, errorCode }
        failures.push(failure)
        try {
          await this.statuses.record(
            application.id,
            {
              kind: 'source_failure',
              reason: ApplicationStateReason.SOURCE_ERROR,
              observedAt: new Date(),
            },
            cycle.id,
          )
        } catch (statusError) {
          failure.statusWriteError = this.getErrorCode(statusError)
        }
      }
    })

    counts.failedCount = failures.length
    const status =
      failures.length === 0
        ? MonitoringCycleStatus.SUCCEEDED
        : failures.length === targets.length
          ? MonitoringCycleStatus.FAILED
          : MonitoringCycleStatus.PARTIAL
    await this.cycles.finish(cycle.id, {
      ...counts,
      status,
      details: { source: 'scheduled-monitoring', failures },
    })
  }

  private async forEachLimited<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
  ): Promise<void> {
    let nextIndex = 0
    const worker = async (): Promise<void> => {
      while (nextIndex < items.length) {
        const index = nextIndex++
        await operation(items[index])
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, items.length) }, worker),
    )
  }

  private async finish(
    cycleId: string,
    counts: CycleCounts,
    status: MonitoringCycleStatus,
    error: unknown,
  ): Promise<void> {
    await this.cycles.finish(cycleId, {
      ...counts,
      status,
      failedCount: Math.max(counts.failedCount, 1),
      details: {
        source: 'scheduled-monitoring',
        errorCode: this.getErrorCode(error),
      },
    })
  }

  private getErrorCode(error: unknown): string {
    return error instanceof IntegrationError ? error.code : 'UNEXPECTED_ERROR'
  }
}
