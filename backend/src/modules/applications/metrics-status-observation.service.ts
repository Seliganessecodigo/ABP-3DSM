import { Injectable } from '@nestjs/common'
import { ApplicationsRepository } from './applications.repository'
import { StatusClassificationService } from './status-classification.service'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { CarbonFactorService } from '../../integrations/carbon-factor.service'
import { IntegrationError } from '../../integrations/integration-error'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { type StatusEvidence } from './application-status-classifier'

@Injectable()
export class MetricsStatusObservationService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly metrics: MetricsAggregatorAdapter,
    private readonly carbonFactors: CarbonFactorService,
    private readonly classification: StatusClassificationService,
  ) {}

  async observeAll(cycleId: string): Promise<{ processedCount: number; failedCount: number }> {
    const applications = await this.applications.findForCollection()
    let processedCount = 0
    let failedCount = 0

    for (const application of applications) {
      const checkedAt = new Date()
      let evidence: Exclude<StatusEvidence, { kind: 'removal_confirmed' }>
      let observationFailed = false
      try {
        const observation = await this.metrics.fetchMetrics(application.id)
        let carbonFactorAvailable = false
        if (application.regionCode) {
          try {
            await this.carbonFactors.capture(application.regionCode)
            carbonFactorAvailable = true
          } catch {
            carbonFactorAvailable = false
          }
        }
        evidence = {
          kind: 'metrics',
          result: 'valid',
          observedAt: observation.receivedAt,
          carbonFactorAvailable,
        }
      } catch (error) {
        observationFailed = true
        evidence =
          error instanceof IntegrationError &&
          error.code === 'INVALID_UPSTREAM_RESPONSE'
            ? {
                kind: 'metrics' as const,
                result: 'invalid' as const,
                observedAt: checkedAt,
                carbonFactorAvailable: false,
              }
            : error instanceof IntegrationError && error.status === 404
              ? {
                  kind: 'metrics' as const,
                  result: 'missing' as const,
                  observedAt: checkedAt,
                  carbonFactorAvailable: false,
                }
              : {
                  kind: 'source_failure' as const,
                  reason: ApplicationStateReason.SOURCE_ERROR,
                  observedAt: checkedAt,
                }
      }
      try {
        await this.classification.record(application.id, evidence, cycleId)
      } catch {
        failedCount++
        continue
      }
      processedCount++
      if (observationFailed) failedCount++
    }

    return { processedCount, failedCount }
  }
}
