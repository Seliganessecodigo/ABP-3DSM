import { ApplicationState } from '../../database/entities/application-state'
import { MonitoringCycleStatus } from '../../database/entities/monitoring-cycle.entity'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { IntegrationError } from '../../integrations/integration-error'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { MonitoringCycleRunner } from './monitoring-cycle.runner'

describe('MonitoringCycleRunner', () => {
  const receivedAt = new Date('2026-10-14T12:01:00.000Z')
  const service = {
    id: 'app-1',
    name: 'App',
    location: {},
    metricsPath: '/metrics/app-1',
  }
  let runner: MonitoringCycleRunner
  let dependencies: {
    adapter: { fetchServices: jest.Mock; fetchMetrics: jest.Mock }
    cycles: { start: jest.Mock; finish: jest.Mock }
    discovery: { discover: jest.Mock }
    metadata: { reconcile: jest.Mock }
    removal: { reconcile: jest.Mock }
    returns: { reconcile: jest.Mock }
    applications: { findForCollection: jest.Mock }
    collections: {
      findByApplicationAndIntervalStart: jest.Mock
      append: jest.Mock
    }
    statuses: { record: jest.Mock }
  }

  beforeEach(() => {
    dependencies = {
      adapter: {
        fetchServices: jest.fn().mockResolvedValue([service]),
        fetchMetrics: jest.fn().mockResolvedValue({
          collectionIntervalSeconds: 60,
          metrics: { cpuPercent: 0, memoryGb: 2, diskGb: 3, networkGb: 4 },
          receivedAt,
        }),
      },
      cycles: {
        start: jest.fn().mockResolvedValue({ id: 'cycle-1' }),
        finish: jest.fn().mockResolvedValue({}),
      },
      discovery: { discover: jest.fn().mockResolvedValue(0) },
      metadata: { reconcile: jest.fn().mockResolvedValue(0) },
      removal: { reconcile: jest.fn().mockResolvedValue(0) },
      returns: { reconcile: jest.fn().mockResolvedValue(0) },
      applications: {
        findForCollection: jest.fn().mockResolvedValue([{ id: 'app-1' }]),
      },
      collections: {
        findByApplicationAndIntervalStart: jest.fn().mockResolvedValue(null),
        append: jest.fn().mockResolvedValue({}),
      },
      statuses: { record: jest.fn().mockResolvedValue({}) },
    }
    runner = new MonitoringCycleRunner(
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.cycles as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[1],
      dependencies.discovery as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[2],
      dependencies.metadata as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[3],
      dependencies.removal as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[4],
      dependencies.returns as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[5],
      dependencies.applications as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[6],
      dependencies.collections as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[7],
      dependencies.statuses as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[8],
      2,
    )
  })

  it('reuses one validated snapshot and persists the source-defined interval and units', async () => {
    await runner.run()
    expect(dependencies.adapter.fetchServices).toHaveBeenCalledTimes(1)
    expect(dependencies.discovery.discover).toHaveBeenCalledWith('cycle-1', [
      service,
    ])
    expect(dependencies.metadata.reconcile).toHaveBeenCalledWith('cycle-1', [
      service,
    ])
    expect(dependencies.removal.reconcile).toHaveBeenCalledWith('cycle-1', [
      service,
    ])
    expect(dependencies.collections.append).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 'app-1',
        intervalStart: new Date('2026-10-14T12:00:00.000Z'),
        intervalEnd: receivedAt,
        collectedAt: receivedAt,
        state: ApplicationState.AVAILABLE,
        metrics: expect.objectContaining({
          cpuPercent: 0,
          collectionIntervalSeconds: 60,
        }),
        metricUnits: {
          cpuPercent: '%',
          memoryGb: 'GB',
          diskGb: 'GB',
          networkGb: 'GB',
        },
      }),
    )
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      'cycle-1',
      expect.objectContaining({
        status: MonitoringCycleStatus.SUCCEEDED,
        processedCount: 1,
        persistedCount: 1,
        failedCount: 0,
      }),
    )
  })

  it('does not duplicate a collection with an existing application interval', async () => {
    dependencies.collections.findByApplicationAndIntervalStart.mockResolvedValue(
      { id: 'existing' },
    )
    await runner.run()
    expect(dependencies.collections.append).not.toHaveBeenCalled()
    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      'app-1',
      expect.objectContaining({ result: 'valid' }),
      'cycle-1',
    )
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      'cycle-1',
      expect.objectContaining({ persistedCount: 0 }),
    )
  })

  it('isolates a metric failure and marks the cycle partial without writing a zero', async () => {
    dependencies.adapter.fetchMetrics.mockRejectedValue(
      new IntegrationError('UPSTREAM_UNAVAILABLE', 500),
    )
    await runner.run()
    expect(dependencies.collections.append).not.toHaveBeenCalled()
    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      'app-1',
      {
        kind: 'source_failure',
        reason: ApplicationStateReason.SOURCE_ERROR,
        observedAt: expect.any(Date),
      },
      'cycle-1',
    )
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      'cycle-1',
      expect.objectContaining({
        status: MonitoringCycleStatus.FAILED,
        processedCount: 1,
        failedCount: 1,
        persistedCount: 0,
      }),
    )
  })

  it('marks the cycle partial when one application fails and another succeeds', async () => {
    dependencies.adapter.fetchServices.mockResolvedValue([
      service,
      { ...service, id: 'app-2' },
    ])
    dependencies.applications.findForCollection.mockResolvedValue([
      { id: 'app-1' },
      { id: 'app-2' },
    ])
    dependencies.adapter.fetchMetrics.mockImplementation(async (id: string) => {
      if (id === 'app-2') {
        throw new IntegrationError('UPSTREAM_UNAVAILABLE', 500)
      }
      return {
        collectionIntervalSeconds: 60,
        metrics: { cpuPercent: 1, memoryGb: 1, diskGb: 1, networkGb: 1 },
        receivedAt,
      }
    })

    await runner.run()

    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      'cycle-1',
      expect.objectContaining({
        status: MonitoringCycleStatus.PARTIAL,
        processedCount: 2,
        failedCount: 1,
        persistedCount: 1,
      }),
    )
  })

  it('does not reconcile removal after the services snapshot fails', async () => {
    dependencies.adapter.fetchServices.mockRejectedValue(
      new IntegrationError('INVALID_UPSTREAM_RESPONSE'),
    )

    await expect(runner.run()).rejects.toBeInstanceOf(IntegrationError)

    expect(dependencies.removal.reconcile).not.toHaveBeenCalled()
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      'cycle-1',
      expect.objectContaining({ status: MonitoringCycleStatus.FAILED }),
    )
  })

  it('limits concurrent metrics requests', async () => {
    const apps = Array.from({ length: 5 }, (_, index) => ({
      id: `app-${index}`,
    }))
    dependencies.adapter.fetchServices.mockResolvedValue(
      apps.map(({ id }) => ({ ...service, id })),
    )
    dependencies.applications.findForCollection.mockResolvedValue(apps)
    let active = 0
    let peak = 0
    dependencies.adapter.fetchMetrics.mockImplementation(async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 1))
      active--
      return {
        collectionIntervalSeconds: 60,
        metrics: { cpuPercent: 1, memoryGb: 1, diskGb: 1, networkGb: 1 },
        receivedAt,
      }
    })
    await runner.run()
    expect(peak).toBe(2)
  })
})
