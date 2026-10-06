import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryDeepPartialEntity, Repository } from 'typeorm'
import { ApplicationEventEntity } from '../entities/application-event.entity'

@Injectable()
export class ApplicationEventsRepository {
  constructor(
    @InjectRepository(ApplicationEventEntity)
    private readonly repository: Repository<ApplicationEventEntity>,
  ) {}

  async append(event: Partial<ApplicationEventEntity>): Promise<ApplicationEventEntity> {
    const entity = this.repository.create(event)
    const values = { ...event }
    delete values.application
    const result = await this.repository.insert(
      values as unknown as QueryDeepPartialEntity<ApplicationEventEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }
}
