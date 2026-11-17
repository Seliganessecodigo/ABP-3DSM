type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isMeasure(value: unknown): value is SimulationMeasure {
  return isRecord(value) && (value.value === null || (typeof value.value === 'number' && Number.isFinite(value.value))) &&
    typeof value.unit === 'string' && Array.isArray(value.reasons) && value.reasons.every((reason) =>
      isRecord(reason) && typeof reason.code === 'string' && (reason.metric === undefined || typeof reason.metric === 'string'))
}

export type CarbonRegion = Readonly<{
  code: string
  country: string
  region: string
  city: string | null
  latitude: number
  longitude: number
  intensity: number
  unit: string
  renewableSharePercent: number
}>

export type SimulationMeasure = Readonly<{
  value: number | null
  unit: string
  reasons: readonly Readonly<{ code: string; metric?: string }>[]
}>

export type SimulationFactor = Readonly<{
  id: string | null
  version: string | null
  regionCode: string | null
  country: string | null
  region: string | null
  city: string | null
  intensity: number | null
  unit: string | null
  queriedAt: string | null
}>

export type RegionalSimulationResult = Readonly<{
  status: 'available' | 'partial' | 'empty'
  applicationId: string
  destinationRegionCode: string
  period: Readonly<{ from: string; to: string }>
  energy: SimulationMeasure
  reference: SimulationMeasure
  referenceFactors: readonly SimulationFactor[]
  destinationFactor: SimulationFactor | null
  destination: SimulationMeasure
  coverage: Readonly<{ energy: number; reference: number; destination: number }>
  difference: Readonly<{ absolute: SimulationMeasure; percent: SimulationMeasure }>
}>

export type RegionalSimulationInput = Readonly<{
  from: string
  to: string
  destinationRegionCode: string
}>

export class RegionalSimulationRequestError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) {
    super(`HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/+$/, '')

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    let code = ''
    try {
      const error: unknown = await response.json()
      if (isRecord(error) && typeof error.code === 'string') code = error.code
    } catch { /* response may not contain JSON */ }
    throw new RegionalSimulationRequestError(response.status, code)
  }
  return response.json() as Promise<unknown>
}

function parseRegion(value: unknown): CarbonRegion {
  if (!isRecord(value) || typeof value.code !== 'string' || !value.code || typeof value.country !== 'string' ||
    typeof value.region !== 'string' || !isNullableString(value.city) || !Number.isFinite(value.latitude) ||
    !Number.isFinite(value.longitude) || !Number.isFinite(value.intensity) || typeof value.unit !== 'string' ||
    !Number.isFinite(value.renewableSharePercent)) throw new Error('Invalid carbon region response')
  return value as CarbonRegion
}

export async function getCarbonRegions(signal: AbortSignal): Promise<readonly CarbonRegion[]> {
  const payload = await getJson(`${apiBase}/carbon/regions`, signal)
  if (!isRecord(payload) || !Array.isArray(payload.regions) || !Number.isInteger(payload.total) || payload.total !== payload.regions.length) {
    throw new Error('Invalid carbon regions response')
  }
  return payload.regions.map(parseRegion)
}

function parseFactor(value: unknown): SimulationFactor {
  if (!isRecord(value) || !isNullableString(value.id) || !isNullableString(value.version) ||
    !isNullableString(value.regionCode) || !isNullableString(value.country) || !isNullableString(value.region) ||
    !isNullableString(value.city) || !(value.intensity === null || (typeof value.intensity === 'number' && Number.isFinite(value.intensity))) ||
    !isNullableString(value.unit) || !(value.queriedAt === null || (typeof value.queriedAt === 'string' && Number.isFinite(Date.parse(value.queriedAt))))) {
    throw new Error('Invalid simulation factor')
  }
  return value as SimulationFactor
}

function parseSimulation(value: unknown): RegionalSimulationResult {
  const coverage = isRecord(value) ? value.coverage : null
  if (!isRecord(value) || !['available', 'partial', 'empty'].includes(String(value.status)) ||
    typeof value.applicationId !== 'string' || typeof value.destinationRegionCode !== 'string' || !isRecord(value.period) ||
    typeof value.period.from !== 'string' || !Number.isFinite(Date.parse(value.period.from)) ||
    typeof value.period.to !== 'string' || !Number.isFinite(Date.parse(value.period.to)) || !isMeasure(value.energy) ||
    !isMeasure(value.reference) || !Array.isArray(value.referenceFactors) || !isRecord(coverage) ||
    !['energy', 'reference', 'destination'].every((key) => typeof coverage[key] === 'number' &&
      Number.isFinite(coverage[key]) && (coverage[key] as number) >= 0 && (coverage[key] as number) <= 1) ||
    !isRecord(value.difference) || !isMeasure(value.difference.absolute) || !isMeasure(value.difference.percent) ||
    (value.destinationFactor !== null && !isRecord(value.destinationFactor)) ||
    !isMeasure(value.destination)) throw new Error('Invalid regional simulation response')
  const destinationFactor = value.destinationFactor === null ? null : parseFactor(value.destinationFactor)
  return {
    status: value.status as RegionalSimulationResult['status'],
    applicationId: value.applicationId,
    destinationRegionCode: value.destinationRegionCode,
    period: value.period as RegionalSimulationResult['period'],
    energy: value.energy,
    reference: value.reference,
    referenceFactors: value.referenceFactors.map(parseFactor),
    destinationFactor,
    destination: value.destination,
    coverage: value.coverage as RegionalSimulationResult['coverage'],
    difference: value.difference as RegionalSimulationResult['difference'],
  }
}

export async function postRegionalSimulation(
  applicationId: string,
  input: RegionalSimulationInput,
  signal: AbortSignal,
): Promise<RegionalSimulationResult> {
  const response = await fetch(`${apiBase}/applications/${encodeURIComponent(applicationId)}/analysis/regional-simulation`, {
    method: 'POST',
    signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    let code = ''
    try {
      const error: unknown = await response.json()
      if (isRecord(error) && typeof error.code === 'string') code = error.code
    } catch { /* response may not contain JSON */ }
    throw new RegionalSimulationRequestError(response.status, code)
  }
  return parseSimulation(await response.json())
}
