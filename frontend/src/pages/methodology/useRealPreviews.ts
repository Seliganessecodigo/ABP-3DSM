import { useEffect, useState } from 'react'
import { alertPreviewInput, previewPersonalAlerts, type PersonalAlerts } from '../../features/preferences/alerts.ts'
import { draftPeriod, type PreferenceDraft, type PreferenceTab } from '../../features/preferences/api.ts'
import { getEnvironmentalSummary, type EnvironmentalSummary } from '../../features/analysis/environmentalSummary.ts'
import { validPreferencePeriod } from '../../features/preferences/period.ts'

export function useAlertPreview(drafts: Record<PreferenceTab, PreferenceDraft>, includedTabs: readonly PreferenceTab[]) {
  let input: unknown = null
  try {
    if ((['energy', 'emissions', 'coverage'] as const).every(tab => !includedTabs.includes(tab) || drafts[tab].value.trim() !== '' && Number.isFinite(Number(drafts[tab].value)) && Number(drafts[tab].value) >= 0 && (tab !== 'coverage' || Number(drafts[tab].value) <= 100))) input = alertPreviewInput(drafts, includedTabs)
  } catch { /* Incomplete dates stay in the editor until valid. */ }
  const key = input === null ? null : JSON.stringify(input)
  const [state, setState] = useState<{ key: string; data: PersonalAlerts | null; error: boolean } | null>(null)
  useEffect(() => {
    if (key === null) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void previewPersonalAlerts(JSON.parse(key), controller.signal).then(data => {
        if (!controller.signal.aborted) setState({ key, data, error: false })
      }).catch(() => { if (!controller.signal.aborted) setState({ key, data: null, error: true }) })
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [key])
  const current = state?.key === key ? state : null
  return { valid: key !== null, data: current?.data ?? null, loading: key !== null && !current, error: current?.error ?? false }
}
export function useAnalysisPreview(draft: PreferenceDraft) {
  const period = draftPeriod('analysis', draft)
  const valid = validPreferencePeriod(period)
  const key = JSON.stringify([period, draft.granularity])
  const [state, setState] = useState<{ key: string; data: EnvironmentalSummary | null; error: boolean } | null>(null)
  const kind = period.kind, from = period.from, to = period.to, granularity = draft.granularity
  useEffect(() => {
    if (!valid) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void getEnvironmentalSummary({ period: kind, anchor: new Date().toISOString(), state: null, regionCode: '', granularity,
        ...(kind === 'custom' && from && to ? { range: { from, to } } : {}) }, controller.signal).then(data => {
        if (!controller.signal.aborted) setState({ key, data, error: false })
      }).catch(() => { if (!controller.signal.aborted) setState({ key, data: null, error: true }) })
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [key, valid, kind, from, to, granularity])
  const current = state?.key === key ? state : null
  return { valid, data: current?.data ?? null, loading: valid && !current, error: current?.error ?? false }
}
