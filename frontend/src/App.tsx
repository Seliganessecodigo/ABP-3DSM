import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { selectCatalog, type ApplicationState, type CatalogEntry } from './features/applications/catalog.ts'

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
const states: Array<{ value: State | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'UNAVAILABLE', label: 'Indisponível' },
  { value: 'NO_METRICS', label: 'Sem métricas' },
  { value: 'REMOVED', label: 'Removida' },
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
function formatDate(value: string | null) {
  if (!value) return 'Sem observação'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
}
function stateLabel(state: State) { return states.find((item) => item.value === state)?.label ?? state }

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
  return <div className="app-layout">
    <aside className="sidebar">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}><span>GreenER</span><small>energia mais consciente</small></a>
      <nav aria-label="Navegação principal">
        <p className="nav-heading">Monitoramento</p>
        <button disabled><span aria-hidden="true">▦</span> <span>Dashboard</span></button>
        <a href="/" aria-label="Aplicações" aria-current={detail ? undefined : 'page'} className={!detail ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigate('/') }}>◉ <span>Aplicações</span></a>
        <button disabled><span aria-hidden="true">◷</span> <span>Histórico</span></button>
        <p className="nav-heading">Análise</p>
        <button disabled><span aria-hidden="true">♧</span> <span>Ranking</span></button>
        <button disabled><span aria-hidden="true">⇄</span> <span>Comparação</span></button>
        <button disabled><span aria-hidden="true">◎</span> <span>Simulação regional</span></button>
        <p className="nav-heading">Sistema</p>
        <button disabled><span aria-hidden="true">▤</span> <span>Metodologia</span></button>
        <button disabled><span aria-hidden="true">⚙</span> <span>Configurações</span></button>
      </nav>
      <div className="sidebar-foot">Monitoramento ambiental</div>
    </aside>
    <div className="workspace"><header className="topbar"><span>GreenER · Monitoramento</span><div aria-label="Conta e notificações"><span aria-hidden="true">♧</span><span className="avatar">ER</span></div></header>{children}</div>
  </div>
}

function Catalog({ navigate }: { navigate: (url: string) => void }) {
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
      <div className="page-heading"><div><p className="eyebrow">Monitoramento</p><h1>Aplicações</h1><p>Catálogo das aplicações monitoradas e sua situação atual.</p></div>
        <button className="button secondary" onClick={() => { if (!refreshing) { setLoading(false); setRefreshing(true); setError(false); setAttempt((current) => current + 1) } }} disabled={refreshing}>↻ Atualizar catálogo</button></div>
      <label className="search-wrap"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar aplicações por nome, identificador ou região" placeholder="Buscar por nome, identificador ou região..." value={search} onChange={(event) => updateSearch(event.target.value)} /></label>
      <div className="filters" aria-label="Filtrar aplicações por estado">{states.map(({ value, label }) => <button key={value} className={selectedState === value ? 'filter active' : 'filter'} aria-pressed={selectedState === value} onClick={() => { setSelectedState(value); setPage(1) }}>{label} ({counts[value]})</button>)}</div>
      {loading && <p className="notice" role="status">Carregando aplicações...</p>}
        {error && <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><h2>Não foi possível consultar o catálogo</h2><p>{hasSnapshot ? 'Exibindo os últimos dados válidos; eles podem estar desatualizados.' : 'Isso não significa que as aplicações foram removidas.'}</p><button className="button" onClick={() => { setLoading(!hasSnapshot); setRefreshing(hasSnapshot); setError(false); setAttempt((current) => current + 1) }}>Tentar novamente</button></div></div>}
      {!loading && hasSnapshot && <>
        {applications.length === 0 ? <section className="empty-state"><h2>Nenhuma aplicação reconhecida</h2><p>O catálogo ainda não possui aplicações.</p></section> : result.total === 0 ? <section className="empty-state"><h2>Nenhuma aplicação corresponde à busca</h2><p>Revise o termo ou os filtros selecionados.</p></section> : <>
          <div className="table-wrap"><table><thead><tr><th scope="col">Aplicação</th><th scope="col">País</th><th scope="col">Região</th><th scope="col">Cidade</th><th scope="col">Estado</th><th scope="col">Última verificação</th><th scope="col">Ações</th></tr></thead><tbody>
            {result.items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small className="identifier">{item.id}</small></td><td>{item.location?.country ?? '—'}</td><td>{item.location?.region ?? '—'}</td><td>{item.location ? item.location.city ?? 'Não informada' : 'Localização não informada'}</td><td><span className={`state-badge state-${item.state.toLowerCase()}`}><span aria-hidden="true">{item.state === 'AVAILABLE' ? '✓' : item.state === 'UNAVAILABLE' ? '×' : item.state === 'NO_METRICS' ? '!' : '▣'}</span>{stateLabel(item.state)}</span></td><td>{formatDate(item.lastCheckedAt)}</td><td><a className="detail-link" href={`/services/${encodeURIComponent(item.id)}${window.location.search}`} onClick={(event) => { event.preventDefault(); navigate(`/services/${encodeURIComponent(item.id)}${window.location.search}`) }}>Ver detalhes <span aria-hidden="true">→</span></a></td></tr>)}
          </tbody></table></div>
          <div className="pagination"><span>{result.total} aplicação(ões) · Página {result.page} de {result.pageCount}</span><div><button aria-label="Página anterior" className="button page-button" disabled={result.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Anterior</button><button aria-label="Próxima página" className="button page-button" disabled={result.page >= result.pageCount} onClick={() => setPage((current) => current + 1)}>Próxima →</button></div></div>
        </>}
      </>}
      <div className="below-panels"><section className="selection-panel"><span className="panel-icon" aria-hidden="true">◎</span><div><h2>Nenhuma aplicação selecionada</h2><p>Selecione uma aplicação na lista para ver detalhes, métricas e histórico.</p></div></section>
        {!error && <section className="info-panel"><span className="info-icon" aria-hidden="true">i</span><div><h2>Catálogo atualizado</h2><p>Os estados das aplicações são apresentados com texto e indicadores visuais.</p></div></section>}</div>
    </main>
  </Shell>
}

function Detail({ id, navigate }: { id: string; navigate: (url: string) => void }) {
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
    <a className="back-link" href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>← Voltar ao catálogo</a>
    {loading && <p className="notice" role="status">Carregando aplicação...</p>}
    {notFound && <section className="empty-state"><h1>Aplicação não encontrada</h1><p>Este identificador não está disponível no catálogo.</p></section>}
    {error && <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div><h1>Não foi possível consultar esta aplicação</h1><p>A consulta falhou. Tente novamente.</p><button className="button" onClick={() => { setLoading(true); setError(false); setAttempt((current) => current + 1) }}>Tentar novamente</button></div></div>}
    {application && <><div className="page-heading detail-heading"><div><p className="eyebrow">Aplicação monitorada</p><h1>{application.name}</h1><p className="identifier">{application.id}</p></div><span className={`state-badge state-${application.state.toLowerCase()}`}>{stateLabel(application.state)}</span></div>
      <section className="detail-card"><h2>Identificação e situação</h2><dl><div><dt>Identificador</dt><dd>{application.id}</dd></div><div><dt>Estado</dt><dd>{stateLabel(application.state)}</dd></div><div><dt>Primeira observação</dt><dd>{formatDate(application.firstSeenAt)}</dd></div><div><dt>Última verificação</dt><dd>{formatDate(application.lastCheckedAt)}</dd></div>{application.removedAt && <div><dt>Removida em</dt><dd>{formatDate(application.removedAt)}</dd></div>}</dl></section>
      <section className="detail-card"><h2>Localização</h2>{application.location ? <dl><div><dt>Código regional</dt><dd>{application.location.regionCode}</dd></div><div><dt>País</dt><dd>{application.location.country}</dd></div><div><dt>Região</dt><dd>{application.location.region}</dd></div><div><dt>Cidade</dt><dd>{application.location.city ?? 'Não informada'}</dd></div><div><dt>Latitude</dt><dd>{application.location.latitude.toLocaleString('pt-BR')}</dd></div><div><dt>Longitude</dt><dd>{application.location.longitude.toLocaleString('pt-BR')}</dd></div></dl> : <p>Localização não informada.</p>}</section>
    </>}
  </main></Shell>
}

function App() {
  const { route, navigate } = useRoute()
  return route.kind === 'detail' ? <Detail key={route.id} id={route.id} navigate={navigate} /> : <Catalog key="catalog" navigate={navigate} />
}

export default App
