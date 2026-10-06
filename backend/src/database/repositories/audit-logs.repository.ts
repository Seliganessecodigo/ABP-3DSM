import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryDeepPartialEntity, Repository } from 'typeorm'
import { AuditLogEntity } from '../entities/audit-log.entity'

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  async append(entry: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    const entity = this.repository.create(entry)
    const values = { ...entry }
    delete values.actorUser
    const result = await this.repository.insert(
      values as unknown as QueryDeepPartialEntity<AuditLogEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }
}
