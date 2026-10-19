import { useEffect, useState, type ReactNode } from 'react'
import type { AnalysisPresentationReason, AnalysisReading, AnalysisSeriesPoint, AnalysisSeriesResult } from '../../features/analysis/source.ts'
import { formatInstantForDateTimeInput, getBrowserTimeZone, parseDateTimeInputInZone, parseAnalysisSeriesPageSize, parseAnalysisSeriesReadingStatus, type AnalysisSeriesPageSize, type AnalysisSeriesQuery } from './seriesQuery.ts'
import { collectSeriesUnits, formatSeriesNumber, formatSeriesReading, hasInvalidDateRange, readNumericRange, readSeriesRowRange, selectSeriesPoints } from './analysisSeriesData.ts'
import styles from './AnalysisSeries.module.css'

type Labels = Readonly<{
  heading: string
  graph: string
  table: string
  metricToggle: string
  moment: string
  energy: string
  emissions: string
  energyChart: string
  emissionsChart: string
  unavailable: string
  loading: string
  notCalculable: string
  noPoints: string
  gapsNote: string
  pageSize: string
  allRows: string
  pageChoice: string
  pageStatus: (current: number, total: number) => string
  search: string
  searchPlaceholder: string
  from: string
  to: string
  timeZone: (zone: string) => string
  invalidDateRange: string
  energyStatus: string
  emissionsStatus: string
  allStatuses: string
  availableStatus: string
  unavailableStatus: string
  notCalculableStatus: string
  noMatches: string
  energyUnit: string
  emissionsUnit: string
  selectUnit: string
  energyMin: string
  energyMax: string
  emissionsMin: string
  emissionsMax: string
  invalidNumericRange: string
  invalidUnit: string
  clearFilters: string
  inspectContributions: string
  mixedUnits: string
  previous: string
  next: string
  rangeStatus: (start: number, end: number, count: number) => string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>

function readingText(reading: AnalysisReading, locale: string, labels: Labels) {
  return formatSeriesReading(reading, locale, labels)
}

function formatAnalysisNumber(value: number, locale: string) {
  return formatSeriesNumber(value, locale)
}

function Chart({ points, metric, label, locale, formatDate, labels }: Readonly<{
  points: readonly AnalysisSeriesPoint[]
  metric: 'energy' | 'emissions'
  label: string
  locale: string
  formatDate: (value: string) => string
  labels: Labels
}>) {
  const units = [...new Set(points.flatMap(point => point[metric].status === 'available' && Number.isFinite(point[metric].value) ? [point[metric].unit] : []))]
  const timestamps = points.map(point => Date.parse(point.timestamp)).filter(Number.isFinite)
  const minTime = timestamps.length ? Math.min(...timestamps) : 0
  const maxTime = timestamps.length ? Math.max(...timestamps) : 0
  const chronological = [...points].sort((a, b) => {
    const left = Date.parse(a.timestamp)
    const right = Date.parse(b.timestamp)
    return (Number.isFinite(left) ? left : Number.POSITIVE_INFINITY) - (Number.isFinite(right) ? right : Number.POSITIVE_INFINITY)
  })
  return <div className={styles.chartGroup}>
    <h3>{label}</h3>
    {units.length === 0
      ? <p><output aria-live="polite">{labels.noPoints}</output></p>
      : units.map(unit => {
        const values = chronological.map(point => {
          const reading = point[metric]
          const time = Date.parse(point.timestamp)
          return reading.status === 'available' && reading.unit === unit && Number.isFinite(reading.value) && Number.isFinite(time)
            ? { id: point.id, value: reading.value, time, timestamp: point.timestamp }
            : null
        })
        const validValues = values.flatMap(point => point ? [point.value] : [])
        const min = Math.min(...validValues)
        const max = Math.max(...validValues)
        const coordinates = values.map(point => point && ({
          id: point.id,
          x: maxTime === minTime ? 300 : 8 + ((point.time - minTime) / (maxTime - minTime)) * 584,
          y: max === min ? 74 : 128 - ((point.value - min) / (max - min)) * 104,
        }))
        const segments: { key: string; points: string; area: string }[] = []
        let segment: { firstId: string; lastId: string; coordinates: string[] } | null = null
        const pushSegment = () => {
          if (!segment || segment.coordinates.length < 2) return
          const points = segment.coordinates.join(' ')
          const [firstX] = segment.coordinates[0].split(',')
          const [lastX] = segment.coordinates.at(-1)!.split(',')
          segments.push({ key: `${segment.firstId}:${segment.lastId}`, points, area: `${points} ${lastX},128 ${firstX},128` })
        }
        for (const point of coordinates) {
          if (!point) {
            pushSegment()
            segment = null
          } else {
            segment ??= { firstId: point.id, lastId: point.id, coordinates: [] }
            segment.lastId = point.id
            segment.coordinates.push(`${point.x},${point.y}`)
          }
        }
        pushSegment()
        const accessiblePoints = chronological.map(point => `${formatDate(point.timestamp)}: ${readingText(point[metric], locale, labels)}`).join('; ')
        const firstTime = chronological.find(point => Number.isFinite(Date.parse(point.timestamp)))?.timestamp
        const lastTime = [...chronological].reverse().find(point => Number.isFinite(Date.parse(point.timestamp)))?.timestamp
        const hasGaps = chronological.some(point => point[metric].status !== 'available' || (point[metric].status === 'available' && point[metric].unit !== unit))
        return <div key={unit} className={styles.unitChart}>
          <p className={styles.axisSummary}>{formatAnalysisNumber(min, locale)} - {formatAnalysisNumber(max, locale)} {unit}</p>
          <div className={styles.plot}>
            <div className={styles.yAxis} aria-hidden="true"><span>{formatAnalysisNumber(max, locale)}</span><span>{formatAnalysisNumber(min, locale)}</span></div>
            <svg className={styles.chart} viewBox="0 0 600 144" role="img" aria-label={`${label} (${unit}): ${accessiblePoints}`}>
              <line className={styles.grid} x1="8" y1="20" x2="592" y2="20" />
              <line className={styles.grid} x1="8" y1="56" x2="592" y2="56" />
              <line className={styles.grid} x1="8" y1="92" x2="592" y2="92" />
              <line className={styles.axis} x1="8" y1="128" x2="592" y2="128" />
              <line className={styles.axis} x1="8" y1="20" x2="8" y2="128" />
              {segments.map(segment => <polygon key={`${segment.key}:area`} className={styles.area} points={segment.area} />)}
              {segments.map(segmentPath => <polyline key={segmentPath.key} points={segmentPath.points} />)}
              {coordinates.map(point => point && <circle key={point.id} cx={point.x} cy={point.y} r="4" />)}
            </svg>
          </div>
          {firstTime && lastTime && <div className={styles.timeAxis}><span>{formatDate(firstTime)}</span><span>{formatDate(lastTime)}</span></div>}
          {hasGaps && <p className={styles.gapNote}>{labels.gapsNote}</p>}
        </div>
      })}
  </div>
}

type SeriesFilterProps = Readonly<{
  query: AnalysisSeriesQuery
  fromDraft: string
  toDraft: string
  energyUnits: readonly string[]
  emissionsUnits: readonly string[]
  energyUnit: string
  emissionsUnit: string
  energyUnitRequired: boolean
  emissionsUnitRequired: boolean
  invalidEnergyUnit: boolean
  invalidEmissionsUnit: boolean
  invalidEnergyRange: boolean
  invalidEmissionsRange: boolean
  labels: Labels
  onClear: () => void
  onQueryChange: (query: AnalysisSeriesQuery) => void
  onUpdateDate: (field: 'from' | 'to', value: string) => void
}>

function SeriesFilters({ query, fromDraft, toDraft, energyUnits, emissionsUnits, energyUnit, emissionsUnit,
  energyUnitRequired, emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit, invalidEnergyRange,
  invalidEmissionsRange, labels, onClear, onQueryChange, onUpdateDate }: SeriesFilterProps) {
  return <div className={styles.filters}>
    <button type="button" onClick={onClear}>{labels.clearFilters}</button>
    <label>{labels.search}<input type="search" value={query.search} placeholder={labels.searchPlaceholder}
      onChange={event => onQueryChange({ ...query, search: event.target.value })} /></label>
    <label>{labels.from}<input type="datetime-local" value={fromDraft} onChange={event => onUpdateDate('from', event.target.value)} /></label>
    <label>{labels.to}<input type="datetime-local" value={toDraft} onChange={event => onUpdateDate('to', event.target.value)} /></label>
    <label>{labels.energyStatus}<select value={query.energyStatus} onChange={event => onQueryChange({ ...query, energyStatus: parseAnalysisSeriesReadingStatus(event.target.value) })}>
      <option value="">{labels.allStatuses}</option>
      <option value="available">{labels.availableStatus}</option><option value="unavailable">{labels.unavailableStatus}</option>
      <option value="not-calculable">{labels.notCalculableStatus}</option>
    </select></label>
    <label>{labels.emissionsStatus}<select value={query.emissionsStatus} onChange={event => onQueryChange({ ...query, emissionsStatus: parseAnalysisSeriesReadingStatus(event.target.value) })}>
      <option value="">{labels.allStatuses}</option>
      <option value="available">{labels.availableStatus}</option><option value="unavailable">{labels.unavailableStatus}</option>
      <option value="not-calculable">{labels.notCalculableStatus}</option>
    </select></label>
    <label>{labels.energyUnit}<select value={energyUnit} onChange={event => onQueryChange({ ...query, energyUnit: event.target.value })}>
      <option value="">{labels.selectUnit}</option>
      {energyUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
    </select></label>
    <label>{labels.energyMin}<input type="number" step="any" value={query.energyMin} disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0}
      aria-invalid={invalidEnergyRange || undefined} onChange={event => onQueryChange({ ...query, energyMin: event.target.value })} /></label>
    <label>{labels.energyMax}<input type="number" step="any" value={query.energyMax} disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0}
      aria-invalid={invalidEnergyRange || undefined} onChange={event => onQueryChange({ ...query, energyMax: event.target.value })} /></label>
    {emissionsUnits.length > 1 && <label>{labels.emissionsUnit}<select value={emissionsUnit} onChange={event => onQueryChange({ ...query, emissionsUnit: event.target.value })}>
      <option value="">{labels.selectUnit}</option>
      {emissionsUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
    </select></label>}
    <label>{labels.emissionsMin}<input type="number" step="any" value={query.emissionsMin} disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0}
      aria-invalid={invalidEmissionsRange || undefined} onChange={event => onQueryChange({ ...query, emissionsMin: event.target.value })} /></label>
    <label>{labels.emissionsMax}<input type="number" step="any" value={query.emissionsMax} disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0}
      aria-invalid={invalidEmissionsRange || undefined} onChange={event => onQueryChange({ ...query, emissionsMax: event.target.value })} /></label>
  </div>
}

type SeriesTableProps = Readonly<{
  points: readonly AnalysisSeriesPoint[]
  filteredPoints: readonly AnalysisSeriesPoint[]
  visiblePoints: readonly AnalysisSeriesPoint[]
  page: number
  pageCount: number
  pageSize: AnalysisSeriesPageSize
  firstRow: number
  lastRow: number
  energyUnitRequired: boolean
  emissionsUnitRequired: boolean
  invalidEnergyUnit: boolean
  invalidEmissionsUnit: boolean
  energyUnits: readonly string[]
  emissionsUnits: readonly string[]
  locale: string
  labels: Labels
  formatDate: (value: string) => string
  sortState: (column: AnalysisSeriesQuery['sort']) => 'none' | 'ascending' | 'descending'
  onSort: (column: AnalysisSeriesQuery['sort']) => void
  onPaginationChange: (page: number | null, pageSize: AnalysisSeriesPageSize) => void
  onInspectContributions?: (bucketStart: string) => void
}>

function SeriesTable({ points, filteredPoints, visiblePoints, page, pageCount, pageSize, firstRow, lastRow,
  energyUnitRequired, emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit, energyUnits, emissionsUnits,
  locale, labels, formatDate, sortState, onSort, onPaginationChange, onInspectContributions }: SeriesTableProps) {
  const emptyMessage = points.length === 0 ? labels.noPoints : labels.noMatches
  return <>
    <table className={styles.table}>
      <thead><tr>
        <th scope="col" aria-sort={sortState('moment')}><button type="button" onClick={() => onSort('moment')}>{labels.moment}</button></th>
        <th scope="col" aria-sort={sortState('energy')}><button type="button" disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0} onClick={() => onSort('energy')}>{labels.energy}</button></th>
        <th scope="col" aria-sort={sortState('emissions')}><button type="button" disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0} onClick={() => onSort('emissions')}>{labels.emissions}</button></th>
      </tr></thead>
      <tbody>{filteredPoints.length === 0
        ? <tr><td colSpan={3}>{emptyMessage}</td></tr>
        : visiblePoints.map(point => <tr key={point.id}>
          <td>{formatDate(point.timestamp)}{onInspectContributions && <button type="button" onClick={() => onInspectContributions(point.timestamp)}>{labels.inspectContributions}</button>}</td>
          <td>{readingText(point.energy, locale, labels)}</td>
          <td>{readingText(point.emissions, locale, labels)}</td>
        </tr>)}</tbody>
    </table>
    <div className={styles.pagination}>
      <label>{labels.pageSize}<select value={pageSize} onChange={event => onPaginationChange(1, parseAnalysisSeriesPageSize(event.target.value))}>
        {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
        <option value="all">{labels.allRows}</option>
      </select></label>
      {pageCount > 1 && <label>{labels.pageChoice}<select value={page} onChange={event => onPaginationChange(Number(event.target.value), pageSize)}>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => <option key={number} value={number}>{number}</option>)}
      </select></label>}
      <button type="button" disabled={page <= 1} onClick={() => onPaginationChange(page - 1, pageSize)}>{labels.previous}</button>
      {pageCount > 1 && <output aria-live="polite">{labels.pageStatus(page, pageCount)}</output>}
      <output aria-live="polite">{labels.rangeStatus(firstRow, lastRow, filteredPoints.length)}</output>
      <button type="button" disabled={page >= pageCount} onClick={() => onPaginationChange(page + 1, pageSize)}>{labels.next}</button>
    </div>
  </>
}

type SeriesTableViewProps = SeriesFilterProps & Readonly<{
  invalidDateRange: boolean
  tableProps: SeriesTableProps
}>

function SeriesTableView({ invalidDateRange, tableProps, ...filterProps }: SeriesTableViewProps) {
  const { labels } = filterProps
  return <div className={styles.tableScroll}>
    <SeriesFilters {...filterProps} />
    {invalidDateRange && <p role="alert" className={styles.invalidRange}>{labels.invalidDateRange}</p>}
    {(filterProps.invalidEnergyRange || filterProps.invalidEmissionsRange) && <p role="alert" className={styles.invalidRange}>{labels.invalidNumericRange}</p>}
    {(filterProps.invalidEnergyUnit || filterProps.invalidEmissionsUnit) && <p role="alert" className={styles.invalidRange}>{labels.invalidUnit}</p>}
    {(filterProps.energyUnitRequired || filterProps.emissionsUnitRequired) && <p className={styles.invalidRange}><output aria-live="polite">{labels.mixedUnits}</output></p>}
    <SeriesTable {...tableProps} />
  </div>
}

type SeriesContentProps = Readonly<{
  series: AnalysisSeriesResult
  state: 'loading' | 'refreshing' | 'available' | 'unavailable' | 'error' | 'invalid-period'
  view: 'graph' | 'table'
  metric: 'energy' | 'emissions'
  locale: string
  labels: Labels
  formatDate: (value: string) => string
  invalidDateRange: boolean
  filterProps: SeriesFilterProps
  tableProps: SeriesTableProps
}>

function SeriesContent({ series, state, view, metric, locale, labels, formatDate, invalidDateRange, filterProps, tableProps }: SeriesContentProps) {
  if (series.status === 'unavailable') {
    const message = state === 'loading' ? labels.loading : `${labels.unavailable}: ${labels.reasons[series.reason]}`
    return <p><output aria-live="polite">{message}</output></p>
  }
  if (view === 'graph') {
    return <div className={styles.charts}>
      <Chart points={series.points} metric={metric} label={metric === 'energy' ? labels.energyChart : labels.emissionsChart}
        locale={locale} formatDate={formatDate} labels={labels} />
    </div>
  }
  return <SeriesTableView {...filterProps} invalidDateRange={invalidDateRange} tableProps={tableProps} />
}

export function AnalysisSeries({ series, state, locale, labels, formatDate, page, pageSize, query, onPaginationChange, onQueryChange, onInspectContributions, controlContent }: Readonly<{
  series: AnalysisSeriesResult
  state: 'loading' | 'refreshing' | 'available' | 'unavailable' | 'error' | 'invalid-period'
  locale: string
  labels: Labels
  formatDate: (value: string) => string
  page: number
  pageSize: AnalysisSeriesPageSize
  query: AnalysisSeriesQuery
  onPaginationChange: (page: number | null, pageSize: AnalysisSeriesPageSize) => void
  onQueryChange: (query: AnalysisSeriesQuery) => void
  onInspectContributions?: (bucketStart: string) => void
  controlContent?: ReactNode
}>) {
  const [view, setView] = useState<'graph' | 'table'>('graph')
  const [metric, setMetric] = useState<'energy' | 'emissions'>('energy')
  const fromKey = JSON.stringify([query.from, query.timeZone])
  const toKey = JSON.stringify([query.to, query.timeZone])
  const [fromDraftState, setFromDraftState] = useState(() => ({ key: fromKey, value: formatInstantForDateTimeInput(query.from, query.timeZone) }))
  const [toDraftState, setToDraftState] = useState(() => ({ key: toKey, value: formatInstantForDateTimeInput(query.to, query.timeZone) }))
  const fromDraft = fromDraftState.key === fromKey ? fromDraftState.value : formatInstantForDateTimeInput(query.from, query.timeZone)
  const toDraft = toDraftState.key === toKey ? toDraftState.value : formatInstantForDateTimeInput(query.to, query.timeZone)
  const points = series.status === 'available' ? series.points : []
  const energyUnits = collectSeriesUnits(points, 'energy')
  const emissionsUnits = collectSeriesUnits(points, 'emissions')
  const energyUnit = query.energyUnit || (energyUnits.length === 1 ? energyUnits[0] : '')
  const emissionsUnit = query.emissionsUnit || (emissionsUnits.length === 1 ? emissionsUnits[0] : '')
  const energyUnitRequired = energyUnits.length > 1 && !energyUnit
  const emissionsUnitRequired = emissionsUnits.length > 1 && !emissionsUnit
  const invalidEnergyUnit = query.energyUnit !== '' && energyUnits.length > 0 && !energyUnits.includes(query.energyUnit)
  const invalidEmissionsUnit = query.emissionsUnit !== '' && emissionsUnits.length > 0 && !emissionsUnits.includes(query.emissionsUnit)
  const energyRange = readNumericRange(query.energyMin, query.energyMax)
  const emissionsRange = readNumericRange(query.emissionsMin, query.emissionsMax)
  const dateRange = hasInvalidDateRange(query, fromDraft, toDraft)
  const invalidDateRange = dateRange.invalid
  const invalidEnergyRange = energyRange.invalid
  const invalidEmissionsRange = emissionsRange.invalid
  const formatSeriesDate = (value: string) => {
    const timestamp = Date.parse(value)
    if (!Number.isFinite(timestamp)) return formatDate(value)
    try { return new Intl.DateTimeFormat(locale, { timeZone: query.timeZone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(timestamp)) }
    catch { return formatDate(value) }
  }
  const updateDate = (field: 'from' | 'to', value: string) => {
    if (field === 'from') setFromDraftState({ key: fromKey, value })
    else setToDraftState({ key: toKey, value })
    const instant = value === '' ? '' : parseDateTimeInputInZone(value, query.timeZone)
    if (instant !== null) onQueryChange({ ...query, [field]: instant })
  }
  const filteredPoints = selectSeriesPoints(points, {
    query, locale, energyUnit, emissionsUnit, energyUnits, emissionsUnits, energyRange, emissionsRange,
    fromTime: dateRange.fromTime, toTime: dateRange.toTime, invalidDateRange, invalidEnergyUnit, invalidEmissionsUnit,
    energyUnitRequired, emissionsUnitRequired, formatDate: formatSeriesDate, labels,
  })
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredPoints.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), pageCount)
  useEffect(() => {
    if (series.status === 'available' && page !== currentPage) {
      onPaginationChange(currentPage === 1 ? null : currentPage, pageSize)
    }
  }, [currentPage, onPaginationChange, page, pageSize, series.status])
  const visiblePoints = pageSize === 'all' ? filteredPoints : filteredPoints.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rowRange = readSeriesRowRange(filteredPoints.length, currentPage, pageSize)
  const toggleSort = (column: AnalysisSeriesQuery['sort']) => {
    if (!column) return
    const direction = query.sort === column && query.direction === 'asc' ? 'desc' : 'asc'
    onQueryChange({ ...query, sort: column, direction })
  }
  const sortState = (column: AnalysisSeriesQuery['sort']) => {
    if ((column === 'energy' && (energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0)) ||
      (column === 'emissions' && (emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0)) || query.sort !== column) return 'none'
    return query.direction === 'asc' ? 'ascending' : 'descending'
  }
  const clearFilters = () => {
    setFromDraftState({ key: fromKey, value: '' })
    setToDraftState({ key: toKey, value: '' })
    onQueryChange({ ...query, search: '', energyStatus: '', emissionsStatus: '', from: '', to: '',
      timeZone: getBrowserTimeZone(), energyUnit: '', emissionsUnit: '', energyMin: '', energyMax: '', emissionsMin: '', emissionsMax: '' })
  }
  const filterProps: SeriesFilterProps = {
    query, fromDraft, toDraft, energyUnits, emissionsUnits, energyUnit, emissionsUnit, energyUnitRequired,
    emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit, invalidEnergyRange, invalidEmissionsRange,
    labels, onClear: clearFilters, onQueryChange, onUpdateDate: updateDate,
  }
  const tableProps: SeriesTableProps = {
    points, filteredPoints, visiblePoints, page: currentPage, pageCount, pageSize, firstRow: rowRange.first,
    lastRow: rowRange.last, energyUnitRequired, emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit,
    energyUnits, emissionsUnits, locale, labels, formatDate: formatSeriesDate, sortState, onSort: toggleSort,
    onPaginationChange, onInspectContributions,
  }
  return <section className={styles.section} aria-labelledby="analysis-series-heading">
    <div className={styles.header}>
      <h2 id="analysis-series-heading">{labels.heading}</h2>
      <div className={styles.controls}>
      {controlContent}
      <div className={styles.metricToggle} role="group" aria-label={labels.metricToggle}>
        <button type="button" aria-pressed={metric === 'energy'} onClick={() => setMetric('energy')}>{labels.energy}</button>
        <button type="button" aria-pressed={metric === 'emissions'} onClick={() => setMetric('emissions')}>{labels.emissions}</button>
      </div>
      <div className={styles.toggle} aria-label={labels.heading}>
        <button type="button" aria-pressed={view === 'graph'} onClick={() => setView('graph')}>{labels.graph}</button>
        <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>{labels.table}</button>
      </div>
      </div>
    </div>
    <p className={styles.timeZone}>{labels.timeZone(query.timeZone)}</p>
    <SeriesContent series={series} state={state} view={view} metric={metric} locale={locale} labels={labels} formatDate={formatSeriesDate}
      invalidDateRange={invalidDateRange} filterProps={filterProps} tableProps={tableProps} />
  </section>
}
