import { CardIcon } from '../../components/CardIcon.tsx'
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { Breadcrumbs } from '../../components/Breadcrumbs.tsx'
import { PageHelp } from '../../components/PageHelp.tsx'
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
  const { t, i18n } = useTranslation('history')
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
        <Breadcrumbs navigate={navigate} items={[{ label: tCommon('nav.applications'), href: '/applications' }, { label: tCommon('nav.history') }]} />
        <div className="heading-title"><h1>{tDetail('historyTitle')}</h1><PageHelp steps={[
  { title: tCatalog('app'), description: tDetail('helpHistoryFilters'), target: '[data-help="history-selector"]' },
  { title: t('applicationsTitle'), description: tDetail('historyDescription'), target: '[aria-labelledby="history-applications-heading"]' },
]} /></div>
      </div>
    </header>
    <section data-help="history-selector" className={styles.selector} aria-label={tCatalog('app')}>
      <div className={styles.controls}>
        {applicationSelector}
        <PeriodSelector compact select selected={selectedPeriod}
          onSelect={(period) => navigate(urlWithPeriod(window.location.pathname, window.location.search, period))}
          title={tDetail('periodTitle')} invalidMessage={tDetail('periodInvalid')}
          options={periods.map((value) => ({ value, label: tDetail(`periods.${value}`) }))} />
      </div>
    </section>
    {error && hasSnapshot && <RequestFeedback state="error"><p>{tCatalog('stale')}</p><button type="button" onClick={retry}>{tCommon('actions.retry')}</button></RequestFeedback>}
    {applications.length === 0 && <RequestFeedback state="empty"><h2>{tCatalog('emptyTitle')}</h2><p>{tCatalog('empty')}</p></RequestFeedback>}
    {applications.length > 0 && <section className={styles.applications} aria-labelledby="history-applications-heading">
      <h2 id="history-applications-heading"><CardIcon icon={faClockRotateLeft} size="small" inline />{t('applicationsTitle')}<span className={styles.applicationCount}>{new Intl.NumberFormat(i18n.resolvedLanguage ?? 'pt-BR').format(applications.length)}</span></h2>
      <div className={styles.applicationList}>{applications.map((application) => <button type="button" key={application.id}
        className={styles.applicationRow} onClick={() => selectApplication(application.id)}>
        <span className={styles.applicationIdentity}><span className={styles.applicationName}>{application.name}</span><span className={styles.applicationId}>{application.id}</span></span>
        <span className={styles.applicationLocation}>{application.location ? [application.location.country, application.location.region].join(' · ') : tCommon('location.unknown')}</span>
        <span className={styles.applicationState}><span className={`state-badge state-${application.state.toLowerCase()}`} aria-label={t('currentState', { state: stateLabel(application.state, tCommon) })}>{stateLabel(application.state, tCommon)}</span></span>
        <span className={styles.applicationAction}>{t('openHistory')}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg></span>
      </button>)}</div>
    </section>}
    {selectedId && !loading && hasSnapshot && <RequestFeedback state="empty"><p>{tCatalog('noResults')}</p></RequestFeedback>}
  </main>
}
