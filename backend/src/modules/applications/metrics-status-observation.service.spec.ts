import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { CarbonFactorService } from '../../integrations/carbon-factor.service'
import { IntegrationError } from '../../integrations/integration-error'
import {
  MetricsAggregatorAdapter,
} from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'
import { MetricsStatusObservationService } from './metrics-status-observation.service'
import { StatusClassificationService } from './status-classification.service'

describe('MetricsStatusObservationService', () => {
  const observedAt = new Date('2026-10-13T12:00:00.000Z')
  const application = Object.assign(new ApplicationEntity(), {
    id: 'billing-api',
    regionCode: 'br-sudeste',
  })
  let applications: jest.Mocked<ApplicationsRepository>
  let metrics: jest.Mocked<MetricsAggregatorAdapter>
  let carbonFactors: jest.Mocked<CarbonFactorService>
  let classification: jest.Mocked<StatusClassificationService>
  let service: MetricsStatusObservationService

  beforeEach(() => {
    application.regionCode = 'br-sudeste'
    applications = {
      findForCollection: jest.fn().mockResolvedValue([application]),
    } as unknown as jest.Mocked<ApplicationsRepository>
    metrics = {
      fetchMetrics: jest.fn().mockResolvedValue({ receivedAt: observedAt }),
    } as unknown as jest.Mocked<MetricsAggregatorAdapter>
    carbonFactors = {
      capture: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<CarbonFactorService>
    classification = {
      record: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<StatusClassificationService>
    service = new MetricsStatusObservationService(
      applications,
      metrics,
      carbonFactors,
      classification,
    )
  })

  it('classifies valid metrics with an available regional factor', async () => {
    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 1,
      failedCount: 0,
    })
    expect(classification.record).toHaveBeenCalledWith(
      application.id,
      {
        kind: 'metrics',
        result: 'valid',
        observedAt,
        carbonFactorAvailable: true,
      },
      'cycle-1',
    )
  })

  it('keeps valid metrics available when the carbon factor cannot be captured', async () => {
    carbonFactors.capture.mockRejectedValue(new Error('factor unavailable'))

    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 1,
      failedCount: 0,
    })
    expect(classification.record).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({
        kind: 'metrics',
        result: 'valid',
        carbonFactorAvailable: false,
      }),
      'cycle-1',
    )
  })

  it('skips the carbon-factor request when the application has no region code', async () => {
    applications.findForCollection.mockResolvedValue([
      Object.assign(new ApplicationEntity(), {
        id: application.id,
        regionCode: null,
      }),
    ])

    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 1,
      failedCount: 0,
    })
    expect(carbonFactors.capture).not.toHaveBeenCalled()
    expect(classification.record).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({
        kind: 'metrics',
        result: 'valid',
        carbonFactorAvailable: false,
      }),
      'cycle-1',
    )
  })

  it.each([
    [new IntegrationError('UPSTREAM_UNAVAILABLE', 404), 'missing'],
    [new IntegrationError('INVALID_UPSTREAM_RESPONSE'), 'invalid'],
  ] as const)('classifies metric response errors (%s)', async (failure, result) => {
    metrics.fetchMetrics.mockRejectedValue(failure)

    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 1,
      failedCount: 1,
    })
    expect(classification.record).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({ kind: 'metrics', result }),
      'cycle-1',
    )
  })

  it('marks upstream failures as source errors and preserves per-application processing', async () => {
    metrics.fetchMetrics.mockRejectedValue(
      new IntegrationError('UPSTREAM_UNAVAILABLE'),
    )

    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 1,
      failedCount: 1,
    })
    expect(classification.record).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({
        kind: 'source_failure',
        reason: ApplicationStateReason.SOURCE_ERROR,
      }),
      'cycle-1',
    )
  })

  it('counts failed persistence without relabeling it as an upstream failure', async () => {
    classification.record.mockRejectedValue(new Error('database unavailable'))

    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 0,
      failedCount: 1,
    })
    expect(classification.record).toHaveBeenCalledWith(
      application.id,
      expect.objectContaining({ kind: 'metrics', result: 'valid' }),
      'cycle-1',
    )
  })

  it('does not call integrations when there are no collectable applications', async () => {
    applications.findForCollection.mockResolvedValue([])

    await expect(service.observeAll('cycle-1')).resolves.toEqual({
      processedCount: 0,
      failedCount: 0,
    })
    expect(metrics.fetchMetrics).not.toHaveBeenCalled()
    expect(carbonFactors.capture).not.toHaveBeenCalled()
    expect(classification.record).not.toHaveBeenCalled()
  })
})
