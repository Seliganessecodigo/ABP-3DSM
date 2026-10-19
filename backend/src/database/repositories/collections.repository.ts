import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { QueryDeepPartialEntity, Repository } from 'typeorm'
import { CollectionEntity } from '../entities/collection.entity'
import type { CollectionCalculationEvidenceV1 } from '../entities/collection.entity'
import { ApplicationState } from '../entities/application-state'
import type { PersistedEnvironmentalInterval } from '../../modules/calculations/persisted-environmental-period'
import { formatUtcTimestamp } from '../../modules/calculations/persisted-environmental-period'

@Injectable()
export class CollectionsRepository {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly repository: Repository<CollectionEntity>,
  ) {}

  async append(
    collection: Partial<CollectionEntity>,
  ): Promise<CollectionEntity> {
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

  async persistEnvironmentalBundle(
    collectionId: string,
    bundle: EnvironmentalBundle,
  ): Promise<CollectionEntity> {
    if (bundle.calculationEvidence?.version !== 1) {
      throw new InvalidEnvironmentalBundleError()
    }
    return this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(CollectionEntity)
      const collection = await repository.findOne({
        where: { id: collectionId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!collection) throw new EnvironmentalBundleCollectionNotFoundError()

      if (collection.calculationEvidence !== null) {
        if (sameBundle(collection, bundle)) return collection
        throw new EnvironmentalBundleConflictError()
      }

      Object.assign(collection, bundle)
      return repository.save(collection)
    })
  }

  findByApplicationAndIntervalStart(
    applicationId: string,
    intervalStart: Date,
  ): Promise<CollectionEntity | null> {
    return this.repository.findOne({ where: { applicationId, intervalStart } })
  }

  findHistoryByApplication(applicationId: string): Promise<CollectionEntity[]> {
    return this.repository.find({
      where: { applicationId },
      order: { intervalStart: 'ASC', id: 'ASC' },
    })
  }

  async findEnvironmentalByApplicationAndPeriod(
    applicationId: string,
    periodStartNanoseconds: bigint,
    periodEndNanoseconds: bigint,
  ): Promise<PersistedEnvironmentalInterval[]> {
    const startBound = floorToMicrosecond(periodStartNanoseconds)
    const endBound = ceilToMicrosecond(periodEndNanoseconds)
    const rows = await this.repository.manager.query<EnvironmentalCollectionRow[]>(
      `SELECT
        id,
        to_char("intervalStart" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "intervalStart",
        to_char("intervalEnd" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "intervalEnd",
        to_char("collectedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "collectedAt",
        "energyKwh",
        "carbonGrams",
        "calculationEvidence"
      FROM collections
      WHERE "applicationId" = $1
        AND "intervalStart" < $3::timestamptz
        AND "intervalEnd" > $2::timestamptz
      ORDER BY "intervalStart" ASC, id ASC`,
      [applicationId, formatUtcTimestamp(startBound), formatUtcTimestamp(endBound)],
    )
    return rows
  }

  findEnvironmentalHistoryByCollectedAt(
    applicationId: string,
    periodStartNanoseconds: bigint,
    periodEndNanoseconds: bigint,
  ): Promise<PersistedEnvironmentalInterval[]> {
    const startBound = floorToMicrosecond(periodStartNanoseconds)
    const endBound = ceilToMicrosecond(periodEndNanoseconds)
    return this.repository.manager.query<EnvironmentalCollectionRow[]>(
      `WITH predecessor AS (
        SELECT id, "intervalStart", "intervalEnd", "collectedAt", "energyKwh", "carbonGrams", "calculationEvidence"
        FROM collections
        WHERE "applicationId" = $1 AND "collectedAt" < $2::timestamptz
        ORDER BY "collectedAt" DESC, id DESC
        LIMIT 1
      ), period AS (
        SELECT id, "intervalStart", "intervalEnd", "collectedAt", "energyKwh", "carbonGrams", "calculationEvidence"
        FROM collections
        WHERE "applicationId" = $1
          AND "collectedAt" >= $2::timestamptz
          AND "collectedAt" < $3::timestamptz
      )
      SELECT id,
        to_char("intervalStart" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "intervalStart",
        to_char("intervalEnd" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "intervalEnd",
        to_char("collectedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "collectedAt",
        "energyKwh", "carbonGrams", "calculationEvidence"
      FROM (SELECT * FROM predecessor UNION ALL SELECT * FROM period) history
      ORDER BY "collectedAt" ASC, id ASC`,
      [applicationId, formatUtcTimestamp(startBound), formatUtcTimestamp(endBound)],
    )
  }

  findLatestByApplication(
    applicationId: string,
  ): Promise<CollectionEntity | null> {
    return this.repository.findOne({
      where: { applicationId, state: ApplicationState.AVAILABLE },
      order: { collectedAt: 'DESC', id: 'DESC' },
    })
  }

  findByApplicationAndId(
    applicationId: string,
    id: string,
  ): Promise<CollectionEntity | null> {
    return this.repository.findOne({
      where: { applicationId, id, state: ApplicationState.AVAILABLE },
    })
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

interface EnvironmentalCollectionRow {
  id: string
  intervalStart: string
  intervalEnd: string
  collectedAt: string
  energyKwh: string | null
  carbonGrams: string | null
  calculationEvidence: PersistedEnvironmentalInterval['calculationEvidence']
}

export type EnvironmentalBundle = Omit<
  Pick<
    CollectionEntity,
    | 'energyKwh'
    | 'carbonGrams'
    | 'carbonFactor'
    | 'calculationVersion'
    | 'carbonRegionVersion'
    | 'carbonRegionId'
    | 'calculationConfigVersion'
    | 'calculationConfigId'
    | 'coverage'
    | 'calculationEvidence'
  >,
  'calculationEvidence'
> & { calculationEvidence: CollectionCalculationEvidenceV1 }

export class EnvironmentalBundleConflictError extends Error {
  constructor() {
    super('ENVIRONMENTAL_BUNDLE_CONFLICT')
    this.name = 'EnvironmentalBundleConflictError'
  }
}

export class EnvironmentalBundleCollectionNotFoundError extends Error {
  constructor() {
    super('COLLECTION_NOT_FOUND')
    this.name = 'EnvironmentalBundleCollectionNotFoundError'
  }
}

export class InvalidEnvironmentalBundleError extends Error {
  constructor() {
    super('INVALID_ENVIRONMENTAL_BUNDLE')
    this.name = 'InvalidEnvironmentalBundleError'
  }
}

function sameBundle(
  collection: CollectionEntity,
  bundle: EnvironmentalBundle,
): boolean {
  return (
    collection.energyKwh === bundle.energyKwh &&
    collection.carbonGrams === bundle.carbonGrams &&
    collection.carbonFactor === bundle.carbonFactor &&
    collection.calculationVersion === bundle.calculationVersion &&
    collection.carbonRegionVersion === bundle.carbonRegionVersion &&
    collection.carbonRegionId === bundle.carbonRegionId &&
    collection.calculationConfigVersion === bundle.calculationConfigVersion &&
    collection.calculationConfigId === bundle.calculationConfigId &&
    collection.coverage === bundle.coverage &&
    canonicalJson(collection.calculationEvidence) ===
      canonicalJson(bundle.calculationEvidence)
  )
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
    )
    return `{${entries
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
