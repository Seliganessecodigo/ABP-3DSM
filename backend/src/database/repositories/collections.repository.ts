import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryDeepPartialEntity, Repository } from 'typeorm'
import { CollectionEntity } from '../entities/collection.entity'

@Injectable()
export class CollectionsRepository {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly repository: Repository<CollectionEntity>,
  ) {}

  async append(collection: Partial<CollectionEntity>): Promise<CollectionEntity> {
    const entity = this.repository.create(collection)
    const values = { ...collection }
    delete values.application
    delete values.carbonRegion
    delete values.calculationConfig
    const result = await this.repository.insert(
      values as unknown as QueryDeepPartialEntity<CollectionEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }

  findByApplicationAndIntervalStart(
    applicationId: string,
    intervalStart: Date,
  ): Promise<CollectionEntity | null> {
    return this.repository.findOne({ where: { applicationId, intervalStart } })
  }
}
