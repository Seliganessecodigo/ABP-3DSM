import { CardIcon } from '../../components/CardIcon.tsx'
import { faBolt, faChartLine, faChartPie, faLayerGroup, faLeaf, faCalendarCheck } from '@fortawesome/free-solid-svg-icons'
import { Breadcrumbs } from '../../components/Breadcrumbs.tsx'
import { SortButton } from '../../components/SortButton.tsx'
import { Pagination } from '../../components/Pagination.tsx'
import { PageHelp } from '../../components/PageHelp.tsx'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
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
import { EnvironmentalSeries } from '../../components/EnvironmentalSeries.tsx'
import { useDashboard } from './useDashboard.ts'
import styles from './DashboardPage.module.css'
import { usePersonalAlerts } from '../../features/preferences/usePersonalAlerts.ts'
import { PersonalAlertsPanel, PersonalAlertBadges } from '../../components/PersonalAlerts.tsx'
import { useAnalysisDefaults } from '../../features/preferences/useAnalysisDefaults.ts'

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
const compositionColors = ['#0b7658', '#36a87c', '#70c4a1', '#91bda9', '#557d6c', '#aacb58', '#22965e', '#6e9b94'] as const
const filterDefaults: DashboardTableFilters = {
  name: '', state: 'ALL', region: '', energyMin: '', energyMax: '', energyMissing: false,
  emissionsMin: '', emissionsMax: '', emissionsMissing: false,
  energyCoverageMin: '', energyCoverageMax: '',
  emissionsCoverageMin: '', emissionsCoverageMax: '',
}

function numberLabel(value: number | null, unit: string, locale: string, missing: string): string {
  return value === null ? missing : `${formatNumber(value, locale)} ${unit}`
}

function coverageLabel(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

function compositionColor(index: number): string {
  if (index < compositionColors.length) return compositionColors[index]
  return `hsl(${85 + ((index - compositionColors.length) * 137.508) % 100} 45% 42%)`
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

function summaryFilters(query: Pick<DashboardQuery, 'period' | 'state' | 'regionCode' | 'range' | 'granularity'>) {
  if (query.period === null) return null
  return {
    period: query.period,
    range: query.range,
    granularity: query.granularity,
    state: query.state === 'ALL' ? null : query.state,
    regionCode: query.regionCode,
  }
}

function pageRange(total: number, pageSize: DashboardPageSize, requestedPage: number) {
  const pageCount = pageSize === 'all' ? 1 : Math.ceil(total / pageSize)
  const page = total === 0 ? 1 : Math.min(requestedPage, pageCount)
  const from = pageSize === 'all' ? 0 : (page - 1) * pageSize
  const to = pageSize === 'all' ? total : Math.min(page * pageSize, total)
  return { pageCount, page, from, to }
}

export function DashboardPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const personalAlerts = usePersonalAlerts()
  const personalAlertsById = new Map(personalAlerts.data?.applications.map(entry => [entry.applicationId, entry]))
  const { t, i18n } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { t: detailText } = useTranslation('detail')
  const { t: preferencesText } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const [query, setQuery] = useState<DashboardQuery>(() => readDashboardQuery(window.location.search))
  const applyDefaults = useCallback(() => { setQuery(readDashboardQuery(window.location.search)) }, [])
  useAnalysisDefaults(applyDefaults)
  const [draftFilters, setDraftFilters] = useState<DashboardTableFilters>(query.filters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [compositionMode, setCompositionMode] = useState<'donut' | 'bars'>('donut')
  const [compositionDirection, setCompositionDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const period = query.period
  const data = useDashboard(summaryFilters(query))
  const refresh = data.refresh
  const pending = ['loading', 'refreshing'].includes(data.status)

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
  const { pageCount, page, from, to } = pageRange(table.total, query.pageSize, query.page)
  const visibleRows = table.items.slice(from, to)
  const activeFilterCount = activeDashboardFilterCount(query.filters)
  const regionCodes = [...new Set(data.applications.items.flatMap((application) => application.location?.regionCode ?? []))]
    .sort((left, right) => left.localeCompare(right, locale))
  const emissionApplications = (data.data?.applications ?? []).filter((application) => application.emissions.value !== null)
  const emissionSum = emissionApplications.reduce((sum, application) => sum + (application.emissions.value ?? 0), 0)
  const canDrawComposition = data.data?.totals.emissions.value !== null &&
    data.data?.totals.emissions.value !== undefined && emissionSum > 0 &&
    emissionApplications.every((application) => (application.emissions.value ?? 0) >= 0)
  const rankedApplications = [...emissionApplications].sort((left, right) => {
    const difference = (left.emissions.value ?? 0) - (right.emissions.value ?? 0)
    return -difference || left.applicationId.localeCompare(right.applicationId, locale)
  })
  const applicationColors = new Map(rankedApplications.map((application, index) => [application.applicationId, compositionColor(index)]))
  const chartApplications = compositionMode === 'bars' && compositionDirection === 'asc'
    ? [...rankedApplications].sort((left, right) => (left.emissions.value ?? 0) - (right.emissions.value ?? 0) || left.applicationId.localeCompare(right.applicationId, locale))
    : rankedApplications
  const selectedApplication = canDrawComposition
    ? chartApplications.find((application) => application.applicationId === selectedApplicationId && (application.emissions.value ?? 0) > 0)
    : undefined
  const otherApplications = chartApplications.slice(3)
  const otherEmissions = otherApplications.reduce((sum, application) => sum + (application.emissions.value ?? 0), 0)
  const donutValues = chartApplications.map((application) => application.emissions.value ?? 0)
  const positiveDonutValues = donutValues.filter((value) => value > 0)
  const gapPercent = positiveDonutValues.length > 1
    ? Math.min(0.8, Math.min(...positiveDonutValues) / emissionSum * 100 / 3)
    : 0
  const capPercent = 26 / (4 * Math.PI * 80) * 100
  const donutSegments = donutValues.reduce<{
    position: number
    segments: Array<{ applicationId: string; color: string; start: number; length: number; rounded: boolean; compact: boolean }>
  }>((result, value, index) => {
    if (value <= 0 || emissionSum <= 0) return result
    const share = value / emissionSum * 100
    const rounded = positiveDonutValues.length > 1 && share > 2 * capPercent + gapPercent
    const compact = positiveDonutValues.length > 1 && !rounded
    const inset = rounded ? capPercent : 0
    const segment = {
      applicationId: chartApplications[index].applicationId,
      color: applicationColors.get(chartApplications[index].applicationId) ?? compositionColor(index),
      start: result.position + inset + gapPercent / 2,
      length: share - 2 * inset - gapPercent,
      rounded,
      compact,
    }
    return { position: result.position + share, segments: [...result.segments, segment] }
  }, { position: 0, segments: [] }).segments
  const compositionRows = chartApplications.map((application, index) => {
    const value = application.emissions.value ?? 0
    const share = canDrawComposition ? value / emissionSum : 0
    const color = applicationColors.get(application.applicationId) ?? compositionColor(index)
    return <li key={application.applicationId} className={compositionMode === 'bars' ? styles.barRow : styles.legendRow}>
      <button type="button" className={styles.applicationButton} aria-pressed={selectedApplication?.applicationId === application.applicationId}
        disabled={!canDrawComposition || value <= 0}
        onClick={() => setSelectedApplicationId((current) => current === application.applicationId ? null : application.applicationId)}>
        <span className={styles.legendName}>
          <span className={styles.legendSwatch} style={{ backgroundColor: color }} />
          <span className={styles.applicationName} title={application.name}>{application.name}</span>
        </span>
        {compositionMode === 'bars' && <span className={styles.barTrack}><span style={{ width: `${share * 100}%`, backgroundColor: color }} /></span>}
        <strong>{numberLabel(value, application.emissions.unit, locale, t('notAvailable'))}</strong>
        {canDrawComposition && <span className={styles.legendShare}>{coverageLabel(share, locale)}</span>}
      </button>
    </li>
  })
  const totalApplications = data.data ? Object.values(data.data.states).reduce((sum, count) => sum + count, 0) : 0
  const summaryMeta = data.data && dateRangeLabel(data.data.period.from, data.data.period.to, locale)

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
    if (pending && period === next) return
    update({ period: next, explicitPeriod: true, range: undefined })
    refresh()
  }
  const changePageSize = (value: string) => {
    const pageSize = pageSizes.find((option) => String(option) === value)
    if (pageSize) update({ pageSize })
  }
  const retry = () => {
    if (pending) return
    data.refreshAll()
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

  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className={`page-heading ${styles.header}`}>
      <div>
        <Breadcrumbs navigate={navigate} />
        <div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={[
  { title: t('filters.contextHeading'), description: [t('helpFilters'), tCommon('help.period')].join("\n\n"), target: '[data-help="dashboard-filters"]' },
  { title: t('energy'), description: tCommon('help.energy'), target: '[data-help="dashboard-energy"]' },
  { title: t('emissions'), description: tCommon('help.emissions'), target: '[data-help="dashboard-emissions"]' },
  { title: t('coverage'), description: tCommon('help.coverage'), target: '#dashboard-coverage' },
  { title: t('trendTitle'), description: t('trend.note'), target: '[data-help="dashboard-trend"]' },
  { title: t('compositionTitle'), description: tCommon('help.composition'), target: '[data-help="dashboard-composition"]' },
]} /></div>
        {summaryMeta && <p className={styles.summaryMeta}>{summaryMeta}</p>}
      </div>
      <button className={styles.refreshButton} type="button" aria-disabled={pending}
        aria-busy={pending} onClick={retry}>
        {data.status === 'refreshing' ? t('refreshing') : t('refresh')}
      </button>
    </header>

    <section data-help="dashboard-filters" className={styles.controls} aria-label={t('filters.contextHeading')}>
      <div className={styles.periods} role="group" aria-label={t('period')}>
        {periodPresets.map((preset) => <button key={preset} type="button" aria-pressed={period === preset}
          aria-disabled={period === preset && pending}
          className={period === preset ? styles.selected : ''}
          onClick={() => changePeriod(preset)}>{t(`period.${preset}`)}</button>)}
      </div>
      {period === null && <p className={styles.error} role="alert">{t('invalidPeriod')}</p>}
      {(period === 'custom' || period === 'month') && <p>{preferencesText(`evaluationPeriod.${period}`)}{query.range && ` · ${dateRangeLabel(query.range.from, query.range.to, locale)} UTC`}</p>}
      <label>{preferencesText('granularityEditing')}<select className="form-control" aria-label={preferencesText('granularityEditing')} value={query.granularity ?? (period === '24h' ? 'hour' : 'day')} onChange={event => {
        const granularity = (['hour', 'day', 'month', 'year'] as const).find(value => value === event.target.value)
        if (granularity) update({ granularity })
      }}><option value="hour">{preferencesText('hour')}</option><option value="day">{preferencesText('day')}</option><option value="month">{detailText('analysisGranularityMonth')}</option><option value="year">{detailText('analysisGranularityYear')}</option></select></label>
      <label>{t('region')}
        <select className="form-control" aria-label={t('region')} value={query.regionCode} disabled={data.applications.loading || data.applications.error}
          onChange={(event) => update({ regionCode: event.target.value })}>
          <option value="">{t('allRegions')}</option>
          {query.regionCode && !regionCodes.includes(query.regionCode) && <option value={query.regionCode}>{query.regionCode}</option>}
          {regionCodes.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
      </label>
      <label>{t('state')}
        <select className="form-control" aria-label={t('state')} value={query.state} onChange={(event) => update({ state: event.target.value as DashboardQuery['state'] })}>
          <option value="ALL">{tCommon('state.ALL')}</option>
          {(['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as const).map((state) =>
            <option key={state} value={state}>{labels[state]}</option>)}
        </select>
      </label>
      {data.applications.error && <p className={styles.warning} role="status">{t('regionOptionsUnavailable')}</p>}

    </section>

    <PersonalAlertsPanel state={personalAlerts} />
    {data.status === 'loading' && <LoadingState title={t('loading')} panelTitle={t('trendTitle')} layout="dashboard" />}
    {data.status === 'error' && <div className={styles.error} role="alert">
      <p>{data.data ? t('refreshError') : t('error')}</p>
      {!data.data && <button className="button secondary" type="button" onClick={retry}>{t('retry')}</button>}
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
        <article data-help="dashboard-energy" className={styles.card}>
          <h2><CardIcon icon={faBolt} size="small" inline />{t('energy')}</h2>
          <p className={styles.metricValue}>{numberLabel(data.data.totals.energy.value, data.data.totals.energy.unit, locale, t('notAvailable'))}</p>
          <p className={styles.coverageLine}>{t('energyCoverage')}: {coverageLabel(data.data.coverage.energy, locale)}</p>
        </article>
        <article data-help="dashboard-emissions" className={styles.card}>
          <h2><CardIcon icon={faLeaf} size="small" inline />{t('emissions')}</h2>
          <p className={styles.metricValue}>{numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable'))}</p>
          <p className={styles.coverageLine}>{t('emissionsCoverage')}: {coverageLabel(data.data.coverage.emissions, locale)}</p>
        </article>
        <article id="dashboard-coverage" className={`${styles.card} ${styles.coverageCard}`}>
          <h2><CardIcon icon={faCalendarCheck} size="small" inline />{t('coverage')}</h2>
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
          <h2><CardIcon icon={faLayerGroup} size="small" inline />{t('applicationStates', { count: totalApplications })}</h2>
          <ul className={styles.stateList}>
            {(['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as const).map((state) =>
              <li key={state}><span className={`${styles.stateBadge} ${styles[`state${state}`]}`}>{labels[state]} <strong>{data.data?.states[state]}</strong></span></li>)}
          </ul>
        </article>
      </section>

      <p className={styles.dataAsOf}>{data.data.dataAsOf ? t('dataAsOf', { date: timeLabel(data.data.dataAsOf, locale) }) : t('dataAsOfUnavailable')}</p>
      {data.status === 'refreshing' && <LoadingState title={t('refreshing')} compact />}

      <section className={styles.visualizations}>
        <article data-help="dashboard-trend" className={styles.card}>
          <h2><CardIcon icon={faChartLine} size="small" inline />{t('trendTitle')}</h2>
          <EnvironmentalSeries series={data.data.series} locale={locale} />
        </article>
        <article data-help="dashboard-composition" className={styles.card}>
          <div className={styles.sectionHeading}>
            <h2><CardIcon icon={faChartPie} size="small" inline />{t('compositionTitle')}</h2>
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
              {compositionMode === 'donut' && canDrawComposition && data.data.totals.emissions.value !== null && <div className={styles.donut}
                role="img" aria-label={`${selectedApplication ? `${selectedApplication.name}: ${numberLabel(selectedApplication.emissions.value, selectedApplication.emissions.unit, locale, t('notAvailable'))} (${coverageLabel((selectedApplication.emissions.value ?? 0) / emissionSum, locale)}). ` : ''}${t('donutDescription', {
                  count: emissionApplications.length,
                  total: numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable')),
                })}`}>
                <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                  <g transform="rotate(-90 100 100)">
                    {donutSegments.map((segment) => {
                      const isSelected = selectedApplication?.applicationId === segment.applicationId
                      const angle = (segment.start + segment.length / 2) * 2 * Math.PI / 100
                      const offset = isSelected ? 4 : 0
                      const transform = `translate(${offset * Math.cos(angle)} ${offset * Math.sin(angle)})`
                      if (segment.compact) {
                        const centerX = 100 + 80 * Math.cos(angle)
                        const centerY = 100 + 80 * Math.sin(angle)
                        const width = segment.length * 2 * Math.PI * 80 / 100
                        return <g key={segment.applicationId} className={styles.donutSegment}
                          opacity={selectedApplication && !isSelected ? 0.28 : 1} transform={transform}>
                          <rect x={centerX - width / 2} y={centerY - 13} width={width} height="26"
                            rx={Math.min(5, width / 2)} fill={segment.color}
                            transform={`rotate(${angle * 180 / Math.PI + 90} ${centerX} ${centerY})`} />
                        </g>
                      }
                      return <g key={segment.applicationId} className={styles.donutSegment}
                        opacity={selectedApplication && !isSelected ? 0.28 : 1} transform={transform}>
                        <circle cx="100" cy="100" r="80" pathLength="100"
                          fill="none" stroke={segment.color} strokeWidth="26" strokeLinecap={segment.rounded ? 'round' : 'butt'}
                          strokeDasharray={`${segment.length} ${100 - segment.length}`} strokeDashoffset={-segment.start} />
                      </g>
                    })}
                  </g>
                </svg>
                <span>
                  <small className={selectedApplication ? styles.donutSelectedName : undefined} title={selectedApplication?.name}>{selectedApplication?.name ?? t('total')}</small>
                  <strong>{formatNumber(selectedApplication?.emissions.value ?? data.data.totals.emissions.value, locale)}</strong>
                  <span className={styles.donutUnit}>{selectedApplication?.emissions.unit ?? data.data.totals.emissions.unit}</span>
                  {selectedApplication && <small>{coverageLabel((selectedApplication.emissions.value ?? 0) / emissionSum, locale)}</small>}
                </span>
              </div>}
              {!canDrawComposition && <p className={styles.pendingNote}>{t('compositionSharesUnavailable')}</p>}
              <div className={styles.compositionLegend}>
                {compositionMode === 'bars' && <div className={styles.compositionSort}>
                  <button type="button" aria-pressed={compositionDirection === 'asc'} onClick={() => setCompositionDirection('asc')}>{t('ascending')}</button>
                  <button type="button" aria-pressed={compositionDirection === 'desc'} onClick={() => setCompositionDirection('desc')}>{t('descending')}</button>
                </div>}
                <ul>
                  {compositionMode === 'bars' ? compositionRows : compositionRows.slice(0, 3)}
                </ul>
                {compositionMode === 'donut' && otherApplications.length > 0 && <details className={styles.moreApplications}>
                  <summary>
                    <span className={styles.legendName}>
                      <span className={styles.moreSwatches} aria-hidden="true">
                        {otherApplications.slice(0, 5).map((application, index) => <span key={application.applicationId} className={styles.legendSwatch} style={{ backgroundColor: applicationColors.get(application.applicationId) ?? compositionColor(index + 3) }} />)}
                      </span>
                      {t('otherApplications', { count: otherApplications.length })}
                    </span>
                    {canDrawComposition && <strong>{coverageLabel(otherEmissions / emissionSum, locale)}</strong>}
                  </summary>
                  <ul>{compositionRows.slice(3)}</ul>
                </details>}
              </div>
            </div>}
        </article>
      </section>

      <section data-help="dashboard-results" className={styles.tableCard} aria-labelledby="dashboard-applications-heading">
        <div className={styles.tableHeading}>
          <div><h2 id="dashboard-applications-heading">{t('table.title', { count: table.total })}</h2></div>
          <div className={styles.tableActions}>
            <label className={styles.searchLabel}>{t('table.search')}
              <input className="form-control" type="search" value={query.search} placeholder={t('table.searchPlaceholder')}
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
              <label>{t('filters.text')}<input placeholder={t('filters.text')} className="form-control" value={draftFilters.name} onChange={(event) => updateDraft('name', event.target.value)} /></label>
              <button type="button" onClick={() => clearDraft(['name'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.state')}</legend>
              <label><span>{t('state')}</span><select className="form-control" value={draftFilters.state} onChange={(event) => updateDraft('state', event.target.value as DashboardTableFilters['state'])}>
                <option value="ALL">{tCommon('state.ALL')}</option>
                {(['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] as const).map((state) => <option key={state} value={state}>{labels[state]}</option>)}
              </select></label>
              <button type="button" onClick={() => clearDraft(['state'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.region')}</legend>
              <label>{t('filters.text')}<input placeholder={t('filters.text')} className="form-control" value={draftFilters.region} onChange={(event) => updateDraft('region', event.target.value)} /></label>
              <button type="button" onClick={() => clearDraft(['region'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('energy')} ({data.data.totals.energy.unit})</legend>
              <label>{t('filters.minimum')}<input placeholder={t('filters.minimum')} className="form-control" type="number" min="0" step="any" value={draftFilters.energyMin} onChange={(event) => updateDraft('energyMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximum')}<input placeholder={t('filters.maximum')} className="form-control" type="number" min="0" step="any" value={draftFilters.energyMax} onChange={(event) => updateDraft('energyMax', normalizeNumberInput(event.target.value))} /></label>
              <label className={styles.checkbox}><input type="checkbox" checked={draftFilters.energyMissing} onChange={(event) => updateDraft('energyMissing', event.target.checked)} />{t('filters.includeMissing')}</label>
              <button type="button" onClick={() => clearDraft(['energyMin', 'energyMax', 'energyMissing'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('emissions')} ({data.data.totals.emissions.unit})</legend>
              <label>{t('filters.minimum')}<input placeholder={t('filters.minimum')} className="form-control" type="number" min="0" step="any" value={draftFilters.emissionsMin} onChange={(event) => updateDraft('emissionsMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximum')}<input placeholder={t('filters.maximum')} className="form-control" type="number" min="0" step="any" value={draftFilters.emissionsMax} onChange={(event) => updateDraft('emissionsMax', normalizeNumberInput(event.target.value))} /></label>
              <label className={styles.checkbox}><input type="checkbox" checked={draftFilters.emissionsMissing} onChange={(event) => updateDraft('emissionsMissing', event.target.checked)} />{t('filters.includeMissing')}</label>
              <button type="button" onClick={() => clearDraft(['emissionsMin', 'emissionsMax', 'emissionsMissing'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.energyCoverage')}</legend>
              <label>{t('filters.minimumPercent')}<input placeholder={t('filters.minimumPercent')} className="form-control" type="number" min="0" max="100" step="any" value={draftFilters.energyCoverageMin} onChange={(event) => updateDraft('energyCoverageMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximumPercent')}<input placeholder={t('filters.maximumPercent')} className="form-control" type="number" min="0" max="100" step="any" value={draftFilters.energyCoverageMax} onChange={(event) => updateDraft('energyCoverageMax', normalizeNumberInput(event.target.value))} /></label>
              <button type="button" onClick={() => clearDraft(['energyCoverageMin', 'energyCoverageMax'])}>{t('filters.clearColumn')}</button>
            </fieldset>
            <fieldset><legend>{t('filters.emissionsCoverage')}</legend>
              <label>{t('filters.minimumPercent')}<input placeholder={t('filters.minimumPercent')} className="form-control" type="number" min="0" max="100" step="any" value={draftFilters.emissionsCoverageMin} onChange={(event) => updateDraft('emissionsCoverageMin', normalizeNumberInput(event.target.value))} /></label>
              <label>{t('filters.maximumPercent')}<input placeholder={t('filters.maximumPercent')} className="form-control" type="number" min="0" max="100" step="any" value={draftFilters.emissionsCoverageMax} onChange={(event) => updateDraft('emissionsCoverageMax', normalizeNumberInput(event.target.value))} /></label>
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
              <thead><tr>{tableColumns.map(({ key, label }) => <th key={key} scope="col" aria-sort={sortState(key)}><SortButton state={sortState(key)} onClick={() => toggleSort(key)}>{t(label)}</SortButton>
              </th>)}</tr></thead>
              <tbody>{visibleRows.map((row) => <tr key={row.applicationId} data-dashboard-application-id={row.applicationId}>
                <th scope="row" data-label={t('table.application')}>{detailsLink(row.applicationId, row.name)}<PersonalAlertBadges application={personalAlertsById.get(row.applicationId)} /></th>
                <td data-label={t('table.state')}><span className={`${styles.stateBadge} ${styles[`state${row.state}`]}`}>{labels[row.state]}</span></td>
                <td data-label={t('table.currentRegion')}>{row.regionCode ?? tCommon('location.unknown')}</td>
                <td data-label={`${t('table.energy')} (${row.energy.unit})`}>{numberLabel(row.energy.value, row.energy.unit, locale, t('notAvailable'))}</td>
                <td data-label={`${t('table.emissions')} (${row.emissions.unit})`}>{numberLabel(row.emissions.value, row.emissions.unit, locale, t('notAvailable'))}</td>
                <td data-label={t('table.energyCoverage')}>{coverageLabel(row.coverage.energy, locale)}</td>
                <td data-label={t('table.emissionsCoverage')}>{coverageLabel(row.coverage.emissions, locale)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        {table.total > 0 && <Pagination page={page} pageCount={pageCount} label={t('table.pagination')}
          onPageChange={page => update({ page })} summary={t('table.range', { from: from + 1, to, total: table.total })}
          pageSize={{ value: query.pageSize, options: pageSizes, onChange: changePageSize }} />}
      </section>
    </>}
  </main>
}
