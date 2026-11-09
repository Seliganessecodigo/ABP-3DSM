/* eslint no-await-in-loop: "error" */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import type { ClassifiedStatus } from './application-status-classifier'

// Keep each INSERT below PostgreSQL's parameter limit without limiting the catalog.
const DISCOVERY_INSERT_BATCH_SIZE = 1_000

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

  async insertManyIfAbsent(
    manager: EntityManager,
    values: readonly (Partial<ApplicationEntity> & Pick<ApplicationEntity, 'id'>)[],
  ): Promise<string[]> {
    const unique = new Map<string, Partial<ApplicationEntity>>()
    for (const value of values) {
      if (!unique.has(value.id)) unique.set(value.id, value)
    }
    // Consistent lock order also applies when concurrent snapshots arrive reversed.
    const ordered = [...unique.entries()]
      .sort(([left], [right]) => {
        if (left < right) return -1
        if (left > right) return 1
        return 0
      })
      .map(([, value]) => value)
    const insertedIds: string[] = []
    for (let offset = 0; offset < ordered.length; offset += DISCOVERY_INSERT_BATCH_SIZE) {
      // eslint-disable-next-line no-await-in-loop -- One transactional connection; preserve lock order and stop after a failed batch.
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(ApplicationEntity)
        .values(ordered.slice(offset, offset + DISCOVERY_INSERT_BATCH_SIZE) as QueryDeepPartialEntity<ApplicationEntity>[])
        .orIgnore()
        .returning('id')
        .execute()
      insertedIds.push(...(result.raw as { id: string }[]).map(({ id }) => id))
    }
    return insertedIds
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
        stateReason: ApplicationStateReason.REMOVAL_CONFIRMED,
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
