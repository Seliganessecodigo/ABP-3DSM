import { analysisRangeFor } from './source.ts'
import type { PeriodPreset } from './periodContext.ts'

export type EnvironmentalSummaryState = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'
export type EnvironmentalSummaryMeasure = Readonly<{ value: number | null; unit: string }>
export type EnvironmentalSummaryApplication = Readonly<{
  applicationId: string
  name: string
  state: EnvironmentalSummaryState
  energy: EnvironmentalSummaryMeasure
  emissions: EnvironmentalSummaryMeasure
  coverage: Readonly<{ energy: number; emissions: number }>
}>
export type EnvironmentalSummary = Readonly<{
  status: 'available' | 'empty'
  period: Readonly<{ from: string; to: string }>
  dataAsOf: string | null
  totals: Readonly<{ energy: EnvironmentalSummaryMeasure; emissions: EnvironmentalSummaryMeasure }>
  coverage: Readonly<{ energy: number; emissions: number }>
  states: Readonly<Record<EnvironmentalSummaryState, number>>
  applications: readonly EnvironmentalSummaryApplication[]
}>

export type EnvironmentalSummaryFilters = Readonly<{
  period: PeriodPreset
  anchor: string
  state: EnvironmentalSummaryState | null
  regionCode: string
}>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readMeasure(value: unknown, name: string): EnvironmentalSummaryMeasure {
  if (!isRecord(value) || typeof value.unit !== 'string' ||
    !(value.value === null || typeof value.value === 'number' && Number.isFinite(value.value)) ||
    !Array.isArray(value.reasons) ||
    !value.reasons.every((reason) => isRecord(reason) && typeof reason.code === 'string')) {
    throw new Error(`Invalid ${name} in environmental summary`)
  }
  return { value: value.value, unit: value.unit }
}

function readCoverage(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Invalid ${name} in environmental summary`)
  }
  return value
}

function readState(value: unknown): EnvironmentalSummaryState {
  if (value !== 'AVAILABLE' && value !== 'UNAVAILABLE' && value !== 'NO_METRICS' && value !== 'REMOVED') {
    throw new Error('Invalid application state in environmental summary')
  }
  return value
}

export function parseEnvironmentalSummary(value: unknown, expectedPeriod: Readonly<{ from: string; to: string }>): EnvironmentalSummary {
  if (!isRecord(value) || (value.status !== 'available' && value.status !== 'empty') ||
    !isRecord(value.period) || value.period.from !== expectedPeriod.from || value.period.to !== expectedPeriod.to ||
    !(value.dataAsOf === null || typeof value.dataAsOf === 'string' && Number.isFinite(Date.parse(value.dataAsOf))) ||
    !isRecord(value.totals) || !isRecord(value.coverage) || !isRecord(value.states) ||
    !Array.isArray(value.applications) || !isRecord(value.provenance) ||
    !Array.isArray(value.provenance.methodologies) || !Array.isArray(value.provenance.factors) ||
    !Array.isArray(value.provenance.reasons)) {
    throw new Error('Invalid environmental summary response')
  }

  const states: Record<EnvironmentalSummaryState, number> = {
    AVAILABLE: 0, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0,
  }
  for (const state of Object.keys(states) as EnvironmentalSummaryState[]) {
    const count = value.states[state]
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(`Invalid ${state} count in environmental summary`)
    }
    states[state] = count
  }

  const ids = new Set<string>()
  const applications = value.applications.map((entry): EnvironmentalSummaryApplication => {
    if (!isRecord(entry) || typeof entry.applicationId !== 'string' || !entry.applicationId ||
      typeof entry.name !== 'string' || !entry.name || !isRecord(entry.coverage)) {
      throw new Error('Invalid application in environmental summary')
    }
    if (ids.has(entry.applicationId)) throw new Error('Duplicate application in environmental summary')
    ids.add(entry.applicationId)
    return {
      applicationId: entry.applicationId,
      name: entry.name,
      state: readState(entry.state),
      energy: readMeasure(entry.energy, 'application energy'),
      emissions: readMeasure(entry.emissions, 'application emissions'),
      coverage: {
        energy: readCoverage(entry.coverage.energy, 'application energy coverage'),
        emissions: readCoverage(entry.coverage.emissions, 'application emissions coverage'),
      },
    }
  })

  return {
    status: value.status,
    period: expectedPeriod,
    dataAsOf: value.dataAsOf,
    totals: {
      energy: readMeasure(value.totals.energy, 'energy total'),
      emissions: readMeasure(value.totals.emissions, 'emissions total'),
    },
    coverage: {
      energy: readCoverage(value.coverage.energy, 'energy coverage'),
      emissions: readCoverage(value.coverage.emissions, 'emissions coverage'),
    },
    states,
    applications,
  }
}

export async function getEnvironmentalSummary(filters: EnvironmentalSummaryFilters, signal: AbortSignal): Promise<EnvironmentalSummary> {
  const range = analysisRangeFor(filters.period, new Date(filters.anchor))
  const params = new URLSearchParams(range)
  if (filters.state) params.append('states', filters.state)
  if (filters.regionCode) params.append('regionCodes', filters.regionCode)
  const base = (import.meta.env.VITE_API_URL as string | undefined ?? '/api').replace(/\/+$/, '')
  const response = await fetch(`${base}/analysis/summary?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Environmental summary request failed: ${response.status}`)
  return parseEnvironmentalSummary(await response.json() as unknown, range)
}
