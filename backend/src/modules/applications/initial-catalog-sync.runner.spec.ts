import { DiscoveryService } from './discovery.service'
import { InitialCatalogSyncRunner } from './initial-catalog-sync.runner'
import { MonitoringCyclesRepository } from '../../database/repositories/monitoring-cycles.repository'
import { MonitoringCycleStatus } from '../../database/entities/monitoring-cycle.entity'
import { IntegrationError } from '../../integrations/integration-error'

describe('sincronização inicial do catálogo', () => {
  it('registra a descoberta e encerra o ciclo com as aplicações persistidas', async () => {
    const cycle = { id: 'startup-cycle' }
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    }
    const discovery = { discover: jest.fn().mockResolvedValue(8) }
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
    )

    await expect(runner.run()).resolves.toBe(8)

    expect(cycles.start).toHaveBeenCalledWith({
      source: 'startup-catalog-discovery',
    })
    expect(discovery.discover).toHaveBeenCalledWith(cycle.id)
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.SUCCEEDED,
      discoveredCount: 8,
      processedCount: 8,
      failedCount: 0,
      persistedCount: 8,
      details: { source: 'startup-catalog-discovery' },
    })
  })

  it('marca o ciclo como falho quando a origem não fornece um snapshot válido', async () => {
    const cycle = { id: 'failed-startup-cycle' }
    const failure = new IntegrationError('INVALID_UPSTREAM_RESPONSE')
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    }
    const discovery = { discover: jest.fn().mockRejectedValue(failure) }
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
    )

    await expect(runner.run()).rejects.toBe(failure)
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 1,
      persistedCount: 0,
      details: {
        source: 'startup-catalog-discovery',
        errorCode: 'INVALID_UPSTREAM_RESPONSE',
      },
    })
  })
})
