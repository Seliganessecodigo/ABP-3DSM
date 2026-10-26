import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '../../components/LoadingState.tsx'
import { formatNumber } from '../../utils/formatNumber.ts'
import { stateLabel } from '../../features/applications/presentation.ts'
import { periodPresets } from '../../features/analysis/periodContext.ts'
import { validDashboardFilters, activeDashboardFilterCount, selectDashboardRows } from './dashboardData.ts'
import {
  dashboardQueryUrl,
  readDashboardQuery,
  type DashboardPageSize,
  type DashboardQuery,
  type DashboardSortColumn,
  type DashboardTableFilters,
} from './query.ts'
import { useDashboard } from './useDashboard.ts'
import styles from './DashboardPage.module.css'

const tableColumns: ReadonlyArray<Readonly<{ key: DashboardSortColumn; label: string }>> = [
  { key: 'name', label: 'table.application' },
  { key: 'state', label: 'table.state' },
  { key: 'region', label: 'table.currentRegion' },
  { key: 'energy', label: 'table.energy' },
  { key: 'emissions', label: 'table.emissions' },
  { key: 'energyCoverage', label: 'table.energyCoverage' },
  { key: 'emissionsCoverage', label: 'table.emissionsCoverage' },
]
const pageSizes: readonly DashboardPageSize[] = [5, 10, 15, 20, 'all']
const compositionColors = ['#0b7658', '#36a87c', '#70c4a1', '#91bda9', '#557d6c'] as const
const filterDefaults: DashboardTableFilters = {
  name: '', state: 'ALL', region: '', energyMin: '', energyMax: '', energyMissing: false,
  emissionsMin: '', emissionsMax: '', emissionsMissing: false,
  energyCoverageMin: '', energyCoverageMax: '',
  emissionsCoverageMin: '', emissionsCoverageMax: '',
}

function paginationPages(page: number, pageCount: number): number[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const first = page <= 3 ? 2 : page >= pageCount - 2 ? pageCount - 3 : page - 1
  const last = page <= 3 ? 4 : page >= pageCount - 2 ? pageCount - 1 : page + 1
  return [1, ...(first > 2 ? [-1] : []), ...Array.from({ length: last - first + 1 }, (_, index) => first + index), ...(last < pageCount - 1 ? [-2] : []), pageCount]
}

function numberLabel(value: number | null, unit: string, locale: string, missing: string): string {
  return value === null ? missing : `${formatNumber(value, locale)} ${unit}`
}

function coverageLabel(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

function compositionColor(index: number): string {
  return compositionColors[index % compositionColors.length]
}

function timeLabel(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function dateRangeLabel(from: string, to: string, locale: string): string {
  const format = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeZone: 'UTC' })
  return `${format.format(new Date(from))} – ${format.format(new Date(to))}`
}

function normalizeNumberInput(value: string): string {
  return value.trim()
}

export function DashboardPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const [query, setQuery] = useState<DashboardQuery>(() => readDashboardQuery(window.location.search))
  const [draftFilters, setDraftFilters] = useState<DashboardTableFilters>(query.filters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [compositionMode, setCompositionMode] = useState<'donut' | 'bars'>('donut')
  const [compositionDirection, setCompositionDirection] = useState<'asc' | 'desc'>('desc')
  const period = query.period
  const data = useDashboard(period === null ? null : {
    period,
    state: query.state === 'ALL' ? null : query.state,
    regionCode: query.regionCode,
  })
  const refresh = data.refresh

  const labels = useMemo(() => ({
    AVAILABLE: stateLabel('AVAILABLE', tCommon),
    UNAVAILABLE: stateLabel('UNAVAILABLE', tCommon),
    NO_METRICS: stateLabel('NO_METRICS', tCommon),
    REMOVED: stateLabel('REMOVED', tCommon),
  }), [tCommon])
  const table = useMemo(() => selectDashboardRows(
    data.data?.applications ?? [],
    data.applications.items,
    query,
    locale,
    (state) => labels[state],
  ), [data.applications.items, data.data?.applications, labels, locale, query])
  const pageCount = query.pageSize === 'all' ? 1 : Math.ceil(table.total / query.pageSize)
  const page = table.total === 0 ? 1 : Math.min(query.page, pageCount)
  const visibleRows = query.pageSize === 'all'
    ? table.items
    : table.items.slice((page - 1) * query.pageSize, page * query.pageSize)
  const activeFilterCount = activeDashboardFilterCount(query.filters)
  const regionCodes = [...new Set(data.applications.items.flatMap((application) => application.location?.regionCode ?? []))]
    .sort((left, right) => left.localeCompare(right, locale))
  const emissionApplications = (data.data?.applications ?? []).filter((application) => application.emissions.value !== null)
  const emissionSum = emissionApplications.reduce((sum, application) => sum + (application.emissions.value ?? 0), 0)
  const canDrawComposition = data.data?.totals.emissions.value !== null &&
    data.data?.totals.emissions.value !== undefined && emissionSum > 0 &&
    emissionApplications.every((application) => (application.emissions.value ?? 0) >= 0)
  const chartApplications = [...emissionApplications].sort((left, right) => {
    const difference = (left.emissions.value ?? 0) - (right.emissions.value ?? 0)
    return (compositionDirection === 'asc' ? difference : -difference) || left.applicationId.localeCompare(right.applicationId, locale)
  })
  const donutStops = chartApplications.reduce((result, application, index) => {
    const end = result.position + ((application.emissions.value ?? 0) / emissionSum) * 100
    const color = compositionColor(index)
    return { position: end, stops: [...result.stops, `${color} ${result.position}% ${end}%`] }
  }, { position: 0, stops: [] as string[] }).stops.join(', ')
  const totalApplications = data.data ? Object.values(data.data.states).reduce((sum, count) => sum + count, 0) : 0
  const summaryMeta = data.data && [
    `${numberLabel(data.data.totals.energy.value, data.data.totals.energy.unit, locale, t('notAvailable'))}`,
    `${numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable'))}`,
    dateRangeLabel(data.data.period.from, data.data.period.to, locale),
  ].join(' | ')

  useEffect(() => {
    const url = dashboardQueryUrl({ ...query, page })
    const current = `${window.location.pathname}${window.location.search}`
    if (current !== url) {
      if (query.page !== page) window.history.replaceState({}, '', url)
      else window.history.pushState({}, '', url)
    }
  }, [page, query])

  useEffect(() => {
    const syncQuery = () => {
      const next = readDashboardQuery(window.location.search)
      setQuery(next)
      setDraftFilters(next.filters)
      refresh()
    }
    window.addEventListener('popstate', syncQuery)
    return () => window.removeEventListener('popstate', syncQuery)
  }, [refresh])

  const update = (patch: Partial<DashboardQuery>) => setQuery((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  const toggleSort = (column: DashboardSortColumn) => update({
    sort: { column, direction: query.sort.column === column && query.sort.direction === 'asc' ? 'desc' : 'asc' },
  })
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validDashboardFilters(draftFilters)) return
    update({ filters: draftFilters })
    setFiltersOpen(false)
  }
  const updateDraft = <K extends keyof DashboardTableFilters>(key: K, value: DashboardTableFilters[K]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }
  const clearDraft = (keys: readonly (keyof DashboardTableFilters)[]) => setDraftFilters((current) => {
    const next: DashboardTableFilters = { ...current }
    Object.assign(next, Object.fromEntries(keys.map((key) => [key, filterDefaults[key]])))
    return next
  })
  const changePeriod = (next: typeof periodPresets[number]) => {
    update({ period: next })
    refresh()
  }
  const changePageSize = (value: string) => {
    const pageSize = pageSizes.find((option) => String(option) === value)
    if (pageSize) update({ pageSize })
  }
  const retry = () => {
    refresh()
  }
  const detailsLink = (id: string, name: string) => <a
    data-dashboard-application-id={id}
    href={`/services/${encodeURIComponent(id)}${window.location.search}`}
    aria-label={`${t('table.details')}: ${name}`}
    onClick={(event) => {
      event.preventDefault()
      navigate(`/services/${encodeURIComponent(id)}${window.location.search}`)
    }}
  >{name}</a>
  const sortState = (column: DashboardSortColumn) => query.sort.column !== column
    ? 'none'
    : query.sort.direction === 'asc' ? 'ascending' : 'descending'

  return <main className={styles.page} tabIndex={-1}>
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        {(data.data || (!data.applications.loading && !data.applications.error)) && <p className={styles.subtitle}>{t('subtitle', { count: totalApplications })}</p>}
        {summaryMeta && <p className={styles.summaryMeta}>{summaryMeta}</p>}
      </div>
      <button className={styles.refreshButton} type="button" aria-disabled={data.status === 'loading' || data.status === 'refreshing'}
        aria-busy={data.status === 'loading' || data.status === 'refreshing'}
        onClick={() => { if (data.status !== 'loading' && data.status !== 'refreshing') retry() }}>
        {data.status === 'refreshing' ? t('refreshing') : t('refresh')}
      </button>
    </header>

    <section className={styles.controls} aria-label={t('filters.contextHeading')}>
      <div className={styles.periods} role="group" aria-label={t('period')}>
        {periodPresets.map((preset) => <button key={preset} type="button" aria-pressed={period === preset}
          aria-disabled={period === preset && (data.status === 'loading' || data.status === 'refreshing')}
          className={period === preset ? styles.selected : ''}
          onClick={() => { if (period !== preset || (data.status !== 'loading' && data.status !== 'refreshing')) changePeriod(preset) }}>{t(`period.${preset}`)}</button>)}
      </div>
      {period === null && <p className={styles.error} role="alert">{t('invalidPeriod')}</p>}
      <label>{t('region')}
        <select aria-label={t('region')} value={query.regionCode} disabled={data.applications.loading || data.applications.error}
          onChange={(event) => update({ regionCode: event.target.value })}>
          <option value="">{t('allRegions')}</option>
          {query.regionCode && !regionCodes.includes(query.regionCode) && <option value={query.regionCode}>{query.regionCode}</option>}
          {regionCodes.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
      </label>
      <label>{t('state')}
        <select aria-label={t('state')} value={query.state} onChange={(event) => update({ state: event.target.value as DashboardQuery['state'] })}>
          <option value="ALL">{tCommon('state.ALL')}</option>
          {(['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as const).map((state) =>
            <option key={state} value={state}>{labels[state]}</option>)}
        </select>
      </label>
      {data.applications.error && <p className={styles.warning} role="status">{t('regionOptionsUnavailable')}</p>}
      <p className={styles.comparisonNote}>{t('comparisonPending')}</p>
    </section>

    {data.status === 'loading' && <LoadingState title={t('loading')} panelTitle={t('trendTitle')} layout="dashboard" />}
    {data.status === 'error' && <div className={styles.error} role="alert">
      <p>{data.data ? t('refreshError') : t('error')}</p>
      {!data.data && <button type="button" onClick={retry}>{t('retry')}</button>}
    </div>}
    {data.status === 'invalid-period' && <p className={styles.error} role="alert">{t('invalidPeriod')}</p>}

    {data.data && <>
      {data.data.status === 'available' && (data.data.coverage.energy < 1 || data.data.coverage.emissions < 1) &&
        <p className={styles.partialNotice} role="status">
          <span>{t('partialCoverage')}</span>
          <a href="#dashboard-coverage">{t('coverage')}</a>
        </p>}
      {data.data.status === 'empty' && <p className={styles.emptyNotice} role="status">{t('empty')}</p>}

      <section className={styles.kpis} aria-label={t('indicators')}>
        <article className={styles.card}>
          <h2>{t('energy')}</h2>
          <p className={styles.metricValue}>{numberLabel(data.data.totals.energy.value, data.data.totals.energy.unit, locale, t('notAvailable'))}</p>
          <p className={styles.coverageLine}>{t('energyCoverage')}: {coverageLabel(data.data.coverage.energy, locale)}</p>
        </article>
        <article className={styles.card}>
          <h2>{t('emissions')}</h2>
          <p className={styles.metricValue}>{numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable'))}</p>
          <p className={styles.coverageLine}>{t('emissionsCoverage')}: {coverageLabel(data.data.coverage.emissions, locale)}</p>
        </article>
        <article id="dashboard-coverage" className={`${styles.card} ${styles.coverageCard}`}>
          <h2>{t('coverage')}</h2>
          <div className={styles.coverageVisual}>
            <div className={styles.coverageRing} role="img" aria-label={`${t('emissionsCoverage')}: ${coverageLabel(data.data.coverage.emissions, locale)}`}
              style={{ background: `conic-gradient(var(--accent-default) ${data.data.coverage.emissions * 100}%, var(--control-hover) 0)` }}>
              <strong>{coverageLabel(data.data.coverage.emissions, locale)}</strong>
            </div>
            <dl className={styles.coverageList}>
              <div><dt>{t('energyCoverage')}</dt><dd>{coverageLabel(data.data.coverage.energy, locale)}</dd></div>
              <div><dt>{t('emissionsCoverage')}</dt><dd>{coverageLabel(data.data.coverage.emissions, locale)}</dd></div>
            </dl>
          </div>
        </article>
        <article className={styles.card}>
          <h2>{t('applicationStates', { count: totalApplications })}</h2>
          <ul className={styles.stateList}>
            {(['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as const).map((state) =>
              <li key={state}><span className={`${styles.stateBadge} ${styles[`state${state}`]}`}>{labels[state]} <strong>{data.data?.states[state]}</strong></span></li>)}
          </ul>
        </article>
      </section>

      <p className={styles.dataAsOf}>{data.data.dataAsOf ? t('dataAsOf', { date: timeLabel(data.data.dataAsOf, locale) }) : t('dataAsOfUnavailable')}</p>
      {data.status === 'refreshing' && <LoadingState title={t('refreshing')} compact />}

      <section className={styles.visualizations}>
        <article className={styles.card}>
          <h2>{t('trendTitle')}</h2>
          <div className={styles.seriesPlaceholder} role="note">
            <svg aria-hidden="true" viewBox="0 0 48 48"><path d="M7 7v34h34M13 30l8-9 7 5 11-13" /></svg>
            <p>{t('trendUnavailable')}</p>
          </div>
        </article>
        <article className={styles.card}>
          <div className={styles.sectionHeading}>
            <h2>{t('compositionTitle')}</h2>
            <div className={styles.modeButtons}>
              <button type="button" aria-pressed={compositionMode === 'bars'}
                onClick={() => setCompositionMode(compositionMode === 'donut' ? 'bars' : 'donut')}>
                {compositionMode === 'donut' ? t('bars') : t('donut')}
              </button>
            </div>
          </div>
          {emissionApplications.length === 0
            ? <p className={styles.emptyNotice}>{t('compositionEmpty')}</p>
            : <div className={`${styles.composition} ${compositionMode === 'bars' ? styles.compositionBars : ''}`}>
              {compositionMode === 'donut' && canDrawComposition && <div className={styles.donut}
                style={{ background: `conic-gradient(${donutStops})` }} role="img" aria-label={t('donutDescription', {
                  count: emissionApplications.length,
                  total: numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable')),
                })}>
                <span><small>{t('total')}</small><strong>{numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable'))}</strong></span>
              </div>}
              {!canDrawComposition && <p className={styles.pendingNote}>{t('compositionSharesUnavailable')}</p>}
              <div className={styles.compositionLegend}>
                {compositionMode === 'bars' && <div className={styles.compositionSort}>
                  <button type="button" aria-pressed={compositionDirection === 'asc'} onClick={() => setCompositionDirection('asc')}>{t('ascending')}</button>
                  <button type="button" aria-pressed={compositionDirection === 'desc'} onClick={() => setCompositionDirection('desc')}>{t('descending')}</button>
                </div>}
                <ul>
                  {chartApplications.map((application, index) => {
                    const value = application.emissions.value ?? 0
                    const share = canDrawComposition ? value / emissionSum * 100 : 0
                    return <li key={application.applicationId} className={compositionMode === 'bars' ? styles.barRow : styles.legendRow}>
                      <span className={styles.legendName}><span className={styles.legendSwatch} style={{ backgroundColor: compositionColor(index) }} />{application.name}</span>
                      {compositionMode === 'bars' && <span className={styles.barTrack}><span style={{ width: `${share}%`, backgroundColor: compositionColor(index) }} /></span>}
                      <strong>{numberLabel(value, application.emissions.unit, locale, t('notAvailable'))}</strong>
                      {canDrawComposition && <span>{coverageLabel(share / 100, locale)}</span>}
                    </li>
                  })}
                </ul>
              </div>
            </div>}
        </article>
      </section>

      <section className={styles.tableCard} aria-labelledby="dashboard-applications-heading">
        <div className={styles.tableHeading}>
          <div><h2 id="dashboard-applications-heading">{t('table.title', { count: table.total })}</h2></div>
          <div className={styles.tableActions}>
            <label className={styles.searchLabel}>{t('table.search')}
              <input type="search" value={query.search} placeholder={t('table.searchPlaceholder')}
                onChange={(event) => update({ search: event.target.value })} />
            </label>
            <button type="button" aria-expanded={filtersOpen} aria-controls="dashboard-table-filters" onClick={() => {
              setDraftFilters(query.filters)
              setFiltersOpen((open) => !open)
            }}>{t('table.filters')} {activeFilterCount > 0 && <span>({activeFilterCount})</span>}</button>
          </div>
        </div>
        {filtersOpen && <form id="dashboard-table-filters" className={styles.filtersPanel} onSubmit={applyFilters}>
          <div className={styles.filterGrid}>
            <fieldset><legend>{t('filters.application')}</legend>
              <label>{t('filters.text')}<input value={draftFilters.name} onChange={(event) => updateDraft('name', event.target.value)} /></label>
              <button type="button" onClick={() => clearDraft(['name'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.state')}</legend>
              <label><span>{t('state')}</span><select value={draftFilters.state} onChange={(event) => updateDraft('state', event.target.value as DashboardTableFilters['state'])}>
                <option value="ALL">{tCommon('state.ALL')}</option>
                {(['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as const).map((state) => <option key={state} value={state}>{labels[state]}</option>)}
              </select></label>
              <button type="button" onClick={() => clearDraft(['state'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.region')}</legend>
              <label>{t('filters.text')}<input value={draftFilters.region} onChange={(event) => updateDraft('region', event.target.value)} /></label>
              <button type="button" onClick={() => clearDraft(['region'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('energy')} ({data.data.totals.energy.unit})</legend>
              <label>{t('filters.minimum')}<input type="number" min="0" step="any" value={draftFilters.energyMin} onChange={(event) => updateDraft('energyMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximum')}<input type="number" min="0" step="any" value={draftFilters.energyMax} onChange={(event) => updateDraft('energyMax', normalizeNumberInput(event.target.value))} /></label>
              <label className={styles.checkbox}><input type="checkbox" checked={draftFilters.energyMissing} onChange={(event) => updateDraft('energyMissing', event.target.checked)} />{t('filters.includeMissing')}</label>
              <button type="button" onClick={() => clearDraft(['energyMin', 'energyMax', 'energyMissing'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('emissions')} ({data.data.totals.emissions.unit})</legend>
              <label>{t('filters.minimum')}<input type="number" min="0" step="any" value={draftFilters.emissionsMin} onChange={(event) => updateDraft('emissionsMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximum')}<input type="number" min="0" step="any" value={draftFilters.emissionsMax} onChange={(event) => updateDraft('emissionsMax', normalizeNumberInput(event.target.value))} /></label>
              <label className={styles.checkbox}><input type="checkbox" checked={draftFilters.emissionsMissing} onChange={(event) => updateDraft('emissionsMissing', event.target.checked)} />{t('filters.includeMissing')}</label>
              <button type="button" onClick={() => clearDraft(['emissionsMin', 'emissionsMax', 'emissionsMissing'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.energyCoverage')}</legend>
              <label>{t('filters.minimumPercent')}<input type="number" min="0" max="100" step="any" value={draftFilters.energyCoverageMin} onChange={(event) => updateDraft('energyCoverageMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximumPercent')}<input type="number" min="0" max="100" step="any" value={draftFilters.energyCoverageMax} onChange={(event) => updateDraft('energyCoverageMax', normalizeNumberInput(event.target.value))} /></label>
              <button type="button" onClick={() => clearDraft(['energyCoverageMin', 'energyCoverageMax'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.emissionsCoverage')}</legend>
              <label>{t('filters.minimumPercent')}<input type="number" min="0" max="100" step="any" value={draftFilters.emissionsCoverageMin} onChange={(event) => updateDraft('emissionsCoverageMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximumPercent')}<input type="number" min="0" max="100" step="any" value={draftFilters.emissionsCoverageMax} onChange={(event) => updateDraft('emissionsCoverageMax', normalizeNumberInput(event.target.value))} /></label>
              <button type="button" onClick={() => clearDraft(['emissionsCoverageMin', 'emissionsCoverageMax'])}>{t('filters.clearColumn')}</button>
            </fieldset>
          </div>
          {!validDashboardFilters(draftFilters) && <p className={styles.error} role="alert">{t('filters.invalidRange')}</p>}
          <div className={styles.filterActions}>
            <button type="button" onClick={() => setDraftFilters(filterDefaults)}>{t('filters.clearAll')}</button>
            <button type="button" onClick={() => setFiltersOpen(false)}>{t('filters.cancel')}</button>
            <button type="submit" disabled={!validDashboardFilters(draftFilters)}>{t('filters.apply')}</button>
          </div>
        </form>}

        {data.data.applications.length > 0 && <p className={styles.scopeNote}>{t('table.contributorsOnly')}</p>}
        {table.total === 0
          ? <p className={styles.emptyNotice} role="status">{data.data.applications.length === 0 ? t('table.noContributors') : t('table.noMatches')}</p>
          : <div className={styles.tableScroll}>
            <table>
              <thead><tr>{tableColumns.map(({ key, label }) => <th key={key} scope="col" aria-sort={sortState(key)}>
                <button type="button" onClick={() => toggleSort(key)}>{t(label)}</button>
              </th>)}</tr></thead>
              <tbody>{visibleRows.map((row) => <tr key={row.applicationId} data-dashboard-application-id={row.applicationId}>
                <th scope="row" data-label={t('table.application')}>{detailsLink(row.applicationId, row.name)}</th>
                <td data-label={t('table.state')}><span className={`${styles.stateBadge} ${styles[`state${row.state}`]}`}>{labels[row.state]}</span></td>
                <td data-label={t('table.currentRegion')}>{row.regionCode ?? tCommon('location.unknown')}</td>
                <td data-label={`${t('table.energy')} (${row.energy.unit})`}>{numberLabel(row.energy.value, row.energy.unit, locale, t('notAvailable'))}</td>
                <td data-label={`${t('table.emissions')} (${row.emissions.unit})`}>{numberLabel(row.emissions.value, row.emissions.unit, locale, t('notAvailable'))}</td>
                <td data-label={t('table.energyCoverage')}>{coverageLabel(row.coverage.energy, locale)}</td>
                <td data-label={t('table.emissionsCoverage')}>{coverageLabel(row.coverage.emissions, locale)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        {table.total > 0 && <footer className={styles.pagination}>
          <p>{t('table.range', {
            from: query.pageSize === 'all' ? 1 : (page - 1) * query.pageSize + 1,
            to: query.pageSize === 'all' ? table.total : Math.min(page * query.pageSize, table.total),
            total: table.total,
          })}</p>
          <label>{t('table.pageSize')}<select value={query.pageSize} onChange={(event) => changePageSize(event.target.value)}>
            {pageSizes.map((size) => <option key={size} value={size}>{size === 'all' ? t('table.allRows') : size}</option>)}
          </select></label>
          <nav aria-label={t('table.pagination')}>
            <button type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>{t('table.previous')}</button>
            {paginationPages(page, pageCount).map((number, index) => number < 0
              ? <span key={`${number}-${index}`} aria-hidden="true">…</span>
              : <button key={number} type="button" aria-current={number === page ? 'page' : undefined}
                aria-label={t('table.pageChoice', { page: number, total: pageCount })} onClick={() => update({ page: number })}>{number}</button>)}
            <button type="button" disabled={page >= pageCount} onClick={() => update({ page: page + 1 })}>{t('table.next')}</button>
          </nav>
        </footer>}
      </section>
    </>}
  </main>
}
