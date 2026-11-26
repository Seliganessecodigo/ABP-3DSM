import { TableExportButton } from '../../components/TableExportButton.tsx'
import { CardIcon } from '../../components/CardIcon.tsx'
import { faClockRotateLeft, faGaugeHigh, faPlug } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../components/ActionButton.tsx'
import { formatDate } from '../../utils/formatDate.ts'
import { useMonitoring } from './useMonitoring.ts'
import styles from './SettingsPage.module.css'

export function MonitoringSettings() {
  const { t, i18n } = useTranslation('settings')
  const { health, loading, error, reload, saving, saveError, changePaused } = useMonitoring()
  const [confirming, setConfirming] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')
  const [saved, setSaved] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (confirming === null) return
    const element = dialog.current
    const triggerElement = trigger.current
    element?.showModal(); cancel.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { element?.close(); document.body.style.overflow = previous; if (triggerElement?.isConnected) triggerElement.focus(); else document.querySelector<HTMLElement>('main')?.focus() }
  }, [confirming])
  const locale = i18n.resolvedLanguage ?? 'en-US'
  const date = (value: string | null) => formatDate(value, locale, t('unknown'))
  const number = new Intl.NumberFormat(locale)
  return <>
    {loading && <output>{t('loading')}</output>}
    {error && <div role="alert"><p className={styles.error}>{t(error)}</p>{health && <p className={styles.previous}>{t('previousData')}</p>}<ActionButton appearance="secondary" pending={loading} onClick={reload}>{t('retry')}</ActionButton></div>}
    {health && <>
      <section className={styles.section}>
        <div className={styles.row}><div><h2><CardIcon icon={faGaugeHigh} size="small" inline />{t(`state.${health.state}`)}</h2><p>{t('interval', { count: health.intervalSeconds })}</p></div>
          <button ref={trigger} type="button" className="button" disabled={health.paused === null || loading} onClick={() => { setConfirming(!health.paused); setReason(''); setSaved(false) }}>{t(health.paused ? 'resume' : 'pause')}</button>
        </div>
        <dl className={styles.facts}><div><dt>{t('knownApplications')}</dt><dd>{number.format(health.knownApplications)}</dd></div><div><dt>{t('staleApplications')}</dt><dd>{number.format(health.staleApplications)}</dd></div><div><dt>{t('lastObservation')}</dt><dd>{date(health.lastObservationAt)}</dd></div></dl>
      </section>
      <section className={styles.section}><div className={styles.row}><div><h2><CardIcon icon={faPlug} size="small" inline />{t('integrations')}</h2><p>{t('refreshNote')}</p></div><ActionButton appearance="secondary" pending={loading} onClick={reload}>{t('refresh')}</ActionButton></div>
        {!health.sources.length && <p>{t('noSources')}</p>}
        <div className={styles.sources}>{health.sources.map(source => <div className={styles.source} key={source.integration}>
          <strong>{t(`source.${source.integration}`)}</strong><span>{t(`sourceState.${source.status}`)}</span><div><p>{t('lastAttempt')}: {date(source.lastAttemptAt)}</p><p>{t('lastSuccess')}: {date(source.lastSuccessAt)}</p><p>{t('lastFailure')}: {date(source.lastFailureAt)}</p><p>{t('openIncidents', { count: source.openIncidentCount })}</p></div>
        </div>)}</div>
      </section>
      <section className={styles.section}><h2><CardIcon icon={faClockRotateLeft} size="small" inline />{t('latestCycle')}</h2>{health.latestCycle ? <><TableExportButton tableId="monitoring-cycle" /><div className={styles.tableScroll}><table id="monitoring-cycle" className={styles.table}><thead><tr>{['startedAt', 'result', 'processed', 'failures'].map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody><tr><td>{date(health.latestCycle.startedAt)}</td><td>{t(`cycle.${health.latestCycle.status}`)}</td><td data-export-number={health.latestCycle.processedCount}>{number.format(health.latestCycle.processedCount)}</td><td data-export-number={health.latestCycle.failedCount}>{number.format(health.latestCycle.failedCount)}</td></tr></tbody></table></div></> : <p>{t('noCycles')}</p>}</section>
    </>}
    {saved && <output>{t('saved')}</output>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="monitoring-confirmation-title" onCancel={e => { e.preventDefault(); if (!saving) setConfirming(null) }}>
      <form onSubmit={e => { e.preventDefault(); if (confirming !== null && reason.trim()) void changePaused(confirming, reason.trim()).then(ok => { if (ok) { setConfirming(null); setSaved(true) } }) }}>
        <h2 id="monitoring-confirmation-title">{t(confirming ? 'pauseTitle' : 'resumeTitle')}</h2><p>{t(confirming ? 'pauseDescription' : 'resumeDescription')}</p>
        <label>{t('reason')}<textarea placeholder={t('reason')} className="form-control" maxLength={512} required value={reason} disabled={saving} onChange={e => setReason(e.target.value)} /></label>
        {saveError && <p className={styles.error} role="alert">{t(saveError)}</p>}
        <div className={styles.actions}><button ref={cancel} type="button" className="button secondary" disabled={saving} onClick={() => setConfirming(null)}>{t('cancel')}</button><ActionButton type="submit" pending={saving} disabled={!reason.trim()}>{t('confirm')}</ActionButton></div>
      </form>
    </dialog>
  </>
}
