import { CardIcon } from '../../components/CardIcon.tsx'
import { faBolt, faChartLine, faChartPie, faLayerGroup, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { CollectionSuccessCard } from './CollectionSuccessCard.tsx'
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
  const [hoveredComposition, setHoveredComposition] = useState<{ applicationId: string; left: number; top: number; below: boolean } | null>(null)
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
  const hoveredApplication = hoveredComposition && chartApplications.find((application) => application.applicationId === hoveredComposition.applicationId)
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
    segments: Array<{ applicationId: string; name: string; value: number; unit: string; color: string; start: number; length: number; rounded: boolean; compact: boolean }>
  }>((result, value, index) => {
    if (value <= 0 || emissionSum <= 0) return result
    const share = value / emissionSum * 100
    const rounded = positiveDonutValues.length > 1 && share > 2 * capPercent + gapPercent
    const compact = positiveDonutValues.length > 1 && !rounded
    const inset = rounded ? capPercent : 0
    const segment = {
      applicationId: chartApplications[index].applicationId,
      name: chartApplications[index].name,
      value,
      unit: chartApplications[index].emissions.unit,
      color: applicationColors.get(chartApplications[index].applicationId) ?? compositionColor(index),
      start: result.position + inset + gapPercent / 2,
      length: share - 2 * inset - gapPercent,
      rounded,
      compact,
    }
    return { position: result.position + share, segments: [...result.segments, segment] }
  }, { position: 0, segments: [] }).segments
  function selectCompositionApplication(applicationId: string) {
    setSelectedApplicationId((current) => current === applicationId ? null : applicationId)
  }
  function showCompositionTooltip(applicationId: string, card: HTMLElement, clientX: number, clientY: number) {
    const cardRect = card.getBoundingClientRect()
    const halfWidth = Math.min(110, cardRect.width / 2 - 12)
    const below = clientY - cardRect.top < 150
    setHoveredComposition({
      applicationId,
      left: Math.min(Math.max(clientX - cardRect.left, halfWidth), cardRect.width - halfWidth),
      top: clientY - cardRect.top + (below ? 8 : -8),
      below,
    })
  }
  function showBarTooltip(applicationId: string, bar: HTMLElement) {
    const card = bar.closest<HTMLElement>('[data-help="dashboard-composition"]')
    if (!card) return
    const barRect = bar.getBoundingClientRect()
    showCompositionTooltip(applicationId, card, barRect.left + barRect.width / 2, barRect.top + barRect.height / 2)
  }
  function showDonutTooltip(applicationId: string, segment: SVGGElement, clientX: number) {
    const card = segment.closest<HTMLElement>('[data-help="dashboard-composition"]')
    const svgRect = segment.ownerSVGElement?.getBoundingClientRect()
    if (!card || !svgRect) return
    const cardRect = card.getBoundingClientRect()
    const halfWidth = Math.min(svgRect.width <= 150 ? 58 : 110, cardRect.width / 2 - 12)
    const side = clientX >= svgRect.left + svgRect.width / 2 ? 1 : -1
    const desiredLeft = (side === 1 ? svgRect.right + 78 : svgRect.left - 78) - cardRect.left
    setHoveredComposition({
      applicationId,
      left: Math.min(Math.max(desiredLeft, halfWidth), cardRect.width - halfWidth),
      top: svgRect.top - cardRect.top + svgRect.height / 2 - 25,
      below: true,
    })
  }
  const compositionRows = chartApplications.map((application, index) => {
    const value = application.emissions.value ?? 0
    const share = canDrawComposition ? value / emissionSum : 0
    const color = applicationColors.get(application.applicationId) ?? compositionColor(index)
    return <li key={application.applicationId} className={compositionMode === 'bars' ? styles.barRow : styles.legendRow}>
      <button type="button" className={styles.applicationButton} aria-pressed={selectedApplication?.applicationId === application.applicationId}
        disabled={!canDrawComposition || value <= 0}
        onFocus={(event) => {
          if (compositionMode === 'bars' && event.currentTarget.matches(':focus-visible')) {
            const bar = event.currentTarget.querySelector<HTMLElement>('[data-bar-track]')
            if (bar) showBarTooltip(application.applicationId, bar)
          }
        }}
        onBlur={() => setHoveredComposition(null)}
        onClick={() => selectCompositionApplication(application.applicationId)}>
        <span className={styles.legendName}>
          <span className={styles.legendSwatch} style={{ backgroundColor: color }} />
          <span className={styles.applicationName} title={application.name}>{application.name}</span>
        </span>
        {compositionMode === 'bars' && <span className={styles.barTrack} data-bar-track
          onPointerEnter={(event) => {
            if (event.pointerType !== 'touch') showBarTooltip(application.applicationId, event.currentTarget)
          }}
          onPointerLeave={() => setHoveredComposition(null)}>
          <span style={{ width: `${share * 100}%`, backgroundColor: color }} />
        </span>}
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
  { title: t('collectionSuccess.title'), description: t('collectionSuccess.help'), target: '#dashboard-collection-success' },
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
          <a href="#dashboard-applications-heading">{t('coverage')}</a>
        </p>}
      {data.data.status === 'empty' && <p className={styles.emptyNotice} role="status">{t('empty')}</p>}

      <section className={styles.kpis} aria-label={t('indicators')}>
        <article data-help="dashboard-energy" className={styles.card}>
          <h2><CardIcon icon={faBolt} size="small" inline />{t('energy')}</h2>
          <p className={styles.metricValue}>{numberLabel(data.data.totals.energy.value, data.data.totals.energy.unit, locale, t('notAvailable'))}</p>
        </article>
        <article data-help="dashboard-emissions" className={styles.card}>
          <h2><CardIcon icon={faLeaf} size="small" inline />{t('emissions')}</h2>
          <p className={styles.metricValue}>{numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable'))}</p>
        </article>
        <CollectionSuccessCard summary={data.data.collectionSuccess} />
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
        <article data-help="dashboard-composition" className={`${styles.card} ${styles.compositionCard}`}>
          <div className={styles.sectionHeading}>
            <h2><CardIcon icon={faChartPie} size="small" inline />{t('compositionTitle')}</h2>
            <div className={styles.modeButtons}>
              <button type="button" aria-pressed={compositionMode === 'bars'}
                onClick={() => {
                  setHoveredComposition(null)
                  setCompositionMode(compositionMode === 'donut' ? 'bars' : 'donut')
                }}>
                {compositionMode === 'donut' ? t('bars') : t('donut')}
              </button>
            </div>
          </div>
          {emissionApplications.length === 0
            ? <p className={styles.emptyNotice}>{t('compositionEmpty')}</p>
            : <div className={`${styles.composition} ${compositionMode === 'bars' ? styles.compositionBars : ''}`}>
              {compositionMode === 'donut' && canDrawComposition && data.data.totals.emissions.value !== null && <div className={styles.donut}
                role="group" aria-label={`${selectedApplication ? `${selectedApplication.name}: ${numberLabel(selectedApplication.emissions.value, selectedApplication.emissions.unit, locale, t('notAvailable'))} (${coverageLabel((selectedApplication.emissions.value ?? 0) / emissionSum, locale)}). ` : ''}${t('donutDescription', {
                  count: emissionApplications.length,
                  total: numberLabel(data.data.totals.emissions.value, data.data.totals.emissions.unit, locale, t('notAvailable')),
                })}`}>
                <svg viewBox="0 0 200 200">
                  <defs>
                    {donutSegments.map((segment, index) => <radialGradient key={segment.applicationId} id={`composition-shade-${index}`}
                      gradientUnits="userSpaceOnUse" cx="100" cy="100" r="93">
                      <stop offset="70%" stopColor={`color-mix(in srgb, ${segment.color} 88%, black)`} />
                      <stop offset="85%" stopColor={segment.color} />
                      <stop offset="100%" stopColor={`color-mix(in srgb, ${segment.color} 82%, white)`} />
                    </radialGradient>)}
                  </defs>
                  <g transform="rotate(-90 100 100)">
                    {donutSegments.map((segment, index) => {
                      const isSelected = selectedApplication?.applicationId === segment.applicationId
                      const isHovered = hoveredComposition?.applicationId === segment.applicationId
                      const angle = (segment.start + segment.length / 2) * 2 * Math.PI / 100
                      const offset = isSelected ? 6 : 0
                      const transform = `translate(${offset * Math.cos(angle)} ${offset * Math.sin(angle)})`
                      const selectedStyle = isSelected ? {
                        filter: `saturate(1.12) drop-shadow(0 3px 5px color-mix(in srgb, ${segment.color} 68%, transparent))`,
                      } : isHovered ? { filter: `brightness(1.12) drop-shadow(0 2px 4px ${segment.color})` } : undefined
                      const centerX = 100 + 80 * Math.cos(angle)
                      const centerY = 100 + 80 * Math.sin(angle)
                      const width = segment.length * 2 * Math.PI * 80 / 100
                      const startAngle = segment.start * 2 * Math.PI / 100
                      const endAngle = (segment.start + segment.length) * 2 * Math.PI / 100
                      const arcPath = `M ${100 + 80 * Math.cos(startAngle)} ${100 + 80 * Math.sin(startAngle)} A 80 80 0 ${segment.length > 50 ? 1 : 0} 1 ${100 + 80 * Math.cos(endAngle)} ${100 + 80 * Math.sin(endAngle)}`
                      return <g key={segment.applicationId} className={styles.donutSegment} style={selectedStyle}
                        role="button" tabIndex={0} aria-pressed={isSelected}
                        aria-label={`${segment.name}: ${numberLabel(segment.value, segment.unit, locale, t('notAvailable'))} (${coverageLabel(segment.value / emissionSum, locale)})`}
                        opacity={selectedApplication && !isSelected && !isHovered ? 0.42 : 1} transform={transform}
                        onClick={() => selectCompositionApplication(segment.applicationId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectCompositionApplication(segment.applicationId)
                          }
                        }}
                        onPointerEnter={(event) => {
                          if (event.pointerType !== 'touch') showDonutTooltip(segment.applicationId, event.currentTarget, event.clientX)
                        }}
                        onPointerLeave={() => setHoveredComposition(null)}
                        onFocus={(event) => {
                          if (!event.currentTarget.matches(':focus-visible')) return
                          const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
                          if (!svgRect) return
                          const radius = 80 * svgRect.width / 200
                          showDonutTooltip(segment.applicationId, event.currentTarget,
                            svgRect.left + svgRect.width / 2 + radius * Math.sin(angle))
                        }}
                        onBlur={() => setHoveredComposition(null)}>
                        {segment.compact ? <>
                          <rect x={centerX - width / 2} y={centerY - (isSelected ? 16 : 13)} width={width} height={isSelected ? 32 : 26}
                            rx={Math.min(5, width / 2)} fill={`url(#composition-shade-${index})`}
                            transform={`rotate(${angle * 180 / Math.PI + 90} ${centerX} ${centerY})`} />
                          <rect x={centerX - Math.max(14, width) / 2} y={centerY - 18} width={Math.max(14, width)} height="36"
                            fill="transparent" pointerEvents="all"
                            transform={`rotate(${angle * 180 / Math.PI + 90} ${centerX} ${centerY})`} />
                          {isSelected && <circle cx={100 + 103 * Math.cos(angle)} cy={100 + 103 * Math.sin(angle)} r="4.5"
                            fill={segment.color} stroke="var(--surface-card)" strokeWidth="2" />}
                        </> : segment.length >= 99.99
                          ? <circle cx="100" cy="100" r="80" fill="none" stroke={`url(#composition-shade-${index})`} strokeWidth={isSelected ? 32 : 26} />
                          : <path d={arcPath} fill="none" stroke={`url(#composition-shade-${index})`}
                            strokeWidth={isSelected ? 32 : 26} strokeLinecap={segment.rounded ? 'round' : 'butt'} />}
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
                <ul onScroll={() => setHoveredComposition(null)}>
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
          {hoveredComposition && hoveredApplication && <div role="tooltip"
            className={`${styles.compositionTooltip} ${hoveredComposition.below ? styles.compositionTooltipBelow : ''} ${compositionMode === 'donut' ? styles.compositionTooltipDonut : ''}`}
            style={{ left: hoveredComposition.left, top: hoveredComposition.top }}>
            <span className={styles.compositionTooltipName}>
              <span className={styles.legendSwatch} style={{ backgroundColor: applicationColors.get(hoveredApplication.applicationId) }} />
              {hoveredApplication.name}
            </span>
            <span className={styles.compositionTooltipValues}>
              <strong>{numberLabel(hoveredApplication.emissions.value, hoveredApplication.emissions.unit, locale, t('notAvailable'))}</strong>
              <span>{coverageLabel((hoveredApplication.emissions.value ?? 0) / emissionSum, locale)}</span>
            </span>
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
