import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryDeepPartialEntity, Repository } from 'typeorm'
import { RecalculationEntity } from '../entities/recalculation.entity'

@Injectable()
export class RecalculationsRepository {
  constructor(
    @InjectRepository(RecalculationEntity)
    private readonly repository: Repository<RecalculationEntity>,
  ) {}

  async append(recalculation: Partial<RecalculationEntity>): Promise<RecalculationEntity> {
    const entity = this.repository.create(recalculation)
    const values = { ...recalculation }
    delete values.collection
    delete values.requestedByUser
    const result = await this.repository.insert(
      values as unknown as QueryDeepPartialEntity<RecalculationEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }
}
