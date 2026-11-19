import { CardIcon } from '../../components/CardIcon.tsx'
import { Breadcrumbs } from '../../components/Breadcrumbs.tsx'
import { SortButton } from '../../components/SortButton.tsx'
import { tableSortPresentation } from '../../utils/tableSortPresentation.ts'
import { PageHelp } from '../../components/PageHelp.tsx'
import { Pagination } from '../../components/Pagination.tsx'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightArrowLeft, faBolt, faCalendarDays, faChevronDown, faCrosshairs, faLayerGroup, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { LoadingState } from '../../components/LoadingState.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { useApplicationCatalog } from '../../features/applications/useApplicationCatalog.ts'
import {
  selectCatalog,
  type ApplicationState,
  type CatalogColumnFilters,
  type CatalogQuery,
  type CatalogSortColumn,
} from '../../features/applications/catalog.ts'
import { stateLabel } from '../../features/applications/presentation.ts'
import {
  ComparisonRequestError,
  requestApplicationComparison,
  type ApplicationComparison,
  type ComparisonApplication,
  type ComparisonDifference,
} from '../../features/analysis/comparison.ts'
import { analysisRangeFor } from '../../features/analysis/source.ts'
import { periodPresets, readCustomAnalysisRange, readPeriodSelection, type PeriodPreset } from '../../features/analysis/periodContext.ts'
import { PeriodSelector } from '../detail/PeriodSelector.tsx'
import { formatDate } from '../../utils/formatDate.ts'
import { formatNumber } from '../../utils/formatNumber.ts'
import styles from './ComparisonPage.module.css'

const states: readonly (ApplicationState | 'ALL')[] = ['ALL', 'AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED']
const sortColumns: readonly CatalogSortColumn[] = ['name', 'country', 'regionCode', 'city', 'state', 'lastCheckedAt']
const pageSizes: readonly (number | 'all')[] = [5, 10, 15, 20, 'all']
type PageState = Readonly<{
  applicationIds: readonly string[]
  referenceApplicationId: string | null
  period: PeriodPreset | null
  invalidPeriod: string | null
  query: CatalogQuery
}>
type RequestState = Readonly<{
  key: string
  status: 'success' | 'error'
  data?: ApplicationComparison
  error?: string
}>
type ComparisonRow = Readonly<{
  key: string
  label: string
  value: (application: ComparisonApplication) => string
  difference?: (application: ComparisonApplication) => string
  icon?: typeof faBolt
}>

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function readPageState(search: string): PageState {
  const params = new URLSearchParams(search)
  const applicationIds = [...new Set(params.getAll('applicationIds'))]
  const referenceApplicationId = params.has('referenceApplicationId')
    ? params.get('referenceApplicationId')
    : applicationIds[0] ?? null
  const period = readPeriodSelection(search)
  const size = params.get('size') ?? '10'
  const sortColumn = params.get('sort')
  const direction = params.get('direction')
  const filters: CatalogColumnFilters = {
    name: params.get('name') ?? '',
    country: params.get('country') ?? '',
    regionCode: params.get('regionCode') ?? '',
    city: params.get('city') ?? '',
    cityIsMissing: params.get('cityMissing') === 'true',
    state: states.includes(params.get('columnState') as ApplicationState | 'ALL')
      ? params.get('columnState') as ApplicationState | 'ALL' : 'ALL',
  }
  return {
    applicationIds,
    referenceApplicationId,
    period,
    invalidPeriod: period === null ? params.get('period') : null,
    query: {
      search: params.get('q') ?? '',
      state: 'ALL',
      regionCode: '',
      page: positiveInteger(params.get('page'), 1),
      pageSize: pageSizes.includes(size === 'all' ? 'all' : Number(size))
        ? size === 'all' ? 'all' : Number(size)
        : 10,
      filters,
      sort: sortColumns.includes(sortColumn as CatalogSortColumn) && (direction === 'asc' || direction === 'desc')
        ? { column: sortColumn as CatalogSortColumn, direction }
        : { column: 'name', direction: 'asc' },
    },
  }
}

function pageUrl(state: PageState): string {
  const params = new URLSearchParams(window.location.search)
  const managed = [
    'applicationIds', 'referenceApplicationId', 'q', 'page', 'size', 'sort', 'direction',
    'name', 'country', 'regionCode', 'city', 'cityMissing', 'columnState',
  ]
  for (const key of managed) params.delete(key)
  for (const id of state.applicationIds) params.append('applicationIds', id)
  if (state.referenceApplicationId !== null) params.set('referenceApplicationId', state.referenceApplicationId)
  if (state.period) params.set('period', state.period)
  else if (state.invalidPeriod !== null) params.set('period', state.invalidPeriod)
  else params.delete('period')
  if (state.period && state.period !== 'custom') {
    params.delete('from')
    params.delete('to')
  }
  if (state.query.search) params.set('q', state.query.search)
  if (state.query.page > 1) params.set('page', String(state.query.page))
  if (state.query.pageSize !== 10) params.set('size', String(state.query.pageSize))
  if (state.query.sort && (state.query.sort.column !== 'name' || state.query.sort.direction !== 'asc')) {
    params.set('sort', state.query.sort.column)
    params.set('direction', state.query.sort.direction)
  }
  const filters = state.query.filters ?? {}
  for (const key of ['name', 'country', 'regionCode', 'city'] as const) {
    if (filters[key]) params.set(key, filters[key]!)
  }
  if (filters.cityIsMissing) params.set('cityMissing', 'true')
  if (filters.state && filters.state !== 'ALL') params.set('columnState', filters.state)
  const query = params.toString()
  return query ? `${window.location.pathname}?${query}` : window.location.pathname
}

function differenceText(
  value: ComparisonDifference,
  locale: string,
  t: (key: string) => string,
  reasonLabel: (code: string) => string,
  emissions = false,
): string {
  if (value.absolute === null) return value.reason ? reasonLabel(value.reason) : t('unavailable')
  const amount = emissions && value.unit === 'gCO2e' ? value.absolute / 1000 : value.absolute
  const unit = emissions && value.unit === 'gCO2e' ? 'kgCO₂e' : value.unit ?? ''
  const signed = amount > 0 ? '+' : ''
  const absolute = `${signed}${formatNumber(amount, locale)}${unit ? ` ${unit}` : ''}`
  if (value.percentage !== null) {
    const percentSign = value.percentage > 0 ? '+' : ''
    return `${absolute} (${percentSign}${formatNumber(value.percentage, locale)}%)`
  }
  return value.reason ? `${absolute} · ${reasonLabel(value.reason)}` : absolute
}

export function ComparisonPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('comparison')
  const { t: tCommon } = useTranslation('common')
  const { t: tCatalog } = useTranslation('catalog')
  const { t: tDetail } = useTranslation('detail')
  const { applications, hasSnapshot, loading: catalogLoading, error: catalogError, retry: retryCatalog } = useApplicationCatalog()
  const [pageState, setPageState] = useState(() => readPageState(window.location.search))
  const [catalogExpanded, setCatalogExpanded] = useState(() => readPageState(window.location.search).applicationIds.length < 2)
  const [attempt, setAttempt] = useState(0)
  const [requestState, setRequestState] = useState<RequestState | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [anchor] = useState(() => new Date())
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const query = pageState.query
  const referenceApplicationId = pageState.referenceApplicationId
  const selectedIds = pageState.applicationIds
  const customRange = pageState.period === 'custom' ? readCustomAnalysisRange(window.location.search) : undefined
  let range: Readonly<{ from: string; to: string }> | null = null
  try {
    if (pageState.period) range = analysisRangeFor(pageState.period, anchor, customRange)
  } catch {
    range = null
  }
  const listPresentation = useMemo(() => ({
    locale,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    stateLabels: Object.fromEntries(states.filter((state): state is ApplicationState => state !== 'ALL')
      .map((state) => [state, stateLabel(state, tCommon)])) as Record<ApplicationState, string>,
  }), [locale, tCommon])
  const result = useMemo(() => selectCatalog(applications, query, listPresentation), [applications, query, listPresentation])
  const requestKey = JSON.stringify([selectedIds, referenceApplicationId, range?.from, range?.to, attempt])
  const rangeFrom = range?.from
  const rangeTo = range?.to
  const validSelection = selectedIds.length >= 2 && selectedIds.length <= 5 &&
    selectedIds.every(Boolean) && referenceApplicationId !== null &&
    selectedIds.includes(referenceApplicationId) && range !== null
  const currentRequest = requestState?.key === requestKey ? requestState : null
  const comparisonLoading = validSelection && hasSnapshot && currentRequest === null
  const comparison = currentRequest?.status === 'success' ? currentRequest.data : undefined
  const comparisonError = currentRequest?.status === 'error' ? currentRequest.error : undefined

  useEffect(() => {
    const url = pageUrl(pageState)
    if (`${window.location.pathname}${window.location.search}` !== url) window.history.replaceState({}, '', url)
  }, [pageState])

  useEffect(() => {
    const restore = () => setPageState(readPageState(window.location.search))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])

  useEffect(() => {
    if (!validSelection || !hasSnapshot || !rangeFrom || !rangeTo || !referenceApplicationId) return
    const controller = new AbortController()
    void requestApplicationComparison(selectedIds, referenceApplicationId, rangeFrom, rangeTo, controller.signal).then((data) => {
      if (!controller.signal.aborted) setRequestState({ key: requestKey, status: 'success', data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        const code = error instanceof ComparisonRequestError && error.code ? error.code : ''
        setRequestState({ key: requestKey, status: 'error', error: code })
      }
    })
    return () => controller.abort()
  }, [attempt, hasSnapshot, rangeFrom, rangeTo, referenceApplicationId, requestKey, selectedIds, validSelection])

  const commit = (next: PageState, mode: 'push' | 'replace' = 'replace') => {
    window.history[`${mode}State`]({}, '', pageUrl(next))
    setPageState(next)
  }
  const updateQuery = (nextQuery: CatalogQuery) => commit({ ...pageState, query: nextQuery }, 'replace')
  const updateFilter = (patch: Partial<CatalogColumnFilters>) => updateQuery({
    ...query, page: 1, filters: { ...query.filters, ...patch },
  })
  const updateSearch = (search: string) => updateQuery({ ...query, search, page: 1 })
  const toggleSort = (column: CatalogSortColumn) => updateQuery({
    ...query, page: 1,
    sort: { column, direction: query.sort?.column === column && query.sort.direction === 'asc' ? 'desc' : 'asc' },
  })
  const toggleApplication = (id: string, checked: boolean) => {
    const applicationIds = checked ? [...selectedIds, id] : selectedIds.filter((selected) => selected !== id)
    const removedReference = referenceApplicationId !== null &&
      selectedIds.includes(referenceApplicationId) && !applicationIds.includes(referenceApplicationId)
    const nextReference = removedReference ? applicationIds[0] ?? null : referenceApplicationId ?? applicationIds[0] ?? null
    if (referenceApplicationId && nextReference !== referenceApplicationId) setAnnouncement(t('referenceChanged'))
    commit({ ...pageState, applicationIds, referenceApplicationId: nextReference }, 'push')
  }
  const selectReference = (reference: string) => commit({ ...pageState, referenceApplicationId: reference }, 'push')
  const selectPeriod = (period: PeriodPreset) => commit({ ...pageState, period, invalidPeriod: null }, 'push')
  const applicationName = (id: string) => applications.find((application) => application.id === id)?.name ?? (id || t('invalidId'))
  const missingIds = selectedIds.filter((id) => !applications.some((application) => application.id === id))
  const selectedApplications = comparison?.applications ?? []
  const total = result.total
  const pageSize = query.pageSize === 'all' ? Math.max(total, 1) : query.pageSize
  const firstItem = total === 0 ? 0 : (result.page - 1) * pageSize + 1
  const lastItem = Math.min(result.page * pageSize, total)
  const stateFilters = states.map((state) => ({
    value: state,
    label: state === 'ALL' ? t('allStates') : stateLabel(state, tCommon),
  }))
  const sortLabels: Record<CatalogSortColumn, string> = {
    name: tCatalog('nameFilter'),
    country: tCatalog('countryFilter'),
    regionCode: tCatalog('regionCodeFilter'),
    city: tCatalog('cityFilter'),
    state: tCatalog('stateFilter'),
    lastCheckedAt: tCommon('date.lastCheck'),
  }

  const reasonLabel = (code: string) => i18n.exists(`reason.${code}`, { ns: 'comparison' })
    ? t(`reason.${code}`)
    : t('unavailable')
  const reasonText = (codes: readonly string[]) => codes.length
    ? codes.map(reasonLabel).join(', ')
    : t('unavailable')
  const measureText = (value: number | null, unit: string, reasons: readonly { code: string }[], emissions = false) => {
    if (value === null) return `${t('unavailable')} · ${reasonText(reasons.map(({ code }) => code))}`
    const shown = emissions && unit === 'gCO2e' ? value / 1000 : value
    const shownUnit = emissions && unit === 'gCO2e' ? 'kgCO₂e' : unit
    return `${formatNumber(shown, locale)} ${shownUnit}`
  }
  const coverageText = (value: number) => `${formatNumber(value * 100, locale)}%`
  const coverageDifference = (value: number | null) => value === null
    ? t('unavailable') : `${value > 0 ? '+' : ''}${formatNumber(value, locale)} pp`
  const metricText = (value: ComparisonApplication['metrics']['cpu']) =>
    measureText(value.value, value.unit ?? '', value.reasons)
  const locationText = (application: ComparisonApplication) => application.locations.length
    ? application.locations.map(({ from, to, location, reasons }) => {
      const place = location
        ? [location.city ?? tCommon('location.cityUnknown'), location.region, location.country].filter(Boolean).join(' · ')
        : reasonText(reasons.map(({ code }) => code))
      const start = formatDate(from, locale, tCommon('date.noObservation'), listPresentation.timeZone)
      const end = formatDate(to, locale, tCommon('date.noObservation'), listPresentation.timeZone)
      return `${place} (${start}–${end})`
    }).join(' | ')
    : t('noHistoricalLocation')

  const rows: ComparisonRow[] = [
    { key: 'energy', icon: faBolt, label: t('energy'), value: (application) => measureText(application.energy.value, application.energy.unit, application.energy.reasons), difference: (application) => differenceText(application.differences.energy, locale, t, reasonLabel) },
    { key: 'emissions', icon: faLeaf, label: t('emissions'), value: (application) => measureText(application.emissions.value, application.emissions.unit, application.emissions.reasons, true), difference: (application) => differenceText(application.differences.emissions, locale, t, reasonLabel, true) },
    { key: 'energyCoverage', label: t('energyCoverage'), value: (application) => coverageText(application.coverage.energy), difference: (application) => coverageDifference(application.differences.coverage.energyPercentagePoints) },
    { key: 'emissionsCoverage', label: t('emissionsCoverage'), value: (application) => coverageText(application.coverage.emissions), difference: (application) => coverageDifference(application.differences.coverage.emissionsPercentagePoints) },
    ...(['cpu', 'memory', 'disk', 'network'] as const).map((metric): ComparisonRow => ({
      key: metric, label: t(metric), value: (application) => metricText(application.metrics[metric]),
      difference: (application) => differenceText(application.differences.metrics[metric], locale, t, reasonLabel),
    })),
    { key: 'location', label: t('locations'), value: locationText },
    { key: 'state', label: t('applicationState'), value: (application) => stateLabel(application.state, tCommon) },
  ]

  const periodOptions = [...periodPresets, ...(pageState.period === 'month' || pageState.period === 'custom' ? [pageState.period] : [])]
  const activeFilters = Object.entries(query.filters ?? {}).filter(([key, value]) => key !== 'cityIsMissing' && value && value !== 'ALL' || key === 'cityIsMissing' && value)

  if (catalogLoading && !hasSnapshot) return <LoadingState title={t('loadingCatalog')} layout="table" />

  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className={`page-heading ${styles.header}`}>
      <div><Breadcrumbs navigate={navigate} items={[{ label: t('title') }]} /><div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={[
      { title: t('selectionHeading'), description: t('helpSelection'), target: '[data-help="comparison-selection"]' },
      { title: tDetail('periodTitle'), description: tCommon('help.period'), target: '[data-help="comparison-period"]' },
      { title: t('reference'), description: t('helpReference'), target: '[data-help="comparison-reference"]' },
      { title: t('energy'), description: tCommon('help.energy'), target: '[data-help="comparison-energy"]' },
      { title: t('emissions'), description: tCommon('help.emissions'), target: '[data-help="comparison-emissions"]' },
      { title: t('energyCoverage'), description: tCommon('help.coverage'), target: '[data-help="comparison-energyCoverage"]' },
    ]} /></div></div>
    </header>
    {catalogError && <RequestFeedback state="error"><p>{t('catalogError')}</p><button className="button secondary" type="button" onClick={retryCatalog}>{tCommon('actions.retry')}</button></RequestFeedback>}
    <section data-help="comparison-selection" className={styles.selection} aria-labelledby="comparison-selection-heading">
      {selectedIds.length >= 5 && <p role="status">{t('selectionLimit')}</p>}
      {announcement && <p role="status" aria-live="polite">{announcement}</p>}
      <ul className={styles.selectedList} aria-label={t('selectedApplications')}>
        {selectedIds.map((id, index) => <li key={id} data-reference={id === referenceApplicationId}>
          <span className={styles.applicationMarker} aria-hidden="true">{String.fromCodePoint(65 + index)}</span>
          <span>{applicationName(id)}{missingIds.includes(id) ? ` · ${t('missingApplication')}` : ''}</span>
          <button type="button" aria-label={t('removeApplication', { name: applicationName(id) })} onClick={() => toggleApplication(id, false)}>×</button>
        </li>)}
      </ul>
      <div className={styles.contextFields}>
      <section data-help="comparison-period" className={styles.period} aria-label={t('periodSection')}>
        <FontAwesomeIcon icon={faCalendarDays} className={styles.fieldIcon} aria-hidden="true" />
        <PeriodSelector compact select selected={pageState.period} onSelect={selectPeriod}
          title={tDetail('periodTitle')} invalidMessage={tDetail('periodInvalid')}
          options={periodOptions.map((period) => ({ value: period, label: tDetail(`periods.${period}`) }))} />
      </section>
      {selectedIds.length >= 2 && selectedIds.length <= 5 && <label data-help="comparison-reference" className={styles.reference}>
        <span><FontAwesomeIcon icon={faCrosshairs} aria-hidden="true" />{t('reference')}</span><select className="form-control" value={referenceApplicationId ?? ''} onChange={(event) => selectReference(event.target.value)}>
          {referenceApplicationId && !selectedIds.includes(referenceApplicationId) && <option value={referenceApplicationId}>{t('invalidId')}: {referenceApplicationId}</option>}
          {selectedIds.map((id) => <option key={id} value={id}>{applicationName(id)}</option>)}
        </select>
      </label>}
      </div>
      <details className={styles.catalog} open={catalogExpanded} onToggle={event => setCatalogExpanded(event.currentTarget.open)}>
      <summary className={styles.catalogHeading}>
        <CardIcon icon={faLayerGroup} size="small" />
        <h2 id="comparison-selection-heading">{t('selectionHeading')}</h2>
        <span className={styles.selectionCount}>{formatNumber(selectedIds.length, locale)} / 5</span>
        <FontAwesomeIcon icon={faChevronDown} className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.catalogBody}>
      <p className={styles.selectionInstructions}>{t('selectionInstructions')}</p>
      <div className={styles.filters}>
        <label className={styles.search}>
          <span>{t('searchLabel')}</span>
          <input className="form-control" type="search" value={query.search} onChange={(event) => updateSearch(event.target.value)} />
        </label>
        <label><span>{tCatalog('nameFilter')}</span><input className="form-control" value={query.filters?.name ?? ''} onChange={(event) => updateFilter({ name: event.target.value })} /></label>
        <label><span>{tCatalog('countryFilter')}</span><input className="form-control" value={query.filters?.country ?? ''} onChange={(event) => updateFilter({ country: event.target.value })} /></label>
        <label><span>{tCatalog('regionCodeFilter')}</span><input className="form-control" value={query.filters?.regionCode ?? ''} onChange={(event) => updateFilter({ regionCode: event.target.value })} /></label>
        <label><span>{tCatalog('cityFilter')}</span><input className="form-control" value={query.filters?.city ?? ''} disabled={Boolean(query.filters?.cityIsMissing)} onChange={(event) => updateFilter({ city: event.target.value })} /></label>
        <label><span>{tCatalog('stateFilter')}</span><select className="form-control" value={query.filters?.state ?? 'ALL'} onChange={(event) => updateFilter({ state: event.target.value as ApplicationState | 'ALL' })}>
          {stateFilters.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label className={styles.missingCity}><input type="checkbox" checked={Boolean(query.filters?.cityIsMissing)} onChange={(event) => updateFilter({ cityIsMissing: event.target.checked, city: '' })} />{tCatalog('cityMissing')}</label>
      </div>
      {(query.search || activeFilters.length > 0) && <div className={styles.activeFilters} aria-label={tCatalog('activeFilters')}>
        {query.search && <button type="button" onClick={() => updateSearch('')}>{t('searchLabel')}: {query.search} ×</button>}
        {activeFilters.map(([key]) => <button key={key} type="button" onClick={() => updateFilter({
          [key]: key === 'cityIsMissing' ? false : key === 'state' ? 'ALL' : '',
        })}>{tCatalog(key === 'state' ? 'stateFilter' : key === 'cityIsMissing' ? 'cityMissing' : `${key}Filter`)} ×</button>)}
        <button type="button" onClick={() => updateQuery({ ...query, page: 1, search: '', filters: {} })}>{tCatalog('clearFilters')}</button>
      </div>}
      {applications.length === 0 && hasSnapshot && <RequestFeedback state="empty"><h3>{tCatalog('emptyTitle')}</h3><p>{tCatalog('empty')}</p></RequestFeedback>}
      {applications.length > 0 && result.total === 0 && <RequestFeedback state="empty"><h3>{tCatalog('noResults')}</h3><p>{tCatalog('adjustFilters')}</p></RequestFeedback>}
      {result.total > 0 && <div className={styles.tableWrap}>
        <table className={styles.applicationTable}>
          <thead><tr>
            <th scope="col">{t('selectColumn')}</th>
            {sortColumns.map((column) => {
              const sort = tableSortPresentation(column, query.sort?.column ?? null, query.sort?.direction ?? null)
              return <th key={column} scope="col" aria-sort={sort.ariaSort}><SortButton state={sort.ariaSort} onClick={() => toggleSort(column)}>{sortLabels[column]}</SortButton></th>
            })}
          </tr></thead>
          <tbody>{result.items.map((application) => {
            const checked = selectedIds.includes(application.id)
            const disabled = !checked && selectedIds.length >= 5
            return <tr key={application.id} data-selected={checked}>
              <td><label className={styles.selectionControl}><input type="checkbox" aria-label={t('selectApplication', { name: application.name, id: application.id })} checked={checked} disabled={disabled}
                onChange={(event) => toggleApplication(application.id, event.target.checked)} /></label></td>
              <td><strong>{application.name}</strong><small>{application.id}</small></td>
              <td>{application.location?.country ?? tCommon('location.unknown')}</td>
              <td>{application.location?.regionCode ?? tCommon('location.unknown')}</td>
              <td>{application.location?.city ?? tCommon('location.cityUnknown')}</td>
              <td><span className={`state-badge state-${application.state.toLowerCase()}`}>{stateLabel(application.state, tCommon)}</span></td>
              <td>{formatDate(application.lastCheckedAt, locale, tCommon('date.noObservation'), listPresentation.timeZone)}</td>
            </tr>
          })}</tbody>
        </table>
      </div>}
      {result.total > 0 && <Pagination page={result.page} pageCount={result.pageCount} label={t('pagination')}
        onPageChange={page => updateQuery({ ...query, page })} summary={tCatalog('range', { start: firstItem, end: lastItem, count: total })}
        pageSize={{ value: query.pageSize, options: pageSizes, onChange: value => updateQuery({ ...query, page: 1, pageSize: value === 'all' ? 'all' : Number(value) }) }} />}
      </div>
      </details>
    </section>
    {selectedIds.length > 5 && <RequestFeedback state="error"><p>{t('tooManySelected')}</p></RequestFeedback>}
    {selectedIds.length > 0 && selectedIds.length < 2 && <p className={styles.notice} role="status">{t('selectAtLeastTwo')}</p>}
    {selectedIds.length > 0 && referenceApplicationId !== null && !selectedIds.includes(referenceApplicationId) &&
      <RequestFeedback state="error"><p>{t('invalidReference', { id: referenceApplicationId })}</p></RequestFeedback>}
    {pageState.period === null && <p className={styles.notice} role="alert">{tDetail('periodInvalid')}</p>}
    {selectedIds.length >= 2 && selectedIds.length <= 5 && selectedIds.includes(referenceApplicationId ?? '') && pageState.period !== null &&
      <section className={styles.results} aria-labelledby="comparison-results-heading">
        <div className={styles.resultHeading}>
          <div className={styles.resultTitle}><CardIcon icon={faArrowRightArrowLeft} size="small" /><h2 id="comparison-results-heading">{t('resultsHeading')}</h2></div>
          <span className={styles.periodBadge}>{tDetail(`periods.${pageState.period}`)}</span>
        </div>
        {comparisonLoading && <LoadingState title={t('loadingComparison')} compact />}
        {comparisonError && <RequestFeedback state="error">
          <h3>{t('comparisonErrorTitle')}</h3>
          <p>{comparisonError === 'APPLICATION_NOT_FOUND' ? t('applicationNotFound')
            : comparisonError === 'INVALID_ANALYSIS_REFERENCE_APPLICATION' ? t('invalidReferenceError')
              : t('comparisonError')}</p>
          <button className="button" type="button" onClick={() => setAttempt((value) => value + 1)}>{tCommon('actions.retry')}</button>
        </RequestFeedback>}
        {comparison && <>
          {comparison.status === 'empty' && <RequestFeedback state="empty"><p>{t('emptyComparison')}</p></RequestFeedback>}
          {comparison.status === 'partial' && <p className={styles.partial} role="status">{t('partialComparison')}</p>}
          <div className={styles.desktopResults}>
            <table className={styles.comparisonTable} aria-label={t('tableLabel')}>
              <thead><tr><th scope="col">{t('indicator')}</th>{selectedApplications.map((application) =>
                <th scope="col" key={application.applicationId} data-reference={application.applicationId === referenceApplicationId}><div className={styles.applicationHeading}><span className={styles.applicationMarker} aria-hidden="true">{String.fromCodePoint(65 + selectedIds.indexOf(application.applicationId))}</span><div>{application.name}{application.applicationId === referenceApplicationId && <small className={styles.referenceBadge}>{t('reference')}</small>}</div></div></th>)}</tr></thead>
              <tbody>{rows.map((row) => <tr key={row.key} data-primary={Boolean(row.icon)} data-help={`comparison-${row.key}`}><th scope="row"><span className={styles.indicatorLabel}>{row.icon && <CardIcon icon={row.icon} />}{row.label}</span></th>{selectedApplications.map((application) =>
                <td key={application.applicationId} data-reference={application.applicationId === referenceApplicationId}><span className={styles.metricValue}>{row.value(application)}</span>{row.difference && <small>{application.applicationId === referenceApplicationId
                  ? t('referenceBase') : `${t('difference')}: ${row.difference(application)}`}</small>}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className={styles.mobileResults}>
            {rows.map((row) => <section key={row.key} data-primary={Boolean(row.icon)} data-help={`comparison-${row.key}`} className={styles.metricCard} aria-labelledby={`comparison-${row.key}`}>
              <h3 id={`comparison-${row.key}`} className={styles.indicatorLabel}>{row.icon && <CardIcon icon={row.icon} />}{row.label}</h3>
              {selectedApplications.map((application) => <div className={styles.mobileValue} key={application.applicationId}>
                <strong>{application.name}{application.applicationId === referenceApplicationId ? ` · ${t('reference')}` : ''}</strong>
                <span className={styles.metricValue}>{row.value(application)}</span>
                {row.difference && <small>{application.applicationId === referenceApplicationId
                  ? t('referenceBase') : `${t('difference')}: ${row.difference(application)}`}</small>}
              </div>)}
            </section>)}
          </div>
        </>}
      </section>}
  </main>
}
