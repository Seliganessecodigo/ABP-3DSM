import type { Repository } from 'typeorm'
import { ApplicationEventEntity } from '../entities/application-event.entity'
import { AuditLogEntity } from '../entities/audit-log.entity'
import { CalculationConfigEntity } from '../entities/calculation-config.entity'
import { CarbonRegionEntity } from '../entities/carbon-region.entity'
import { CollectionEntity } from '../entities/collection.entity'
import {
  MonitoringCycleEntity,
  MonitoringCycleStatus,
} from '../entities/monitoring-cycle.entity'
import { RecalculationEntity } from '../entities/recalculation.entity'
import { ApplicationEventsRepository } from './application-events.repository'
import { AuditLogsRepository } from './audit-logs.repository'
import { CalculationConfigsRepository } from './calculation-configs.repository'
import { CarbonRegionsRepository } from './carbon-regions.repository'
import { CollectionsRepository } from './collections.repository'
import { MonitoringCyclesRepository } from './monitoring-cycles.repository'
import { RecalculationsRepository } from './recalculations.repository'

const generatedId = 'generated-id'

function createRepository<T extends object>() {
  const repository = {
    create: jest.fn((values) => values),
    insert: jest.fn().mockResolvedValue({ identifiers: [{ id: generatedId }] }),
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    save: jest.fn(),
  }

  return {
    repository: repository as unknown as Repository<T>,
    mock: repository,
  }
}

describe('database repositories', () => {
  it('appends collections with insert and supports interval lookup', async () => {
    const { repository, mock } = createRepository<CollectionEntity>()
    const collections = new CollectionsRepository(repository)
    const intervalStart = new Date('2026-01-01T00:00:00Z')
    const collection = { applicationId: 'app-1', intervalStart } as CollectionEntity
    mock.findOne.mockResolvedValue(collection)

    await expect(collections.append(collection)).resolves.toMatchObject({ id: generatedId })
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'app-1', intervalStart }),
    )
    await expect(
      collections.findByApplicationAndIntervalStart('app-1', intervalStart),
    ).resolves.toBe(collection)
    expect(mock.findOne).toHaveBeenCalledWith({
      where: { applicationId: 'app-1', intervalStart },
    })
  })

  it('appends application lifecycle events', async () => {
    const { repository, mock } = createRepository<ApplicationEventEntity>()
    const events = new ApplicationEventsRepository(repository)
    const event = { applicationId: 'app-1', kind: 'discovered' } as ApplicationEventEntity

    await expect(events.append(event)).resolves.toMatchObject({ id: generatedId })
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'app-1', kind: 'discovered' }),
    )
    expect(mock.save).not.toHaveBeenCalled()
  })

  it('appends audit records', async () => {
    const { repository, mock } = createRepository<AuditLogEntity>()
    const auditLogs = new AuditLogsRepository(repository)
    const entry = { actor: 'system', action: 'collection.created' } as AuditLogEntity

    await expect(auditLogs.append(entry)).resolves.toMatchObject({ id: generatedId })
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ actor: 'system', action: 'collection.created' }),
    )
    expect(mock.save).not.toHaveBeenCalled()
  })

  it('appends recalculation records', async () => {
    const { repository, mock } = createRepository<RecalculationEntity>()
    const recalculations = new RecalculationsRepository(repository)
    const record = { collectionId: generatedId, configVersion: 'v2' } as RecalculationEntity

    await expect(recalculations.append(record)).resolves.toMatchObject({ id: generatedId })
    expect(mock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ collectionId: generatedId, configVersion: 'v2' }),
    )
    expect(mock.save).not.toHaveBeenCalled()
  })

  it('creates a running monitoring cycle and finishes it with its duration', async () => {
    const { repository, mock } = createRepository<MonitoringCycleEntity>()
    const cycles = new MonitoringCyclesRepository(repository)
    const startedAt = new Date(Date.now() - 500)
    mock.create.mockImplementation((values) => values)
    mock.findOneByOrFail.mockResolvedValue({
      id: generatedId,
      startedAt,
      details: null,
    })
    mock.save.mockImplementation(async (cycle) => cycle)

    await cycles.start({ source: 'scheduler' })
    expect(mock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: MonitoringCycleStatus.RUNNING,
        details: { source: 'scheduler' },
      }),
    )

    const finished = await cycles.finish(generatedId, {
      status: MonitoringCycleStatus.SUCCEEDED,
      discoveredCount: 2,
      processedCount: 2,
      failedCount: 0,
      persistedCount: 2,
    })
    expect(mock.findOneByOrFail).toHaveBeenCalledWith({ id: generatedId })
    expect(finished.finishedAt).toBeInstanceOf(Date)
    expect(Number(finished.durationMs)).toBeGreaterThanOrEqual(0)
    expect(mock.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: MonitoringCycleStatus.SUCCEEDED,
        discoveredCount: 2,
        finishedAt: finished.finishedAt,
      }),
    )
  })

  it('adds immutable carbon factor versions and finds the effective version', async () => {
    const { repository, mock } = createRepository<CarbonRegionEntity>()
    const regions = new CarbonRegionsRepository(repository)
    const region = { code: 'region-1', version: 'v1' } as CarbonRegionEntity
    mock.findOne.mockResolvedValue(region)
    const at = new Date('2026-01-01T00:00:00Z')

    await expect(regions.addVersion(region)).resolves.toMatchObject({ id: generatedId })
    expect(mock.insert).toHaveBeenCalledWith(region)
    await expect(regions.findEffective('region-1', at)).resolves.toBe(region)
    expect(mock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ code: 'region-1' }),
        order: { validFrom: 'DESC' },
      }),
    )
    expect(mock.save).not.toHaveBeenCalled()
  })

  it('adds immutable calculation config versions and finds the effective version', async () => {
    const { repository, mock } = createRepository<CalculationConfigEntity>()
    const configs = new CalculationConfigsRepository(repository)
    const config = { key: 'energy', version: 'v1' } as CalculationConfigEntity
    mock.findOne.mockResolvedValue(config)
    const at = new Date('2026-01-01T00:00:00Z')

    await expect(configs.addVersion(config)).resolves.toMatchObject({ id: generatedId })
    expect(mock.insert).toHaveBeenCalledWith(config)
    await expect(configs.findEffective('energy', at)).resolves.toBe(config)
    expect(mock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ key: 'energy' }),
        order: { effectiveFrom: 'DESC' },
      }),
    )
    expect(mock.save).not.toHaveBeenCalled()
  })
})
