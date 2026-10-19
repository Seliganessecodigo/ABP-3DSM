import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm'
import { ApplicationEventEntity } from '../entities/application-event.entity'
import { formatUtcTimestamp } from '../../modules/calculations/persisted-environmental-period'

export interface PersistedApplicationAnalysisEvent {
  readonly id: string
  readonly occurredAt: string
  readonly kind: string
  readonly details: Record<string, unknown> | null
}

@Injectable()
export class ApplicationEventsRepository {
  constructor(
    @InjectRepository(ApplicationEventEntity)
    private readonly repository: Repository<ApplicationEventEntity>,
  ) {}

  async append(
    event: Partial<ApplicationEventEntity>,
  ): Promise<ApplicationEventEntity> {
    const entity = this.repository.create(event)
    const values = { ...event }
    delete values.application
    const result = await this.repository.insert(
      values as unknown as QueryDeepPartialEntity<ApplicationEventEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }

  async appendInTransaction(
    manager: EntityManager,
    event: Partial<ApplicationEventEntity>,
  ): Promise<void> {
    await manager.insert(
      ApplicationEventEntity,
      event as QueryDeepPartialEntity<ApplicationEventEntity>,
    )
  }

  findAnalysisEventsByApplicationAndPeriod(
    applicationId: string,
    periodStartNanoseconds: bigint,
    periodEndNanoseconds: bigint,
  ): Promise<PersistedApplicationAnalysisEvent[]> {
    const startBound = floorToMicrosecond(periodStartNanoseconds)
    const endBound = ceilToMicrosecond(periodEndNanoseconds)
    return this.repository.manager.query<PersistedApplicationAnalysisEvent[]>(
      `SELECT id,
        to_char("occurredAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "occurredAt",
        kind, details
      FROM application_events
      WHERE "applicationId" = $1
        AND "occurredAt" >= $2::timestamptz
        AND "occurredAt" < $3::timestamptz
        AND kind IN ('status_changed', 'removed', 'returned', 'registration_changed', 'region_changed')
      ORDER BY "occurredAt" ASC, id ASC`,
      [applicationId, formatUtcTimestamp(startBound), formatUtcTimestamp(endBound)],
    )
  }
}

function floorToMicrosecond(nanoseconds: bigint): bigint {
  const remainder = nanoseconds % 1_000n
  return remainder < 0n
    ? nanoseconds - remainder - 1_000n
    : nanoseconds - remainder
}

function ceilToMicrosecond(nanoseconds: bigint): bigint {
  const remainder = nanoseconds % 1_000n
  return remainder > 0n
    ? nanoseconds - remainder + 1_000n
    : nanoseconds - remainder
}
