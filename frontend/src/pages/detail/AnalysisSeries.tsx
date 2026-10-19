import { useEffect, useState } from 'react'
import type { AnalysisPresentationReason, AnalysisReading, AnalysisSeriesPoint, AnalysisSeriesResult } from '../../features/analysis/source.ts'
import { formatInstantForDateTimeInput, getBrowserTimeZone, parseDateTimeInputInZone, parseAnalysisSeriesPageSize, parseAnalysisSeriesReadingStatus, type AnalysisSeriesPageSize, type AnalysisSeriesQuery } from './seriesQuery.ts'
import styles from './AnalysisSeries.module.css'

type Labels = Readonly<{
  heading: string
  graph: string
  table: string
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
  mixedUnits: string
  previous: string
  next: string
  rangeStatus: (start: number, end: number, count: number) => string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>

function readingText(reading: AnalysisReading, locale: string, labels: Labels) {
  if (reading.status === 'available') return `${formatAnalysisNumber(reading.value, locale)} ${reading.unit}`
  const message = reading.status === 'not-calculable' ? labels.notCalculable : labels.unavailable
  return `${message}: ${labels.reasons[reading.reason]}`
}

function formatAnalysisNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)
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
      ? <p role="status">{labels.noPoints}</p>
      : units.map(unit => {
        const values = chronological.map(point => {
          const reading = point[metric]
          const time = Date.parse(point.timestamp)
          return reading.status === 'available' && reading.unit === unit && Number.isFinite(reading.value) && Number.isFinite(time)
            ? { value: reading.value, time, timestamp: point.timestamp }
            : null
        })
        const validValues = values.flatMap(point => point ? [point.value] : [])
        const min = Math.min(...validValues)
        const max = Math.max(...validValues)
        const coordinates = values.map(point => point && ({
          x: maxTime === minTime ? 300 : 8 + ((point.time - minTime) / (maxTime - minTime)) * 584,
          y: max === min ? 74 : 128 - ((point.value - min) / (max - min)) * 104,
        }))
        const segments: string[] = []
        let segment: string[] = []
        for (const point of coordinates) {
          if (!point) {
            if (segment.length > 1) segments.push(segment.join(' '))
            segment = []
          } else segment.push(`${point.x},${point.y}`)
        }
        if (segment.length > 1) segments.push(segment.join(' '))
        const accessiblePoints = chronological.map(point => `${formatDate(point.timestamp)}: ${readingText(point[metric], locale, labels)}`).join('; ')
        const firstTime = chronological.find(point => Number.isFinite(Date.parse(point.timestamp)))?.timestamp
        const lastTime = [...chronological].reverse().find(point => Number.isFinite(Date.parse(point.timestamp)))?.timestamp
        const hasGaps = chronological.some(point => point[metric].status !== 'available' || (point[metric].status === 'available' && point[metric].unit !== unit))
        return <div key={unit} className={styles.unitChart}>
          <p className={styles.axisSummary}>{formatAnalysisNumber(min, locale)} - {formatAnalysisNumber(max, locale)} {unit}</p>
          <div className={styles.plot}>
            <div className={styles.yAxis} aria-hidden="true"><span>{formatAnalysisNumber(max, locale)}</span><span>{formatAnalysisNumber(min, locale)}</span></div>
            <svg className={styles.chart} viewBox="0 0 600 144" role="img" aria-label={`${label} (${unit}): ${accessiblePoints}`}>
              <line className={styles.axis} x1="8" y1="128" x2="592" y2="128" />
              <line className={styles.axis} x1="8" y1="20" x2="8" y2="128" />
              {segments.map((path, index) => <polyline key={index} points={path} />)}
              {coordinates.map((point, index) => point && <circle key={index} cx={point.x} cy={point.y} r="4" />)}
            </svg>
          </div>
          {firstTime && lastTime && <div className={styles.timeAxis}><span>{formatDate(firstTime)}</span><span>{formatDate(lastTime)}</span></div>}
          {hasGaps && <p className={styles.gapNote}>{labels.gapsNote}</p>}
        </div>
      })}
  </div>
}

export function AnalysisSeries({ series, state, locale, labels, formatDate, page, pageSize, query, onPaginationChange, onQueryChange }: Readonly<{
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
}>) {
  const [view, setView] = useState<'graph' | 'table'>('graph')
  const fromKey = JSON.stringify([query.from, query.timeZone])
  const toKey = JSON.stringify([query.to, query.timeZone])
  const [fromDraftState, setFromDraftState] = useState(() => ({ key: fromKey, value: formatInstantForDateTimeInput(query.from, query.timeZone) }))
  const [toDraftState, setToDraftState] = useState(() => ({ key: toKey, value: formatInstantForDateTimeInput(query.to, query.timeZone) }))
  const fromDraft = fromDraftState.key === fromKey ? fromDraftState.value : formatInstantForDateTimeInput(query.from, query.timeZone)
  const toDraft = toDraftState.key === toKey ? toDraftState.value : formatInstantForDateTimeInput(query.to, query.timeZone)
  const points = series.status === 'available' ? series.points : []
  const energyUnits = [...new Set(points.flatMap(point => point.energy.status === 'available' && Number.isFinite(point.energy.value) ? [point.energy.unit] : []))]
  const emissionsUnits = [...new Set(points.flatMap(point => point.emissions.status === 'available' && Number.isFinite(point.emissions.value) ? [point.emissions.unit] : []))]
  const energyUnit = query.energyUnit || (energyUnits.length === 1 ? energyUnits[0] : '')
  const emissionsUnit = query.emissionsUnit || (emissionsUnits.length === 1 ? emissionsUnits[0] : '')
  const energyUnitRequired = energyUnits.length > 1 && !energyUnit
  const emissionsUnitRequired = emissionsUnits.length > 1 && !emissionsUnit
  const invalidEnergyUnit = query.energyUnit !== '' && energyUnits.length > 0 && !energyUnits.includes(query.energyUnit)
  const invalidEmissionsUnit = query.emissionsUnit !== '' && emissionsUnits.length > 0 && !emissionsUnits.includes(query.emissionsUnit)
  const energyRangeActive = query.energyMin !== '' || query.energyMax !== ''
  const minValue = query.energyMin === '' ? null : Number(query.energyMin)
  const maxValue = query.energyMax === '' ? null : Number(query.energyMax)
  const invalidEnergyRange = (minValue !== null && !Number.isFinite(minValue)) || (maxValue !== null && !Number.isFinite(maxValue)) ||
    (minValue !== null && maxValue !== null && minValue > maxValue)
  const emissionsRangeActive = query.emissionsMin !== '' || query.emissionsMax !== ''
  const emissionsMinValue = query.emissionsMin === '' ? null : Number(query.emissionsMin)
  const emissionsMaxValue = query.emissionsMax === '' ? null : Number(query.emissionsMax)
  const invalidEmissionsRange = (emissionsMinValue !== null && !Number.isFinite(emissionsMinValue)) ||
    (emissionsMaxValue !== null && !Number.isFinite(emissionsMaxValue)) ||
    (emissionsMinValue !== null && emissionsMaxValue !== null && emissionsMinValue > emissionsMaxValue)
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale)
  const fromTime = query.from ? Date.parse(query.from) : null
  const toTime = query.to ? Date.parse(query.to) : null
  const hasExplicitTimeZone = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const invalidTimeZone = formatInstantForDateTimeInput('2000-01-01T00:00:00.000Z', query.timeZone) === ''
  const invalidDateRange = invalidTimeZone || (fromDraft !== '' && parseDateTimeInputInZone(fromDraft, query.timeZone) === null) ||
    (toDraft !== '' && parseDateTimeInputInZone(toDraft, query.timeZone) === null) ||
    (query.from !== '' && (!hasExplicitTimeZone(query.from) || !Number.isFinite(fromTime))) ||
    (query.to !== '' && (!hasExplicitTimeZone(query.to) || !Number.isFinite(toTime))) ||
    (fromTime !== null && toTime !== null && fromTime > toTime)
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
  const filteredPoints = points.filter(point => {
    const searchContent = normalize([
      formatSeriesDate(point.timestamp), readingText(point.energy, locale, labels), readingText(point.emissions, locale, labels),
    ].join(' '))
    const pointTime = Date.parse(point.timestamp)
    const energy = point.energy.status === 'available' && point.energy.unit === energyUnit ? point.energy.value : null
    const emissions = point.emissions.status === 'available' && point.emissions.unit === emissionsUnit ? point.emissions.value : null
    return !invalidDateRange && !invalidEnergyRange && !invalidEmissionsRange && !invalidEnergyUnit && !invalidEmissionsUnit &&
      (fromTime === null || pointTime >= fromTime) && (toTime === null || pointTime <= toTime) &&
      (!query.search || searchContent.includes(normalize(query.search))) &&
      (!query.energyStatus || point.energy.status === query.energyStatus) &&
      (!query.emissionsStatus || point.emissions.status === query.emissionsStatus) &&
      (energyUnits.length <= 1 || !energyUnit || point.energy.status !== 'available' || point.energy.unit === energyUnit) &&
      (emissionsUnits.length <= 1 || !emissionsUnit || point.emissions.status !== 'available' || point.emissions.unit === emissionsUnit) &&
      (!energyRangeActive || (!energyUnitRequired && energy !== null && (minValue === null || energy >= minValue) && (maxValue === null || energy <= maxValue))) &&
      (!emissionsRangeActive || (!emissionsUnitRequired && emissions !== null &&
        (emissionsMinValue === null || emissions >= emissionsMinValue) && (emissionsMaxValue === null || emissions <= emissionsMaxValue)))
  }).sort((left, right) => {
    if (!query.sort) return 0
    if ((query.sort === 'energy' && energyUnitRequired) || (query.sort === 'emissions' && emissionsUnitRequired)) return 0
    let leftValue: number | null = null
    let rightValue: number | null = null
    if (query.sort === 'moment') {
      const leftTime = Date.parse(left.timestamp), rightTime = Date.parse(right.timestamp)
      leftValue = Number.isFinite(leftTime) ? leftTime : null
      rightValue = Number.isFinite(rightTime) ? rightTime : null
    } else {
      const metric = query.sort
      const leftReading = left[metric], rightReading = right[metric]
      const unit = metric === 'energy' ? energyUnit : emissionsUnit
      leftValue = leftReading.status === 'available' && (!unit || leftReading.unit === unit) ? leftReading.value : null
      rightValue = rightReading.status === 'available' && (!unit || rightReading.unit === unit) ? rightReading.value : null
    }
    if (leftValue === null || rightValue === null) {
      if (leftValue === null && rightValue !== null) return 1
      if (leftValue !== null && rightValue === null) return -1
      return left.id.localeCompare(right.id)
    }
    const difference = leftValue - rightValue
    return difference === 0 ? left.id.localeCompare(right.id) : difference * (query.direction === 'asc' ? 1 : -1)
  })
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredPoints.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), pageCount)
  useEffect(() => {
    if (series.status === 'available' && page !== currentPage) {
      onPaginationChange(currentPage === 1 ? null : currentPage, pageSize)
    }
  }, [currentPage, onPaginationChange, page, pageSize, series.status])
  const visiblePoints = pageSize === 'all' ? filteredPoints : filteredPoints.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstRow = filteredPoints.length === 0 ? 0 : pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1
  const lastRow = pageSize === 'all' ? filteredPoints.length : Math.min(currentPage * pageSize, filteredPoints.length)
  const toggleSort = (column: AnalysisSeriesQuery['sort']) => {
    if (!column) return
    onQueryChange({ ...query, sort: column, direction: query.sort === column && query.direction === 'asc' ? 'desc' : 'asc' })
  }
  const sortState = (column: AnalysisSeriesQuery['sort']) => {
    if ((column === 'energy' && (energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0)) ||
      (column === 'emissions' && (emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0)) || query.sort !== column) return 'none'
    return query.direction === 'asc' ? 'ascending' : 'descending'
  }
  return <section className={styles.section} aria-labelledby="analysis-series-heading">
    <div className={styles.header}>
      <h2 id="analysis-series-heading">{labels.heading}</h2>
      <div className={styles.toggle} aria-label={labels.heading}>
        <button type="button" aria-pressed={view === 'graph'} onClick={() => setView('graph')}>{labels.graph}</button>
        <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>{labels.table}</button>
      </div>
    </div>
    <p className={styles.timeZone}>{labels.timeZone(query.timeZone)}</p>
    {series.status === 'unavailable'
      ? <p role="status">{state === 'loading' ? labels.loading : `${labels.unavailable}: ${labels.reasons[series.reason]}`}</p>
      : view === 'graph'
        ? <div className={styles.charts}>
          <Chart points={series.points} metric="energy" label={labels.energyChart} locale={locale} formatDate={formatSeriesDate} labels={labels} />
          <Chart points={series.points} metric="emissions" label={labels.emissionsChart} locale={locale} formatDate={formatSeriesDate} labels={labels} />
        </div>
        : <div className={styles.tableScroll}>
          <div className={styles.filters}>
            <button type="button" onClick={() => {
              setFromDraftState({ key: fromKey, value: '' })
              setToDraftState({ key: toKey, value: '' })
              onQueryChange({ ...query, search: '', energyStatus: '', emissionsStatus: '', from: '', to: '',
                timeZone: getBrowserTimeZone(), energyUnit: '', emissionsUnit: '', energyMin: '', energyMax: '', emissionsMin: '', emissionsMax: '' })
            }}>{labels.clearFilters}</button>
            <label>{labels.search}<input type="search" value={query.search} placeholder={labels.searchPlaceholder}
              onChange={event => onQueryChange({ ...query, search: event.target.value })} /></label>
            <label>{labels.from}<input type="datetime-local" value={fromDraft} onChange={event => updateDate('from', event.target.value)} /></label>
            <label>{labels.to}<input type="datetime-local" value={toDraft} onChange={event => updateDate('to', event.target.value)} /></label>
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
          {invalidDateRange && <p role="alert" className={styles.invalidRange}>{labels.invalidDateRange}</p>}
          {(invalidEnergyRange || invalidEmissionsRange) && <p role="alert" className={styles.invalidRange}>{labels.invalidNumericRange}</p>}
          {(invalidEnergyUnit || invalidEmissionsUnit) && <p role="alert" className={styles.invalidRange}>{labels.invalidUnit}</p>}
          {(energyUnitRequired || emissionsUnitRequired) && <p role="status" className={styles.invalidRange}>{labels.mixedUnits}</p>}
          <table className={styles.table}>
            <thead><tr>
              <th scope="col" aria-sort={sortState('moment')}><button type="button" onClick={() => toggleSort('moment')}>{labels.moment}</button></th>
              <th scope="col" aria-sort={sortState('energy')}><button type="button" disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0} onClick={() => toggleSort('energy')}>{labels.energy}</button></th>
              <th scope="col" aria-sort={sortState('emissions')}><button type="button" disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0} onClick={() => toggleSort('emissions')}>{labels.emissions}</button></th>
            </tr></thead>
            <tbody>{filteredPoints.length === 0
              ? <tr><td colSpan={3}>{points.length === 0 ? labels.noPoints : labels.noMatches}</td></tr>
              : visiblePoints.map((point) => <tr key={point.id}>
                <td>{formatSeriesDate(point.timestamp)}</td>
                <td>{readingText(point.energy, locale, labels)}</td>
                <td>{readingText(point.emissions, locale, labels)}</td>
              </tr>)}</tbody>
          </table>
          <div className={styles.pagination}>
            <label>{labels.pageSize}<select value={pageSize} onChange={(event) => {
              onPaginationChange(1, parseAnalysisSeriesPageSize(event.target.value))
            }}>
              {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
              <option value="all">{labels.allRows}</option>
            </select></label>
            {pageCount > 1 && <label>{labels.pageChoice}<select value={currentPage} onChange={(event) => onPaginationChange(Number(event.target.value), pageSize)}>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => <option key={number} value={number}>{number}</option>)}
            </select></label>}
            <button type="button" disabled={currentPage <= 1} onClick={() => onPaginationChange(currentPage - 1, pageSize)}>{labels.previous}</button>
            {pageCount > 1 && <span role="status">{labels.pageStatus(currentPage, pageCount)}</span>}
            <span role="status">{labels.rangeStatus(firstRow, lastRow, filteredPoints.length)}</span>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => onPaginationChange(currentPage + 1, pageSize)}>{labels.next}</button>
          </div>
        </div>}
  </section>
}
