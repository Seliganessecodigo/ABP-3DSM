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

interface ClippedInterval {
  readonly observation: PersistedEnvironmentalInterval
  readonly start: bigint
  readonly end: bigint
  readonly receivedAt: bigint
}

export function formatUtcTimestamp(nanoseconds: bigint): string {
  let seconds = nanoseconds / 1_000_000_000n
  let fraction = nanoseconds % 1_000_000_000n
  if (fraction < 0n) {
    seconds -= 1n
    fraction += 1_000_000_000n
  }
  const base = new Date(Number(seconds) * 1000).toISOString().replace('.000Z', '')
  const digits = fraction.toString().padStart(9, '0').replace(/0+$/, '') || '000'
  return `${base}.${digits}Z`
}

function higherPriority(first: ClippedInterval, second: ClippedInterval): boolean {
  return first.receivedAt > second.receivedAt ||
    (first.receivedAt === second.receivedAt && first.observation.id < second.observation.id)
}

function pushHeap(heap: ClippedInterval[], value: ClippedInterval): void {
  heap.push(value)
  let child = heap.length - 1
  while (child > 0) {
    const parent = Math.floor((child - 1) / 2)
    if (higherPriority(heap[parent], heap[child])) break
    ;[heap[parent], heap[child]] = [heap[child], heap[parent]]
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
    ;[heap[parent], heap[best]] = [heap[best], heap[parent]]
    parent = best
  }
}

function utcBoundaries(intervals: readonly ClippedInterval[], from: bigint, to: bigint): bigint[] {
  return [...new Set([
    from.toString(),
    to.toString(),
    ...intervals.flatMap(({ start, end }) => [start.toString(), end.toString()]),
  ])].map(BigInt).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
}

function numericValue(value: string | null, durationRatio: number): number | null {
  if (value === null) return null
  const persistedValue = Number(value)
  const countedValue = persistedValue * durationRatio
  return Number.isFinite(countedValue) ? countedValue : null
}

function uniqueReasons(reasons: readonly EnvironmentalReason[]): EnvironmentalReason[] {
  const unique = new Map<string, EnvironmentalReason>()
  for (const reason of reasons) unique.set(`${reason.code}:${reason.metric ?? ''}`, reason)
  return [...unique.values()]
}

export function aggregatePersistedEnvironmentalPeriod(
  periodStart: string,
  periodEnd: string,
  observations: readonly PersistedEnvironmentalInterval[],
): PersistedEnvironmentalPeriodResult {
  const start = parseZonedTimestampNanoseconds(periodStart)
  const end = parseZonedTimestampNanoseconds(periodEnd)
  if (start === null || end === null || end <= start) throw new Error('INVALID_ANALYSIS_PERIOD')

  const intervals = observations.flatMap((observation) => {
    const originalStart = parseZonedTimestampNanoseconds(observation.intervalStart)
    const originalEnd = parseZonedTimestampNanoseconds(observation.intervalEnd)
    const receivedAt = parseZonedTimestampNanoseconds(observation.collectedAt)
    if (originalStart === null || originalEnd === null || receivedAt === null || originalEnd <= originalStart) return []
    const clippedStart = originalStart > start ? originalStart : start
    const clippedEnd = originalEnd < end ? originalEnd : end
    return clippedEnd > clippedStart ? [{ observation, start: clippedStart, end: clippedEnd, receivedAt }] : []
  }).sort((left, right) => left.start < right.start ? -1 : left.start > right.start ? 1 : left.observation.id < right.observation.id ? -1 : 1)

  if (intervals.length === 0) {
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

  const boundaries = utcBoundaries(intervals, start, end)
  const active: ClippedInterval[] = []
  const contributions: EnvironmentalContribution[] = []
  const exclusions: EnvironmentalExclusion[] = []
  const energyReasons: EnvironmentalReason[] = []
  const emissionsReasons: EnvironmentalReason[] = []
  let energyTotal = 0
  let emissionsTotal = 0
  let energyCovered = 0n
  let emissionsCovered = 0n
  let nextInterval = 0

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]
    const segmentEnd = boundaries[index + 1]
    while (nextInterval < intervals.length && intervals[nextInterval].start <= segmentStart) pushHeap(active, intervals[nextInterval++])
    while (active.length > 0 && active[0].end <= segmentStart) popHeap(active)
    const winner = active[0]
    const interval = { from: formatUtcTimestamp(segmentStart), to: formatUtcTimestamp(segmentEnd) }
    if (!winner) {
      const noObservation = [{ code: 'NO_OBSERVATION' }]
      energyReasons.push(...noObservation)
      emissionsReasons.push(...noObservation)
      exclusions.push({ collectionId: null, interval, energyReasons: noObservation, emissionsReasons: noObservation })
      continue
    }

    const observation = winner.observation
    const ratio = Number(segmentEnd - segmentStart) / Number(parseZonedTimestampNanoseconds(observation.intervalEnd)! - parseZonedTimestampNanoseconds(observation.intervalStart)!)
    const energyValue = numericValue(observation.energyKwh, ratio)
    const emissionsValue = numericValue(observation.carbonGrams, ratio)
    const energyMissingReasons = energyValue === null ? observation.calculationEvidence?.energy.reasons ?? [] : []
    const emissionsMissingReasons = emissionsValue === null ? observation.calculationEvidence?.carbon.reasons ?? [] : []
    energyTotal += energyValue ?? 0
    emissionsTotal += emissionsValue ?? 0
    if (energyValue !== null) energyCovered += segmentEnd - segmentStart
    if (emissionsValue !== null) emissionsCovered += segmentEnd - segmentStart
    if (energyValue !== null || emissionsValue !== null) {
      const factor = observation.calculationEvidence?.carbon.factorSnapshot
      contributions.push({
        collectionId: observation.id,
        originalInterval: { from: formatUtcTimestamp(parseZonedTimestampNanoseconds(observation.intervalStart)!), to: formatUtcTimestamp(parseZonedTimestampNanoseconds(observation.intervalEnd)!) },
        countedInterval: interval,
        collectedAt: formatUtcTimestamp(winner.receivedAt),
        energy: { value: energyValue, unit: 'kWh', reasons: energyMissingReasons },
        emissions: { value: emissionsValue, unit: 'gCO2e', reasons: emissionsMissingReasons },
        methodology: observation.calculationEvidence ? {
          key: observation.calculationEvidence.energy.modelKey,
          version: observation.calculationEvidence.energy.modelVersion,
          parameters: observation.calculationEvidence.energy.modelParameters,
        } : null,
        factorSnapshot: factor ? { ...factor } : null,
      })
    }
    if (energyValue === null || emissionsValue === null) {
      energyReasons.push(...energyMissingReasons)
      emissionsReasons.push(...emissionsMissingReasons)
      exclusions.push({
        collectionId: observation.id,
        interval,
        energyReasons: energyMissingReasons,
        emissionsReasons: emissionsMissingReasons,
      })
    }
  }

  const periodDuration = end - start
  const available = intervals.length > 0
  return {
    status: available ? 'available' : 'empty',
    period: { from: formatUtcTimestamp(start), to: formatUtcTimestamp(end) },
    energy: { value: energyCovered > 0n ? energyTotal : null, unit: 'kWh', reasons: uniqueReasons(energyReasons) },
    emissions: { value: emissionsCovered > 0n ? emissionsTotal : null, unit: 'gCO2e', reasons: uniqueReasons(emissionsReasons) },
    coverage: { energy: Number(energyCovered) / Number(periodDuration), emissions: Number(emissionsCovered) / Number(periodDuration) },
    contributions,
    exclusions,
  }
}
