import styles from './ApplicationDetailPage.module.css'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/formatDate.ts'
import { reasonLabel, stateLabel } from '../../features/applications/presentation.ts'
import { useApplicationDetail } from './useApplicationDetail.ts'

export function ApplicationDetailPage({ id, navigate }: Readonly<{ id: string; navigate: (url: string) => void }>) {
  const { t: tDetail, i18n } = useTranslation('detail')
  const { t: tCommon } = useTranslation('common')
  const { application, loading, notFound, error, retry } = useApplicationDetail(id)
  const backUrl = `/${window.location.search}`
  return <main className={`content ${styles['detail-content']}`}>
    <a className={styles['back-link']} href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>← {tDetail('back')}</a>
    {loading && <output className="notice">{tDetail('loading')}</output>}
    {notFound && <section className="empty-state"><h1>{tDetail('notFound')}</h1><p>{tDetail('notFoundHint')}</p></section>}
    {error && <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><h1>{tDetail('error')}</h1><p>{tDetail('errorHint')}</p><button className="button" onClick={retry}>{tCommon('actions.retry')}</button></div></div>}
    {application && <><div className={`page-heading ${styles['detail-heading']}`}><div><p className="eyebrow">{tDetail('eyebrow')}</p><h1>{application.name}</h1><p className="identifier">{application.id}</p></div><span className={`state-badge state-${application.state.toLowerCase()}`}>{stateLabel(application.state, tCommon)}</span></div>
      <section className={styles['detail-card']}><h2>{tDetail('identity')}</h2><dl><div><dt>{tDetail('id')}</dt><dd>{application.id}</dd></div><div><dt>{tCommon('state.label')}</dt><dd>{stateLabel(application.state, tCommon)}</dd></div><div><dt>{tDetail('firstSeen')}</dt><dd>{formatDate(application.firstSeenAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div>{application.removedAt && <div><dt>{tDetail('removedAt')}</dt><dd>{formatDate(application.removedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div>}</dl></section>
      <section className={styles['detail-card']}><h2>{tDetail('operationalCondition')}</h2><dl><div><dt>{tDetail('reason')}</dt><dd>{reasonLabel(application.reason, tCommon)}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div><div><dt>{tCommon('date.lastObservation')}</dt><dd>{formatDate(application.lastObservationAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div><div><dt>{tDetail('freshness')}</dt><dd>{application.isStale ? tCommon('freshness.stale') : tCommon('freshness.current')}</dd></div><div><dt>{tDetail('calculability')}</dt><dd>{application.isCalculable ? tCommon('calculability.available') : tCommon('calculability.unavailable')}</dd></div></dl></section>
      <section className={styles['detail-card']}><h2>{tDetail('location')}</h2>{application.location ? <dl><div><dt>{tDetail('regionCode')}</dt><dd>{application.location.regionCode}</dd></div><div><dt>{tCommon('location.country')}</dt><dd>{application.location.country}</dd></div><div><dt>{tCommon('location.region')}</dt><dd>{application.location.region}</dd></div><div><dt>{tCommon('location.city')}</dt><dd>{application.location.city ?? tCommon('location.cityUnknown')}</dd></div><div><dt>{tDetail('latitude')}</dt><dd>{application.location.latitude.toLocaleString(i18n.resolvedLanguage)}</dd></div><div><dt>{tDetail('longitude')}</dt><dd>{application.location.longitude.toLocaleString(i18n.resolvedLanguage)}</dd></div></dl> : <p>{tCommon('location.unknown')}</p>}</section>
    </>}
  </main>
}
