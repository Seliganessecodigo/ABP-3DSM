import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import type { ClassifiedStatus } from './application-status-classifier'

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
  ) {}

  findAll() {
    return this.applications.find()
  }

  findById(id: string) {
    return this.applications.findOneBy({ id })
  }

  findByIdForUpdate(manager: EntityManager, id: string) {
    return manager
      .getRepository(ApplicationEntity)
      .createQueryBuilder('application')
      .where('application.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne()
  }

  async insertIfAbsent(
    manager: EntityManager,
    values: Partial<ApplicationEntity>,
  ): Promise<boolean> {
    const result = await manager
      .createQueryBuilder()
      .insert()
      .into(ApplicationEntity)
      .values(values as QueryDeepPartialEntity<ApplicationEntity>)
      .orIgnore()
      .returning('id')
      .execute()
    return result.raw.length > 0
  }

  async findMissingForUpdate(
    manager: EntityManager,
    currentIds: string[],
  ): Promise<ApplicationEntity[]> {
    const query = manager
      .getRepository(ApplicationEntity)
      .createQueryBuilder('application')
      .where('application.state <> :removed', {
        removed: ApplicationState.REMOVED,
      })
    if (currentIds.length > 0) {
      query.andWhere('application.id NOT IN (:...currentIds)', { currentIds })
    }
    return query.setLock('pessimistic_write').getMany()
  }

  async markRemoved(
    manager: EntityManager,
    id: string,
    at: Date,
  ): Promise<void> {
    await manager.update(
      ApplicationEntity,
      { id },
      {
        state: ApplicationState.REMOVED,
        stateReason: null,
        isStale: false,
        isCalculable: false,
        removedAt: at,
        lastCheckedAt: at,
      },
    )
  }

  findForCollection(): Promise<ApplicationEntity[]> {
    return this.applications
      .createQueryBuilder('application')
      .where('application.state <> :removed', {
        removed: ApplicationState.REMOVED,
      })
      .getMany()
  }

  async updateOperationalStatus(
    manager: EntityManager,
    id: string,
    status: ClassifiedStatus,
  ): Promise<void> {
    await manager.update(
      ApplicationEntity,
      { id },
      {
        state: status.state,
        stateReason: status.reason,
        isStale: status.isStale,
        isCalculable: status.isCalculable,
        lastCheckedAt: status.lastCheckedAt,
        lastObservationAt: status.lastObservationAt,
      },
    )
  }

  async findByIdsForUpdate(
    manager: EntityManager,
    ids: string[],
  ): Promise<ApplicationEntity[]> {
    if (ids.length === 0) return []
    return manager
      .getRepository(ApplicationEntity)
      .createQueryBuilder('application')
      .where('application.id IN (:...ids)', { ids })
      .setLock('pessimistic_write')
      .getMany()
  }

  async findReturnedForUpdate(
    manager: EntityManager,
    currentIds: string[],
  ): Promise<ApplicationEntity[]> {
    if (currentIds.length === 0) return []
    return manager
      .getRepository(ApplicationEntity)
      .createQueryBuilder('application')
      .where('application.state = :removed', {
        removed: ApplicationState.REMOVED,
      })
      .andWhere('application.id IN (:...currentIds)', { currentIds })
      .setLock('pessimistic_write')
      .getMany()
  }

  async updateMetadata(
    manager: EntityManager,
    id: string,
    values: Pick<
      ApplicationEntity,
      | 'name'
      | 'regionCode'
      | 'country'
      | 'region'
      | 'city'
      | 'latitude'
      | 'longitude'
    >,
  ): Promise<void> {
    await manager.update(ApplicationEntity, { id }, values)
  }

  async restore(
    manager: EntityManager,
    id: string,
    state: ApplicationState,
    at: Date,
  ): Promise<void> {
    await manager.update(
      ApplicationEntity,
      { id },
      {
        state,
        stateReason:
          state === ApplicationState.UNAVAILABLE
            ? ApplicationStateReason.METRICS_MISSING
            : null,
        isStale: false,
        isCalculable: false,
        removedAt: null,
        lastCheckedAt: at,
      },
    )
  }
}
