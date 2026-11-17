export type AuthenticatedRequest = (url: string, init?: RequestInit) => Promise<Response>
export class MonitoringError extends Error {
  readonly status: number
  constructor(status: number) { super(`Monitoring HTTP ${status}`); this.status = status }
}
export interface MonitoringCycle {
  id: string
  status: 'RUNNING' | 'SUCCEEDED' | 'PARTIAL' | 'FAILED'
  startedAt: string
  finishedAt: string | null
  processedCount: number
  failedCount: number
}
export interface MonitoringHealth {
  state: 'ACTIVE' | 'PAUSED' | 'UNAVAILABLE'
  paused: boolean | null
  schedulerRunning: boolean
  intervalSeconds: number
  knownApplications: number
  staleApplications: number
  lastObservationAt: string | null
  latestCycle: MonitoringCycle | null
  sources: {
    integration: 'services' | 'metrics' | 'carbon-factor'
    status: 'UNKNOWN' | 'DEGRADED' | 'RECOVERING' | 'RECOVERED'
    lastAttemptAt: string | null
    lastSuccessAt: string | null
    lastFailureAt: string | null
    openIncidentCount: number
  }[]
}
export interface AuditEvent {
  id: string
  actor: string
  actorLabel: string | null
  createdAt: string
  action: string
  entityType: string
  entityId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string | null
  outcome: 'success' | 'denied' | 'failed'
}
export interface AuditPage {
  items: AuditEvent[]
  pagination: { page: number; pageSize: number | 'all'; totalItems: number; totalPages: number; hasNextPage: boolean }
}
let base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
while (base.endsWith('/')) base = base.slice(0, -1)
function invalid(): never { throw new Error('Invalid monitoring response') }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  return value as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value) return invalid()
  return value
}
function nullableText(value: unknown): string | null { return value === null ? null : text(value) }
function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return invalid()
  return value
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') return invalid()
  return value
}
function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) return invalid()
  return value as T
}
function date(value: unknown): string | null {
  const result = nullableText(value)
  if (result !== null && !Number.isFinite(Date.parse(result))) return invalid()
  return result
}
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : invalid() }
function cycle(value: unknown): MonitoringCycle {
  const v = record(value)
  return { id: text(v.id), status: choice(v.status, ['RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED']), startedAt: date(v.startedAt) ?? invalid(), finishedAt: date(v.finishedAt), processedCount: count(v.processedCount), failedCount: count(v.failedCount) }
}
async function request(request: AuthenticatedRequest, path: string, init: RequestInit): Promise<unknown> {
  const response = await request(`${base}/monitoring/${path}`, init)
  if (!response.ok) throw new MonitoringError(response.status)
  return response.json()
}
export async function getMonitoringHealth(fetch: AuthenticatedRequest, signal: AbortSignal): Promise<MonitoringHealth> {
  const v = record(await request(fetch, 'health', { signal }))
  const sources = array(v.sources).map(value => {
    const s = record(value)
    return { integration: choice(s.integration, ['services', 'metrics', 'carbon-factor']), status: choice(s.status, ['UNKNOWN', 'DEGRADED', 'RECOVERING', 'RECOVERED']), lastAttemptAt: date(s.lastAttemptAt), lastSuccessAt: date(s.lastSuccessAt), lastFailureAt: date(s.lastFailureAt), openIncidentCount: count(s.openIncidentCount) }
  })
  if (new Set(sources.map(s => s.integration)).size !== sources.length || count(v.intervalSeconds) === 0) return invalid()
  return { state: choice(v.state, ['ACTIVE', 'PAUSED', 'UNAVAILABLE']), paused: v.paused === null ? null : boolean(v.paused), schedulerRunning: boolean(v.schedulerRunning), intervalSeconds: count(v.intervalSeconds), knownApplications: count(v.knownApplications), staleApplications: count(v.staleApplications), lastObservationAt: date(v.lastObservationAt), latestCycle: v.latestCycle === null ? null : cycle(v.latestCycle), sources }
}
export async function setMonitoringPaused(fetch: AuthenticatedRequest, paused: boolean, reason: string, signal: AbortSignal): Promise<void> {
  const v = record(await request(fetch, 'control', { signal, method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paused, reason }) }))
  if (boolean(v.paused) !== paused) return invalid()
  boolean(v.changed)
  if (!date(v.updatedAt)) return invalid()
}
export async function getMonitoringAudit(fetch: AuthenticatedRequest, query: URLSearchParams, signal: AbortSignal): Promise<AuditPage> {
  const v = record(await request(fetch, `audit?${query}`, { signal }))
  const items = array(v.items).map(value => {
    const a = record(value)
    return { id: text(a.id), actor: text(a.actor), actorLabel: nullableText(a.actorLabel), createdAt: date(a.createdAt) ?? invalid(), action: text(a.action), entityType: text(a.entityType), entityId: text(a.entityId), before: a.before === null ? null : record(a.before), after: a.after === null ? null : record(a.after), reason: nullableText(a.reason), outcome: choice(a.outcome, ['success', 'denied', 'failed']) }
  })
  const p = record(v.pagination)
  const page = count(p.page)
  const pageSize = p.pageSize === 'all' ? 'all' : count(p.pageSize)
  if (!page || (pageSize !== 'all' && ![5, 10, 15, 20].includes(pageSize)) || new Set(items.map(a => a.id)).size !== items.length) return invalid()
  return { items, pagination: { page, pageSize, totalItems: count(p.totalItems), totalPages: count(p.totalPages), hasNextPage: boolean(p.hasNextPage) } }
}
