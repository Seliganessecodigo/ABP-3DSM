import { readPreferencePeriod, type PreferencePeriod } from './period.ts'
export const preferenceTabs = ['energy', 'emissions', 'coverage', 'analysis'] as const
export type PreferenceTab = typeof preferenceTabs[number]
export type PreferenceDraft = { value: string; enabled: boolean; period: '7' | '30'; granularity: 'hour' | 'day'; evaluationPeriod?: PreferencePeriod }
export type SavedPreference = { revision: number; updatedAt: string; draft: PreferenceDraft }
export type Preferences = Record<PreferenceTab, SavedPreference | null>
export type AuthenticatedFetch = (url: string, init?: RequestInit) => Promise<Response>
export const emptyPreferences: Preferences = { energy: null, emissions: null, coverage: null, analysis: null }
export function draftPeriod(tab: PreferenceTab, draft: PreferenceDraft): PreferencePeriod {
  return draft.evaluationPeriod ?? { kind: tab === 'analysis' ? draft.period === '30' ? '30d' : '7d' : 'month' }
}
let apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
while (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1)
export class PreferenceError extends Error {
  readonly status: number
  constructor(status: number) { super(`Preferences HTTP ${status}`); this.status = status }
}
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function numeric(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 }
function parse(tab: PreferenceTab, value: unknown): SavedPreference {
  if (!record(value) || !Number.isSafeInteger(value.revision) || typeof value.revision !== 'number' || value.revision < 1 || typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt)) || !record(value.value)) throw new Error('Invalid preference response')
  return { revision: value.revision, updatedAt: value.updatedAt, draft: parseDraft(tab, value.value) }
}
function parseDraft(tab: PreferenceTab, data: Record<string, unknown>): PreferenceDraft {
  const evaluationPeriod = data.period === undefined ? undefined : readPreferencePeriod(data.period)
  if (tab === 'analysis') {
    if (!evaluationPeriod && data.periodDays !== 7 && data.periodDays !== 30 || data.granularity !== 'hour' && data.granularity !== 'day') throw new Error('Invalid analysis preference')
    return { value: '', enabled: true, period: data.periodDays === 30 ? '30' : '7', granularity: data.granularity, ...(evaluationPeriod ? { evaluationPeriod } : {}) }
  }
  const threshold = tab === 'coverage' ? data.thresholdPercent : data.threshold
  if (!numeric(threshold) || tab === 'coverage' && threshold > 100 || typeof data.alertsEnabled !== 'boolean' || tab !== 'coverage' && (data.scope !== 'application' || !evaluationPeriod && data.referencePeriod !== 'month' || data.unit !== (tab === 'energy' ? 'kWh' : 'kgCO2e'))) throw new Error('Invalid limit preference')
  return { value: String(threshold), enabled: data.alertsEnabled, period: '7', granularity: 'hour', ...(evaluationPeriod ? { evaluationPeriod } : {}) }
}
export async function getPreferences(request: AuthenticatedFetch, signal: AbortSignal): Promise<Preferences> {
  const response = await request(`${apiBase}/me/preferences`, { signal })
  if (!response.ok) throw new PreferenceError(response.status)
  const value: unknown = await response.json()
  if (!record(value)) throw new Error('Invalid preferences response')
  const result = { ...emptyPreferences }
  for (const tab of preferenceTabs) result[tab] = value[tab] === null ? null : parse(tab, value[tab])
  return result
}
export async function savePreference(request: AuthenticatedFetch, tab: PreferenceTab, draft: PreferenceDraft, expectedRevision: number, signal: AbortSignal): Promise<SavedPreference> {
  const value = preferenceValue(tab, draft)
  const response = await request(`${apiBase}/me/preferences/${tab}`, { method: 'PUT', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision, value }) })
  if (!response.ok) throw new PreferenceError(response.status)
  return parse(tab, await response.json())
}
export function preferenceValue(tab: PreferenceTab, draft: PreferenceDraft) {
  if (draft.evaluationPeriod) {
    const period = readPreferencePeriod(draft.evaluationPeriod)
    if (tab === 'analysis') return { period, granularity: draft.granularity }
    if (tab === 'coverage') return { period, thresholdPercent: Number(draft.value), alertsEnabled: draft.enabled }
    return { period, threshold: Number(draft.value), alertsEnabled: draft.enabled, scope: 'application', unit: tab === 'energy' ? 'kWh' : 'kgCO2e' }
  }
  if (tab === 'analysis') return { periodDays: Number(draft.period), granularity: draft.granularity }
  if (tab === 'coverage') return { thresholdPercent: Number(draft.value), alertsEnabled: draft.enabled }
  return { threshold: Number(draft.value), alertsEnabled: draft.enabled, scope: 'application', referencePeriod: 'month', unit: tab === 'energy' ? 'kWh' : 'kgCO2e' }
}
