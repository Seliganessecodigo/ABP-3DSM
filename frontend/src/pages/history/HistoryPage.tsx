import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '../../components/LoadingState.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { useCatalog } from '../catalog/useCatalog.ts'
import { ApplicationDetailPage } from '../detail/ApplicationDetailPage.tsx'
import styles from './HistoryPage.module.css'

function applicationIdFromLocation() {
  return new URLSearchParams(window.location.search).get('applicationId') ?? ''
}

export function HistoryPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t: tCommon } = useTranslation('common')
  const { t: tCatalog } = useTranslation('catalog')
  const { t: tDetail } = useTranslation('detail')
  const { applications, hasSnapshot, loading, error, retry } = useCatalog()
  const [selectedId, setSelectedId] = useState(applicationIdFromLocation)

  useEffect(() => {
    const syncSelection = () => setSelectedId(applicationIdFromLocation())
    window.addEventListener('popstate', syncSelection)
    return () => window.removeEventListener('popstate', syncSelection)
  }, [])

  const selectApplication = (id: string) => {
    setSelectedId(id)
    const params = new URLSearchParams(window.location.search)
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
    <select value={selectedId} onChange={(event) => selectApplication(event.target.value)}>
      <option value="">{tCatalog('app')}</option>
      {applications.map((application) => <option key={application.id} value={application.id}>
        {application.name} · {application.id}
      </option>)}
    </select>
  </label>
  if (selectedApplication) return <ApplicationDetailPage key={selectedApplication.id} id={selectedApplication.id}
    navigate={navigate} historyOnly historyApplicationSelector={applicationSelector} />
  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className={styles.heading}>
      <h1>{tDetail('historyTitle')}</h1>
      <p>{tDetail('historyDescription')}</p>
    </header>
    <section className={styles.selector} aria-label={tCatalog('app')}>
      {applicationSelector}
      {applications.length === 0 && <p>{tCatalog('empty')}</p>}
    </section>
    {selectedId && !loading && hasSnapshot && <RequestFeedback state="empty"><p>{tCatalog('noResults')}</p></RequestFeedback>}
  </main>
}
