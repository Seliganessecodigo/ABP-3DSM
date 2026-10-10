import { EntityManager, Repository } from 'typeorm'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsRepository } from './applications.repository'
import { ClassifiedStatus } from './application-status-classifier'

describe('ApplicationsRepository operational status methods', () => {
  const repository = new ApplicationsRepository(
    {} as Repository<ApplicationEntity>,
  )

  it('locks the application row before classifying a new observation', async () => {
    const application = Object.assign(new ApplicationEntity(), { id: 'api' })
    const query = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(application),
    }
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(query),
      }),
    } as unknown as EntityManager

    await expect(repository.findByIdForUpdate(manager, 'api')).resolves.toBe(
      application,
    )
    expect(query.where).toHaveBeenCalledWith('application.id = :id', {
      id: 'api',
    })
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write')
  })

  it('persists state, reason, freshness, calculability and timestamps together', async () => {
    const manager = { update: jest.fn().mockResolvedValue(undefined) }
    const observedAt = new Date('2026-10-07T12:00:00.000Z')
    const lastObservationAt = new Date('2026-10-07T11:00:00.000Z')
    const status: ClassifiedStatus = {
      state: ApplicationState.UNAVAILABLE,
      reason: null,
      isStale: true,
      isCalculable: false,
      lastCheckedAt: observedAt,
      lastObservationAt,
    }

    await repository.updateOperationalStatus(
      manager as unknown as EntityManager,
      'api',
      status,
    )

    expect(manager.update).toHaveBeenCalledWith(
      ApplicationEntity,
      { id: 'api' },
      {
        state: ApplicationState.UNAVAILABLE,
        stateReason: null,
        isStale: true,
        isCalculable: false,
        lastCheckedAt: observedAt,
        lastObservationAt,
      },
    )
  })

  it('clears stale and calculability fields only after confirmed removal', async () => {
    const manager = { update: jest.fn().mockResolvedValue(undefined) }
    const removedAt = new Date('2026-10-07T12:00:00.000Z')

    await repository.markRemoved(
      manager as unknown as EntityManager,
      'api',
      removedAt,
    )

    expect(manager.update).toHaveBeenCalledWith(
      ApplicationEntity,
      { id: 'api' },
      {
        state: ApplicationState.REMOVED,
        stateReason: null,
        isStale: false,
        isCalculable: false,
        removedAt,
        lastCheckedAt: removedAt,
      },
    )
  })

  it('clears removal and waits for fresh metrics when the catalog confirms return', async () => {
    const manager = { update: jest.fn().mockResolvedValue(undefined) }
    const returnedAt = new Date('2026-10-07T12:00:00.000Z')

    await repository.restore(
      manager as unknown as EntityManager,
      'api',
      ApplicationState.UNAVAILABLE,
      returnedAt,
    )

    expect(manager.update).toHaveBeenCalledWith(
      ApplicationEntity,
      { id: 'api' },
      {
        state: ApplicationState.UNAVAILABLE,
        stateReason: ApplicationStateReason.METRICS_MISSING,
        isStale: false,
        isCalculable: false,
        removedAt: null,
        lastCheckedAt: returnedAt,
      },
    )
  })
})
