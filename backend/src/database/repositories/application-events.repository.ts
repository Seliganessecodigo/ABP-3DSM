/* eslint no-await-in-loop: "error" */
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

export interface PersistedApplicationMetadataEvent {
  readonly applicationId: string
  readonly occurredAt: string
  readonly details: Record<string, unknown> | null
}

// Event inserts share the caller's transaction and stay below PostgreSQL's parameter limit.
const EVENT_INSERT_BATCH_SIZE = 1_000

@Injectable()
export class ApplicationEventsRepository {
  constructor(
    @InjectRepository(ApplicationEventEntity)
    private readonly repository: Repository<ApplicationEventEntity>,
  ) {}

  async collectionAttemptCounts(applicationIds: readonly string[], from: bigint, to: bigint, regionCodes?: readonly string[]) {
    const rates = new Map<string, number>()
    if (applicationIds.length === 0) return { counts: { successful: 0, total: 0, firstAttemptAt: null, lastAttemptAt: null }, rates }
    const [overall, ...byApplication] = await this.repository.manager.query<{
      applicationId: string | null; successful: number; total: number; firstAttemptAt: string | null; lastAttemptAt: string | null
    }[]>(
      `SELECT "applicationId", COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE details->>'succeeded' = 'true')::int AS successful,
        to_char(MIN("occurredAt") AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "firstAttemptAt",
        to_char(MAX("occurredAt") AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "lastAttemptAt"
      FROM application_events
      WHERE kind = 'collection_attempt' AND "applicationId" = ANY($1::text[])
        AND "occurredAt" >= $2::timestamptz AND "occurredAt" < $3::timestamptz
        AND ($4::text[] IS NULL OR details->>'regionCode' = ANY($4::text[]))
      GROUP BY GROUPING SETS ((), ("applicationId"))
      ORDER BY GROUPING("applicationId") DESC`,
      [applicationIds, formatUtcTimestamp(floorToMicrosecond(from)), formatUtcTimestamp(ceilToMicrosecond(to)), regionCodes ?? null],
    )
    for (const row of byApplication) {
      if (row.applicationId !== null) rates.set(row.applicationId, row.successful / row.total)
    }
    const { successful, total, firstAttemptAt, lastAttemptAt } = overall
    return { counts: { successful, total, firstAttemptAt, lastAttemptAt }, rates }
  }

  async collectionSuccessByBucket(applicationId: string, from: bigint, to: bigint, granularity: string) {
    const rows = await this.repository.manager.query<{ bucketStart: string; rate: number }[]>(
      `SELECT to_char(date_trunc($4, "occurredAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "bucketStart",
        COUNT(*) FILTER (WHERE details->>'succeeded' = 'true')::float8 / COUNT(*) AS rate
      FROM application_events
      WHERE kind = 'collection_attempt' AND "applicationId" = $1
        AND "occurredAt" >= $2::timestamptz AND "occurredAt" < $3::timestamptz
      GROUP BY date_trunc($4, "occurredAt" AT TIME ZONE 'UTC')`,
      [applicationId, formatUtcTimestamp(floorToMicrosecond(from)), formatUtcTimestamp(ceilToMicrosecond(to)), granularity],
    )
    return new Map(rows.map(({ bucketStart, rate }) => [Date.parse(bucketStart), rate]))
  }

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

  async appendManyInTransaction(
    manager: EntityManager,
    events: readonly Partial<ApplicationEventEntity>[],
  ): Promise<void> {
    for (let offset = 0; offset < events.length; offset += EVENT_INSERT_BATCH_SIZE) {
      // eslint-disable-next-line no-await-in-loop -- Submit the next batch only after success on the same transactional connection.
      await manager.insert(
        ApplicationEventEntity,
        events.slice(offset, offset + EVENT_INSERT_BATCH_SIZE) as QueryDeepPartialEntity<ApplicationEventEntity>[],
      )
    }
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
      [
        applicationId,
        formatUtcTimestamp(startBound),
        formatUtcTimestamp(endBound),
      ],
    )
  }

  findMetadataHistory(
    applicationIds: readonly string[],
  ): Promise<PersistedApplicationMetadataEvent[]> {
    if (applicationIds.length === 0) return Promise.resolve([])
    return this.repository.manager.query<PersistedApplicationMetadataEvent[]>(
      `SELECT "applicationId",
        to_char("occurredAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "occurredAt",
        details
      FROM application_events
      WHERE "applicationId" = ANY($1::text[]) AND kind = 'registration_changed'
      ORDER BY "applicationId" ASC, "occurredAt" ASC, id ASC`,
      [applicationIds],
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
