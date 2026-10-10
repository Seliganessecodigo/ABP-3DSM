import { ConflictException, NotFoundException } from '@nestjs/common'
import { EntityManager } from 'typeorm'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { ApplicationsRepository } from './applications.repository'
import { StatusClassificationService } from './status-classification.service'

describe('StatusClassificationService', () => {
  const observedAt = new Date('2026-10-07T12:00:00.000Z')
  const manager = {} as EntityManager
  const makeApplication = (overrides: Partial<ApplicationEntity> = {}) =>
    Object.assign(new ApplicationEntity(), {
      id: 'billing-api',
      state: ApplicationState.AVAILABLE,
      stateReason: null,
      isStale: false,
      isCalculable: null,
      lastObservationAt: null,
      ...overrides,
    })

  let applications: jest.Mocked<ApplicationsRepository>
  let events: jest.Mocked<ApplicationEventsRepository>
  let dataSource: { transaction: jest.Mock }
  let service: StatusClassificationService

  beforeEach(() => {
    applications = {
      findByIdForUpdate: jest.fn().mockResolvedValue(makeApplication()),
      updateOperationalStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ApplicationsRepository>
    events = {
      appendInTransaction: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ApplicationEventsRepository>
    dataSource = {
      transaction: jest.fn((work) => work(manager)),
    }
    service = new StatusClassificationService(
      applications,
      events,
      dataSource as never,
    )
  })

  it('persists a new operational state and appends the transition event atomically', async () => {
    const result = await service.record('billing-api', {
      kind: 'source_failure',
      reason: ApplicationStateReason.SOURCE_TIMEOUT,
      observedAt,
    })

    expect(result).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      reason: ApplicationStateReason.SOURCE_TIMEOUT,
      isStale: true,
    })
    expect(applications.updateOperationalStatus).toHaveBeenCalledWith(
      manager,
      'billing-api',
      result,
    )
    expect(events.appendInTransaction).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({
        applicationId: 'billing-api',
        cycleId: null,
        kind: 'status_changed',
        actor: 'system',
        occurredAt: observedAt,
      }),
    )
  })

  it('does not append duplicate transition events when the classification is unchanged', async () => {
    applications.findByIdForUpdate.mockResolvedValue(
      makeApplication({
        state: ApplicationState.AVAILABLE,
        isCalculable: true,
        lastObservationAt: new Date('2026-10-07T11:00:00.000Z'),
      }),
    )

    await service.record('billing-api', {
      kind: 'metrics',
      result: 'valid',
      observedAt,
      carbonFactorAvailable: true,
    })

    expect(events.appendInTransaction).not.toHaveBeenCalled()
  })

  it('returns not found without mutating when the application does not exist', async () => {
    applications.findByIdForUpdate.mockResolvedValue(null)

    await expect(
      service.record('missing', {
        kind: 'metrics',
        result: 'missing',
        observedAt,
        carbonFactorAvailable: false,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(applications.updateOperationalStatus).not.toHaveBeenCalled()
  })

  it('requires the catalog return flow before changing a removed application', async () => {
    applications.findByIdForUpdate.mockResolvedValue(
      makeApplication({ state: ApplicationState.REMOVED }),
    )

    await expect(
      service.record('billing-api', {
        kind: 'metrics',
        result: 'valid',
        observedAt,
        carbonFactorAvailable: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(applications.updateOperationalStatus).not.toHaveBeenCalled()
  })
})
