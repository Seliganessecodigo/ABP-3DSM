import { parseZonedTimestampNanoseconds } from './energy-calculation'
import type { CarbonFactorSnapshotInput } from './carbon-emission'

export interface PersistedEnvironmentalInterval {
  readonly id: string
  readonly intervalStart: string
  readonly intervalEnd: string
  readonly collectedAt: string
  readonly energyKwh: string | null
  readonly carbonGrams: string | null
  readonly calculationEvidence: {
    readonly energy: {
      readonly modelKey: string
      readonly modelVersion: string
      readonly modelParameters: Readonly<Record<string, number>>
      readonly reasons: readonly { readonly code: string; readonly metric?: string }[]
    }
    readonly carbon: {
      readonly factorSnapshot: Readonly<CarbonFactorSnapshotInput> | null
      readonly reasons: readonly { readonly code: string }[]
    }
  } | null
}

export interface EnvironmentalReason {
  readonly code: string
  readonly metric?: string
}

export interface EnvironmentalMeasure {
  readonly value: number | null
  readonly unit: string
  readonly reasons: readonly EnvironmentalReason[]
}

export interface EnvironmentalContribution {
  readonly collectionId: string
  readonly originalInterval: { readonly from: string; readonly to: string }
  readonly countedInterval: { readonly from: string; readonly to: string }
  readonly collectedAt: string
  readonly energy: EnvironmentalMeasure
  readonly emissions: EnvironmentalMeasure
  readonly methodology: {
    readonly key: string
    readonly version: string
    readonly parameters: Readonly<Record<string, number>>
  } | null
  readonly factorSnapshot: Readonly<CarbonFactorSnapshotInput> | null
}

export interface EnvironmentalExclusion {
  readonly collectionId: string | null
  readonly interval: { readonly from: string; readonly to: string }
  readonly energyReasons: readonly EnvironmentalReason[]
  readonly emissionsReasons: readonly EnvironmentalReason[]
}

export interface PersistedEnvironmentalPeriodResult {
  readonly status: 'available' | 'empty'
  readonly period: { readonly from: string; readonly to: string }
  readonly energy: EnvironmentalMeasure
  readonly emissions: EnvironmentalMeasure
  readonly coverage: { readonly energy: number; readonly emissions: number }
  readonly contributions: readonly EnvironmentalContribution[]
  readonly exclusions: readonly EnvironmentalExclusion[]
}

export interface EnvironmentalMethodologyProvenance {
  readonly key: string
  readonly version: string
  readonly parameters: Readonly<Record<string, number>>
}

export interface EnvironmentalFactorProvenance {
  readonly contractVersion: string | null
  readonly regionCode: string | null
  readonly country: string | null
  readonly region: string | null
  readonly city: string | null
  readonly intensity: number | null
  readonly unit: string | null
  readonly version: string | null
  readonly source: string | null
  readonly validFrom: string | null
  readonly validUntil: string | null
  readonly queriedAt: { readonly from: string | null; readonly to: string | null }
}

export interface EnvironmentalProvenance {
  readonly methodologies: readonly EnvironmentalMethodologyProvenance[]
  readonly factors: readonly EnvironmentalFactorProvenance[]
  readonly reasons: readonly EnvironmentalReason[]
}

export type PersistedEnvironmentalSummary = Omit<PersistedEnvironmentalPeriodResult, 'contributions' | 'exclusions'> & {
  readonly provenance: EnvironmentalProvenance
}

interface ClippedInterval {
  readonly observation: PersistedEnvironmentalInterval
  readonly originalStart: bigint
  readonly originalEnd: bigint
  readonly start: bigint
  readonly end: bigint
  readonly receivedAt: bigint
}

export interface PersistedEnvironmentalSegment {
  readonly from: string
  readonly to: string
  readonly observation: PersistedEnvironmentalInterval | null
}

export interface PersistedEnvironmentalSegmentProjection {
  readonly interval: { readonly from: string; readonly to: string }
  readonly collectionId: string | null
  readonly originalInterval: { readonly from: string; readonly to: string } | null
  readonly collectedAt: string | null
  readonly energy: EnvironmentalMeasure
  readonly emissions: EnvironmentalMeasure
  readonly methodology: EnvironmentalContribution['methodology']
  readonly factorSnapshot: Readonly<CarbonFactorSnapshotInput> | null
}

interface ResolvedSegment extends PersistedEnvironmentalSegment {
  readonly start: bigint
  readonly end: bigint
  readonly winner: ClippedInterval | null
}

interface EnvironmentalProjectionWindow {
  readonly from: string
  readonly to: string
  readonly start: bigint
  readonly end: bigint
  readonly originalStart: bigint
  readonly originalEnd: bigint
  readonly collectedAt: string
}

interface AggregateTotals {
  energyTotal: number
  emissionsTotal: number
  energyCovered: bigint
  emissionsCovered: bigint
  readonly contributions: EnvironmentalContribution[]
  readonly exclusions: EnvironmentalExclusion[]
  readonly energyReasons: EnvironmentalReason[]
  readonly emissionsReasons: EnvironmentalReason[]
}

interface FactorSummary {
  readonly factor: Readonly<CarbonFactorSnapshotInput>
  queriedFrom: bigint | null
  queriedTo: bigint | null
}

interface SummaryTotals {
  energyTotal: number
  emissionsTotal: number
  energyCovered: bigint
  emissionsCovered: bigint
  readonly energyReasons: EnvironmentalReason[]
  readonly emissionsReasons: EnvironmentalReason[]
  readonly provenanceReasons: EnvironmentalReason[]
  readonly methodologies: Map<string, EnvironmentalMethodologyProvenance>
  readonly factors: Map<string, FactorSummary>
}

interface EnvironmentalPeriodMeasures {
  readonly energyTotal: number
  readonly emissionsTotal: number
  readonly energyCovered: bigint
  readonly emissionsCovered: bigint
  readonly energyReasons: readonly EnvironmentalReason[]
  readonly emissionsReasons: readonly EnvironmentalReason[]
}

export function formatUtcTimestamp(nanoseconds: bigint): string {
  let seconds = nanoseconds / 1_000_000_000n
  let fraction = nanoseconds % 1_000_000_000n
  if (fraction < 0n) {
    seconds -= 1n
    fraction += 1_000_000_000n
  }
  const base = new Date(Number(seconds) * 1000).toISOString().replace('.000Z', '')
  let digits = fraction.toString().padStart(9, '0')
  while (digits.length > 3 && digits.endsWith('0')) digits = digits.slice(0, -1)
  return `${base}.${digits}Z`
}

function compareBigInt(left: bigint, right: bigint): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function compareIntervals(left: ClippedInterval, right: ClippedInterval): number {
  const startOrder = compareBigInt(left.start, right.start)
  if (startOrder !== 0) return startOrder
  if (left.observation.id < right.observation.id) return -1
  if (left.observation.id > right.observation.id) return 1
  return 0
}

function higherPriority(first: ClippedInterval, second: ClippedInterval): boolean {
  if (first.receivedAt !== second.receivedAt) return first.receivedAt > second.receivedAt
  return first.observation.id < second.observation.id
}

function swap(heap: ClippedInterval[], first: number, second: number): void {
  const value = heap[first]
  heap[first] = heap[second]
  heap[second] = value
}

function pushHeap(heap: ClippedInterval[], value: ClippedInterval): void {
  heap.push(value)
  let child = heap.length - 1
  while (child > 0) {
    const parent = Math.floor((child - 1) / 2)
    if (higherPriority(heap[parent], heap[child])) break
    swap(heap, parent, child)
    child = parent
  }
}

function popHeap(heap: ClippedInterval[]): void {
  const last = heap.pop()
  if (heap.length === 0 || last === undefined) return
  heap[0] = last
  let parent = 0
  while (true) {
    const left = parent * 2 + 1
    const right = left + 1
    let best = parent
    if (left < heap.length && higherPriority(heap[left], heap[best])) best = left
    if (right < heap.length && higherPriority(heap[right], heap[best])) best = right
    if (best === parent) return
    swap(heap, parent, best)
    parent = best
  }
}

function prepareIntervals(
  start: bigint,
  end: bigint,
  observations: readonly PersistedEnvironmentalInterval[],
): ClippedInterval[] {
  const intervals: ClippedInterval[] = []
  for (const observation of observations) {
    const originalStart = parseZonedTimestampNanoseconds(observation.intervalStart)
    const originalEnd = parseZonedTimestampNanoseconds(observation.intervalEnd)
    const receivedAt = parseZonedTimestampNanoseconds(observation.collectedAt)
    if (originalStart === null || originalEnd === null || receivedAt === null || originalEnd <= originalStart) continue
    const clippedStart = originalStart > start ? originalStart : start
    const clippedEnd = originalEnd < end ? originalEnd : end
    if (clippedEnd > clippedStart) {
      intervals.push({ observation, originalStart, originalEnd, start: clippedStart, end: clippedEnd, receivedAt })
    }
  }
  return intervals.sort(compareIntervals)
}

function utcBoundaries(intervals: readonly ClippedInterval[], from: bigint, to: bigint): bigint[] {
  const boundaries = new Set<bigint>([from, to])
  for (const interval of intervals) {
    boundaries.add(interval.start)
    boundaries.add(interval.end)
  }
  return [...boundaries].sort(compareBigInt)
}

function resolvePreparedSegments(start: bigint, end: bigint, intervals: readonly ClippedInterval[]): ResolvedSegment[] {
  if (intervals.length === 0) return []
  const boundaries = utcBoundaries(intervals, start, end)
  const active: ClippedInterval[] = []
  const segments: ResolvedSegment[] = []
  let nextInterval = 0
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]
    const segmentEnd = boundaries[index + 1]
    while (nextInterval < intervals.length && intervals[nextInterval].start <= segmentStart) {
      pushHeap(active, intervals[nextInterval])
      nextInterval += 1
    }
    while (active.length > 0 && active[0].end <= segmentStart) popHeap(active)
    const winner = active[0] ?? null
    segments.push({
      from: formatUtcTimestamp(segmentStart),
      to: formatUtcTimestamp(segmentEnd),
      observation: winner?.observation ?? null,
      start: segmentStart,
      end: segmentEnd,
      winner,
    })
  }
  return segments
}

function numericValue(value: string | null, durationRatio: number): number | null {
  if (value === null) return null
  const countedValue = Number(value) * durationRatio
  return Number.isFinite(countedValue) ? countedValue : null
}

function uniqueReasons(reasons: readonly EnvironmentalReason[]): EnvironmentalReason[] {
  const unique = new Map<string, EnvironmentalReason>()
  for (const reason of reasons) unique.set(`${reason.code}:${reason.metric ?? ''}`, reason)
  return [...unique.values()]
}

function missingReasons(reasons: readonly EnvironmentalReason[], metric: 'energy' | 'emissions'): readonly EnvironmentalReason[] {
  if (reasons.length > 0) return reasons
  return [{ code: 'ENVIRONMENTAL_RESULT_NOT_PERSISTED', metric }]
}

function projectObservation(
  observation: PersistedEnvironmentalInterval,
  window: EnvironmentalProjectionWindow,
): PersistedEnvironmentalSegmentProjection {
  const ratio = Number(window.end - window.start) / Number(window.originalEnd - window.originalStart)
  const energyValue = numericValue(observation.energyKwh, ratio)
  const emissionsValue = numericValue(observation.carbonGrams, ratio)
  const energyReasons = energyValue === null
    ? missingReasons(observation.calculationEvidence?.energy.reasons ?? [], 'energy')
    : []
  const emissionsReasons = emissionsValue === null
    ? missingReasons(observation.calculationEvidence?.carbon.reasons ?? [], 'emissions')
    : []
  return {
    interval: { from: window.from, to: window.to },
    collectionId: observation.id,
    originalInterval: { from: formatUtcTimestamp(window.originalStart), to: formatUtcTimestamp(window.originalEnd) },
    collectedAt: window.collectedAt,
    energy: { value: energyValue, unit: 'kWh', reasons: energyReasons },
    emissions: { value: emissionsValue, unit: 'gCO2e', reasons: emissionsReasons },
    methodology: observation.calculationEvidence ? {
      key: observation.calculationEvidence.energy.modelKey,
      version: observation.calculationEvidence.energy.modelVersion,
      parameters: observation.calculationEvidence.energy.modelParameters,
    } : null,
    factorSnapshot: observation.calculationEvidence?.carbon.factorSnapshot ?? null,
  }
}

export function projectPersistedEnvironmentalInterval(
  observation: PersistedEnvironmentalInterval,
  countedFrom: string,
  countedTo: string,
): PersistedEnvironmentalSegmentProjection {
  const start = parseZonedTimestampNanoseconds(countedFrom)
  const end = parseZonedTimestampNanoseconds(countedTo)
  const originalStart = parseZonedTimestampNanoseconds(observation.intervalStart)
  const originalEnd = parseZonedTimestampNanoseconds(observation.intervalEnd)
  const collectedAt = parseZonedTimestampNanoseconds(observation.collectedAt)
  if (start === null || end === null || end <= start) throw new Error('INVALID_ANALYSIS_SEGMENT')
  if (originalStart === null || originalEnd === null || collectedAt === null || originalEnd <= originalStart) {
    throw new Error('INVALID_PERSISTED_ENVIRONMENTAL_INTERVAL')
  }
  if (start < originalStart || end > originalEnd) throw new Error('INVALID_ANALYSIS_SEGMENT')
  return projectObservation(
    observation,
    {
      from: formatUtcTimestamp(start),
      to: formatUtcTimestamp(end),
      start,
      end,
      originalStart,
      originalEnd,
      collectedAt: formatUtcTimestamp(collectedAt),
    },
  )
}

function emptyResult(start: bigint, end: bigint): PersistedEnvironmentalPeriodResult {
  return {
    status: 'empty',
    period: { from: formatUtcTimestamp(start), to: formatUtcTimestamp(end) },
    energy: { value: null, unit: 'kWh', reasons: [] },
    emissions: { value: null, unit: 'gCO2e', reasons: [] },
    coverage: { energy: 0, emissions: 0 },
    contributions: [],
    exclusions: [],
  }
}

function createTotals(): AggregateTotals {
  return {
    energyTotal: 0,
    emissionsTotal: 0,
    energyCovered: 0n,
    emissionsCovered: 0n,
    contributions: [],
    exclusions: [],
    energyReasons: [],
    emissionsReasons: [],
  }
}

function createSummaryTotals(): SummaryTotals {
  return {
    energyTotal: 0,
    emissionsTotal: 0,
    energyCovered: 0n,
    emissionsCovered: 0n,
    energyReasons: [],
    emissionsReasons: [],
    provenanceReasons: [],
    methodologies: new Map(),
    factors: new Map(),
  }
}

function methodologyIdentity(methodology: EnvironmentalMethodologyProvenance): string {
  const parameters = Object.entries(methodology.parameters).sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify([methodology.key, methodology.version, parameters])
}

function factorIdentity(factor: Readonly<CarbonFactorSnapshotInput>): string {
  return JSON.stringify([
    factor.regionCode,
    factor.country,
    factor.region,
    factor.city,
    factor.intensity,
    factor.unit,
    factor.version,
    factor.contractVersion,
    factor.source,
    factor.validFrom,
    factor.validUntil,
  ])
}

function addSummaryMethodology(projection: PersistedEnvironmentalSegmentProjection, totals: SummaryTotals): void {
  if (projection.energy.value === null) return
  const methodology = projection.methodology
  if (methodology === null) {
    totals.provenanceReasons.push({ code: 'METHODOLOGY_METADATA_UNAVAILABLE', metric: 'energy' })
    return
  }
  totals.methodologies.set(methodologyIdentity(methodology), methodology)
}

function addSummaryFactor(projection: PersistedEnvironmentalSegmentProjection, totals: SummaryTotals): void {
  if (projection.emissions.value === null) return
  const factor = projection.factorSnapshot
  if (factor === null) {
    totals.provenanceReasons.push({ code: 'FACTOR_METADATA_UNAVAILABLE', metric: 'emissions' })
    return
  }
  const identity = factorIdentity(factor)
  const queryTime = factor.queriedAt === null ? null : parseZonedTimestampNanoseconds(factor.queriedAt)
  const summary = totals.factors.get(identity)
  if (summary) {
    if (queryTime !== null) {
      if (summary.queriedFrom === null || queryTime < summary.queriedFrom) summary.queriedFrom = queryTime
      if (summary.queriedTo === null || queryTime > summary.queriedTo) summary.queriedTo = queryTime
    }
    return
  }
  totals.factors.set(identity, { factor, queriedFrom: queryTime, queriedTo: queryTime })
}

function addSummarySegment(segment: ResolvedSegment, totals: SummaryTotals): void {
  if (!segment.winner) {
    const missing = [{ code: 'NO_OBSERVATION' }]
    totals.energyReasons.push(...missing)
    totals.emissionsReasons.push(...missing)
    return
  }
  const projection = projectObservationSegment(segment)
  const duration = segment.end - segment.start
  if (projection.energy.value === null) totals.energyReasons.push(...projection.energy.reasons)
  else {
    totals.energyTotal += projection.energy.value
    totals.energyCovered += duration
    addSummaryMethodology(projection, totals)
  }
  if (projection.emissions.value === null) totals.emissionsReasons.push(...projection.emissions.reasons)
  else {
    totals.emissionsTotal += projection.emissions.value
    totals.emissionsCovered += duration
    addSummaryFactor(projection, totals)
  }
}

function toFactorProvenance(factor: FactorSummary): EnvironmentalFactorProvenance {
  return {
    contractVersion: factor.factor.contractVersion,
    regionCode: factor.factor.regionCode,
    country: factor.factor.country,
    region: factor.factor.region,
    city: factor.factor.city,
    intensity: factor.factor.intensity,
    unit: factor.factor.unit,
    version: factor.factor.version,
    source: factor.factor.source,
    validFrom: factor.factor.validFrom,
    validUntil: factor.factor.validUntil,
    queriedAt: {
      from: factor.queriedFrom === null ? null : formatUtcTimestamp(factor.queriedFrom),
      to: factor.queriedTo === null ? null : formatUtcTimestamp(factor.queriedTo),
    },
  }
}

function periodMeasures(start: bigint, end: bigint, totals: EnvironmentalPeriodMeasures) {
  const periodDuration = end - start
  return {
    period: { from: formatUtcTimestamp(start), to: formatUtcTimestamp(end) },
    energy: {
      value: totals.energyCovered > 0n ? totals.energyTotal : null,
      unit: 'kWh',
      reasons: uniqueReasons(totals.energyReasons),
    },
    emissions: {
      value: totals.emissionsCovered > 0n ? totals.emissionsTotal : null,
      unit: 'gCO2e',
      reasons: uniqueReasons(totals.emissionsReasons),
    },
    coverage: {
      energy: Number(totals.energyCovered) / Number(periodDuration),
      emissions: Number(totals.emissionsCovered) / Number(periodDuration),
    },
  }
}

function finishSummary(start: bigint, end: bigint, totals: SummaryTotals): PersistedEnvironmentalSummary {
  return {
    status: 'available',
    ...periodMeasures(start, end, totals),
    provenance: {
      methodologies: [...totals.methodologies.values()],
      factors: [...totals.factors.values()].map(toFactorProvenance),
      reasons: uniqueReasons(totals.provenanceReasons),
    },
  }
}

function addGap(segment: ResolvedSegment, totals: AggregateTotals): void {
  const noObservation: EnvironmentalReason[] = [{ code: 'NO_OBSERVATION' }]
  totals.energyReasons.push(...noObservation)
  totals.emissionsReasons.push(...noObservation)
  totals.exclusions.push({
    collectionId: null,
    interval: { from: segment.from, to: segment.to },
    energyReasons: noObservation,
    emissionsReasons: noObservation,
  })
}

function addContribution(segment: ResolvedSegment, totals: AggregateTotals): void {
  if (!segment.winner) {
    addGap(segment, totals)
    return
  }
  const projection = projectObservationSegment(segment)
  const energyValue = projection.energy.value
  const emissionsValue = projection.emissions.value
  totals.energyTotal += energyValue ?? 0
  totals.emissionsTotal += emissionsValue ?? 0
  if (energyValue !== null) totals.energyCovered += segment.end - segment.start
  if (emissionsValue !== null) totals.emissionsCovered += segment.end - segment.start
  addPersistedContribution(projection, totals)
  addExclusionIfNeeded(projection, energyValue, emissionsValue, totals)
}

function projectObservationSegment(segment: ResolvedSegment): PersistedEnvironmentalSegmentProjection {
  const winner = segment.winner!
  return projectObservation(
    winner.observation,
    {
      from: segment.from,
      to: segment.to,
      start: segment.start,
      end: segment.end,
      originalStart: winner.originalStart,
      originalEnd: winner.originalEnd,
      collectedAt: formatUtcTimestamp(winner.receivedAt),
    },
  )
}

function addPersistedContribution(
  projection: PersistedEnvironmentalSegmentProjection,
  totals: AggregateTotals,
): void {
  if (projection.energy.value === null && projection.emissions.value === null) return
  totals.contributions.push({
    collectionId: projection.collectionId!,
    originalInterval: projection.originalInterval!,
    countedInterval: projection.interval,
    collectedAt: projection.collectedAt!,
    energy: projection.energy,
    emissions: projection.emissions,
    methodology: projection.methodology,
    factorSnapshot: projection.factorSnapshot,
  })
}

function addExclusionIfNeeded(
  projection: PersistedEnvironmentalSegmentProjection,
  energyValue: number | null,
  emissionsValue: number | null,
  totals: AggregateTotals,
): void {
  if (energyValue !== null && emissionsValue !== null) return
  totals.energyReasons.push(...projection.energy.reasons)
  totals.emissionsReasons.push(...projection.emissions.reasons)
  totals.exclusions.push({
    collectionId: projection.collectionId,
    interval: projection.interval,
    energyReasons: projection.energy.reasons,
    emissionsReasons: projection.emissions.reasons,
  })
}

function finishAggregation(start: bigint, end: bigint, totals: AggregateTotals): PersistedEnvironmentalPeriodResult {
  return {
    status: 'available',
    ...periodMeasures(start, end, totals),
    contributions: totals.contributions,
    exclusions: totals.exclusions,
  }
}

function parsePeriod(periodStart: string, periodEnd: string): { readonly start: bigint; readonly end: bigint } {
  const start = parseZonedTimestampNanoseconds(periodStart)
  const end = parseZonedTimestampNanoseconds(periodEnd)
  if (start === null || end === null || end <= start) throw new Error('INVALID_ANALYSIS_PERIOD')
  return { start, end }
}

export function aggregatePersistedEnvironmentalPeriod(
  periodStart: string,
  periodEnd: string,
  observations: readonly PersistedEnvironmentalInterval[],
): PersistedEnvironmentalPeriodResult {
  const { start, end } = parsePeriod(periodStart, periodEnd)
  const intervals = prepareIntervals(start, end, observations)
  if (intervals.length === 0) return emptyResult(start, end)
  const totals = createTotals()
  for (const segment of resolvePreparedSegments(start, end, intervals)) addContribution(segment, totals)
  return finishAggregation(start, end, totals)
}

export function summarizePersistedEnvironmentalPeriod(
  periodStart: string,
  periodEnd: string,
  observations: readonly PersistedEnvironmentalInterval[],
): PersistedEnvironmentalSummary {
  const { start, end } = parsePeriod(periodStart, periodEnd)
  const intervals = prepareIntervals(start, end, observations)
  if (intervals.length === 0) {
    const empty = emptyResult(start, end)
    return {
      status: empty.status,
      period: empty.period,
      energy: empty.energy,
      emissions: empty.emissions,
      coverage: empty.coverage,
      provenance: { methodologies: [], factors: [], reasons: [] },
    }
  }
  const totals = createSummaryTotals()
  for (const segment of resolvePreparedSegments(start, end, intervals)) addSummarySegment(segment, totals)
  return finishSummary(start, end, totals)
}

export function resolvePersistedEnvironmentalSegments(
  periodStart: string,
  periodEnd: string,
  observations: readonly PersistedEnvironmentalInterval[],
): PersistedEnvironmentalSegment[] {
  const { start, end } = parsePeriod(periodStart, periodEnd)
  const intervals = prepareIntervals(start, end, observations)
  return resolvePreparedSegments(start, end, intervals).map(({ from, to, observation }) => ({ from, to, observation }))
}
