import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'

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
}
