import { parseZonedTimestampNanoseconds } from './energy-calculation'
import type { PersistedEnvironmentalInterval } from './persisted-environmental-period'

export interface PersistedEnvironmentalSeriesEventInput {
  readonly id: string
  readonly occurredAt: string
  readonly kind: string
  readonly details: Record<string, unknown> | null
}

export type EnvironmentalAnalysisSeriesEventType =
  | 'status_changed'
  | 'removed'
  | 'returned'
  | 'region_changed'
  | 'methodology_changed'
  | 'factor_version_changed'

export interface EnvironmentalAnalysisSeriesEvent {
  readonly id: string
  readonly at: string
  readonly type: EnvironmentalAnalysisSeriesEventType
  readonly details: { readonly before: unknown; readonly after: unknown }
}

const regionFields = ['regionCode', 'country', 'region', 'city', 'latitude', 'longitude'] as const
const statusFields = ['state', 'reason', 'isStale', 'isCalculable'] as const

function projectStatus(value: unknown): Record<string, unknown> | null {
  const source = record(value)
  if (!source) return null
  return Object.fromEntries(statusFields
    .filter((field) => field in source)
    .map((field) => [field, source[field]]))
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function regionSnapshot(value: unknown): Record<string, unknown> | null {
  const source = record(value)
  const location = record(source?.location) ?? source
  if (!location) return null
  if (!regionFields.some((field) => field in location)) return null
  return Object.fromEntries(regionFields.map((field) => [field, location[field] ?? null]))
}

function regionsDiffer(before: Record<string, unknown>, after: Record<string, unknown>): boolean {
  return regionFields.some((field) => before[field] !== after[field])
}

function projectPersistedEvent(event: PersistedEnvironmentalSeriesEventInput): EnvironmentalAnalysisSeriesEvent | null {
  const details = record(event.details) ?? {}
  if (event.kind === 'status_changed') {
    const { before, after } = details
    if (before === undefined || after === undefined) return null
    return {
      id: event.id,
      at: event.occurredAt,
      type: 'status_changed',
      details: { before: projectStatus(before), after: projectStatus(after) },
    }
  }
  if (event.kind === 'removed') {
    return { id: event.id, at: event.occurredAt, type: 'removed', details: { before: null, after: { state: 'REMOVED' } } }
  }
  if (event.kind === 'returned') {
    return { id: event.id, at: event.occurredAt, type: 'returned', details: { before: { state: 'REMOVED' }, after: { state: 'UNAVAILABLE' } } }
  }
  if (event.kind !== 'registration_changed' && event.kind !== 'region_changed') return null

  const before = regionSnapshot(details.before)
  const after = regionSnapshot(details.after)
  if (!before || !after || !regionsDiffer(before, after)) return null
  return { id: event.id, at: event.occurredAt, type: 'region_changed', details: { before, after } }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => compareText(left, right))
    return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

function compareText(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function compareInstants(left: string, right: string): number {
  const leftAt = parseZonedTimestampNanoseconds(left)!
  const rightAt = parseZonedTimestampNanoseconds(right)!
  if (leftAt < rightAt) return -1
  if (leftAt > rightAt) return 1
  return 0
}

function methodology(observation: PersistedEnvironmentalInterval) {
  const evidence = observation.calculationEvidence?.energy
  return evidence ? {
    key: evidence.modelKey,
    version: evidence.modelVersion,
    parameters: evidence.modelParameters,
  } : null
}

function factor(observation: PersistedEnvironmentalInterval) {
  const snapshot = observation.calculationEvidence?.carbon.factorSnapshot
  if (!snapshot || snapshot.version === null) return null
  return { id: snapshot.id, version: snapshot.version }
}

function versionEvents(
  history: readonly PersistedEnvironmentalInterval[],
  from: bigint,
  to: bigint,
): EnvironmentalAnalysisSeriesEvent[] {
  const sorted = [...history].sort((left, right) => {
    const instantOrder = compareInstants(left.collectedAt, right.collectedAt)
    return instantOrder !== 0 ? instantOrder : compareText(left.id, right.id)
  })
  const events: EnvironmentalAnalysisSeriesEvent[] = []

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    const at = parseZonedTimestampNanoseconds(current.collectedAt)!
    if (at < from || at >= to) continue

    const beforeMethodology = methodology(previous)
    const afterMethodology = methodology(current)
    if (beforeMethodology && afterMethodology && canonicalJson(beforeMethodology) !== canonicalJson(afterMethodology)) {
      events.push({
        id: `${current.id}:methodology_changed`,
        at: current.collectedAt,
        type: 'methodology_changed',
        details: { before: beforeMethodology, after: afterMethodology },
      })
    }

    const beforeFactor = factor(previous)
    const afterFactor = factor(current)
    if (beforeFactor && afterFactor && beforeFactor.version !== afterFactor.version) {
      events.push({
        id: `${current.id}:factor_version_changed`,
        at: current.collectedAt,
        type: 'factor_version_changed',
        details: { before: beforeFactor, after: afterFactor },
      })
    }
  }
  return events
}

export function buildEnvironmentalAnalysisSeriesEvents(
  from: string,
  to: string,
  history: readonly PersistedEnvironmentalInterval[],
  persistedEvents: readonly PersistedEnvironmentalSeriesEventInput[],
): EnvironmentalAnalysisSeriesEvent[] {
  const start = parseZonedTimestampNanoseconds(from)
  const end = parseZonedTimestampNanoseconds(to)
  if (start === null || end === null || end <= start) throw new Error('INVALID_ANALYSIS_PERIOD')
  const events = persistedEvents.flatMap((event) => {
    const at = parseZonedTimestampNanoseconds(event.occurredAt)
    if (at === null || at < start || at >= end) return []
    const projected = projectPersistedEvent(event)
    return projected ? [projected] : []
  })
  events.push(...versionEvents(history, start, end))
  return events.sort((left, right) => {
    const instantOrder = compareInstants(left.at, right.at)
    return instantOrder !== 0 ? instantOrder : compareText(left.id, right.id)
  })
}
