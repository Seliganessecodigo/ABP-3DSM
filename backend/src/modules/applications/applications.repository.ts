import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationState } from '../../database/entities/application-state'

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
}
