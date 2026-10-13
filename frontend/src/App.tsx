import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { selectCatalog, type ApplicationState, type CatalogEntry } from './features/applications/catalog.ts'
import { useTranslation } from 'react-i18next'
import { localeNames, supportedLocales, type Locale } from './i18n.ts'

type State = ApplicationState
interface LocationDto { regionCode: string; country: string; region: string; city: string | null; latitude: number; longitude: number }
interface Application extends CatalogEntry {
  location: LocationDto | null
  firstSeenAt: string
  lastCheckedAt: string | null
  removedAt: string | null
  updatedAt: string
}
type Route = { kind: 'catalog' } | { kind: 'detail'; id: string }
const states: Array<{ value: State | 'ALL' }> = [
  { value: 'ALL' }, { value: 'AVAILABLE' }, { value: 'UNAVAILABLE' }, { value: 'NO_METRICS' }, { value: 'REMOVED' },
]
const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '')
const endpoint = (id?: string) => `${apiBase ?? '/api'}/applications${id === undefined ? '' : `/${encodeURIComponent(id)}`}`

function routeFromLocation(): Route {
  const match = window.location.pathname.match(/^\/services\/(.+)$/)
  if (!match) return { kind: 'catalog' }
  try { return { kind: 'detail', id: decodeURIComponent(match[1]) } } catch { return { kind: 'detail', id: match[1] } }
}
function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const state = params.get('state') as State | null
  return {
    search: params.get('q') ?? '',
    state: states.some((option) => option.value === state) ? state as State : 'ALL' as const,
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}
function makeUrl(query: { search: string; state: State | 'ALL'; page: number }) {
  const params = new URLSearchParams(window.location.search)
  for (const key of ['q', 'state', 'page']) params.delete(key)
  if (query.search) params.set('q', query.search)
  if (query.state !== 'ALL') params.set('state', query.state)
  if (query.page > 1) params.set('page', String(query.page))
  const queryString = params.toString()
  return `/${queryString ? `?${queryString}` : ''}`
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function parseApplication(value: unknown): Application {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name ||
    !['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'].includes(String(value.state)) ||
    !isDate(value.firstSeenAt) || !isDate(value.updatedAt) ||
    !(value.lastCheckedAt === null || isDate(value.lastCheckedAt)) || !(value.removedAt === null || isDate(value.removedAt))) {
    throw new Error('Resposta incompatível com o catálogo')
  }
  let location: LocationDto | null = null
  if (value.location !== null) {
    const raw = value.location
    if (!isRecord(raw) || !['regionCode', 'country', 'region'].every((key) => typeof raw[key] === 'string') ||
      !(raw.city === null || typeof raw.city === 'string') || typeof raw.latitude !== 'number' || !Number.isFinite(raw.latitude) ||
      typeof raw.longitude !== 'number' || !Number.isFinite(raw.longitude)) throw new Error('Localização incompatível com o catálogo')
    location = { regionCode: raw.regionCode as string, country: raw.country as string, region: raw.region as string,
      city: raw.city as string | null, latitude: raw.latitude, longitude: raw.longitude }
  }
  return { id: value.id, name: value.name, state: value.state as State, location,
    firstSeenAt: value.firstSeenAt, lastCheckedAt: value.lastCheckedAt, removedAt: value.removedAt, updatedAt: value.updatedAt }
}
function readCachedCatalog(): Application[] | null {
  try {
    const cached: unknown = JSON.parse(window.sessionStorage.getItem('greener:applications') ?? 'null')
    return Array.isArray(cached) ? cached.map(parseApplication) : null
  } catch { return null }
}
async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    let code = ''
    try { const error: unknown = await response.json(); if (isRecord(error) && typeof error.code === 'string') code = error.code } catch { /* resposta sem JSON */ }
    const failure = new Error(`HTTP ${response.status}`) as Error & { status: number; code: string }
    failure.status = response.status; failure.code = code
    throw failure
  }
  return response.json() as Promise<unknown>
}
function formatDate(value: string | null, locale: string, noObservation: string) {
  if (!value) return noObservation
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
}
function stateLabel(state: State | 'ALL', t: (key: string) => string) { return t(`state.${state}`) }

function LanguageSelector() {
  const { i18n, t } = useTranslation('common')
  return <label className="language-control"><span>{t('language.label')}</span><select aria-label={t('language.label')} value={i18n.resolvedLanguage} onChange={(event) => void i18n.changeLanguage(event.target.value as Locale)}>{supportedLocales.map((locale) => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
}

function useRoute() {
  const [route, setRoute] = useState<Route>(routeFromLocation)
  useEffect(() => {
    const handlePopState = () => setRoute(routeFromLocation())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const navigate = useCallback((url: string) => {
    window.history.pushState({}, '', url)
    setRoute(routeFromLocation())
  }, [])
  return { route, navigate }
}

function Shell({ children, navigate, detail = false }: { children: React.ReactNode; navigate: (url: string) => void; detail?: boolean }) {
  const { t } = useTranslation('common')
  return <div className="app-layout">
    <aside className="sidebar">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}><span>GreenER</span><small>{t('app.tagline')}</small></a>
      <nav aria-label={t('nav.main')}>
        <p className="nav-heading">{t('nav.monitoring')}</p>
        <button disabled><span aria-hidden="true">▦</span> <span>{t('nav.dashboard')}</span></button>
        <a href="/" aria-label={t('nav.applications')} aria-current={detail ? undefined : 'page'} className={!detail ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigate('/') }}>◉ <span>{t('nav.applications')}</span></a>
        <button disabled><span aria-hidden="true">◷</span> <span>{t('nav.history')}</span></button>
        <p className="nav-heading">{t('nav.analysis')}</p>
        <button disabled><span aria-hidden="true">♧</span> <span>{t('nav.ranking')}</span></button>
        <button disabled><span aria-hidden="true">⇄</span> <span>{t('nav.comparison')}</span></button>
        <button disabled><span aria-hidden="true">◎</span> <span>{t('nav.regionalSimulation')}</span></button>
        <p className="nav-heading">{t('nav.system')}</p>
        <button disabled><span aria-hidden="true">▤</span> <span>{t('nav.methodology')}</span></button>
        <button disabled><span aria-hidden="true">⚙</span> <span>{t('nav.settings')}</span></button>
      </nav>
      <div className="sidebar-foot">{t('nav.environment')}</div>
    </aside>
    <div className="workspace"><header className="topbar"><span>{t('topbar')}</span><div className="topbar-actions"><LanguageSelector /><span className="avatar" aria-label={t('account')}>ER</span></div></header>{children}</div>
  </div>
}

function Catalog({ navigate }: { navigate: (url: string) => void }) {
  const { t: tCatalog, i18n } = useTranslation('catalog')
  const { t: tCommon } = useTranslation('common')
  const initial = useMemo(() => readQuery(), [])
  const [search, setSearch] = useState(initial.search)
  const [selectedState, setSelectedState] = useState<State | 'ALL'>(initial.state)
  const [page, setPage] = useState(initial.page)
  const [applications, setApplications] = useState<Application[]>(() => readCachedCatalog() ?? [])
  const [hasSnapshot, setHasSnapshot] = useState(() => readCachedCatalog() !== null)
  const [loading, setLoading] = useState(() => readCachedCatalog() === null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const query = useMemo(() => ({ search, state: selectedState, page, pageSize: 10 }), [search, selectedState, page])
  const result = useMemo(() => selectCatalog(applications, query), [applications, query])
  useEffect(() => {
    const url = makeUrl(query)
    if (`${window.location.pathname}${window.location.search}` !== url) window.history.replaceState({}, '', url)
  }, [query])
  useEffect(() => {
    const controller = new AbortController()
    getJson(endpoint(), controller.signal).then((payload) => {
      if (!Array.isArray(payload)) throw new Error('Coleção de aplicações inválida')
      const parsed = payload.map(parseApplication)
      window.sessionStorage.setItem('greener:applications', JSON.stringify(parsed))
      setApplications(parsed); setHasSnapshot(true); setError(false)
    }).catch(() => {
      if (!controller.signal.aborted) setError(true)
    }).finally(() => {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false) }
    })
    return () => controller.abort()
  }, [attempt])
  const counts = useMemo(() => Object.fromEntries(states.map(({ value }) => [value,
    value === 'ALL' ? applications.length : applications.filter((item) => item.state === value).length])) as Record<State | 'ALL', number>, [applications])
  const updateSearch = (value: string) => { setSearch(value); setPage(1) }
  return <Shell navigate={navigate}>
    <main className="content">
      <div className="page-heading"><div><p className="eyebrow">{tCatalog('eyebrow')}</p><h1>{tCatalog('title')}</h1><p>{tCatalog('description')}</p></div>
        <button className="button secondary" onClick={() => { if (!refreshing) { setLoading(false); setRefreshing(true); setError(false); setAttempt((current) => current + 1) } }} disabled={refreshing}>↻ {tCatalog('refresh')}</button></div>
      <label className="search-wrap"><span aria-hidden="true">⌕</span><input type="search" aria-label={tCatalog('searchLabel')} placeholder={tCatalog('searchPlaceholder')} value={search} onChange={(event) => updateSearch(event.target.value)} /></label>
      <div className="filters" aria-label={tCatalog('filterLabel')}>{states.map(({ value }) => <button key={value} className={selectedState === value ? 'filter active' : 'filter'} aria-pressed={selectedState === value} onClick={() => { setSelectedState(value); setPage(1) }}>{stateLabel(value, tCommon)} ({counts[value]})</button>)}</div>
      {loading && <p className="notice" role="status">{tCatalog('loading')}</p>}
      {error && <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><h2>{tCatalog('errorTitle')}</h2><p>{hasSnapshot ? tCatalog('stale') : tCatalog('errorNotRemoved')}</p><button className="button" onClick={() => { setLoading(!hasSnapshot); setRefreshing(hasSnapshot); setError(false); setAttempt((current) => current + 1) }}>{tCommon('actions.retry')}</button></div></div>}
      {!loading && hasSnapshot && <>
        {applications.length === 0 ? <section className="empty-state"><h2>{tCatalog('emptyTitle')}</h2><p>{tCatalog('empty')}</p></section> : result.total === 0 ? <section className="empty-state"><h2>{tCatalog('noResults')}</h2><p>{tCatalog('adjustFilters')}</p></section> : <>
          <div className="table-wrap"><table><thead><tr><th scope="col">{tCatalog('app')}</th><th scope="col">{tCommon('location.country')}</th><th scope="col">{tCommon('location.region')}</th><th scope="col">{tCommon('location.city')}</th><th scope="col">{tCommon('state.label')}</th><th scope="col">{tCommon('date.lastCheck')}</th><th scope="col">{tCatalog('actions')}</th></tr></thead><tbody>
            {result.items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small className="identifier">{item.id}</small></td><td>{item.location?.country ?? '—'}</td><td>{item.location?.region ?? '—'}</td><td>{item.location ? item.location.city ?? tCommon('location.cityUnknown') : tCommon('location.unknown')}</td><td><span className={`state-badge state-${item.state.toLowerCase()}`}><span aria-hidden="true">{item.state === 'AVAILABLE' ? '✓' : item.state === 'UNAVAILABLE' ? '×' : item.state === 'NO_METRICS' ? '!' : '□'}</span>{stateLabel(item.state, tCommon)}</span></td><td>{formatDate(item.lastCheckedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</td><td><a className="detail-link" href={`/services/${encodeURIComponent(item.id)}${window.location.search}`} onClick={(event) => { event.preventDefault(); navigate(`/services/${encodeURIComponent(item.id)}${window.location.search}`) }}>{tCatalog('details')} <span aria-hidden="true">→</span></a></td></tr>)}
          </tbody></table></div>
          <div className="pagination"><span>{tCatalog('total', { count: result.total })} · {tCatalog('page', { page: result.page, count: result.pageCount })}</span><div><button aria-label={tCatalog('previousAria')} className="button page-button" disabled={result.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← {tCatalog('previous')}</button><button aria-label={tCatalog('nextAria')} className="button page-button" disabled={result.page >= result.pageCount} onClick={() => setPage((current) => current + 1)}>{tCatalog('next')} →</button></div></div>
        </>}
      </>}
      <div className="below-panels"><section className="selection-panel"><span className="panel-icon" aria-hidden="true">◉</span><div><h2>{tCatalog('noneSelected')}</h2><p>{tCatalog('selectHint')}</p></div></section>
        {!error && <section className="info-panel"><span className="info-icon" aria-hidden="true">i</span><div><h2>{tCatalog('updated')}</h2><p>{tCatalog('stateHint')}</p></div></section>}</div>
    </main>
  </Shell>
}

function Detail({ id, navigate }: { id: string; navigate: (url: string) => void }) {
  const { t: tDetail, i18n } = useTranslation('detail')
  const { t: tCommon } = useTranslation('common')
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const backUrl = `/${window.location.search}`
  useEffect(() => {
    const controller = new AbortController()
    getJson(endpoint(id), controller.signal).then((payload) => setApplication(parseApplication(payload))).catch((failure: unknown) => {
      if (controller.signal.aborted) return
      const status = isRecord(failure) && typeof failure.status === 'number' ? failure.status : 0
      const code = isRecord(failure) && typeof failure.code === 'string' ? failure.code : ''
      if (status === 404 || code === 'APPLICATION_NOT_FOUND') setNotFound(true)
      else setError(true)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id, attempt])
  return <Shell navigate={navigate} detail><main className="content detail-content">
    <a className="back-link" href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>← {tDetail('back')}</a>
    {loading && <p className="notice" role="status">{tDetail('loading')}</p>}
    {notFound && <section className="empty-state"><h1>{tDetail('notFound')}</h1><p>{tDetail('notFoundHint')}</p></section>}
    {error && <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><h1>{tDetail('error')}</h1><p>{tDetail('errorHint')}</p><button className="button" onClick={() => { setLoading(true); setError(false); setAttempt((current) => current + 1) }}>{tCommon('actions.retry')}</button></div></div>}
    {application && <><div className="page-heading detail-heading"><div><p className="eyebrow">{tDetail('eyebrow')}</p><h1>{application.name}</h1><p className="identifier">{application.id}</p></div><span className={`state-badge state-${application.state.toLowerCase()}`}>{stateLabel(application.state, tCommon)}</span></div>
      <section className="detail-card"><h2>{tDetail('identity')}</h2><dl><div><dt>{tDetail('id')}</dt><dd>{application.id}</dd></div><div><dt>{tCommon('state.label')}</dt><dd>{stateLabel(application.state, tCommon)}</dd></div><div><dt>{tDetail('firstSeen')}</dt><dd>{formatDate(application.firstSeenAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div>{application.removedAt && <div><dt>{tDetail('removedAt')}</dt><dd>{formatDate(application.removedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</dd></div>}</dl></section>
      <section className="detail-card"><h2>{tDetail('location')}</h2>{application.location ? <dl><div><dt>{tDetail('regionCode')}</dt><dd>{application.location.regionCode}</dd></div><div><dt>{tCommon('location.country')}</dt><dd>{application.location.country}</dd></div><div><dt>{tCommon('location.region')}</dt><dd>{application.location.region}</dd></div><div><dt>{tCommon('location.city')}</dt><dd>{application.location.city ?? tCommon('location.cityUnknown')}</dd></div><div><dt>{tDetail('latitude')}</dt><dd>{application.location.latitude.toLocaleString(i18n.resolvedLanguage)}</dd></div><div><dt>{tDetail('longitude')}</dt><dd>{application.location.longitude.toLocaleString(i18n.resolvedLanguage)}</dd></div></dl> : <p>{tCommon('location.unknown')}</p>}</section>
    </>}
  </main></Shell>
}

function App() {
  const { route, navigate } = useRoute()
  return route.kind === 'detail' ? <Detail key={route.id} id={route.id} navigate={navigate} /> : <Catalog key="catalog" navigate={navigate} />
}

export default App
