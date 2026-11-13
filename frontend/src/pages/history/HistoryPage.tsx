import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '../../components/LoadingState.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { useApplicationCatalog } from '../../features/applications/useApplicationCatalog.ts'
import { ApplicationDetailPage } from '../detail/ApplicationDetailPage.tsx'
import { PeriodSelector } from '../detail/PeriodSelector.tsx'
import { periodPresets, readPeriodSelection, urlWithPeriod } from '../../features/analysis/periodContext.ts'
import { stateLabel } from '../../features/applications/presentation.ts'
import styles from './HistoryPage.module.css'

function applicationIdFromLocation() {
  return new URLSearchParams(window.location.search).get('applicationId') ?? ''
}

export function HistoryPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t: tCommon } = useTranslation('common')
  const { t: tCatalog } = useTranslation('catalog')
  const { t: tDetail } = useTranslation('detail')
  const { t } = useTranslation('history')
  const { applications, hasSnapshot, loading, error, retry } = useApplicationCatalog()
  const [selectedId, setSelectedId] = useState(applicationIdFromLocation)
  const selectedPeriod = readPeriodSelection(window.location.search)
  const periods = selectedPeriod === 'month' || selectedPeriod === 'custom' ? [...periodPresets, selectedPeriod] : periodPresets

  useEffect(() => {
    const syncSelection = () => setSelectedId(applicationIdFromLocation())
    window.addEventListener('popstate', syncSelection)
    return () => window.removeEventListener('popstate', syncSelection)
  }, [])

  const selectApplication = (id: string) => {
    setSelectedId(id)
    const params = new URLSearchParams(window.location.search)
    for (const key of ['inspectionBucket', 'collectionId', 'seriesPage']) params.delete(key)
    if (id) params.set('applicationId', id)
    else params.delete('applicationId')
    if (!params.has('period')) params.set('period', '7d')
    if (!params.has('granularity')) params.set('granularity', 'day')
    if (!params.has('seriesTimeZone')) params.set('seriesTimeZone', 'America/Sao_Paulo')
    navigate(`${window.location.pathname}?${params.toString()}`)
  }

  if (loading && !hasSnapshot) return <LoadingState title={tCatalog('loading')} layout="detail" />
  if (error && !hasSnapshot) return <RequestFeedback state="error">
    <h1>{tCatalog('errorTitle')}</h1>
    <button type="button" onClick={retry}>{tCommon('actions.retry')}</button>
  </RequestFeedback>

  const selectedApplication = applications.find(({ id }) => id === selectedId)
  const applicationSelector = <label className={styles.applicationFilter}>
    {tCatalog('app')}
    <select className="form-control" value={selectedId} onChange={(event) => selectApplication(event.target.value)}>
      <option value="">{t('selectApplication')}</option>
      {applications.map((application) => <option key={application.id} value={application.id}>
        {application.name} · {application.id}
      </option>)}
    </select>
  </label>
  if (selectedApplication) return <ApplicationDetailPage key={selectedApplication.id} id={selectedApplication.id}
    navigate={navigate} historyOnly historyApplicationSelector={applicationSelector} />
  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className="page-heading">
      <div>
        <p className="eyebrow">{tCatalog('eyebrow')}</p>
        <h1>{tDetail('historyTitle')}</h1>
        <p>{tDetail('historyDescription')}</p>
      </div>
    </header>
    <section className={styles.selector} aria-label={tCatalog('app')}>
      <div className={styles.intro}>
        <span className={styles.historyIcon} aria-hidden="true">↶</span>
        <div><p className={styles.eyebrow}>{t('eyebrow')}</p><h2>{t('startTitle')}</h2><p>{t('startDescription')}</p></div>
      </div>
      <div className={styles.controls}>
        {applicationSelector}
        <PeriodSelector compact select selected={selectedPeriod}
          onSelect={(period) => navigate(urlWithPeriod(window.location.pathname, window.location.search, period))}
          title={tDetail('periodTitle')} invalidMessage={tDetail('periodInvalid')}
          options={periods.map((value) => ({ value, label: tDetail(`periods.${value}`) }))} />
      </div>
      <ul className={styles.capabilities}>
        <li>{t('evolution')}</li><li>{t('events')}</li><li>{t('evidence')}</li>
      </ul>
    </section>
    {error && hasSnapshot && <RequestFeedback state="error"><p>{tCatalog('stale')}</p><button type="button" onClick={retry}>{tCommon('actions.retry')}</button></RequestFeedback>}
    {applications.length === 0 && <RequestFeedback state="empty"><h2>{tCatalog('emptyTitle')}</h2><p>{tCatalog('empty')}</p></RequestFeedback>}
    {applications.length > 0 && <section className={styles.applications} aria-labelledby="history-applications-heading">
      <h2 id="history-applications-heading">{t('applicationsTitle')}</h2>
      <div className={styles.applicationGrid}>{applications.map((application) => <button type="button" key={application.id}
        className={styles.applicationCard} onClick={() => selectApplication(application.id)}>
        <span className={styles.applicationName}>{application.name}<span aria-hidden="true">↗</span></span>
        <span className={styles.applicationId}>{application.id}</span>
        <span>{application.location ? [application.location.country, application.location.region].join(' · ') : tCommon('location.unknown')}</span>
        <span className={styles.applicationAction}>{t('openHistory')}<small>{t('currentState', { state: stateLabel(application.state, tCommon) })}</small></span>
      </button>)}</div>
    </section>}
    {selectedId && !loading && hasSnapshot && <RequestFeedback state="empty"><p>{tCatalog('noResults')}</p></RequestFeedback>}
  </main>
}
