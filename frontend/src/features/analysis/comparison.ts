import type { ApplicationState } from '../applications/catalog.ts'

export type ComparisonReason = Readonly<{ code: string; metric?: string }>
export type ComparisonMeasure = Readonly<{ value: number | null; unit: string; reasons: readonly ComparisonReason[] }>
export type ComparisonDifference = Readonly<{
  absolute: number | null
  unit: string | null
  percentage: number | null
  reason: string | null
}>
export type ComparisonMetric = Readonly<{
  value: number | null
  unit: string | null
  status: 'available' | 'missing' | 'invalid'
  collectedAt: string | null
  reasons: readonly ComparisonReason[]
}>
export type ComparisonLocation = Readonly<{
  regionCode: string
  country: string
  region: string
  city: string | null
  latitude: number
  longitude: number
}>
export type ComparisonLocationSnapshot = Readonly<{
  from: string
  to: string
  location: ComparisonLocation | null
  reasons: readonly ComparisonReason[]
}>
export type ComparisonApplication = Readonly<{
  verificationOverdue?: boolean
  collectionSuccessRate?: number | null
  applicationId: string
  name: string
  state: ApplicationState
  locations: readonly ComparisonLocationSnapshot[]
  metrics: Readonly<Record<'cpu' | 'memory' | 'disk' | 'network', ComparisonMetric>>
  energy: ComparisonMeasure
  emissions: ComparisonMeasure
  coverage: Readonly<{ energy: number; emissions: number }>
  differences: Readonly<{
    energy: ComparisonDifference
    emissions: ComparisonDifference
    metrics: Readonly<Record<'cpu' | 'memory' | 'disk' | 'network', ComparisonDifference>>
    coverage: Readonly<{ energyPercentagePoints: number | null; emissionsPercentagePoints: number | null }>
  }>
}>
export type ApplicationComparison = Readonly<{
  status: 'empty' | 'partial' | 'complete'
  period: Readonly<{ from: string; to: string }>
  referenceApplicationId: string
  applications: readonly ComparisonApplication[]
}>

export class ComparisonRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string) {
    super(`HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

type RecordValue = Record<string, unknown>

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown, name: string): RecordValue {
  if (!isRecord(value)) throw new Error(`Invalid comparison ${name}`)
  return value
}

function text(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid comparison ${name}`)
  return value
}

function nullableText(value: unknown, name: string): string | null {
  if (value !== null && typeof value !== 'string') throw new Error(`Invalid comparison ${name}`)
  return value
}

function finite(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid comparison ${name}`)
  return value
}

function nullableFinite(value: unknown, name: string): number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`Invalid comparison ${name}`)
  return value
}

function date(value: unknown, name: string): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error(`Invalid comparison ${name}`)
  return value
}

function reasons(value: unknown, name: string): ComparisonReason[] {
  if (!Array.isArray(value)) throw new Error(`Invalid comparison ${name}`)
  return value.map((entry) => {
    const item = record(entry, name)
    if (item.metric !== undefined && typeof item.metric !== 'string') throw new Error(`Invalid comparison ${name}`)
    return { code: text(item.code, name), ...(item.metric === undefined ? {} : { metric: item.metric }) }
  })
}

function measure(value: unknown, name: string): ComparisonMeasure {
  const item = record(value, name)
  return { value: nullableFinite(item.value, name), unit: text(item.unit, name), reasons: reasons(item.reasons, name) }
}

function difference(value: unknown, name: string): ComparisonDifference {
  const item = record(value, name)
  return {
    absolute: nullableFinite(item.absolute, name),
    unit: nullableText(item.unit, name),
    percentage: nullableFinite(item.percentage, name),
    reason: nullableText(item.reason, name),
  }
}

function metric(value: unknown, name: string): ComparisonMetric {
  const item = record(value, name)
  if (!['available', 'missing', 'invalid'].includes(String(item.status))) throw new Error(`Invalid comparison ${name}`)
  const result = {
    value: nullableFinite(item.value, name),
    unit: nullableText(item.unit, name),
    status: item.status as ComparisonMetric['status'],
    collectedAt: item.collectedAt === null ? null : date(item.collectedAt, name),
    reasons: reasons(item.reasons, name),
  }
  if ((result.status === 'available') !== (result.value !== null)) throw new Error(`Invalid comparison ${name}`)
  return result
}

function location(value: unknown): ComparisonLocation {
  const item = record(value, 'location')
  const latitude = finite(item.latitude, 'location')
  const longitude = finite(item.longitude, 'location')
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error('Invalid comparison location')
  return {
    regionCode: text(item.regionCode, 'location'),
    country: text(item.country, 'location'),
    region: text(item.region, 'location'),
    city: nullableText(item.city, 'location'),
    latitude,
    longitude,
  }
}

function locationSnapshot(value: unknown): ComparisonLocationSnapshot {
  const item = record(value, 'location snapshot')
  return {
    from: date(item.from, 'location snapshot'),
    to: date(item.to, 'location snapshot'),
    location: item.location === null ? null : location(item.location),
    reasons: reasons(item.reasons, 'location snapshot'),
  }
}

function metricSet(value: unknown, name: string): Record<'cpu' | 'memory' | 'disk' | 'network', ComparisonMetric> {
  const item = record(value, name)
  return {
    cpu: metric(item.cpu, name),
    memory: metric(item.memory, name),
    disk: metric(item.disk, name),
    network: metric(item.network, name),
  }
}

function differenceSet(value: unknown, name: string): Record<'cpu' | 'memory' | 'disk' | 'network', ComparisonDifference> {
  const item = record(value, name)
  return {
    cpu: difference(item.cpu, name),
    memory: difference(item.memory, name),
    disk: difference(item.disk, name),
    network: difference(item.network, name),
  }
}

function comparisonApplication(value: unknown): ComparisonApplication {
  const item = record(value, 'application')
  if (!['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'].includes(String(item.state)) || !Array.isArray(item.locations) ||
    (item.verificationOverdue !== undefined && typeof item.verificationOverdue !== 'boolean')) {
    throw new Error('Invalid comparison application')
  }
  const coverage = record(item.coverage, 'coverage')
  const differences = record(item.differences, 'differences')
  const coverageDifference = record(differences.coverage, 'coverage differences')
  const metricsDifferences = record(differences.metrics, 'metric differences')
  const successRate = item.collectionSuccessRate === undefined ? undefined : nullableFinite(item.collectionSuccessRate, 'collection success')
  if (successRate != null && (successRate < 0 || successRate > 1)) throw new Error('Invalid collection success rate')
  return {
    applicationId: text(item.applicationId, 'application id'),
    name: text(item.name, 'application name'),
    state: item.state as ApplicationState,
    ...(item.verificationOverdue !== undefined ? { verificationOverdue: item.verificationOverdue } : {}),
    ...(successRate !== undefined ? { collectionSuccessRate: successRate } : {}),
    locations: item.locations.map(locationSnapshot),
    metrics: metricSet(item.metrics, 'metrics'),
    energy: measure(item.energy, 'energy'),
    emissions: measure(item.emissions, 'emissions'),
    coverage: {
      energy: finite(coverage.energy, 'energy coverage'),
      emissions: finite(coverage.emissions, 'emissions coverage'),
    },
    differences: {
      energy: difference(differences.energy, 'energy difference'),
      emissions: difference(differences.emissions, 'emissions difference'),
      metrics: differenceSet(metricsDifferences, 'metric differences'),
      coverage: {
        energyPercentagePoints: nullableFinite(coverageDifference.energyPercentagePoints, 'energy coverage difference'),
        emissionsPercentagePoints: nullableFinite(coverageDifference.emissionsPercentagePoints, 'emissions coverage difference'),
      },
    },
  }
}

function parseComparison(value: unknown, applicationIds: readonly string[], referenceApplicationId: string, from: string, to: string): ApplicationComparison {
  const item = record(value, 'response')
  const period = record(item.period, 'period')
  if (!['empty', 'partial', 'complete'].includes(String(item.status)) ||
    item.referenceApplicationId !== referenceApplicationId ||
    Date.parse(text(period.from, 'period start')) !== Date.parse(from) ||
    Date.parse(text(period.to, 'period end')) !== Date.parse(to) ||
    !Array.isArray(item.applications)) throw new Error('Invalid comparison response')
  const applications = item.applications.map(comparisonApplication)
  if (applications.length !== applicationIds.length ||
    applications.some((application, index) => application.applicationId !== applicationIds[index])) {
    throw new Error('Mismatched comparison applications')
  }
  for (const application of applications) {
    if (![application.coverage.energy, application.coverage.emissions].every((coverage) => coverage >= 0 && coverage <= 1)) {
      throw new Error('Invalid comparison coverage')
    }
  }
  return {
    status: item.status as ApplicationComparison['status'],
    period: { from: date(period.from, 'period start'), to: date(period.to, 'period end') },
    referenceApplicationId,
    applications,
  }
}

export async function requestApplicationComparison(
  applicationIds: readonly string[],
  referenceApplicationId: string,
  from: string,
  to: string,
  signal: AbortSignal,
): Promise<ApplicationComparison> {
  if (applicationIds.length < 2 || applicationIds.length > 5 || new Set(applicationIds).size !== applicationIds.length ||
    !applicationIds.includes(referenceApplicationId) || !Number.isFinite(Date.parse(from)) ||
    !Number.isFinite(Date.parse(to)) || Date.parse(to) <= Date.parse(from)) throw new Error('Invalid comparison request')
  const base = ((import.meta.env?.VITE_API_URL as string | undefined) ?? '/api').replace(/\/+$/, '')
  const params = new URLSearchParams({ from, to, referenceApplicationId })
  for (const id of applicationIds) params.append('applicationIds', id)
  const response = await fetch(`${base}/analysis/comparison?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    let code = ''
    try {
      const error: unknown = await response.json()
      if (isRecord(error) && typeof error.code === 'string') code = error.code
    } catch { /* response may not contain JSON */ }
    throw new ComparisonRequestError(response.status, code)
  }
  return parseComparison(await response.json() as unknown, applicationIds, referenceApplicationId, from, to)
}
