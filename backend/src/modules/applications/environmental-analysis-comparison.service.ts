import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApplicationsRepository } from './applications.repository'
import {
  ApplicationEventsRepository,
  PersistedApplicationMetadataEvent,
} from '../../database/repositories/application-events.repository'
import {
  CollectionsRepository,
  ComparisonMetricRow,
} from '../../database/repositories/collections.repository'
import { parseZonedTimestampNanoseconds } from '../calculations/energy-calculation'
import {
  formatUtcTimestamp,
  summarizePersistedEnvironmentalPeriod,
} from '../calculations/persisted-environmental-period'
import type { ApplicationEntity } from '../../database/entities/application.entity'
import type { EnvironmentalAnalysisMeasureDto } from './environmental-analysis.dto'
import type {
  EnvironmentalAnalysisComparisonApplicationDto,
  EnvironmentalAnalysisComparisonDto,
  EnvironmentalComparisonDifferenceDto,
  EnvironmentalComparisonLocationDto,
  EnvironmentalComparisonLocationSnapshotDto,
  EnvironmentalComparisonMetricDto,
  EnvironmentalComparisonMetricsDto,
} from './environmental-analysis-comparison.dto'

interface ComparisonFilters {
  readonly from?: string
  readonly to?: string
  readonly applicationIds?: string | readonly string[]
  readonly referenceApplicationId?: string
}

interface TimestampedLocation {
  readonly at: bigint
  readonly before: EnvironmentalComparisonLocationDto | null
  readonly after: EnvironmentalComparisonLocationDto | null
}

const metricFields = {
  cpu: { key: 'cpuPercent', fallbackUnit: '%' },
  memory: { key: 'memoryGb', fallbackUnit: 'GB' },
  disk: { key: 'diskGb', fallbackUnit: 'GB' },
  network: { key: 'networkGb', fallbackUnit: 'GB' },
} as const

@Injectable()
export class EnvironmentalAnalysisComparisonService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
    private readonly applicationEvents: ApplicationEventsRepository,
  ) {}

  async compare(
    filters: ComparisonFilters,
  ): Promise<EnvironmentalAnalysisComparisonDto> {
    const start =
      typeof filters.from === 'string'
        ? parseZonedTimestampNanoseconds(filters.from)
        : null
    const end =
      typeof filters.to === 'string'
        ? parseZonedTimestampNanoseconds(filters.to)
        : null
    if (start === null || end === null || end <= start) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_PERIOD' })
    }

    const ids = parseApplicationIds(filters.applicationIds)
    if (
      typeof filters.referenceApplicationId !== 'string' ||
      !ids.includes(filters.referenceApplicationId)
    ) {
      throw new BadRequestException({
        code: 'INVALID_ANALYSIS_REFERENCE_APPLICATION',
      })
    }

    const periodFrom = formatUtcTimestamp(start)
    const periodTo = formatUtcTimestamp(end)
    let applications: ApplicationEntity[]
    let environmentalRows: Awaited<
      ReturnType<
        CollectionsRepository['findEnvironmentalByApplicationsAndPeriod']
      >
    >
    let metricRows: ComparisonMetricRow[]
    let metadataHistory: PersistedApplicationMetadataEvent[]
    try {
      ;[applications, environmentalRows, metricRows, metadataHistory] =
        await Promise.all([
          this.applications.findByIds(ids),
          this.collections.findEnvironmentalByApplicationsAndPeriod(
            ids,
            start,
            end,
          ),
          this.collections.findComparisonMetricsByApplicationsAndPeriod(
            ids,
            start,
            end,
          ),
          this.applicationEvents.findMetadataHistory(ids),
        ])
    } catch {
      throw new ServiceUnavailableException({
        code: 'ANALYSIS_COMPARISON_UNAVAILABLE',
      })
    }

    const applicationsById = new Map(
      applications.map((application) => [application.id, application]),
    )
    if (applicationsById.size !== ids.length) {
      throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND' })
    }

    const environmentalByApplication = groupBy(
      environmentalRows,
      (row) => row.applicationId,
    )
    const metricsByApplication = groupBy(metricRows, (row) => row.applicationId)
    const historyByApplication = groupBy(
      metadataHistory,
      (event) => event.applicationId,
    )
    const rows = ids.map((id) => {
      const application = applicationsById.get(id)!
      const rows = environmentalByApplication.get(id) ?? []
      const summary = summarizePersistedEnvironmentalPeriod(
        periodFrom,
        periodTo,
        rows,
      )
      const metrics = buildMetrics(metricsByApplication.get(id) ?? [])
      const locations = buildLocations(
        application,
        historyByApplication.get(id) ?? [],
        start,
        end,
      )
      return {
        applicationId: id,
        name: application.name,
        state: application.state,
        locations,
        metrics,
        energy: summary.energy,
        emissions: summary.emissions,
        coverage: summary.coverage,
      }
    })
    const reference = rows.find(
      (application) =>
        application.applicationId === filters.referenceApplicationId,
    )!
    const applicationsWithDifferences = rows.map((application) => ({
      ...application,
      differences: {
        energy: difference(application.energy, reference.energy),
        emissions: difference(application.emissions, reference.emissions),
        metrics: metricDifferences(application.metrics, reference.metrics),
        coverage: {
          energyPercentagePoints:
            (application.coverage.energy - reference.coverage.energy) * 100,
          emissionsPercentagePoints:
            (application.coverage.emissions - reference.coverage.emissions) *
            100,
        },
      },
    }))
    const hasAnyValue = rows.some(
      (application) =>
        application.energy.value !== null ||
        application.emissions.value !== null ||
        Object.values(application.metrics).some(
          (metric) => metric.value !== null,
        ),
    )
    const hasIncompatibleUnits = applicationsWithDifferences.some(
      (application) =>
        application.differences.energy.reason === 'INCOMPATIBLE_UNIT' ||
        application.differences.emissions.reason === 'INCOMPATIBLE_UNIT' ||
        Object.values(application.differences.metrics).some(
          (metric) => metric.reason === 'INCOMPATIBLE_UNIT',
        ),
    )
    const complete =
      !hasIncompatibleUnits &&
      rows.every(
        (application) =>
          application.energy.value !== null &&
          application.emissions.value !== null &&
          application.coverage.energy === 1 &&
          application.coverage.emissions === 1 &&
          Object.values(application.metrics).every(
            (metric) => metric.value !== null,
          ) &&
          application.locations.every(
            (snapshot) => snapshot.location !== null,
          ) &&
          application.locations.length > 0,
      )

    return {
      status: !hasAnyValue ? 'empty' : complete ? 'complete' : 'partial',
      period: { from: periodFrom, to: periodTo },
      referenceApplicationId: filters.referenceApplicationId!,
      applications: applicationsWithDifferences,
    }
  }
}

function parseApplicationIds(
  input: string | readonly string[] | undefined,
): string[] {
  if (input === undefined) {
    throw new BadRequestException({
      code: 'INVALID_ANALYSIS_APPLICATION_SELECTION',
    })
  }
  const ids = (Array.isArray(input) ? input : [input]).map((id) => id.trim())
  if (
    ids.length < 2 ||
    ids.length > 5 ||
    ids.some((id) => id.length === 0) ||
    new Set(ids).size !== ids.length
  ) {
    throw new BadRequestException({
      code: 'INVALID_ANALYSIS_APPLICATION_SELECTION',
    })
  }
  return ids
}

function groupBy<T>(
  values: readonly T[],
  key: (value: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const value of values) {
    const valueKey = key(value)
    const group = grouped.get(valueKey) ?? []
    group.push(value)
    grouped.set(valueKey, group)
  }
  return grouped
}

function buildMetrics(
  rows: readonly ComparisonMetricRow[],
): EnvironmentalComparisonMetricsDto {
  const rowsByKey = new Map(rows.map((row) => [row.metricKey, row]))
  const result = {} as Record<
    keyof typeof metricFields,
    EnvironmentalComparisonMetricDto
  >
  for (const [field, { key, fallbackUnit }] of Object.entries(metricFields) as [
    keyof typeof metricFields,
    (typeof metricFields)[keyof typeof metricFields],
  ][]) {
    const row = rowsByKey.get(key)
    const value =
      row?.value === null || row?.value === undefined ? null : Number(row.value)
    const validValue = value !== null && Number.isFinite(value) ? value : null
    const status =
      validValue !== null
        ? 'available'
        : row?.status === 'available'
          ? 'invalid'
          : (row?.status ?? 'missing')
    result[field] = {
      value: validValue,
      unit: row?.unit ?? fallbackUnit,
      status,
      collectedAt: row?.collectedAt ?? null,
      reasons:
        status === 'available'
          ? []
          : [
              {
                code:
                  status === 'invalid' ? 'METRIC_INVALID' : 'METRIC_MISSING',
                metric: field,
              },
            ],
    }
  }
  return result
}

function difference(
  value: EnvironmentalAnalysisMeasureDto | EnvironmentalComparisonMetricDto,
  reference: EnvironmentalAnalysisMeasureDto | EnvironmentalComparisonMetricDto,
): EnvironmentalComparisonDifferenceDto {
  if (value.value === null || reference.value === null) {
    return {
      absolute: null,
      unit: value.unit,
      percentage: null,
      reason: 'VALUE_UNAVAILABLE',
    }
  }
  const referenceValue = convertUnit(
    reference.value,
    reference.unit,
    value.unit,
  )
  if (referenceValue === null) {
    return {
      absolute: null,
      unit: value.unit,
      percentage: null,
      reason: 'INCOMPATIBLE_UNIT',
    }
  }
  const absolute = value.value - referenceValue
  return {
    absolute,
    unit: value.unit,
    percentage: referenceValue > 0 ? (absolute / referenceValue) * 100 : null,
    reason:
      referenceValue > 0
        ? null
        : referenceValue === 0
          ? 'ZERO_REFERENCE'
          : 'NON_POSITIVE_REFERENCE',
  }
}

function convertUnit(
  value: number,
  from: string | null,
  to: string | null,
): number | null {
  if (from === to) return value
  const gramsPerUnit: Record<string, number> = {
    gCO2e: 1,
    kgCO2e: 1_000,
  }
  const fromFactor = from === null ? undefined : gramsPerUnit[from]
  const toFactor = to === null ? undefined : gramsPerUnit[to]
  return fromFactor === undefined || toFactor === undefined
    ? null
    : (value * fromFactor) / toFactor
}

function metricDifferences(
  metrics: EnvironmentalComparisonMetricsDto,
  reference: EnvironmentalComparisonMetricsDto,
): EnvironmentalAnalysisComparisonApplicationDto['differences']['metrics'] {
  return {
    cpu: difference(metrics.cpu, reference.cpu),
    memory: difference(metrics.memory, reference.memory),
    disk: difference(metrics.disk, reference.disk),
    network: difference(metrics.network, reference.network),
  }
}

function buildLocations(
  application: ApplicationEntity,
  events: readonly PersistedApplicationMetadataEvent[],
  start: bigint,
  end: bigint,
): EnvironmentalComparisonLocationSnapshotDto[] {
  const firstSeen = BigInt(application.firstSeenAt.getTime()) * 1_000_000n
  const changes = events
    .map((event) => ({
      at: parseZonedTimestampNanoseconds(event.occurredAt),
      before: getEventLocation(event.details, 'before'),
      after: getEventLocation(event.details, 'after'),
    }))
    .filter((event): event is TimestampedLocation => event.at !== null)
    .sort((left, right) =>
      left.at < right.at ? -1 : left.at > right.at ? 1 : 0,
    )
    .filter(
      (event) =>
        (event.before === null && event.after === null) ||
        !sameLocation(event.before, event.after),
    )

  const snapshots: EnvironmentalComparisonLocationSnapshotDto[] = []
  let cursor = start
  if (firstSeen > cursor) {
    const unknownEnd = firstSeen < end ? firstSeen : end
    snapshots.push(locationSnapshot(cursor, unknownEnd, null))
    cursor = unknownEnd
  }
  if (cursor >= end) return snapshots

  let location =
    changes.length > 0
      ? changes[0].before
      : locationFromApplication(application)
  for (const change of changes) {
    if (change.at <= cursor) {
      location = change.after
      continue
    }
    if (change.at >= end) break
    snapshots.push(locationSnapshot(cursor, change.at, location))
    cursor = change.at
    location = change.after
  }
  if (cursor < end) {
    snapshots.push(locationSnapshot(cursor, end, location))
  }
  return snapshots
}

function locationSnapshot(
  start: bigint,
  end: bigint,
  location: EnvironmentalComparisonLocationDto | null,
): EnvironmentalComparisonLocationSnapshotDto {
  return {
    from: formatUtcTimestamp(start),
    to: formatUtcTimestamp(end),
    location,
    reasons: location ? [] : [{ code: 'HISTORICAL_LOCATION_UNAVAILABLE' }],
  }
}

function getEventLocation(
  details: Record<string, unknown> | null,
  side: 'before' | 'after',
): EnvironmentalComparisonLocationDto | null {
  if (!details) return null
  const snapshot = details[side]
  if (typeof snapshot !== 'object' || snapshot === null) return null
  const location = (snapshot as Record<string, unknown>).location
  if (typeof location !== 'object' || location === null) return null
  return parseLocation(location as Record<string, unknown>)
}

function locationFromApplication(
  application: ApplicationEntity,
): EnvironmentalComparisonLocationDto | null {
  return parseLocation({
    regionCode: application.regionCode,
    country: application.country,
    region: application.region,
    city: application.city,
    latitude: application.latitude,
    longitude: application.longitude,
  })
}

function parseLocation(
  value: Record<string, unknown>,
): EnvironmentalComparisonLocationDto | null {
  if (
    typeof value.regionCode !== 'string' ||
    typeof value.country !== 'string' ||
    typeof value.region !== 'string' ||
    (value.city !== null && typeof value.city !== 'string') ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude)
  ) {
    return null
  }
  return {
    regionCode: value.regionCode,
    country: value.country,
    region: value.region,
    city: value.city,
    latitude: value.latitude,
    longitude: value.longitude,
  }
}

function sameLocation(
  left: EnvironmentalComparisonLocationDto | null,
  right: EnvironmentalComparisonLocationDto | null,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
