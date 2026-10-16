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
