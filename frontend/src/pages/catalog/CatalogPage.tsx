import styles from './CatalogPage.module.css'
import { ActionButton } from '../../components/ActionButton.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { LoadingState } from '../../components/LoadingState.tsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { selectCatalog, type ApplicationState as State, type CatalogQuery, type CatalogSortColumn } from '../../features/applications/catalog.ts'
import { reasonLabel, stateLabel, stateIcons } from '../../features/applications/presentation.ts'
import { formatDate } from '../../utils/formatDate.ts'
import { readQuery, makeUrl, states } from './query.ts'
import { useCatalog } from './useCatalog.ts'

const catalogReturnKey = 'greener:catalog-return'
const columns: Array<{ key: CatalogSortColumn; label: string; commonLabel?: boolean }> = [
  { key: 'name', label: 'app' }, { key: 'country', label: 'location.country', commonLabel: true }, { key: 'regionCode', label: 'regionCode' },
  { key: 'city', label: 'location.city', commonLabel: true }, { key: 'state', label: 'state.label', commonLabel: true }, { key: 'lastCheckedAt', label: 'date.lastCheck', commonLabel: true },
]
const pageSizes = [5, 10, 15, 20, 'all'] as const

function sortPresentation(sort: CatalogQuery['sort'], column: CatalogSortColumn):
  Readonly<{ ariaSort: 'ascending' | 'descending' | 'none'; indicator: string }> {
  if (sort?.column !== column) return { ariaSort: 'none', indicator: '' }
  if (sort.direction === 'asc') return { ariaSort: 'ascending', indicator: '\u2191' }
  return { ariaSort: 'descending', indicator: '\u2193' }
}

function paginationPages(page: number, pageCount: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const first = page <= 3 ? 2 : page >= pageCount - 2 ? pageCount - 3 : page - 1
  const last = page <= 3 ? 4 : page >= pageCount - 2 ? pageCount - 1 : page + 1
  return [1, ...(first > 2 ? ['ellipsis-start' as const] : []), ...Array.from({ length: last - first + 1 }, (_, index) => first + index), ...(last < pageCount - 1 ? ['ellipsis-end' as const] : []), pageCount]
}

export function CatalogPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t: tCatalog, i18n } = useTranslation('catalog')
  const { t: tCommon } = useTranslation('common')
  const initial = useMemo(() => readQuery(), [])
  const [query, setQuery] = useState(initial)
  const [filtersOpen, setFiltersOpen] = useState(initial.dateRangeInvalid)
  const [dateError, setDateError] = useState(initial.dateRangeInvalid)
  const [draftFilters, setDraftFilters] = useState(initial.filters ?? {})
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterDialogRef = useRef<HTMLElement>(null)
  const { applications, hasSnapshot, loading, refreshing, error, refresh, retry } = useCatalog()
  const presentation = useMemo(() => ({
    locale: i18n.resolvedLanguage ?? 'pt-BR', timeZone: query.timeZone,
    stateLabels: Object.fromEntries(states.filter(({ value }) => value !== 'ALL').map(({ value }) => [value, stateLabel(value, tCommon)])) as Record<State, string>,
  }), [i18n.resolvedLanguage, query.timeZone, tCommon])
  const result = useMemo(() => selectCatalog(applications, query, presentation), [applications, query, presentation])
  const pages = paginationPages(result.page, result.pageCount)
  useEffect(() => {
    const url = makeUrl({ ...query, page: result.page })
    if (`${window.location.pathname}${window.location.search}` !== url) {
      if (query.page !== result.page) window.history.replaceState({}, '', url)
      else window.history.pushState({}, '', url)
    }
  }, [query, result.page])
  useEffect(() => {
    const onPopState = () => {
      const next = readQuery()
      setQuery(next)
      setDraftFilters(next.filters ?? {})
      setDateError(next.dateRangeInvalid)
      if (next.dateRangeInvalid) setFiltersOpen(true)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    if (!filtersOpen) return
    const trigger = filterTriggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    filterDialogRef.current?.querySelector<HTMLInputElement>('input:not([type="checkbox"])')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && filtersOpen) setFiltersOpen(false)
      if (event.key !== 'Tab') return
      const focusable = [...(filterDialogRef.current?.querySelectorAll<HTMLElement>('button, input:not(:disabled), select:not(:disabled)') ?? [])]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [filtersOpen])
  useEffect(() => {
    if (loading || !hasSnapshot) return
    const stored = window.sessionStorage.getItem(catalogReturnKey)
    if (!stored) return
    try {
      const returnState: unknown = JSON.parse(stored)
      if (typeof returnState !== 'object' || returnState === null || !('applicationId' in returnState) || typeof returnState.applicationId !== 'string' || !('scrollY' in returnState) || typeof returnState.scrollY !== 'number' || !Number.isFinite(returnState.scrollY)) return
      const link = [...document.querySelectorAll<HTMLAnchorElement>('[data-application-id]')].find((element) => element.dataset.applicationId === returnState.applicationId)
      if (!link) return
      window.sessionStorage.removeItem(catalogReturnKey)
      requestAnimationFrame(() => { window.scrollTo(0, returnState.scrollY as number); link.focus({ preventScroll: true }) })
    } catch { window.sessionStorage.removeItem(catalogReturnKey) }
  }, [hasSnapshot, loading, result.items])
  const counts = useMemo(() => Object.fromEntries(states.map(({ value }) => [value, value === 'ALL' ? applications.length : applications.filter((item) => item.state === value).length])) as Record<State | 'ALL', number>, [applications])
  const update = (patch: Partial<CatalogQuery>) => setQuery((current) => ({ ...current, ...patch, dateRangeInvalid: false, page: patch.page ?? 1 }))
  const updateFilter = (patch: Partial<NonNullable<CatalogQuery['filters']>>) => setDraftFilters((current) => ({ ...current, ...patch }))
  const toggleSort = (column: CatalogSortColumn) => update({ sort: { column, direction: query.sort?.column === column && query.sort.direction === 'asc' ? 'desc' : 'asc' } })
  const clearFilter = (key: keyof NonNullable<CatalogQuery['filters']>) => {
    update({ filters: { ...query.filters, [key]: key === 'cityIsMissing' ? false : '' } })
    setDraftFilters((current) => ({ ...current, [key]: key === 'cityIsMissing' ? false : '' }))
    setDateError(false)
  }
  const activeFilters = Object.entries(query.filters ?? {}).filter(([key, value]) => key !== 'cityIsMissing' && value && value !== 'ALL' || key === 'cityIsMissing' && value)
  const setDate = (key: 'lastCheckedFrom' | 'lastCheckedTo', value: string) => {
    if (!value) { updateFilter({ [key]: '' }); setDateError(false); return }
    const [date, time] = value.split('T')
    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)
    const desired = Date.UTC(year, month - 1, day, hour, minute)
    const first = new Date(desired)
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: query.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(first)
    const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, Number(part)]))
    const actual = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute)
    const instant = new Date(desired + desired - actual).toISOString()
    const other = key === 'lastCheckedFrom' ? draftFilters.lastCheckedTo : draftFilters.lastCheckedFrom
    if (other && (key === 'lastCheckedFrom' ? Date.parse(instant) > Date.parse(other) : Date.parse(instant) < Date.parse(other))) {
      setDateError(true)
      return
    }
    updateFilter({ [key]: instant })
    setDateError(false)
  }
  const inputDate = (value?: string) => {
    if (!value) return ''
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: query.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value))
    const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
    return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`
  }
  const columnLabel = (column: (typeof columns)[number]) => column.commonLabel ? tCommon(column.label) : tCatalog(column.label)
  const columnSort = (column: CatalogSortColumn) => sortPresentation(query.sort, column)
  const region = (item: (typeof applications)[number]) => item.location?.regionCode ?? tCommon('location.unknown')
  const displayCell = (item: (typeof applications)[number], column: CatalogSortColumn) => {
    if (column === 'name') return <strong>{item.name}</strong>
    if (column === 'country') return item.location?.country ?? tCommon('location.unknown')
    if (column === 'regionCode') return region(item)
    if (column === 'city') return item.location ? item.location.city ?? tCommon('location.cityUnknown') : tCommon('location.unknown')
    if (column === 'lastCheckedAt') return formatDate(item.lastCheckedAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'), query.timeZone)
    return <><details className={styles['state-details']}><summary><span className={`state-badge state-${item.state.toLowerCase()}`}><span aria-hidden="true">{stateIcons[item.state]}</span>{stateLabel(item.state, tCommon)}</span></summary><div className={styles['state-metadata']}><small>{reasonLabel(item.reason, tCommon)}</small><small>{tCommon('date.lastObservation')}: {formatDate(item.lastObservationAt, i18n.resolvedLanguage ?? 'pt-BR', tCommon('date.noObservation'))}</small>{!item.isCalculable && <small>{tCommon('calculability.unavailable')}</small>}</div></details>{item.isStale && <small className={styles['stale-label']}>{tCommon('freshness.stale')}</small>}</>
  }
  const detailLink = (item: (typeof applications)[number]) => <a data-application-id={item.id} className={styles['detail-link']} href={`/services/${encodeURIComponent(item.id)}${window.location.search}`} aria-label={tCatalog('details')} title={tCatalog('details')} onClick={(event) => { event.preventDefault(); window.sessionStorage.setItem(catalogReturnKey, JSON.stringify({ applicationId: item.id, scrollY: window.scrollY })); navigate(`/services/${encodeURIComponent(item.id)}${window.location.search}`) }}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M1.8 10s3-5.2 8.2-5.2 8.2 5.2 8.2 5.2-3 5.2-8.2 5.2S1.8 10 1.8 10Z"/><circle cx="10" cy="10" r="2.4"/></svg><span className={styles['detail-link-text']}>{tCatalog('details')}</span></a>

  return <main className="content" tabIndex={-1}>
    <div className="page-heading"><div><p className="eyebrow">{tCatalog('eyebrow')}</p><h1>{tCatalog('title')}</h1><p>{tCatalog('description')}</p></div><div className={styles['heading-actions']}><ActionButton appearance="secondary" onClick={refresh} pending={refreshing || loading}>{tCatalog('refresh')}</ActionButton><button ref={filterTriggerRef} className={styles['filter-trigger']} aria-expanded={filtersOpen} aria-controls="catalog-column-filters" onClick={() => { setDraftFilters(query.filters ?? {}); setFiltersOpen(true) }}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 4h14l-5.5 6.2v4.4l-3 1.5v-5.9L3 4Z" /></svg>{tCatalog('columnFilters')}</button></div></div>
    <label className={styles['search-wrap']}><span aria-hidden="true">⌕</span><input type="search" aria-label={tCatalog('searchLabel')} placeholder={tCatalog('searchPlaceholder')} value={query.search} onChange={(event) => update({ search: event.target.value })} /></label>
    <div className={styles.filters} aria-label={tCatalog('filterLabel')}>{states.map(({ value }) => <button key={value} className={query.state === value ? `${styles.filter} ${styles.active}` : styles.filter} aria-pressed={query.state === value} onClick={() => update({ state: value })}>{stateLabel(value, tCommon)}{hasSnapshot && ` (${counts[value]})`}</button>)}</div>
    {filtersOpen && <div className={styles['filter-backdrop']} onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false) }}>
      <section ref={filterDialogRef} id="catalog-column-filters" className={styles['filter-dialog']} role="dialog" aria-modal="true" aria-labelledby="catalog-filter-title" aria-describedby="catalog-filter-description">
        <header className={styles['filter-dialog-header']}><div><h2 id="catalog-filter-title">{tCatalog('columnFilters')}</h2><p id="catalog-filter-description">{tCatalog('filterDialogDescription')}</p></div><button className={styles['filter-close']} aria-label={tCatalog('closeFilters')} onClick={() => setFiltersOpen(false)}>×</button></header>
        <div className={styles['filter-grid']}>
          <label>{tCatalog('nameFilter')}<input placeholder={tCatalog('namePlaceholder')} value={draftFilters.name ?? ''} onChange={(event) => updateFilter({ name: event.target.value })} /></label>
          <label>{tCatalog('countryFilter')}<input placeholder={tCatalog('countryPlaceholder')} value={draftFilters.country ?? ''} onChange={(event) => updateFilter({ country: event.target.value })} /></label>
          <label>{tCatalog('regionCodeFilter')}<input placeholder={tCatalog('regionPlaceholder')} value={draftFilters.regionCode ?? ''} onChange={(event) => updateFilter({ regionCode: event.target.value })} /></label>
          <label>{tCatalog('cityFilter')}<input placeholder={tCatalog('cityPlaceholder')} value={draftFilters.city ?? ''} disabled={Boolean(draftFilters.cityIsMissing)} onChange={(event) => updateFilter({ city: event.target.value })} /></label>
          <label>{tCatalog('stateFilter')}<select value={draftFilters.state ?? 'ALL'} onChange={(event) => updateFilter({ state: event.target.value as State | 'ALL' })}>{states.map(({ value }) => <option key={value} value={value}>{stateLabel(value, tCommon)}</option>)}</select></label>
          <label className={styles['missing-city']}><input type="checkbox" checked={Boolean(draftFilters.cityIsMissing)} onChange={(event) => updateFilter({ cityIsMissing: event.target.checked, city: '' })} />{tCatalog('cityMissing')}</label>
          <fieldset className={styles['date-filters']}><legend>{tCatalog('lastCheck')}: {tCatalog('timeZone', { timeZone: query.timeZone })}</legend><label>{tCatalog('from')}<input type="datetime-local" value={inputDate(draftFilters.lastCheckedFrom)} onChange={(event) => setDate('lastCheckedFrom', event.target.value)} /></label><label>{tCatalog('to')}<input type="datetime-local" value={inputDate(draftFilters.lastCheckedTo)} onChange={(event) => setDate('lastCheckedTo', event.target.value)} /></label></fieldset>
        </div>
        {dateError && <p className={styles['date-error']} role="alert">{tCatalog('invalidDateRange')}</p>}
        <p className={styles['filter-note']}>{tCatalog('filterCombinationNote')}<br />{tCatalog('clearPreservesSort')}</p>
        <footer className={styles['filter-dialog-footer']}><button className={styles['clear-button']} onClick={() => { setDraftFilters({}); setDateError(false) }}>{tCatalog('clearFilters')}</button><button className={styles['apply-button']} onClick={() => { if (draftFilters.lastCheckedFrom && draftFilters.lastCheckedTo && Date.parse(draftFilters.lastCheckedFrom) > Date.parse(draftFilters.lastCheckedTo)) { setDateError(true); return } update({ filters: draftFilters }); setDateError(false); setFiltersOpen(false) }}>{tCatalog('applyFilters')}</button></footer>
      </section>
    </div>}
    {(activeFilters.length > 0 || query.search || query.state !== 'ALL') && <div className={styles['active-filters']} aria-label={tCatalog('activeFilters')}>
      {query.search && <button onClick={() => update({ search: '' })}>{tCatalog('searchLabel')}: {query.search} ×</button>}
      {query.state !== 'ALL' && <button onClick={() => update({ state: 'ALL' })}>{tCatalog('stateFilter')}: {stateLabel(query.state, tCommon)} ×</button>}
      {activeFilters.map(([key]) => {
      const labels: Record<string, string> = { name: 'nameFilter', country: 'countryFilter', regionCode: 'regionCodeFilter', city: 'cityFilter', cityIsMissing: 'cityMissing', state: 'stateFilter', lastCheckedFrom: 'from', lastCheckedTo: 'to' }
      return <button key={key} onClick={() => clearFilter(key as keyof NonNullable<CatalogQuery['filters']>)}>{tCatalog(labels[key] ?? key)} ×</button>
    })}<button onClick={() => { setQuery((current) => ({ ...current, search: '', state: 'ALL', filters: {}, dateRangeInvalid: false, page: 1 })); setDraftFilters({}); setDateError(false) }}>{tCatalog('clearFilters')}</button></div>}
    {loading && <LoadingState title={tCatalog('loading')} layout="table" />}
    {!loading && hasSnapshot && refreshing && <LoadingState title={tCatalog('loading')} compact />}
    {error && <RequestFeedback state="error"><h2>{tCatalog('errorTitle')}</h2><p>{hasSnapshot ? tCatalog('stale') : tCatalog('errorNotRemoved')}</p><ActionButton onClick={retry} disabled={refreshing || loading}>{tCommon('actions.retry')}</ActionButton></RequestFeedback>}
    {!loading && hasSnapshot && applications.length === 0 && <RequestFeedback state="empty"><h2>{tCatalog('emptyTitle')}</h2><p>{tCatalog('empty')}</p></RequestFeedback>}
    {!loading && hasSnapshot && applications.length > 0 && result.total === 0 && <RequestFeedback state="empty"><h2>{tCatalog('noResults')}</h2><p>{tCatalog('adjustFilters')}</p></RequestFeedback>}
    {!loading && hasSnapshot && result.total > 0 && <>
      <div className={styles['table-wrap']}><table><thead><tr>{columns.map((column) => {
        const sort = columnSort(column.key)
        return <th scope="col" key={column.key} aria-sort={sort.ariaSort}><button className={styles['sort-button']} onClick={() => toggleSort(column.key)}>{columnLabel(column)}<span aria-hidden="true">{sort.indicator}</span></button></th>
      })}<th scope="col">{tCatalog('actions')}</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.id} data-catalog-row-id={item.id}>{columns.map(({ key }) => <td key={key}>{displayCell(item, key)}</td>)}<td>{detailLink(item)}</td></tr>)}</tbody></table></div>
      <div className={styles['mobile-cards']}>{result.items.map((item) => <article className={styles['mobile-card']} key={item.id}><h2>{item.name}</h2>{columns.slice(1).map((column) => <div className={styles['mobile-field']} key={column.key}><strong>{columnLabel(column)}:</strong> {displayCell(item, column.key)}</div>)}{detailLink(item)}</article>)}</div>
      <div className={styles.pagination}>
        <span>{tCatalog('range', { start: (result.page - 1) * (query.pageSize === 'all' ? result.total : query.pageSize) + 1, end: Math.min(result.page * (query.pageSize === 'all' ? result.total : query.pageSize), result.total), count: result.total })}</span>
        <label>{tCatalog('pageSize')}<select value={query.pageSize} onChange={(event) => update({ pageSize: event.target.value === 'all' ? 'all' : Number(event.target.value) })}>{pageSizes.map((size) => <option key={size} value={size}>{size === 'all' ? tCatalog('all') : size}</option>)}</select></label>
        <div className={styles['page-controls']}>
          <button aria-label={tCatalog('previousAria')} className={`button ${styles['page-button']}`} disabled={result.page <= 1} onClick={() => update({ page: Math.max(1, result.page - 1) })}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 4.5-5.5 5.5 5.5 5.5" /></svg></button>
          {pages.map((page) => typeof page === 'number'
            ? <button key={page} aria-current={page === result.page ? 'page' : undefined} aria-label={tCatalog('page', { page, count: result.pageCount })} className={page === result.page ? styles['current-page'] : styles['page-number']} onClick={() => update({ page })}>{page}</button>
            : <span key={page} aria-hidden="true">…</span>)}
          <button aria-label={tCatalog('nextAria')} className={`button ${styles['page-button']}`} disabled={result.page >= result.pageCount} onClick={() => update({ page: result.page + 1 })}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4.5 5.5 5.5-5.5 5.5" /></svg></button>
        </div>
      </div>
    </>}
  </main>
}
