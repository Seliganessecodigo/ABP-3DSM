import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  IsNull,
  LessThanOrEqual,
  MoreThan,
  Or,
  QueryDeepPartialEntity,
  Repository,
} from 'typeorm'
import { CalculationConfigEntity } from '../entities/calculation-config.entity'

@Injectable()
export class CalculationConfigsRepository {
  constructor(
    @InjectRepository(CalculationConfigEntity)
    private readonly repository: Repository<CalculationConfigEntity>,
  ) {}

  async addVersion(config: Partial<CalculationConfigEntity>): Promise<CalculationConfigEntity> {
    const entity = this.repository.create(config)
    const result = await this.repository.insert(
      config as unknown as QueryDeepPartialEntity<CalculationConfigEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }

  findEffective(key: string, at: Date): Promise<CalculationConfigEntity | null> {
    return this.repository.findOne({
      where: {
        key,
        effectiveFrom: LessThanOrEqual(at),
        effectiveUntil: Or(MoreThan(at), IsNull()),
      },
      order: { effectiveFrom: 'DESC' },
    })
  }
}
