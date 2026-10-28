import { useEffect, useRef, useState } from 'react'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { emptyPreferences, getPreferences, PreferenceError, savePreference, type PreferenceDraft, type Preferences, type PreferenceTab } from '../../features/preferences/api.ts'
export { preferenceTabs, type PreferenceTab, type PreferenceDraft } from '../../features/preferences/api.ts'

// Examples only seed the preview; they are never active preferences.
const examples: Record<PreferenceTab, PreferenceDraft> = {
  energy: { value: '8', enabled: true, period: '7', granularity: 'hour' },
  emissions: { value: '1.5', enabled: true, period: '7', granularity: 'hour' },
  coverage: { value: '85', enabled: true, period: '7', granularity: 'hour' },
  analysis: { value: '', enabled: true, period: '7', granularity: 'hour' },
}
function draftValues(preferences: Preferences) {
  return { energy: preferences.energy?.draft ?? examples.energy, emissions: preferences.emissions?.draft ?? examples.emissions, coverage: preferences.coverage?.draft ?? examples.coverage, analysis: preferences.analysis?.draft ?? examples.analysis }
}

export function usePreferenceDraft() {
  const { user, authenticatedFetch } = useAuthentication()
  const [tab, setTab] = useState<PreferenceTab>('energy')
  const [drafts, setDrafts] = useState(examples)
  const [active, setActive] = useState<Preferences>(emptyPreferences)
  const [loadedUser, setLoadedUser] = useState<string | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(user ? 'loading' : 'ready')
  const [attempt, setAttempt] = useState(0)
  const [pendingTab, setPendingTab] = useState<PreferenceTab | null>(null)
  const [saveError, setSaveError] = useState<'signIn' | 'conflict' | 'saveUnavailable' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveController = useRef<AbortController | null>(null)
  const conflictDetected = useRef(false)
  const draft = drafts[tab]
  const dirty = JSON.stringify(draft) !== JSON.stringify(active[tab]?.draft ?? examples[tab])
  const numericValue = draft.value.trim() === '' ? null : Number(draft.value)
  const valid = tab === 'analysis' || numericValue !== null && Number.isFinite(numericValue) && numericValue >= 0 && (tab !== 'coverage' || numericValue <= 100)
  const currentUser = user?.id ?? null

  useEffect(() => {
    const controller = new AbortController()
    if (!currentUser) return
    void getPreferences(authenticatedFetch, controller.signal).then((preferences) => {
      if (controller.signal.aborted) return
      setActive(preferences); setDrafts(draftValues(preferences)); setLoadedUser(currentUser); setLoadState('ready')
    }).catch(() => { if (!controller.signal.aborted) setLoadState('error') })
    return () => { controller.abort(); saveController.current?.abort() }
  }, [currentUser, authenticatedFetch, attempt])

  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  function update(patch: Partial<PreferenceDraft>) { setDrafts((current) => ({ ...current, [tab]: { ...current[tab], ...patch } })); setSaveError(null); setSaved(false) }
  function cancel() {
    setDrafts((current) => ({ ...current, [tab]: active[tab]?.draft ?? examples[tab] })); setSaveError(null); setSaved(false)
    if (conflictDetected.current) { conflictDetected.current = false; setLoadState('loading'); setAttempt((value) => value + 1) }
  }
  function switchTab(next: PreferenceTab) {
    if (next === tab || saving) return
    if (dirty) setPendingTab(next)
    else { setTab(next); setSaveError(null); setSaved(false) }
  }
  function discardAndSwitch() { if (!pendingTab || saving) return; cancel(); setTab(pendingTab); setPendingTab(null) }
  async function save() {
    if (!valid || saving) return
    if (!user) { setSaveError('signIn'); return }
    if (loadedUser !== user.id || loadState !== 'ready') { setSaveError('saveUnavailable'); return }
    const controller = new AbortController()
    saveController.current = controller
    setSaving(true); setSaveError(null); setSaved(false)
    try {
      const result = await savePreference(authenticatedFetch, tab, draft, active[tab]?.revision ?? 0, controller.signal)
      if (controller.signal.aborted) return
      setActive((current) => ({ ...current, [tab]: result })); setDrafts((current) => ({ ...current, [tab]: result.draft })); setSaved(true)
      if (pendingTab) { setTab(pendingTab); setPendingTab(null) }
    } catch (error) {
      if (error instanceof PreferenceError && error.status === 409) conflictDetected.current = true
      if (!controller.signal.aborted) setSaveError(error instanceof PreferenceError && error.status === 409 ? 'conflict' : error instanceof PreferenceError && error.status === 401 ? 'signIn' : 'saveUnavailable')
    } finally { if (!controller.signal.aborted) setSaving(false) }
  }
  return { tab, draft, drafts, active, dirty, valid, pendingTab, saveError, saving, saved, loadState, authenticated: !!user, update, cancel, switchTab, discardAndSwitch, save, retry: () => { setLoadState('loading'); setAttempt((value) => value + 1) }, continueEditing: () => { if (!saving) { setPendingTab(null); setSaveError(null) } } }
}
