import type { ApplicationState as State, CatalogEntry } from './catalog.ts'

interface LocationDto { regionCode: string; country: string; region: string; city: string | null; latitude: number; longitude: number }
export type ApplicationStateReason = 'NO_OBSERVATION' | 'METRICS_VALID' | 'METRICS_MISSING' | 'SOURCE_TIMEOUT' | 'SOURCE_ERROR' | 'REQUIRED_FIELD_MISSING' | 'INVALID_FIELD' | 'MONITORING_CYCLE_DELAYED' | 'CARBON_FACTOR_UNAVAILABLE' | 'REMOVAL_CONFIRMED'
export interface Application extends CatalogEntry {
  location: LocationDto | null
  reason: ApplicationStateReason
  lastObservationAt: string | null
  isStale: boolean
  isCalculable: boolean
  firstSeenAt: string
  lastCheckedAt: string | null
  removedAt: string | null
  updatedAt: string
}
export type MetricStatus = 'available' | 'missing' | 'invalid'
export interface MetricEvidence { value: number | null; unit: string | null; status: MetricStatus }
export interface CollectionEvidence {
  id: string; applicationId: string; intervalStart: string; intervalEnd: string; collectedAt: string
  collectionIntervalSeconds: number | null; isStale: boolean; state: string; reason: string
  lastCheckedAt: string | null
  metrics: { cpu: MetricEvidence; memory: MetricEvidence; disk: MetricEvidence; network: MetricEvidence }
  environmental: EnvironmentalEvidence
}

interface EnvironmentalReason { code: string; metric?: string }
interface EnvironmentalFormula { status: 'available' | 'unavailable'; expression: string | null; inputUnits: Record<string, string> | null; outputUnit: string | null; reason: string | null }
interface EnvironmentalModel { key: string; version: string; configId: string | null; configVersion: string | null; parameters: Record<string, number>; formula: EnvironmentalFormula; powerContributionsW: Record<string, number | null>; reasons: EnvironmentalReason[] }
interface EnvironmentalFactorSnapshot { id: string | null; version: string | null; contractVersion: string | null; regionCode: string | null; country: string | null; region: string | null; city: string | null; intensity: number | null; unit: string | null; queriedAt: string | null; source: string | null; validFrom: string | null; validUntil: string | null }
export interface EnvironmentalEvidence {
  status: 'present' | 'absent'; absenceReason: string | null
  energy: null | { valueKwh: number | null; calculatedValueKwh: number | null; coverage: number | null; durationSeconds: number | null; averagePowerW: number | null; model: EnvironmentalModel }
  carbon: null | { valueGramsCo2e: number | null; calculatedValueGramsCo2e: number | null; calculatedValueKilogramsCo2e: number | null; factor: number | null; factorSnapshot: EnvironmentalFactorSnapshot | null; formula: { expression: string; energyUnit: string; factorUnit: string; gramsUnit: string; kilogramsUnit: string }; reasons: EnvironmentalReason[] }
}
function trimTrailingSlashes(value: string) {
  let end = value.length
  while (value[end - 1] === '/') end -= 1
  return value.slice(0, end)
}

const apiBase = trimTrailingSlashes((import.meta.env.VITE_API_URL as string | undefined) ?? '/api')
const endpoint = (id?: string) => {
  const suffix = id === undefined ? '' : '/' + encodeURIComponent(id)
  return apiBase + '/applications' + suffix
}
const collectionEndpoint = (id: string, collectionId?: string) => endpoint(id) + '/collections/' + (collectionId === undefined ? 'latest' : encodeURIComponent(collectionId))

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
const reasons: ReadonlySet<ApplicationStateReason> = new Set(['NO_OBSERVATION', 'METRICS_VALID', 'METRICS_MISSING', 'SOURCE_TIMEOUT', 'SOURCE_ERROR', 'REQUIRED_FIELD_MISSING', 'INVALID_FIELD', 'MONITORING_CYCLE_DELAYED', 'CARBON_FACTOR_UNAVAILABLE', 'REMOVAL_CONFIRMED'])
export function parseApplication(value: unknown): Application {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name ||
    !['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'].includes(String(value.state)) ||
    !reasons.has(value.reason as ApplicationStateReason) || !(value.lastObservationAt === null || isDate(value.lastObservationAt)) ||
    typeof value.isStale !== 'boolean' || typeof value.isCalculable !== 'boolean' ||
    !isDate(value.firstSeenAt) || !isDate(value.updatedAt) ||
    !(value.lastCheckedAt === null || isDate(value.lastCheckedAt)) || !(value.removedAt === null || isDate(value.removedAt))) {
    throw new Error('Resposta incompatível com o catálogo')
  }
  let location: LocationDto | null = null
  if (value.location !== null) {
    const raw = value.location
    if (!isRecord(raw) || !['regionCode', 'country', 'region'].every((key) => typeof raw[key] === 'string') ||
      !(raw.city === null || typeof raw.city === 'string') || typeof raw.latitude !== 'number' || !Number.isFinite(raw.latitude) ||
      typeof raw.longitude !== 'number' || !Number.isFinite(raw.longitude)) throw new Error('Localização incompatível com o catálogo')
    location = { regionCode: raw.regionCode as string, country: raw.country as string, region: raw.region as string,
      city: raw.city as string | null, latitude: raw.latitude, longitude: raw.longitude }
  }
  return { id: value.id, name: value.name, state: value.state as State, reason: value.reason as ApplicationStateReason,
    lastObservationAt: value.lastObservationAt as string | null, isStale: value.isStale, isCalculable: value.isCalculable, location,
    firstSeenAt: value.firstSeenAt, lastCheckedAt: value.lastCheckedAt, removedAt: value.removedAt, updatedAt: value.updatedAt }
}

export class ApplicationRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string) {
    super(`HTTP ${status}`)
    this.status = status
    this.code = code
  }
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    let code = ''
    try { const error: unknown = await response.json(); if (isRecord(error) && typeof error.code === 'string') code = error.code } catch { /* resposta sem JSON */ }
    throw new ApplicationRequestError(response.status, code)
  }
  return response.json() as Promise<unknown>
}

export async function getApplications(signal: AbortSignal): Promise<Application[]> {
  const payload = await getJson(endpoint(), signal)
  if (!Array.isArray(payload)) throw new Error('Invalid applications collection')
  return payload.map(parseApplication)
}

export async function getApplication(id: string, signal: AbortSignal): Promise<Application> {
  return parseApplication(await getJson(endpoint(id), signal))
}

function parseMetric(value: unknown): MetricEvidence {
  if (!isRecord(value) || !['available', 'missing', 'invalid'].includes(String(value.status)) ||
    !(value.value === null || (typeof value.value === 'number' && Number.isFinite(value.value))) ||
    !(value.unit === null || typeof value.unit === 'string') ||
    (value.status === 'available') !== (value.value !== null)) throw new Error('Métrica incompatível com evidência')
  return { value: value.value as number | null, unit: value.unit as string | null, status: value.status as MetricStatus }
}

export function parseCollectionEvidence(value: unknown): CollectionEvidence {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.applicationId !== 'string' ||
    !isDate(value.intervalStart) || !isDate(value.intervalEnd) || !isDate(value.collectedAt) ||
    !(value.collectionIntervalSeconds === null || (typeof value.collectionIntervalSeconds === 'number' && Number.isFinite(value.collectionIntervalSeconds))) ||
    typeof value.isStale !== 'boolean' || typeof value.state !== 'string' || typeof value.reason !== 'string' ||
    !(value.lastCheckedAt === null || isDate(value.lastCheckedAt)) || !isRecord(value.metrics) || !isRecord(value.environmental)) {
    throw new Error('Evidência incompatível com a aplicação')
  }
  return { id: value.id, applicationId: value.applicationId, intervalStart: value.intervalStart, intervalEnd: value.intervalEnd,
    collectedAt: value.collectedAt, collectionIntervalSeconds: value.collectionIntervalSeconds as number | null,
    isStale: value.isStale, state: value.state, reason: value.reason, lastCheckedAt: value.lastCheckedAt as string | null,
    metrics: { cpu: parseMetric(value.metrics.cpu), memory: parseMetric(value.metrics.memory), disk: parseMetric(value.metrics.disk), network: parseMetric(value.metrics.network) },
    environmental: parseEnvironmentalEvidence(value.environmental) }
}

function finiteOrNull(value: unknown): value is number | null { return value === null || typeof value === 'number' && Number.isFinite(value) }
function parseEnvironmentalEvidence(value: unknown): EnvironmentalEvidence {
  if (!isRecord(value) || !['present', 'absent'].includes(String(value.status)) || !(value.absenceReason === null || typeof value.absenceReason === 'string')) throw new Error('Evidência ambiental incompatível')
  if (value.status === 'absent') {
    if (value.energy !== null || value.carbon !== null || value.absenceReason === null) throw new Error('Ausência ambiental incompatível')
    return value as unknown as EnvironmentalEvidence
  }
  if (value.absenceReason !== null || !isRecord(value.energy) || !isRecord(value.carbon)) throw new Error('Evidência ambiental incompatível')
  const energy = value.energy; const model = energy.model; const carbon = value.carbon; const carbonFormula = carbon.formula
  if (!['valueKwh', 'calculatedValueKwh', 'coverage', 'durationSeconds', 'averagePowerW'].every((key) => finiteOrNull(energy[key])) ||
    !isRecord(model) || typeof model.key !== 'string' || typeof model.version !== 'string' ||
    !(model.configId === null || typeof model.configId === 'string') || !(model.configVersion === null || typeof model.configVersion === 'string') ||
    !isRecord(model.parameters) || !Object.values(model.parameters).every((item) => typeof item === 'number' && Number.isFinite(item)) ||
    !isRecord(model.formula) || !['available', 'unavailable'].includes(String(model.formula.status)) ||
    !(model.formula.expression === null || typeof model.formula.expression === 'string') ||
    !(model.formula.outputUnit === null || typeof model.formula.outputUnit === 'string') ||
    !(model.formula.inputUnits === null || isRecord(model.formula.inputUnits) && Object.values(model.formula.inputUnits).every((item) => typeof item === 'string')) ||
    !Array.isArray(model.reasons) || !Array.isArray(carbon.reasons) ||
    !['valueGramsCo2e', 'calculatedValueGramsCo2e', 'calculatedValueKilogramsCo2e', 'factor'].every((key) => finiteOrNull(carbon[key])) ||
    !isRecord(carbonFormula) || !['expression', 'energyUnit', 'factorUnit', 'gramsUnit', 'kilogramsUnit'].every((key) => typeof carbonFormula[key] === 'string')) throw new Error('Evidência ambiental incompatível')
  for (const reason of [...model.reasons, ...carbon.reasons]) if (!isRecord(reason) || typeof reason.code !== 'string') throw new Error('Razão ambiental incompatível')
  if (carbon.factorSnapshot !== null) {
    const snapshot = carbon.factorSnapshot
    if (!isRecord(snapshot) || !['id', 'version', 'contractVersion', 'regionCode', 'country', 'region', 'city', 'unit', 'source'].every((key) => snapshot[key] === null || typeof snapshot[key] === 'string') ||
      !['intensity'].every((key) => finiteOrNull(snapshot[key])) || !['queriedAt', 'validFrom', 'validUntil'].every((key) => optionalDate(snapshot[key]))) throw new Error('Snapshot do fator ambiental incompatível')
  }
  return value as unknown as EnvironmentalEvidence
}

export async function getLatestCollectionEvidence(id: string, signal: AbortSignal): Promise<CollectionEvidence> {
  return parseCollectionEvidence(await getJson(collectionEndpoint(id), signal))
}

export async function getCollectionEvidence(id: string, collectionId: string, signal: AbortSignal): Promise<CollectionEvidence> {
  return parseCollectionEvidence(await getJson(collectionEndpoint(id, collectionId), signal))
}

function optionalDate(value: unknown): value is string | null { return value === null || isDate(value) }
