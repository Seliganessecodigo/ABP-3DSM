import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../components/ActionButton.tsx'
import { RecordedMethodology } from './RecordedMethodology.tsx'
import { MethodologyExplanation } from './MethodologyExplanation.tsx'
import { MethodologyPreview } from './MethodologyPreview.tsx'
import { preferenceTabs, usePreferenceDraft, type PreferenceTab } from './usePreferenceDraft.ts'
import { PreferenceFields } from './PreferenceFields.tsx'
import styles from './Preferences.module.css'
import { useAuthentication } from '../../app/useAuthentication.ts'

function nextTabForKey(key: string, tab: PreferenceTab) {
  const index = preferenceTabs.indexOf(tab)
  switch (key) {
    case 'ArrowRight': return preferenceTabs[(index + 1) % 4]
    case 'ArrowLeft': return preferenceTabs[(index + 3) % 4]
    case 'Home': return preferenceTabs[0]
    case 'End': return preferenceTabs[3]
    default: return null
  }
}

export function MethodologyPage({ id, navigate }: Readonly<{ id: string | null; navigate: (url: string) => void }>) {
  const { user } = useAuthentication()
  return id ? <main tabIndex={-1}><RecordedMethodology id={id} navigate={navigate} /></main> : <MethodologyPreferences key={user?.id ?? 'public'} navigate={navigate} />
}

function MethodologyPreferences({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const [recordedOpen, setRecordedOpen] = useState(false)
  const { t: common } = useTranslation('common')
  const state = usePreferenceDraft()
  const { tab, draft, dirty, valid, pendingTab, saveError, saving } = state
  const dialog = useRef<HTMLDialogElement>(null)
  const tabList = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!pendingTab) return
    const activeTab = tabList.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    const element = dialog.current
    element?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { element?.close(); document.body.style.overflow = previousOverflow; activeTab?.focus() }
  }, [pendingTab])
  const unit = tab === 'energy' ? 'kWh' : 'kg CO₂e'
  const number = (value: string) => new Intl.NumberFormat(i18n.resolvedLanguage ?? 'pt-BR', { maximumFractionDigits: 6 }).format(Number(value))
  function preferenceText(value: typeof draft) {
    if (tab === 'analysis') return `${t('days', { count: Number(value.period) })} • ${t(value.granularity)}`
    if (tab === 'coverage') return t('activeCoverage', { value: number(value.value), status: t(value.enabled ? 'enabled' : 'disabled') })
    return t('activeLimit', { value: number(value.value), unit })
  }
  const active = state.active[tab]
  function activePreferenceText() {
    if (state.loadState === 'loading') return t('loadingPreferences')
    if (state.loadState === 'error') return t('activeUnavailable')
    if (active) return preferenceText(active.draft)
    return t(state.authenticated ? 'noPreference' : 'signInActive')
  }
  const activeText = activePreferenceText()
  let statusKey = 'exampleState'
  if (active) statusKey = 'upToDate'
  if (state.saved) statusKey = 'saved'
  if (dirty) statusKey = 'unsaved'
  const activeSummary = active && (tab === 'energy' || tab === 'emissions') ? `${number(active.draft.value)} ${unit}` : activeText
  const savingUnavailable = <p className={styles.saveError} role="alert">{saveError ? t(saveError) : ''}</p>
  const save = () => { if (form.current?.reportValidity()) void state.save() }
  return <main className={styles.page} tabIndex={-1}>
    <header className={styles.heading}><p className={styles.eyebrow}>{common('nav.system')}</p><h1>{t('title')}</h1><p>{t('description')}</p></header>
    <div className={styles.tabRow}>
      <div ref={tabList} className={styles.tabs} role="tablist" tabIndex={-1} aria-label={t('individual')} onKeyDown={(event) => {
        const next = nextTabForKey(event.key, tab)
        if (next === null) return
        event.preventDefault(); state.switchTab(next)
        if (!dirty) tabList.current?.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus()
      }}>{preferenceTabs.map((item) => <button key={item} id={`tab-${item}`} type="button" role="tab" tabIndex={tab === item ? 0 : -1} aria-selected={tab === item} aria-controls="preference-panel" onClick={() => state.switchTab(item)}>{t(`tabs.${item}`)}</button>)}</div>
      <span>{t('individual')}</span>
    </div>
    <div id="preference-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className={styles.columns}>
      <MethodologyExplanation tab={tab} />
      <section className={`${styles.card} ${tab === 'energy' || tab === 'emissions' ? styles.limitCard : ''}`} aria-labelledby="edit-title">
        <p className={styles.step}>{t('stepEdit')}</p><h2 id="edit-title">{t(`${tab}.editTitle`)}</h2><p className={styles.intro}>{t(`${tab}.editDescription`)}</p>
        <div className={styles.activePreference}><span>{t('active')}</span><strong>{activeText}</strong></div>
        {state.loadState === 'error' && <div role="alert"><p>{t('loadError')}</p><ActionButton appearance="secondary" onClick={state.retry}>{common('actions.retry')}</ActionButton></div>}
        <form ref={form} onSubmit={(event) => { event.preventDefault(); save() }}>
          <PreferenceFields tab={tab} draft={draft} dirty={dirty} disabled={saving || state.loadState !== 'ready'} onUpdate={state.update} />
          {!valid && <p className={styles.saveError} role="alert">{t('invalidValue')}</p>}
        </form>
      </section>
      <MethodologyPreview tab={tab} drafts={state.drafts} />
    </div>
    <footer className={styles.footer}><div><strong>{t(`tabs.${tab}`)} • {t(statusKey)}</strong><p>{t('saveNote')}</p></div><div className={styles.actions}><ActionButton appearance="secondary" onClick={state.cancel} disabled={!dirty || saving}>{t('cancel')}</ActionButton><ActionButton onClick={save} pending={saving} disabled={!valid || state.loadState !== 'ready' || !!active && !dirty}>{t(saving ? 'saving' : 'save')}</ActionButton></div></footer>
    {saveError && !pendingTab && savingUnavailable}
    {state.saved && <output>{t('saved')}</output>}
    <details className={styles.recorded} onToggle={(event) => setRecordedOpen(event.currentTarget.open)}><summary>{t('recorded')}</summary>{recordedOpen && <RecordedMethodology id={null} navigate={navigate} />}</details>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="pending-title" aria-describedby="pending-description" onCancel={(event) => { event.preventDefault(); state.continueEditing() }}>
      <h2 id="pending-title">{t('pendingTitle')}</h2><p id="pending-description">{t('pendingDescription', { from: t(`tabs.${tab}`), to: pendingTab ? t(`tabs.${pendingTab}`) : '' })}</p>
      <div className={styles.summary}><strong>{t(`summaryTitle.${tab}`)}</strong><p>{t('pendingValue', { active: activeSummary, value: preferenceText(draft) })}</p></div>
      {saveError && savingUnavailable}
      <div className={styles.actions}><ActionButton appearance="secondary" onClick={state.continueEditing} disabled={saving}>{t('continueEditing')}</ActionButton><ActionButton appearance="secondary" onClick={state.discardAndSwitch} disabled={saving}>{t('discardSwitch')}</ActionButton><ActionButton onClick={save} pending={saving} disabled={!valid}>{t('saveSwitch')}</ActionButton></div>
    </dialog>
  </main>
}
