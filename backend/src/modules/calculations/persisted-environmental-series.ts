import { parseZonedTimestampNanoseconds } from './energy-calculation'
import {
  formatUtcTimestamp,
  projectPersistedEnvironmentalInterval,
  resolvePersistedEnvironmentalSegments,
  type PersistedEnvironmentalSegmentProjection,
  type PersistedEnvironmentalInterval,
} from './persisted-environmental-period'

export type EnvironmentalSeriesGranularity = 'hour' | 'day' | 'month' | 'year'

type MeasureReasons = readonly { readonly code: string; readonly metric?: string }[]

export interface EnvironmentalSeriesPoint {
  readonly bucketStart: string
  readonly bucketEnd: string
  readonly period: { readonly from: string; readonly to: string }
  readonly energy: { readonly value: number | null; readonly unit: 'kWh'; readonly reasons: MeasureReasons }
  readonly emissions: { readonly value: number | null; readonly unit: 'gCO2e'; readonly reasons: MeasureReasons }
  readonly coverage: { readonly energy: number; readonly emissions: number }
}

export interface PersistedEnvironmentalSeriesResult {
  readonly status: 'available' | 'empty'
  readonly period: { readonly from: string; readonly to: string }
  readonly granularity: EnvironmentalSeriesGranularity
  readonly totals: {
    readonly energy: { readonly value: number | null; readonly unit: 'kWh'; readonly reasons: MeasureReasons }
    readonly emissions: { readonly value: number | null; readonly unit: 'gCO2e'; readonly reasons: MeasureReasons }
  }
  readonly coverage: { readonly energy: number; readonly emissions: number }
  readonly points: readonly EnvironmentalSeriesPoint[]
}

export interface EnvironmentalSeriesBucketBounds {
  readonly start: string
  readonly end: string
  readonly period: { readonly from: string; readonly to: string }
}

export interface EnvironmentalSeriesContribution {
  readonly collectionId: string
  readonly originalInterval: { readonly from: string; readonly to: string }
  readonly countedInterval: { readonly from: string; readonly to: string }
  readonly collectedAt: string
  readonly energy: PersistedEnvironmentalSegmentProjection['energy'] & { readonly originalValue: number | null }
  readonly emissions: PersistedEnvironmentalSegmentProjection['emissions'] & { readonly originalValue: number | null }
  readonly durationRatio: number
  readonly methodology: PersistedEnvironmentalSegmentProjection['methodology']
  readonly factorSnapshot: PersistedEnvironmentalSegmentProjection['factorSnapshot']
}

export interface EnvironmentalSeriesExclusion {
  readonly collectionId: string | null
  readonly interval: { readonly from: string; readonly to: string }
  readonly energyReasons: MeasureReasons
  readonly emissionsReasons: MeasureReasons
}

export interface PersistedEnvironmentalSeriesBucketResult {
  readonly totals: {
    readonly energy: EnvironmentalSeriesPoint['energy']
    readonly emissions: EnvironmentalSeriesPoint['emissions']
  }
  readonly coverage: EnvironmentalSeriesPoint['coverage']
  readonly contributions: readonly EnvironmentalSeriesContribution[]
  readonly exclusions: readonly EnvironmentalSeriesExclusion[]
}

interface BucketValues {
  readonly energy: number
  readonly emissions: number
  readonly energyCovered: bigint
  readonly emissionsCovered: bigint
  readonly energyReasons: MeasureReasons
  readonly emissionsReasons: MeasureReasons
  readonly contributions: readonly EnvironmentalSeriesContribution[]
  readonly exclusions: readonly EnvironmentalSeriesExclusion[]
  readonly nextSegmentIndex: number
}

function floorBucket(timestamp: Date, granularity: EnvironmentalSeriesGranularity): Date {
  const bucket = new Date(timestamp)
  if (granularity === 'year') {
    bucket.setUTCMonth(0, 1)
    bucket.setUTCHours(0, 0, 0, 0)
  } else if (granularity === 'month') {
    bucket.setUTCDate(1)
    bucket.setUTCHours(0, 0, 0, 0)
  } else if (granularity === 'day') {
    bucket.setUTCHours(0, 0, 0, 0)
  } else {
    bucket.setUTCMinutes(0, 0, 0)
  }
  return bucket
}

function nextBucket(timestamp: Date, granularity: EnvironmentalSeriesGranularity): Date {
  const next = new Date(timestamp)
  if (granularity === 'year') next.setUTCFullYear(next.getUTCFullYear() + 1)
  else if (granularity === 'month') next.setUTCMonth(next.getUTCMonth() + 1)
  else if (granularity === 'day') next.setUTCDate(next.getUTCDate() + 1)
  else next.setUTCHours(next.getUTCHours() + 1)
  return next
}

export function countEnvironmentalSeriesBuckets(
  from: string,
  to: string,
  granularity: EnvironmentalSeriesGranularity,
): number {
  const start = parseZonedTimestampNanoseconds(from)
  const end = parseZonedTimestampNanoseconds(to)
  if (start === null || end === null || end <= start) throw new Error('INVALID_ANALYSIS_PERIOD')
  let bucket = floorBucket(new Date(Number(start / 1_000_000n)), granularity)
  let count = 0
  while (BigInt(bucket.getTime()) * 1_000_000n < end) {
    count += 1
    if (count > 10_000) return count
    bucket = nextBucket(bucket, granularity)
  }
  return count
}

export function getEnvironmentalSeriesBucket(
  from: string,
  to: string,
  granularity: EnvironmentalSeriesGranularity,
  bucketStart: string,
): EnvironmentalSeriesBucketBounds | null {
  const periodStart = parseZonedTimestampNanoseconds(from)
  const periodEnd = parseZonedTimestampNanoseconds(to)
  const requestedStart = parseZonedTimestampNanoseconds(bucketStart)
  if (periodStart === null || periodEnd === null || periodEnd <= periodStart || requestedStart === null) return null
  const calendarStart = floorBucket(new Date(Number(requestedStart / 1_000_000n)), granularity)
  const bucketStartNs = BigInt(calendarStart.getTime()) * 1_000_000n
  if (bucketStartNs !== requestedStart) return null
  const calendarEnd = nextBucket(calendarStart, granularity)
  const bucketEndNs = BigInt(calendarEnd.getTime()) * 1_000_000n
  const countedStart = bucketStartNs > periodStart ? bucketStartNs : periodStart
  const countedEnd = bucketEndNs < periodEnd ? bucketEndNs : periodEnd
  if (countedEnd <= countedStart) return null
  return {
    start: formatUtcTimestamp(bucketStartNs),
    end: formatUtcTimestamp(bucketEndNs),
    period: { from: formatUtcTimestamp(countedStart), to: formatUtcTimestamp(countedEnd) },
  }
}

function readBucket(
  from: bigint,
  to: bigint,
  segments: ReturnType<typeof resolvePersistedEnvironmentalSegments>,
  segmentIndex: number,
  includeDetails = false,
): BucketValues {
  let energy = 0
  let emissions = 0
  let energyCovered = 0n
  let emissionsCovered = 0n
  const energyReasons: { code: string; metric?: string }[] = []
  const emissionsReasons: { code: string; metric?: string }[] = []
  const contributions: EnvironmentalSeriesContribution[] = []
  const exclusions: EnvironmentalSeriesExclusion[] = []

  while (segmentIndex < segments.length) {
    const segment = segments[segmentIndex]
    const segmentStart = parseZonedTimestampNanoseconds(segment.from)!
    const segmentEnd = parseZonedTimestampNanoseconds(segment.to)!
    if (segmentStart >= to) break
    if (segmentEnd <= from) {
      segmentIndex += 1
      continue
    }
    if (!segment.observation) {
      energyReasons.push({ code: 'NO_OBSERVATION' })
      emissionsReasons.push({ code: 'NO_OBSERVATION' })
      if (includeDetails) {
        exclusions.push({
          collectionId: null,
          interval: { from: formatUtcTimestamp(segmentStart > from ? segmentStart : from), to: formatUtcTimestamp(segmentEnd < to ? segmentEnd : to) },
          energyReasons: [{ code: 'NO_OBSERVATION' }],
          emissionsReasons: [{ code: 'NO_OBSERVATION' }],
        })
      }
    } else {
      const overlapStart = segmentStart > from ? segmentStart : from
      const overlapEnd = segmentEnd < to ? segmentEnd : to
      const projection = projectPersistedEnvironmentalInterval(
        segment.observation,
        formatUtcTimestamp(overlapStart),
        formatUtcTimestamp(overlapEnd),
      )
      if (includeDetails) addProjectionDetails(projection, segment.observation, contributions, exclusions)
      if (projection.energy.value === null) energyReasons.push(...projection.energy.reasons)
      else {
        energy += projection.energy.value
        energyCovered += overlapEnd - overlapStart
      }
      if (projection.emissions.value === null) emissionsReasons.push(...projection.emissions.reasons)
      else {
        emissions += projection.emissions.value
        emissionsCovered += overlapEnd - overlapStart
      }
    }
    if (segmentEnd <= to) segmentIndex += 1
    else break
  }

  return {
    energy,
    emissions,
    energyCovered,
    emissionsCovered,
    energyReasons: uniqueReasons(energyReasons),
    emissionsReasons: uniqueReasons(emissionsReasons),
    contributions,
    exclusions,
    nextSegmentIndex: segmentIndex,
  }
}

function addProjectionDetails(
  projection: PersistedEnvironmentalSegmentProjection,
  observation: PersistedEnvironmentalInterval,
  contributions: EnvironmentalSeriesContribution[],
  exclusions: EnvironmentalSeriesExclusion[],
): void {
  const hasEnergy = projection.energy.value !== null
  const hasEmissions = projection.emissions.value !== null
  if (hasEnergy || hasEmissions) {
    contributions.push({
      collectionId: observation.id,
      originalInterval: projection.originalInterval!,
      countedInterval: projection.interval,
      collectedAt: projection.collectedAt!,
      energy: { ...projection.energy, originalValue: projection.energyOriginalValue },
      emissions: { ...projection.emissions, originalValue: projection.emissionsOriginalValue },
      durationRatio: projection.durationRatio,
      methodology: projection.methodology,
      factorSnapshot: projection.factorSnapshot,
    })
  }
  if (!hasEnergy || !hasEmissions) {
    exclusions.push({
      collectionId: observation.id,
      interval: projection.interval,
      energyReasons: projection.energy.reasons,
      emissionsReasons: projection.emissions.reasons,
    })
  }
}

function reasonsForPoint(reasons: MeasureReasons, covered: bigint): MeasureReasons {
  if (reasons.length > 0) return reasons
  if (covered > 0n) return []
  return [{ code: 'NO_OBSERVATION' }]
}

function createPoint(
  bucketStart: Date,
  bucketEnd: Date,
  from: bigint,
  to: bigint,
  values: BucketValues,
): EnvironmentalSeriesPoint {
  const duration = to - from
  return {
    bucketStart: formatUtcTimestamp(BigInt(bucketStart.getTime()) * 1_000_000n),
    bucketEnd: formatUtcTimestamp(BigInt(bucketEnd.getTime()) * 1_000_000n),
    period: { from: formatUtcTimestamp(from), to: formatUtcTimestamp(to) },
    energy: {
      value: values.energyCovered > 0n ? values.energy : null,
      unit: 'kWh',
      reasons: reasonsForPoint(values.energyReasons, values.energyCovered),
    },
    emissions: {
      value: values.emissionsCovered > 0n ? values.emissions : null,
      unit: 'gCO2e',
      reasons: reasonsForPoint(values.emissionsReasons, values.emissionsCovered),
    },
    coverage: {
      energy: Number(values.energyCovered) / Number(duration),
      emissions: Number(values.emissionsCovered) / Number(duration),
    },
  }
}

export function aggregatePersistedEnvironmentalSeriesBucket(
  bounds: EnvironmentalSeriesBucketBounds,
  observations: readonly PersistedEnvironmentalInterval[],
): PersistedEnvironmentalSeriesBucketResult {
  const start = parseZonedTimestampNanoseconds(bounds.period.from)!
  const end = parseZonedTimestampNanoseconds(bounds.period.to)!
  const segments = resolvePersistedEnvironmentalSegments(bounds.period.from, bounds.period.to, observations)
  const values = readBucket(start, end, segments, 0, true)
  const exclusions = segments.length === 0
    ? [{
      collectionId: null,
      interval: bounds.period,
      energyReasons: [{ code: 'NO_OBSERVATION' }],
      emissionsReasons: [{ code: 'NO_OBSERVATION' }],
    }]
    : values.exclusions
  const calendarStart = new Date(Number(parseZonedTimestampNanoseconds(bounds.start)! / 1_000_000n))
  const calendarEnd = new Date(Number(parseZonedTimestampNanoseconds(bounds.end)! / 1_000_000n))
  const point = createPoint(calendarStart, calendarEnd, start, end, values)
  return {
    totals: { energy: point.energy, emissions: point.emissions },
    coverage: point.coverage,
    contributions: values.contributions,
    exclusions,
  }
}

export function aggregatePersistedEnvironmentalSeries(
  from: string,
  to: string,
  granularity: EnvironmentalSeriesGranularity,
  observations: readonly PersistedEnvironmentalInterval[],
): PersistedEnvironmentalSeriesResult {
  const start = parseZonedTimestampNanoseconds(from)
  const end = parseZonedTimestampNanoseconds(to)
  if (start === null || end === null || end <= start) throw new Error('INVALID_ANALYSIS_PERIOD')

  const segments = resolvePersistedEnvironmentalSegments(from, to, observations)
  const points: EnvironmentalSeriesPoint[] = []
  let bucketStart = floorBucket(new Date(Number(start / 1_000_000n)), granularity)
  let segmentIndex = 0
  let energyTotal = 0
  let emissionsTotal = 0
  let energyCovered = 0n
  let emissionsCovered = 0n

  while (BigInt(bucketStart.getTime()) * 1_000_000n < end) {
    const bucketEnd = nextBucket(bucketStart, granularity)
    const bucketStartNs = BigInt(bucketStart.getTime()) * 1_000_000n
    const bucketEndNs = BigInt(bucketEnd.getTime()) * 1_000_000n
    const countedStart = bucketStartNs > start ? bucketStartNs : start
    const countedEnd = bucketEndNs < end ? bucketEndNs : end
    const values = readBucket(countedStart, countedEnd, segments, segmentIndex)
    segmentIndex = values.nextSegmentIndex
    points.push(createPoint(bucketStart, bucketEnd, countedStart, countedEnd, values))
    energyTotal += values.energy
    emissionsTotal += values.emissions
    energyCovered += values.energyCovered
    emissionsCovered += values.emissionsCovered
    bucketStart = bucketEnd
  }

  const duration = end - start
  const energyReasons = uniqueReasons(points.flatMap((point) => point.energy.reasons))
  const emissionsReasons = uniqueReasons(points.flatMap((point) => point.emissions.reasons))
  return {
    status: segments.some((segment) => segment.observation !== null) ? 'available' : 'empty',
    period: { from: formatUtcTimestamp(start), to: formatUtcTimestamp(end) },
    granularity,
    totals: {
      energy: { value: energyCovered > 0n ? energyTotal : null, unit: 'kWh', reasons: energyReasons },
      emissions: { value: emissionsCovered > 0n ? emissionsTotal : null, unit: 'gCO2e', reasons: emissionsReasons },
    },
    coverage: {
      energy: Number(energyCovered) / Number(duration),
      emissions: Number(emissionsCovered) / Number(duration),
    },
    points,
  }
}

function uniqueReasons(reasons: readonly { readonly code: string; readonly metric?: string }[]) {
  const unique = new Map<string, { readonly code: string; readonly metric?: string }>()
  for (const reason of reasons) unique.set(`${reason.code}:${reason.metric ?? ''}`, reason)
  return [...unique.values()]
}
