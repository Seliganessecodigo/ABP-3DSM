import styles from './CatalogPage.module.css'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { selectCatalog, type ApplicationState as State } from '../../features/applications/catalog.ts'
import { reasonLabel, stateLabel, stateIcons } from '../../features/applications/presentation.ts'
import { formatDate } from '../../utils/formatDate.ts'
import { readQuery, makeUrl, states } from './query.ts'
import { useCatalog } from './useCatalog.ts'

const catalogReturnKey = 'greener:catalog-return'

export function CatalogPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t: tCatalog, i18n } = useTranslation('catalog')
  const { t: tCommon } = useTranslation('common')
  const initial = useMemo(() => readQuery(), [])
  const [search, setSearch] = useState(initial.search)
  const [selectedState, setSelectedState] = useState<State | 'ALL'>(initial.state)
  const [regionCode, setRegionCode] = useState(initial.regionCode)
  const [page, setPage] = useState(initial.page)
  const { applications, hasSnapshot, loading, refreshing, error, lastAttemptAt, lastResponseAt, pollingIntervalMs, refresh, retry } = useCatalog()
  const query = useMemo(() => ({ search, state: selectedState, regionCode, page, pageSize: 10 }), [search, selectedState, regionCode, page])
  const result = useMemo(() => selectCatalog(applications, query), [applications, query])
  useEffect(() => {
    const url = makeUrl(query)
    if (`${window.location.pathname}${window.location.search}` !== url) window.history.replaceState({}, '', url)
  }, [query])
  useEffect(() => {
    if (loading || !hasSnapshot) return
    const stored = window.sessionStorage.getItem(catalogReturnKey)
    if (!stored) return
    try {
      const returnState: unknown = JSON.parse(stored)
      if (typeof returnState !== 'object' || returnState === null ||
        !('applicationId' in returnState) || typeof returnState.applicationId !== 'string' ||
        !('scrollY' in returnState) || typeof returnState.scrollY !== 'number' || !Number.isFinite(returnState.scrollY)) return
      const applicationId = returnState.applicationId
      const scrollY = returnState.scrollY
      const link = [...document.querySelectorAll<HTMLAnchorElement>('[data-application-id]')]
        .find((element) => element.dataset.applicationId === applicationId)
      if (!link) return
      window.sessionStorage.removeItem(catalogReturnKey)
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY)
        link.focus({ preventScroll: true })
      })
    } catch {
      window.sessionStorage.removeItem(catalogReturnKey)
    }
  }, [hasSnapshot, loading, result.items])
  const counts = useMemo(() => Object.fromEntries(states.map(({ value }) => [value,
    value === 'ALL' ? applications.length : applications.filter((item) => item.state === value).length])) as Record<State | 'ALL', number>, [applications])
  const updateSearch = (value: string) => { setSearch(value); setPage(1) }
  const regions = useMemo(() => [...new Set(applications.map((application) => application.location?.regionCode).filter((value): value is string => Boolean(value)))].sort(new Intl.Collator(i18n.resolvedLanguage).compare), [applications, i18n.resolvedLanguage])
  return <main className="content" tabIndex={-1}>
      <div className="page-heading"><div><p className="eyebrow">{tCatalog('eyebrow')}</p><h1>{tCatalog('title')}</h1><p>{tCatalog('description')}</p></div>
        <button className="button secondary" onClick={refresh} disabled={refreshing || loading}>↻ {tCatalog('refresh')}</button></div>
      <label className={styles['search-wrap']}><span aria-hidden="true">⌕</span><input type="search" aria-label={tCatalog('searchLabel')} placeholder={tCatalog('searchPlaceholder')} value={search} onChange={(event) => updateSearch(event.target.value)} /></label>
      <label className={styles['region-filter']}>{tCatalog('regionFilter')}<select aria-label={tCatalog('regionFilter')} value={regionCode} onChange={(event) => { setRegionCode(event.target.value); setPage(1) }}><option value="">{tCatalog('allRegions')}</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
      <div className={styles['filters']} aria-label={tCatalog('filterLabel')}>{states.map(({ value }) => <button key={value} className={selectedState === value ? `${styles.filter} ${styles.active}` : styles.filter} aria-pressed={selectedState === value} onClick={() => { setSelectedState(value); setPage(1) }}>{stateLabel(value, tCommon)} ({counts[value]})</button>)}</div>
      {loading && <output className="notice">{tCatalog('loading')}</output>}
      {error && <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><h2>{tCatalog('errorTitle')}</h2><p>{hasSnapshot ? tCatalog('stale') : tCatalog('errorNotRemoved')}</p><button className="button" onClick={retry} disabled={refreshing || loading}>{tCommon('actions.retry')}</button></div></div>}
      {!loading && hasSnapshot && applications.length === 0 && <section className="empty-state"><h2>{tCatalog('emptyTitle')}</h2><p>{tCatalog('empty')}</p></section>}
      {!loading && hasSnapshot && applications.length > 0 && result.total === 0 && <section className="empty-state"><h2>{tCatalog('noResults')}</h2><p>{tCatalog('adjustFilters')}</p></section>}
      {!loading && hasSnapshot && result.total > 0 && <>
          <div className={styles['table-wrap']}><table><thead><tr><th scope="col">{tCatalog('app')}</th><th scope="col">{tCommon('location.country')}</th><th scope="col">{tCommon('location.region')}</th><th scope="col">{tCommon('location.city')}</th><th scope="col">{tCommon('state.label')}</th><th scope="col">{tCommon('date.lastCheck')}</th><th scope="col">{tCatalog('actions')}</th></tr></thead><tbody>
            {result.items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small className="identifier">{item.id}</small></td><td>{item.location?.country ?? '—'}</td><td>{item.location?.region ?? '—'}</td><td>{item.location ? item.location.city ?? tCommon('location.cityUnknown') : tCommon('location.unknown')}</td><td><span className={`state-badge state-${item.state.toLowerCase()}`}><span aria-hidden="true">{stateIcons[item.state]}</span>{stateLabel(item.state, tCommon)}</span><small>{reasonLabel(item.reason, tCommon)}</small><small>{tCommon('date.lastObservation')}: {formatDate(item.lastObservationAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</small>{item.isStale && <small>{tCommon('freshness.stale')}</small>}{!item.isCalculable && <small>{tCommon('calculability.unavailable')}</small>}</td><td>{formatDate(item.lastCheckedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</td><td><a data-application-id={item.id} className={styles['detail-link']} href={`/services/${encodeURIComponent(item.id)}${window.location.search}`} onClick={(event) => { event.preventDefault(); window.sessionStorage.setItem(catalogReturnKey, JSON.stringify({ applicationId: item.id, scrollY: window.scrollY })); navigate(`/services/${encodeURIComponent(item.id)}${window.location.search}`) }}>{tCatalog('details')} <span aria-hidden="true">→</span></a></td></tr>)}
          </tbody></table></div>
          <div className={styles['pagination']}><span>{tCatalog('total', { count: result.total })} · {tCatalog('page', { page: result.page, count: result.pageCount })}</span><div><button aria-label={tCatalog('previousAria')} className={`button ${styles['page-button']}`} disabled={result.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← {tCatalog('previous')}</button><button aria-label={tCatalog('nextAria')} className={`button ${styles['page-button']}`} disabled={result.page >= result.pageCount} onClick={() => setPage((current) => current + 1)}>{tCatalog('next')} →</button></div></div>
      </>}
      <div className={styles['below-panels']}><section className={styles['selection-panel']}><span className={styles['panel-icon']} aria-hidden="true">◉</span><div><h2>{tCatalog('noneSelected')}</h2><p>{tCatalog('selectHint')}</p></div></section>
        <section className={styles['info-panel']}><span className={styles['info-icon']} aria-hidden="true">i</span><div><h2>{tCatalog('refreshHeading')}</h2><p>{tCatalog('refreshStatus', {
          seconds: pollingIntervalMs / 1000,
          lastAttempt: formatDate(lastAttemptAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation')),
          lastResponse: formatDate(lastResponseAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation')),
        })}</p><p>{tCatalog('stateHint')}</p></div></section></div>
  </main>
}
