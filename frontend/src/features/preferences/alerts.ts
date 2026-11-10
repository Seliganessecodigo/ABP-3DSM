import { preferenceValue, type AuthenticatedFetch, type PreferenceDraft, type PreferenceTab } from './api.ts'
import { readPreferencePeriod, type PreferencePeriod } from './period.ts'

export type PersonalAlert = { metric: 'energy' | 'emissions' | 'energyCoverage' | 'emissionsCoverage'; status: 'exceeded' | 'within' | 'insufficient-data'; value: number | null; threshold: number; unit: 'kWh' | 'kgCO2e' | '%'; coveragePercent: number; period: PreferencePeriod; from: string; to: string }
export type PersonalAlertApplication = { applicationId: string; name: string; evaluations: PersonalAlert[] }
export type PersonalAlerts = { configured: boolean; evaluatedAt: string; applications: PersonalAlertApplication[] }
let base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
while (base.endsWith('/')) base = base.slice(0, -1)
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function numeric(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 }
function parseAlert(value: unknown): PersonalAlert {
  if (!record(value) || (value.metric !== 'energy' && value.metric !== 'emissions' && value.metric !== 'energyCoverage' && value.metric !== 'emissionsCoverage') || (value.status !== 'exceeded' && value.status !== 'within' && value.status !== 'insufficient-data') || (value.value !== null && !numeric(value.value)) || !numeric(value.threshold) || !numeric(value.coveragePercent) || value.coveragePercent > 100 || (value.unit !== 'kWh' && value.unit !== 'kgCO2e' && value.unit !== '%') || typeof value.from !== 'string' || typeof value.to !== 'string' || !Number.isFinite(Date.parse(value.from)) || !Number.isFinite(Date.parse(value.to)) || Date.parse(value.to) <= Date.parse(value.from)) throw new Error('Invalid personal alert')
  return { metric: value.metric, status: value.status, value: value.value, threshold: value.threshold, unit: value.unit, coveragePercent: value.coveragePercent, period: readPreferencePeriod(value.period), from: value.from, to: value.to }
}
export function parsePersonalAlerts(value: unknown): PersonalAlerts {
  if (!record(value) || typeof value.configured !== 'boolean' || typeof value.evaluatedAt !== 'string' || !Number.isFinite(Date.parse(value.evaluatedAt)) || !Array.isArray(value.applications)) throw new Error('Invalid personal alerts response')
  const applications = value.applications.map((item): PersonalAlertApplication => {
    if (!record(item) || typeof item.applicationId !== 'string' || !item.applicationId || typeof item.name !== 'string' || !Array.isArray(item.evaluations)) throw new Error('Invalid alert application')
    return { applicationId: item.applicationId, name: item.name, evaluations: item.evaluations.map(parseAlert) }
  })
  if (new Set(applications.map(item => item.applicationId)).size !== applications.length) throw new Error('Duplicate alert application')
  return { configured: value.configured, evaluatedAt: value.evaluatedAt, applications }
}
export async function getPersonalAlerts(request: AuthenticatedFetch, signal: AbortSignal): Promise<PersonalAlerts> {
  const response = await request(`${base}/me/preferences/alerts`, { signal })
  if (!response.ok) throw new Error(`Personal alerts HTTP ${response.status}`)
  return parsePersonalAlerts(await response.json())
}
export function alertPreviewInput(drafts: Record<PreferenceTab, PreferenceDraft>, includedTabs: readonly PreferenceTab[]) {
  return Object.fromEntries((['energy', 'emissions', 'coverage'] as const).map(tab => [tab, includedTabs.includes(tab) ? preferenceValue(tab, drafts[tab]) : null]))
}
export async function previewPersonalAlerts(input: unknown, signal: AbortSignal): Promise<PersonalAlerts> {
  const response = await fetch(`${base}/me/preferences/alerts/preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal })
  if (!response.ok) throw new Error(`Personal alerts preview HTTP ${response.status}`)
  return parsePersonalAlerts(await response.json())
}
