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
import { CarbonRegionEntity } from '../entities/carbon-region.entity'

@Injectable()
export class CarbonRegionsRepository {
  constructor(
    @InjectRepository(CarbonRegionEntity)
    private readonly repository: Repository<CarbonRegionEntity>,
  ) {}

  async addVersion(region: Partial<CarbonRegionEntity>): Promise<CarbonRegionEntity> {
    const entity = this.repository.create(region)
    const result = await this.repository.insert(
      region as unknown as QueryDeepPartialEntity<CarbonRegionEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }

  findEffective(code: string, at: Date): Promise<CarbonRegionEntity | null> {
    return this.repository.findOne({
      where: {
        code,
        validFrom: LessThanOrEqual(at),
        validUntil: Or(MoreThan(at), IsNull()),
      },
      order: { validFrom: 'DESC' },
    })
  }
}
