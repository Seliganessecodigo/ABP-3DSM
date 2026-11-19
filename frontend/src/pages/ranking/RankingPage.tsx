import { tableSortPresentation } from '../../utils/tableSortPresentation.ts'
import { Breadcrumbs } from '../../components/Breadcrumbs.tsx'
import { PageHelp } from '../../components/PageHelp.tsx'
import { SortButton } from '../../components/SortButton.tsx'
import { CardIcon } from '../../components/CardIcon.tsx'
import { faRankingStar, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../components/ActionButton.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { getApplications, type Application } from '../../features/applications/api.ts'
import { getEnvironmentalRanking, type EnvironmentalRanking, type EnvironmentalRankingQuery, type RankingDirection, type RankingMetric, type RankingState } from '../../features/analysis/environmentalRanking.ts'
import styles from './RankingPage.module.css'

const columnLabelKeys: Record<string, string> = { energy: 'energyUnit', emissions: 'emissionsUnit' }
const states: readonly RankingState[] = ['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED']
const pageSizes = [5, 10, 15, 20, 'all'] as const
const textFilters = ['filterApplicationId', 'filterName', 'filterRegionCode', 'filterCountry', 'filterRegion', 'filterCity', 'filterStateReason', 'filterEnergyReason', 'filterEmissionsReason'] as const
const numericFilters = ['energy', 'emissions', 'energyCoverage', 'emissionsCoverage', 'position', 'participation'] as const
const columnFilterKeys = [
  ...textFilters, 'filterState', 'filterRankability',
  ...numericFilters.flatMap(field => [`${field}Min`, `${field}Max`, `${field}Missing`]),
]
const sortableColumns = ['position', 'name', 'applicationId', 'state', 'stateReason', 'regionCode', 'country', 'region', 'city', 'energy', 'emissions', 'energyCoverage', 'emissionsCoverage', 'rankability', 'participation'] as const
type SortColumn = (typeof sortableColumns)[number]

function dateInput(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return ''
  return value.slice(0, 19)
}

function defaultPeriod() {
  const to = new Date()
  to.setUTCHours(0, 0, 0, 0)
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 30)
  return { from: from.toISOString(), to: to.toISOString() }
}

function setParam(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

function validPageSize(value: string | null): number | 'all' {
  return pageSizes.find(size => String(size) === value) ?? 10
}

function rankingRequest(params: URLSearchParams): EnvironmentalRankingQuery | null {
  const from = params.get('from')
  const to = params.get('to')
  if (!from || !to || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to)) || Date.parse(to) <= Date.parse(from)) return null
  const metric: RankingMetric = params.get('metric') === 'energy' ? 'energy' : 'emissions'
  const direction: RankingDirection = params.get('direction') === 'asc' ? 'asc' : 'desc'
  const states = params.getAll('states').filter(value => (['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as string[]).includes(value)) as RankingState[]
  const filters = Object.fromEntries(columnFilterKeys.flatMap(key => params.has(key) ? [[key, params.get(key) ?? '']] : []))
  const sortByValue = params.get('sortBy')
  const sortBy = sortableColumns.find(column => column === sortByValue)
  const sortDirection: RankingDirection | undefined = params.get('sortDirection') === 'asc' || params.get('sortDirection') === 'desc' ? params.get('sortDirection') as RankingDirection : undefined
  const pageValue = Number(params.get('page') ?? '1')
  const pageSize = validPageSize(params.get('pageSize'))
  return {
    from, to, metric, direction,
    states,
    regionCodes: params.getAll('regionCodes').filter(Boolean),
    applicationIds: params.getAll('applicationIds').filter(Boolean),
    search: params.get('search') || undefined,
    sortBy: sortBy && sortDirection ? sortBy : undefined,
    sortDirection: sortBy && sortDirection ? sortDirection : undefined,
    page: Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize,
    columnFilters: filters,
  }
}

function stateKey(state: RankingState) {
  return ({ AVAILABLE: 'stateAvailable', UNAVAILABLE: 'stateUnavailable', NO_METRICS: 'stateNoMetrics', REMOVED: 'stateRemoved' })[state]
}

export function RankingPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('ranking')
  const { t: tCommon } = useTranslation('common')
  const search = window.location.search
  const params = useMemo(() => new URLSearchParams(search), [search])
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const metric: RankingMetric = params.get('metric') === 'energy' ? 'energy' : 'emissions'
  const direction: RankingDirection = params.get('direction') === 'asc' ? 'asc' : 'desc'
  const request = useMemo(() => rankingRequest(params), [params])
  const [data, setData] = useState<EnvironmentalRanking | null>(null)
  const [chartData, setChartData] = useState<EnvironmentalRanking | null>(null)
  const [applications, setApplications] = useState<readonly Application[]>([])
  const [catalogError, setCatalogError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [scopeFiltersOpen, setScopeFiltersOpen] = useState(false)
  const [periodExpanded, setPeriodExpanded] = useState(false)
  const [dateDraft, setDateDraft] = useState(() => {
    const period = defaultPeriod()
    return { from: dateInput(from || period.from), to: dateInput(to || period.to) }
  })
  const [regionDraft, setRegionDraft] = useState(params.getAll('regionCodes').join(', '))
  const [searchDraft, setSearchDraft] = useState(params.get('search') ?? '')
  const [filtersDraft, setFiltersDraft] = useState<Record<string, string>>(() => Object.fromEntries(columnFilterKeys.map(key => [key, params.get(key) ?? ''])))
  const [selected, setSelected] = useState<Map<string, string>>(() => new Map())

  useEffect(() => {
    const controller = new AbortController()
    void getApplications(controller.signal).then(setApplications).catch(() => {
      if (!controller.signal.aborted) setCatalogError(true)
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!request) {
      setData(null)
      setChartData(null)
      setLoading(false)
      setError(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    const completeQuery = { ...request, page: 1, pageSize: 'all' as const }
    void Promise.all([
      getEnvironmentalRanking(request, controller.signal),
      getEnvironmentalRanking(completeQuery, controller.signal),
    ]).then(([table, chart]) => {
      if (!controller.signal.aborted) { setData(table); setChartData(chart) }
    }).catch(() => {
      if (!controller.signal.aborted) setError(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [request, retry])

  useEffect(() => {
    const nextParams = new URLSearchParams(search)
    const period = defaultPeriod()
    setDateDraft({ from: dateInput(nextParams.get('from') || period.from), to: dateInput(nextParams.get('to') || period.to) })
    setRegionDraft(nextParams.getAll('regionCodes').join(', '))
    setSearchDraft(nextParams.get('search') ?? '')
    setFiltersDraft(Object.fromEntries(columnFilterKeys.map(key => [key, nextParams.get(key) ?? ''])))
  }, [search])

  const navigateQuery = (next: URLSearchParams, resetPage = true) => {
    if (resetPage) next.delete('page')
    navigate(`/ranking${next.size ? `?${next.toString()}` : ''}`)
  }
  useEffect(() => {
    if (params.has('from') && params.has('to')) return
    const period = defaultPeriod()
    const next = new URLSearchParams(search)
    next.set('from', period.from)
    next.set('to', period.to)
    navigateQuery(next)
  }, [search])
  const changeParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(search)
    setParam(next, key, value)
    navigateQuery(next)
  }
  const changeMulti = (key: 'states' | 'regionCodes' | 'applicationIds', value: string, checked: boolean) => {
    const next = new URLSearchParams(search)
    const remaining = next.getAll(key).filter(item => item !== value)
    next.delete(key)
    for (const item of checked ? [...remaining, value] : remaining) next.append(key, item)
    navigateQuery(next)
  }

  const submitPeriod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const start = Date.parse(`${dateDraft.from}Z`)
    const end = Date.parse(`${dateDraft.to}Z`)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return
    const next = new URLSearchParams(search)
    next.set('from', new Date(start).toISOString())
    next.set('to', new Date(end).toISOString())
    next.set('metric', metric)
    next.set('direction', direction)
    setPeriodExpanded(false)
    navigateQuery(next)
  }

  const applyRegion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams(search)
    next.delete('regionCodes')
    for (const code of regionDraft.split(',').map(value => value.trim()).filter(Boolean)) next.append('regionCodes', code)
    navigateQuery(next)
  }

  const applySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams(search)
    setParam(next, 'search', searchDraft.trim() || null)
    navigateQuery(next)
  }

  const applyColumnFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams(search)
    for (const key of columnFilterKeys) setParam(next, key, filtersDraft[key]?.trim() || null)
    navigateQuery(next)
  }

  const sortBy = params.get('sortBy')
  const sortDirection = params.get('sortDirection')
  const sortColumn = (column: SortColumn) => {
    const next = new URLSearchParams(search)
    const nextDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc'
    next.set('sortBy', column)
    next.set('sortDirection', nextDirection)
    navigateQuery(next)
  }

  const pageSize = validPageSize(params.get('pageSize'))
  const currentPage = data?.pagination.page ?? 1
  const totalPages = data?.pagination.totalPages ?? 0
  const rangeStart = !data || data.pagination.totalItems === 0 ? 0 : pageSize === 'all' ? 1 : (currentPage - 1) * Number(pageSize) + 1
  const rangeEnd = !data || data.pagination.totalItems === 0 ? 0 : pageSize === 'all' ? data.pagination.totalItems : Math.min(currentPage * Number(pageSize), data.pagination.totalItems)
  const activeFilters = columnFilterKeys.filter(key => params.has(key))
  const periodDate = (value: string) => value ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}Z`)) : ''
  const number = (value: number | null, unit: string) => value === null
    ? t('notAvailable')
    : `${new Intl.NumberFormat(i18n.resolvedLanguage).format(value)} ${unit}`
  const percent = (value: number | null) => value === null ? t('notAvailable') : new Intl.NumberFormat(i18n.resolvedLanguage, { style: 'percent' }).format(value)
  const fieldLabel = (field: string) => t(`field.${field}`)
  const rankedItems = data?.items.filter(item => item.rankability === 'ranked') ?? []
  const unrankedItems = data?.items.filter(item => item.rankability === 'unranked') ?? []
  const measureFor = (item: (typeof rankedItems)[number]) => metric === 'energy' ? item.energy : item.emissions
  const maxValue = Math.max(0, ...(chartData?.items ?? rankedItems).map(item => measureFor(item).value ?? 0))
  const toggleSelection = (applicationId: string, name: string, checked: boolean) => {
    setSelected(current => {
      const next = new Map(current)
      if (checked && next.size < 5) next.set(applicationId, name)
      else if (!checked) next.delete(applicationId)
      return next
    })
  }
  const compareParams = new URLSearchParams({ from, to })
  for (const id of selected.keys()) compareParams.append('applicationIds', id)
  const compareHref = `/comparison?${compareParams.toString()}`

  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className={`page-heading ${styles.header}`}>
      <div><Breadcrumbs navigate={navigate} items={[{ label: t('title') }]} /><div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={[
        { title: t('metric'), description: t('description'), target: '[data-help="ranking-controls"]' },
        { title: t('filters'), description: t('helpFilters'), target: '[data-help="ranking-search"]' },
        { title: t('compareSelected', { count: 2 }), description: t('helpCompare'), target: '[data-help="ranking-results"]' },
      ]} /></div></div>
      <ActionButton type="button" appearance="secondary" onClick={() => setRetry(value => value + 1)}>{t('refresh')}</ActionButton>
    </header>

    <form data-help="ranking-controls" className={styles.controls} onSubmit={submitPeriod}>
      <div className={styles.metricControl} role="group" aria-label={t('metric')}>
        <span>{t('metric')}</span>
        <div>{(['energy', 'emissions'] as const).map(value => <button type="button" key={value} aria-pressed={metric === value} onClick={() => changeParam('metric', value)}>{value === 'energy' ? t('energyUnit') : t('emissionsUnit')}</button>)}</div>
      </div>
      <div className={styles.periodControl} data-expanded={periodExpanded}>
        <span>{t('period')}</span>
        <button type="button" className={styles.mobilePeriodSummary} aria-expanded={periodExpanded} onClick={() => setPeriodExpanded(open => !open)}>
          <span>{periodDate(dateDraft.from)} – {periodDate(dateDraft.to)} · UTC</span><span aria-hidden="true">⌄</span>
        </button>
        <div>
          <label>{t('from')}<input className="form-control form-control--compact" type="datetime-local" step="1" value={dateDraft.from} onChange={event => setDateDraft(current => ({ ...current, from: event.target.value }))} required /></label>
          <label>{t('to')}<input className="form-control form-control--compact" type="datetime-local" step="1" value={dateDraft.to} onChange={event => setDateDraft(current => ({ ...current, to: event.target.value }))} required /></label>
          <ActionButton type="submit">{t('apply')}</ActionButton>
        </div>
        <small>{t('utc')}</small>
      </div>
      <label className={styles.directionControl}>{t('direction')}<select className="form-control" value={direction} onChange={event => changeParam('direction', event.target.value)}>
        <option value="desc">{t('largestToSmallest')}</option><option value="asc">{t('smallestToLargest')}</option>
      </select></label>
    </form>

    <div data-help="ranking-search" className={styles.searchRow}>
      <form onSubmit={applySearch}>
        <label>{t('search')}<input className="form-control" type="search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder={t('searchHint')} /></label>
        <ActionButton type="submit">{t('search')}</ActionButton>
      </form>
      <div className={styles.filterButtons}>
        <button className={`button secondary ${styles.domainFiltersButton}`} type="button" aria-expanded={scopeFiltersOpen} aria-controls="ranking-scope-filters" onClick={() => setScopeFiltersOpen(open => !open)}>{t('domainFilters')}</button>
        <button className={`button secondary ${styles.columnFiltersButton}`} type="button" aria-expanded={filtersOpen} aria-controls="ranking-column-filters" onClick={() => setFiltersOpen(open => !open)}>{t('columnFilters')} {activeFilters.length ? `(${activeFilters.length})` : ''}</button>
        <button className={`button secondary ${styles.mobileFiltersButton}`} type="button" aria-expanded={filtersOpen || scopeFiltersOpen} aria-controls="ranking-scope-filters ranking-column-filters" onClick={() => { const open = !(filtersOpen || scopeFiltersOpen); setFiltersOpen(open); setScopeFiltersOpen(open) }}>{t('filters')}</button>
        <button className={styles.mobileDirectionButton} type="button" aria-label={t('direction')} onClick={() => changeParam('direction', direction === 'desc' ? 'asc' : 'desc')}>{direction === 'desc' ? t('largestToSmallest') : t('smallestToLargest')}</button>
      </div>
    </div>

    {scopeFiltersOpen && <section id="ranking-scope-filters" className={styles.domainFilters} aria-label={t('domainFilters')}>
      <fieldset><legend>{t('stateFilter')}</legend>{states.map(state => <label className={styles.check} key={state}>
        <input type="checkbox" checked={params.getAll('states').includes(state)} onChange={event => changeMulti('states', state, event.target.checked)} />{t(stateKey(state))}
      </label>)}</fieldset>
      <form className={styles.inlineForm} onSubmit={applyRegion}>
        <label>{t('historicalRegions')}<input className="form-control" value={regionDraft} onChange={event => setRegionDraft(event.target.value)} placeholder={t('regionCodesHint')} /></label>
        <ActionButton type="submit" appearance="secondary">{t('apply')}</ActionButton>
        <p>{t('historicalRegionHint')}</p>
      </form>
      <label>{t('applications')}<select className="form-control" multiple size={Math.min(Math.max(applications.length, 2), 6)} value={params.getAll('applicationIds')} onChange={event => {
        const next = new URLSearchParams(search)
        next.delete('applicationIds')
        for (const option of Array.from(event.currentTarget.selectedOptions)) next.append('applicationIds', option.value)
        navigateQuery(next)
      }}>
        {applications.map(application => <option value={application.id} key={application.id}>{application.name} ({application.id})</option>)}
        {params.getAll('applicationIds').filter(id => !applications.some(application => application.id === id)).map(id => <option value={id} key={id}>{id}</option>)}
      </select></label>
      {catalogError && <p className={styles.subtle}>{t('applicationOptionsUnavailable')}</p>}
    </section>}

    {filtersOpen && <form id="ranking-column-filters" className={styles.filterPanel} onSubmit={applyColumnFilters}>
      <div className={styles.filterGrid}>
        {textFilters.map(key => <label key={key}>{fieldLabel(key)}<input placeholder={fieldLabel(key)} className="form-control" value={filtersDraft[key] ?? ''} onChange={event => setFiltersDraft(value => ({ ...value, [key]: event.target.value }))} /></label>)}
        <label>{fieldLabel('filterState')}<select className="form-control" value={filtersDraft.filterState ?? ''} onChange={event => setFiltersDraft(value => ({ ...value, filterState: event.target.value }))}>
          <option value="">{t('anyValue')}</option>{states.map(state => <option key={state} value={state}>{t(stateKey(state))}</option>)}
        </select></label>
        <label>{fieldLabel('filterRankability')}<select className="form-control" value={filtersDraft.filterRankability ?? ''} onChange={event => setFiltersDraft(value => ({ ...value, filterRankability: event.target.value }))}>
          <option value="">{t('anyValue')}</option><option value="ranked">{t('ranked')}</option><option value="unranked">{t('unranked')}</option>
        </select></label>
      </div>
      <div className={styles.numericFilterGrid}>{numericFilters.map(field => <fieldset className={styles.numericFilter} key={field}><legend>{fieldLabel(field)}</legend>
          <label>{t('minimum')}<input placeholder={t('minimum')} className="form-control" type="number" min="0" step="any" value={filtersDraft[`${field}Min`] ?? ''} onChange={event => setFiltersDraft(value => ({ ...value, [`${field}Min`]: event.target.value }))} /></label>
          <label>{t('maximum')}<input placeholder={t('maximum')} className="form-control" type="number" min="0" step="any" value={filtersDraft[`${field}Max`] ?? ''} onChange={event => setFiltersDraft(value => ({ ...value, [`${field}Max`]: event.target.value }))} /></label>
          <label>{t('missingValue')}<select className="form-control" value={filtersDraft[`${field}Missing`] ?? ''} onChange={event => setFiltersDraft(value => ({ ...value, [`${field}Missing`]: event.target.value }))}>
            <option value="">{t('anyValue')}</option><option value="true">{t('missingOnly')}</option><option value="false">{t('presentOnly')}</option>
          </select></label>
        </fieldset>)}</div>
      <div className={styles.filterActions}><ActionButton type="submit">{t('applyFilters')}</ActionButton><ActionButton type="button" appearance="secondary" onClick={() => {
        const next = new URLSearchParams(search)
        for (const key of columnFilterKeys) next.delete(key)
        setFiltersDraft(Object.fromEntries(columnFilterKeys.map(key => [key, ''])))
        navigateQuery(next)
      }}>{t('clearAll')}</ActionButton></div>
    </form>}

    {activeFilters.length > 0 && <div className={styles.chips} aria-label={t('activeFilters')}>
      {activeFilters.map(key => <button type="button" key={key} onClick={() => changeParam(key, null)}>{fieldLabel(key)}: {params.get(key)} <span aria-hidden="true">×</span></button>)}
      <button type="button" onClick={() => { const next = new URLSearchParams(search); for (const key of columnFilterKeys) next.delete(key); navigateQuery(next) }}>{t('clearAll')}</button>
    </div>}

    {loading && <RequestFeedback state="loading"><p>{t('loading')}</p></RequestFeedback>}
    {error && <RequestFeedback state="error"><h2>{t('error')}</h2><ActionButton onClick={() => setRetry(value => value + 1)}>{tCommon('actions.retry')}</ActionButton></RequestFeedback>}
    {!request && <p className={styles.hint}>{t('choosePeriod')}</p>}

    {data && <>
      {data.presentation.rankedCount > 0 && (data.scope.coverage.energy < 1 || data.scope.coverage.emissions < 1) && <p className={styles.coverageNotice} role="status">{t('coverageWarning')}</p>}
      {data.status === 'empty' && <RequestFeedback state="empty"><p>{t('empty')}</p></RequestFeedback>}
      {data.pagination.totalItems === 0 && data.status !== 'empty' && <RequestFeedback state="empty"><p>{t('noMatches')}</p></RequestFeedback>}

      {rankedItems.length > 0 && <>
        <section data-help="ranking-results" className={styles.tableCard} aria-labelledby="ranking-table-title">
          <div className={styles.tableHeading}><h2 id="ranking-table-title"><CardIcon icon={faRankingStar} size="small" inline />{t('rankedApplications', { count: data.presentation.rankedCount })}</h2><span>{t('relativeToMaximum')}</span></div>
          <div className={styles.tableScroll}><table>
            <thead><tr>
              <th scope="col" aria-label={t('select')} />
              {([{ label: 'position', key: 'position' }, { label: 'application', key: 'name' }, { label: 'region', key: 'region' }, { label: metric, key: metric }, { label: 'coverage', key: metric === 'energy' ? 'energyCoverage' : 'emissionsCoverage' }] as const).map(({ label, key }) => {
                const sort = tableSortPresentation(key, sortBy, sortDirection)
                return <th scope="col" key={key} aria-sort={sort.ariaSort}>
                  <SortButton state={sort.ariaSort} onClick={() => sortColumn(key)}>{t(columnLabelKeys[label] ?? label)}</SortButton>
                </th>
              })}
              <th scope="col">{t('detail')}</th>
            </tr></thead>
            <tbody>{rankedItems.map(item => {
              const measure = measureFor(item)
              const coverage = metric === 'energy' ? item.coverage.energy : item.coverage.emissions
              const valueInDesignUnit = measure.value === null ? null : metric === 'emissions' ? measure.value / 1000 : measure.value
              const shownUnit = metric === 'emissions' ? t('kgCO2e') : measure.unit
              const barWidth = valueInDesignUnit === null || maxValue === 0 ? 0 : Math.max(2, valueInDesignUnit / (metric === 'emissions' ? maxValue / 1000 : maxValue) * 100)
              const selectedRow = selected.has(item.applicationId)
              const detailHref = `/services/${encodeURIComponent(item.applicationId)}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}&period=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
              return <tr key={item.applicationId} className={selectedRow ? styles.selectedRow : undefined}>
                <td><input aria-label={t('selectApplication', { name: item.name })} type="checkbox" checked={selectedRow} disabled={!selectedRow && selected.size >= 5} onChange={event => toggleSelection(item.applicationId, item.name, event.target.checked)} /></td>
                <td><button className={styles.sortValue} type="button" onClick={() => sortColumn('position')}>{item.position}</button></td>
                <td><a href={detailHref} onClick={event => { event.preventDefault(); navigate(detailHref) }}>{item.name}</a><small>{item.applicationId}</small></td>
                <td>{item.location.regionCode ?? t('notAvailable')}<small>{[item.location.region, item.location.country, item.location.city].filter(Boolean).join(' · ')}</small></td>
                <td><strong>{valueInDesignUnit === null ? t('notAvailable') : `${number(valueInDesignUnit, shownUnit)}`}</strong><span className={styles.metricBar} aria-hidden="true"><span style={{ width: `${Math.min(barWidth, 100)}%` }} /></span></td>
                <td><strong>{percent(coverage)}</strong><small className={coverage < 1 ? styles.partial : styles.complete}>{coverage < 1 ? t('partial') : t('complete')}</small></td>
                <td><a className={styles.detailLink} href={detailHref} aria-label={t('openDetails', { name: item.name })} onClick={event => { event.preventDefault(); navigate(detailHref) }}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2.2" /></svg></a></td>
              </tr>
            })}</tbody>
          </table></div>
          <div className={styles.mobileRankedList}>
            {rankedItems.map(item => {
              const measure = measureFor(item)
              const coverage = metric === 'energy' ? item.coverage.energy : item.coverage.emissions
              const valueInDesignUnit = measure.value === null ? null : metric === 'emissions' ? measure.value / 1000 : measure.value
              const shownUnit = metric === 'emissions' ? t('kgCO2e') : measure.unit
              const barWidth = valueInDesignUnit === null || maxValue === 0 ? 0 : Math.max(2, valueInDesignUnit / (metric === 'emissions' ? maxValue / 1000 : maxValue) * 100)
              const selectedRow = selected.has(item.applicationId)
              const detailHref = `/services/${encodeURIComponent(item.applicationId)}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}&period=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
              return <article className={`${styles.mobileRankCard}${selectedRow ? ` ${styles.mobileSelected}` : ''}`} key={item.applicationId}>
                <div className={styles.mobileRankTitle}>
                  <input aria-label={t('selectApplication', { name: item.name })} type="checkbox" checked={selectedRow} disabled={!selectedRow && selected.size >= 5} onChange={event => toggleSelection(item.applicationId, item.name, event.target.checked)} />
                  <a href={detailHref} onClick={event => { event.preventDefault(); navigate(detailHref) }}><span>{item.position} · {item.name}</span><small>{item.applicationId}</small></a>
                </div>
                <p className={styles.mobileRankRegion}>{[item.location.regionCode, item.location.region, item.location.country].filter(Boolean).join(' · ')}</p>
                <strong className={styles.mobileRankValue}>{number(valueInDesignUnit, shownUnit)}</strong>
                <span className={styles.metricBar} aria-hidden="true"><span style={{ width: `${Math.min(barWidth, 100)}%` }} /></span>
                <small className={coverage < 1 ? styles.partial : styles.complete}>{coverage < 1 ? '△ ' : '✓ '}{coverage < 1 ? t('partial') : t('complete')} · {t('coverage')}: {percent(coverage)}</small>
              </article>
            })}
          </div>
        </section>
      </>}

      {unrankedItems.length > 0 && <section className={styles.unrankedCard} aria-labelledby="unranked-title">
        <div className={styles.tableHeading}><h2 id="unranked-title"><CardIcon icon={faCircleExclamation} size="small" inline />{t('unrankedApplications', { count: data.presentation.unrankedCount })}</h2><span>{t('unrankedHint')}</span></div>
        <div className={styles.unrankedList}>{unrankedItems.map(item => {
          const reasons = [...item.energy.reasons, ...item.emissions.reasons]
          const reason = (item.stateReason !== 'METRICS_VALID' ? item.stateReason : null) ?? reasons.find(itemReason => itemReason.code !== 'METRICS_VALID')?.code
          const detailHref = `/services/${encodeURIComponent(item.applicationId)}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}&period=custom&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
          return <article key={item.applicationId}><div><a href={detailHref} onClick={event => { event.preventDefault(); navigate(detailHref) }}>{item.name}</a><small>{reason ? tCommon(`reason.${reason}`, { defaultValue: reason }) : t('unrankedHint')}</small></div><a className={styles.detailLink} href={detailHref} aria-label={t('openDetails', { name: item.name })} onClick={event => { event.preventDefault(); navigate(detailHref) }}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" /><circle cx="10" cy="10" r="2.2" /></svg></a></article>
        })}</div>
      </section>}

      {data.pagination.totalItems > 0 && <nav className={styles.paginationCard} aria-label={t('pagination')}>
        <span className={styles.paginationRange}>{t('itemsPerPage')}: {pageSize === 'all' ? t('allItems') : pageSize} · {t('showingRange', { from: rangeStart, to: rangeEnd, total: data.pagination.totalItems })}</span>
        <div className={styles.pagination}>
          <button type="button" className="button secondary" disabled={currentPage <= 1} onClick={() => changeParam('page', String(currentPage - 1))}>{t('previous')}</button>
          <label>{t('page')} <input placeholder={t('page')} className="form-control form-control--compact" type="number" min="1" max={Math.max(totalPages, 1)} value={currentPage} onChange={event => changeParam('page', event.target.value === '1' ? null : event.target.value)} /></label>
          <span>{t('pageOf', { page: currentPage, total: totalPages })}</span>
          <button type="button" className="button secondary" disabled={currentPage >= totalPages} onClick={() => changeParam('page', String(currentPage + 1))}>{t('next')}</button>
        </div>
        <label className={styles.pageSize}>{t('itemsPerPage')}<select className="form-control form-control--compact" value={pageSize} onChange={event => changeParam('pageSize', event.target.value === '10' ? null : event.target.value)}>
          {pageSizes.map(size => <option key={size} value={size}>{size === 'all' ? t('allItems') : size}</option>)}
        </select></label>
      </nav>}

      {selected.size > 0 && <section className={styles.selectionBar} aria-live="polite">
        <div><strong>{t('selectedApplications', { count: selected.size })}</strong><small>{Array.from(selected.values()).join(', ')}</small></div>
        <button type="button" className={styles.clearSelection} onClick={() => setSelected(new Map())}>{t('clearSelection')}</button>
        <a className="button" aria-disabled={selected.size < 2 || selected.size > 5} href={selected.size < 2 || selected.size > 5 ? undefined : compareHref} onClick={event => {
          if (selected.size < 2 || selected.size > 5) event.preventDefault()
          else { event.preventDefault(); navigate(compareHref) }
        }}>{t('compareSelected', { count: selected.size })}</a>
      </section>}
    </>}
  </main>
}
