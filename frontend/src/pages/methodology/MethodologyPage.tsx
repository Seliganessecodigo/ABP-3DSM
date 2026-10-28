import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../components/ActionButton.tsx'
import { RecordedMethodology } from './RecordedMethodology.tsx'
import { MethodologyExplanation } from './MethodologyExplanation.tsx'
import { MethodologyPreview } from './MethodologyPreview.tsx'
import { preferenceTabs, usePreferenceDraft } from './usePreferenceDraft.ts'
import styles from './Preferences.module.css'
import { useAuthentication } from '../../app/useAuthentication.ts'

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
    return tab === 'analysis' ? `${t('days', { count: Number(value.period) })} • ${t(value.granularity)}` : tab === 'coverage'
      ? t('activeCoverage', { value: number(value.value), status: t(value.enabled ? 'enabled' : 'disabled') })
      : t('activeLimit', { value: number(value.value), unit })
  }
  const active = state.active[tab]
  const activeText = state.loadState === 'loading' ? t('loadingPreferences') : state.loadState === 'error' ? t('activeUnavailable') : active ? preferenceText(active.draft) : t(state.authenticated ? 'noPreference' : 'signInActive')
  const activeSummary = active && (tab === 'energy' || tab === 'emissions') ? `${number(active.draft.value)} ${unit}` : activeText
  const savingUnavailable = <p className={styles.saveError} role="alert">{saveError ? t(saveError) : ''}</p>
  const save = () => { if (form.current?.reportValidity()) void state.save() }
  return <main className={styles.page} tabIndex={-1}>
    <header className={styles.heading}><p className={styles.eyebrow}>{common('nav.system')}</p><h1>{t('title')}</h1><p>{t('description')}</p></header>
    <div className={styles.tabRow}>
      <div ref={tabList} className={styles.tabs} role="tablist" aria-label={t('individual')} onKeyDown={(event) => {
        const index = preferenceTabs.indexOf(tab)
        const next = event.key === 'ArrowRight' ? (index + 1) % 4 : event.key === 'ArrowLeft' ? (index + 3) % 4 : event.key === 'Home' ? 0 : event.key === 'End' ? 3 : null
        if (next === null) return
        event.preventDefault(); state.switchTab(preferenceTabs[next])
        if (!dirty) tabList.current?.querySelector<HTMLButtonElement>(`#tab-${preferenceTabs[next]}`)?.focus()
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
          <fieldset disabled={saving || state.loadState !== 'ready'} className={styles.formFields}>
          {(tab === 'energy' || tab === 'emissions') && <>
            <label>{t('scope')}<select><option>{t('perApplication')}</option></select></label>
            <div className={styles.fields}><label>{t('limitEditing')}<input type="number" min="0" step="any" required value={draft.value} onChange={(event) => state.update({ value: event.target.value })} /></label><label>{t('unit')}<select value={unit} onChange={() => {}}><option>{unit}</option></select></label></div>
            <label>{t('referencePeriod')}<select><option>{t('monthly')}</option></select></label>
            <label className={styles.toggle}><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => state.update({ enabled: event.target.checked })} /><span aria-hidden="true" />{t('highlight')}</label>
          </>}
          {tab === 'coverage' && <>
            <label>{t('referenceEditing')}<div className={styles.coverageField}><div><input type="number" min="0" max="100" step="any" required value={draft.value} onChange={(event) => state.update({ value: event.target.value })} /><span>%</span></div>{dirty && <span className={styles.badge}>{t('editing')}</span>}</div></label>
            <label className={styles.toggle}><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => state.update({ enabled: event.target.checked })} /><span aria-hidden="true" />{t('coverageToggle')}</label>
            <p className={styles.formNote}>{t('coverageNote')}</p>
          </>}
          {tab === 'analysis' && <>
            <label>{t('periodEditing')}<select value={draft.period} onChange={(event) => state.update({ period: event.target.value === '7' ? '7' : '30' })}><option value="7">{t('days', { count: 7 })}</option><option value="30">{t('days', { count: 30 })}</option></select></label>
            <label>{t('granularityEditing')}<select value={draft.granularity} onChange={(event) => state.update({ granularity: event.target.value === 'hour' ? 'hour' : 'day' })}><option value="hour">{t('hour')}</option><option value="day">{t('day')}</option></select></label>
            <p className={styles.editNote}>{dirty && <span className={styles.badge}>{t('editing')}</span>}{t('previewFollows')}</p>
          </>}
          </fieldset>
          {!valid && <p className={styles.saveError} role="alert">{t('invalidValue')}</p>}
        </form>
      </section>
      <MethodologyPreview tab={tab} drafts={state.drafts} />
    </div>
    <footer className={styles.footer}><div><strong>{t(`tabs.${tab}`)} • {t(dirty ? 'unsaved' : state.saved ? 'saved' : active ? 'upToDate' : 'exampleState')}</strong><p>{t('saveNote')}</p></div><div className={styles.actions}><ActionButton appearance="secondary" onClick={state.cancel} disabled={!dirty || saving}>{t('cancel')}</ActionButton><ActionButton onClick={save} pending={saving} disabled={!valid || state.loadState !== 'ready'}>{t(saving ? 'saving' : 'save')}</ActionButton></div></footer>
    {saveError && !pendingTab && savingUnavailable}
    {state.saved && <p role="status">{t('saved')}</p>}
    <details className={styles.recorded} onToggle={(event) => setRecordedOpen(event.currentTarget.open)}><summary>{t('recorded')}</summary>{recordedOpen && <RecordedMethodology id={null} navigate={navigate} />}</details>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="pending-title" aria-describedby="pending-description" onCancel={(event) => { event.preventDefault(); state.continueEditing() }}>
      <h2 id="pending-title">{t('pendingTitle')}</h2><p id="pending-description">{t('pendingDescription', { from: t(`tabs.${tab}`), to: pendingTab ? t(`tabs.${pendingTab}`) : '' })}</p>
      <div className={styles.summary}><strong>{t(`summaryTitle.${tab}`)}</strong><p>{t('pendingValue', { active: activeSummary, value: preferenceText(draft) })}</p></div>
      {saveError && savingUnavailable}
      <div className={styles.actions}><ActionButton appearance="secondary" onClick={state.continueEditing} disabled={saving}>{t('continueEditing')}</ActionButton><ActionButton appearance="secondary" onClick={state.discardAndSwitch} disabled={saving}>{t('discardSwitch')}</ActionButton><ActionButton onClick={save} pending={saving} disabled={!valid}>{t('saveSwitch')}</ActionButton></div>
    </dialog>
  </main>
}
