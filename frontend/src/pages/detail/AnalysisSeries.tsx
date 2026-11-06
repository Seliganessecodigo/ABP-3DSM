import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatIntervalBoundary } from '../../utils/formatDate.ts'
import type { AnalysisPresentationReason, AnalysisReading, AnalysisSeriesEvent, AnalysisSeriesPoint, AnalysisSeriesResult } from '../../features/analysis/source.ts'
import { formatInstantForDateTimeInput, defaultTimeZone, parseDateTimeInputInZone, parseAnalysisSeriesPageSize, parseAnalysisSeriesReadingStatus, type AnalysisSeriesPageSize, type AnalysisSeriesQuery } from './seriesQuery.ts'
import { chartDomain, collectSeriesUnits, formatSeriesNumber, formatSeriesReading, hasInvalidDateRange, readNumericRange, readSeriesRowRange, selectSeriesPoints } from './analysisSeriesData.ts'
import styles from './AnalysisSeries.module.css'
import { stateIcons, stateLabel } from '../../features/applications/presentation.ts'

type Labels = Readonly<{
  heading: string
  historyIntervalsHeading: string
  regionHeading: string
  graph: string
  table: string
  metricToggle: string
  compareMetrics: string
  currentPeriod: string
  previousPeriod: string
  tooltipCurrent: string
  tooltipPrevious: string
  moment: string
  energy: string
  emissions: string
  coverage: string
  region: string
  methodology: string
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
  rangeBounds: string
  invalidDateRange: string
  energyStatus: string
  emissionsStatus: string
  columnFilters: string
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
  applyFilters: string
  closeFilters: string
  inspectContributions: string
  mixedUnits: string
  previous: string
  next: string
  rangeStatus: (start: number, end: number, count: number) => string
  focusEvent: string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>
type ChartLabels = Labels & Readonly<{
  eventsHeading: string
  eventSummary: (event: AnalysisSeriesEvent) => string
}>

function readingText(reading: AnalysisReading, locale: string, labels: Labels) {
  return formatSeriesReading(reading, locale, labels)
}

function paginationPages(page: number, pageCount: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const first = page <= 3 ? 2 : page >= pageCount - 2 ? pageCount - 3 : page - 1
  const last = page <= 3 ? 4 : page >= pageCount - 2 ? pageCount - 1 : page + 1
  return [1, ...(first > 2 ? ['ellipsis-start' as const] : []), ...Array.from({ length: last - first + 1 }, (_, index) => first + index), ...(last < pageCount - 1 ? ['ellipsis-end' as const] : []), pageCount]
}

function hasNoObservation(reading: AnalysisReading) {
  return reading.status !== 'available' && reading.reason === 'noObservation'
}

function coverageText(point: AnalysisSeriesPoint, locale: string) {
  if (!point.coverage) return '—'
  const energy = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(point.coverage.energy)
  const emissions = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(point.coverage.emissions)
  return energy === emissions ? energy : `E ${energy} · CO₂e ${emissions}`
}

function formatAnalysisNumber(value: number, locale: string) {
  return formatSeriesNumber(value, locale)
}

function formatChartValue(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 }).format(value)
}

type PlotPoint = Readonly<{ id: string; x: number; y: number }>

function chartSegments(points: readonly (PlotPoint | null)[], fill: boolean) {
  const segments: { key: string; points: string; area?: string }[] = []
  let segment: { firstId: string; lastId: string; coordinates: string[] } | null = null
  const pushSegment = () => {
    if (!segment || segment.coordinates.length < 2) return
    const path = segment.coordinates.join(' ')
    const [firstX] = segment.coordinates[0].split(',')
    const [lastX] = segment.coordinates.at(-1)!.split(',')
    segments.push({ key: `${segment.firstId}:${segment.lastId}`, points: path,
      ...(fill ? { area: `${path} ${lastX},108 ${firstX},108` } : {}) })
  }
  for (const point of points) {
    if (!point) { pushSegment(); segment = null }
    else {
      segment ??= { firstId: point.id, lastId: point.id, coordinates: [] }
      segment.lastId = point.id
      segment.coordinates.push(`${point.x},${point.y}`)
    }
  }
  pushSegment()
  return segments
}

function Chart({ points, comparisonPoints, events, metric, label, locale, timeZone, formatDate, labels, historyMode, chartStyle }: Readonly<{
  points: readonly AnalysisSeriesPoint[]
  comparisonPoints: readonly AnalysisSeriesPoint[]
  events: readonly AnalysisSeriesEvent[]
  metric: 'energy' | 'emissions'
  label: string
  locale: string
  timeZone: string
  formatDate: (value: string) => string
  labels: ChartLabels
  historyMode: boolean
  chartStyle: 'line' | 'columns'
}>) {
  const [activePointId, setActivePointId] = useState<string | null>(null)
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
        const displayUnit = metric === 'emissions' && unit === 'gCO2e' ? 'kgCO2e' : unit
        const displayScale = displayUnit === 'kgCO2e' && unit === 'gCO2e' ? 0.001 : 1
        const values = chronological.map(point => {
          const reading = point[metric]
          const time = Date.parse(point.timestamp)
          return reading.status === 'available' && reading.unit === unit && Number.isFinite(reading.value) && Number.isFinite(time)
            ? { id: point.id, value: reading.value * displayScale, time, timestamp: point.timestamp }
            : null
        })
        const comparisonChronological = [...comparisonPoints].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
        const comparisonValues = comparisonChronological.map(point => {
          const reading = point[metric]
          const time = Date.parse(point.timestamp)
          return reading.status === 'available' && reading.unit === unit && Number.isFinite(reading.value) && Number.isFinite(time)
            ? { id: point.id, value: reading.value * displayScale, time }
            : null
        })
        const validValues = [...values, ...comparisonValues].flatMap(point => point ? [point.value] : [])
        const domain = chartDomain(validValues)
        const chartRange = domain.maximum - domain.minimum
        const barWidth = Math.max(1.5, Math.min(20, 584 / Math.max(chronological.length, 1) * 0.34))
        const coordinates: (PlotPoint | null)[] = values.map(point => point && ({
          id: point.id,
          x: maxTime === minTime ? 300 : 8 + ((point.time - minTime) / (maxTime - minTime)) * 584,
          y: 108 - ((point.value - domain.minimum) / chartRange) * 108,
        }))
        const segments = chartSegments(coordinates, true)
        const interactivePoints = new Map<number, { point: PlotPoint; reading: NonNullable<typeof values[number]> }>()
        coordinates.forEach((point, index) => {
          const reading = values[index]
          if (point && reading) interactivePoints.set(Math.floor(point.x / 24), { point, reading })
        })
        const markerGroups = new Map<number, { id: string; x: number; title: string; count: number }>()
        for (const event of events) {
          const time = Date.parse(event.at)
          if (!Number.isFinite(time) || time < minTime || time > maxTime || chronological.length === 0) continue
          const x = maxTime === minTime ? 300 : 8 + ((time - minTime) / (maxTime - minTime)) * 584
          const bucket = Math.floor(x / 24)
          const marker = markerGroups.get(bucket) ?? { id: `event-bin-${bucket}`, x: bucket * 24 + 12, title: labels.eventSummary(event), count: 0 }
          marker.count += 1
          markerGroups.set(bucket, marker)
        }
        const eventMarkers = [...markerGroups.values()].map(marker => ({ ...marker,
          title: marker.count > 1 ? `${marker.title} · ${marker.count}` : marker.title }))
        const visibleEventCount = eventMarkers.reduce((total, marker) => total + marker.count, 0)
        const comparisonTimes = comparisonValues.flatMap(point => point ? [point.time] : [])
        const comparisonMinTime = comparisonTimes.length ? Math.min(...comparisonTimes) : 0
        const comparisonMaxTime = comparisonTimes.length ? Math.max(...comparisonTimes) : 0
        const comparisonCoordinates: (PlotPoint | null)[] = comparisonValues.map(point => point && ({
          id: point.id,
          x: comparisonMaxTime === comparisonMinTime ? 300 : 8 + ((point.time - comparisonMinTime) / (comparisonMaxTime - comparisonMinTime)) * 584,
          y: 108 - ((point.value - domain.minimum) / chartRange) * 108,
        }))
        const comparisonSegments = chartSegments(comparisonCoordinates, false)
        const activePointIndex = chronological.findIndex(point => point.id === activePointId)
        const activePoint = activePointIndex >= 0 ? values[activePointIndex] : null
        const activeComparison = activePointIndex >= 0 ? comparisonValues[activePointIndex] : null
        const activeCoordinate = activePointIndex >= 0 ? coordinates[activePointIndex] : null
        const accessiblePoints = chronological.map(point => `${formatDate(point.timestamp)}: ${readingText(point[metric], locale, labels)}`).join('; ')
        const axisPointCount = Math.min(7, chronological.length)
        const axisPoints = Array.from({ length: axisPointCount }, (_, index) => chronological[
          axisPointCount <= 1 ? 0 : Math.round(index * (chronological.length - 1) / (axisPointCount - 1))
        ])
        const hasGaps = chronological.some(point => point[metric].status !== 'available' || (point[metric].status === 'available' && point[metric].unit !== unit))
        return <div key={unit} className={styles.unitChart}>
          <p className={styles.axisSummary}>{formatAnalysisNumber(domain.minimum, locale)} - {formatAnalysisNumber(domain.maximum, locale)} {displayUnit}</p>
          <div className={styles.legend}><span className={styles.currentLegend}>{labels.currentPeriod}</span>
            {comparisonSegments.length > 0 && <span className={styles.previousLegend}>{labels.previousPeriod}</span>}
            {visibleEventCount > 0 && <span className={styles.eventLegend}>{visibleEventCount} · {labels.eventsHeading}</span>}
            {historyMode && <><span className={styles.axisLegend}>X · {labels.moment}</span><span className={styles.axisLegend}>Y · {label} ({displayUnit})</span></>}</div>
          <div className={styles.plot}>
            <div className={styles.yAxis} aria-hidden="true">{Array.from({ length: 5 }, (_, index) =>
              <span key={index}>{formatAnalysisNumber(domain.maximum - domain.step * index, locale)}</span>)}</div>
            <figure className={styles.chartFigure} aria-label={`${label} (${displayUnit}): ${accessiblePoints}`}>
            <svg className={styles.chart} viewBox="0 0 600 108" preserveAspectRatio="none" role="group" aria-label={`${label} (${displayUnit}): ${accessiblePoints}`}>
              {Array.from({ length: 5 }, (_, index) => <line key={index} className={styles.grid} x1="8" y1={index * 27} x2="592" y2={index * 27} />)}
              <line className={styles.axis} x1="8" y1="108" x2="592" y2="108" />
              <line className={styles.axis} x1="8" y1="0" x2="8" y2="108" />
              {(!historyMode || chartStyle === 'line') && segments.map(segment => segment.area && <polygon key={`${segment.key}:area`} className={styles.area} points={segment.area} />)}
              {comparisonSegments.map(segment => <polyline key={`previous:${segment.key}`} className={styles.previousSeries} points={segment.points} />)}
              {(!historyMode || chartStyle === 'line') && segments.map(segmentPath => <polyline key={segmentPath.key} points={segmentPath.points} />)}
              {historyMode && chartStyle === 'columns' && coordinates.map((point, index) => point && values[index] && <rect key={point.id}
                data-series-bar={metric} className={metric === 'emissions' ? styles.emissionsBar : styles.energyBar}
                x={point.x - barWidth / 2} y={point.y} width={barWidth} height={Math.max(0, 108 - point.y)}
                role="button" tabIndex={0} aria-label={`${formatDate(values[index].timestamp)}: ${formatChartValue(values[index].value, locale)} ${displayUnit}`}
                onMouseEnter={() => setActivePointId(point.id)} onMouseLeave={() => setActivePointId(null)}
                onFocus={() => setActivePointId(point.id)} onBlur={() => setActivePointId(null)}
                onKeyDown={event => { if (event.key === 'Escape') setActivePointId(null) }} />)}
              {eventMarkers.map(event => <g key={event.id} data-series-event-marker="true" data-event-count={event.count} className={styles.eventMarker}>
                <title>{event.title}</title><line x1={event.x} y1="100" x2={event.x} y2="108" />
              </g>)}
              {/* A ponta arredondada mantém o ponto circular quando o SVG muda de proporção. */}
              {(!historyMode || chartStyle === 'line') && [...interactivePoints.values()].map(({ point, reading }) => <path key={point.id} className={styles.point} d={`M${point.x} ${point.y}l0.01 0.01`} role="button" tabIndex={0}
                  aria-label={`${formatDate(reading.timestamp)}: ${formatChartValue(reading.value, locale)} ${displayUnit}`}
                  onMouseEnter={() => setActivePointId(point.id)} onMouseLeave={() => setActivePointId(null)}
                  onFocus={() => setActivePointId(point.id)} onBlur={() => setActivePointId(null)}
                  onKeyDown={event => { if (event.key === 'Escape') setActivePointId(null) }} />)}
            </svg>
              {activePoint && activeCoordinate && <div className={styles.chartTooltip} data-chart-tooltip="true" role="status" aria-live="polite"
                style={{ left: `clamp(8px, ${activeCoordinate.x / 6}%, calc(100% - 188px))`, top: `max(4px, calc(${activeCoordinate.y / 1.08}% - 80px))` }}>
                <span>{new Intl.DateTimeFormat(locale, { timeZone, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(activePoint.timestamp))}</span>
                <span>{labels.tooltipCurrent}: {formatChartValue(activePoint.value, locale)} {displayUnit}</span>
                {activeComparison && <span>{labels.tooltipPrevious}: {formatChartValue(activeComparison.value, locale)} {displayUnit}</span>}
              </div>}
            </figure>
          </div>
          <div className={styles.timeAxis}>{axisPoints.map(point => <time key={point.id} dateTime={point.timestamp}>
            {new Intl.DateTimeFormat(locale, { timeZone, month: '2-digit', day: '2-digit' }).format(new Date(point.timestamp))}
          </time>)}</div>
          {hasGaps && <p className={styles.gapNote}>{labels.gapsNote}</p>}
        </div>
      })}
  </div>
}

function ComparisonChart({ points, comparisonPoints, events, energyUnit, emissionsUnit, locale, timeZone, formatDate, labels, chartStyle }: Readonly<{
  points: readonly AnalysisSeriesPoint[]
  comparisonPoints: readonly AnalysisSeriesPoint[]
  events: readonly AnalysisSeriesEvent[]
  energyUnit: string
  emissionsUnit: string
  locale: string
  timeZone: string
  formatDate: (value: string) => string
  labels: ChartLabels
  chartStyle: 'line' | 'columns'
}>) {
  const [activePoint, setActivePoint] = useState<{ id: string; metric: 'energy' | 'emissions' } | null>(null)
  const chronological = [...points].sort((a, b) => {
    const left = Date.parse(a.timestamp)
    const right = Date.parse(b.timestamp)
    return (Number.isFinite(left) ? left : Number.POSITIVE_INFINITY) - (Number.isFinite(right) ? right : Number.POSITIVE_INFINITY)
  })
  const timestamps = chronological.map(point => Date.parse(point.timestamp)).filter(Number.isFinite)
  const minTime = timestamps.length ? Math.min(...timestamps) : 0
  const maxTime = timestamps.length ? Math.max(...timestamps) : 0
  const energyValues = chronological.map(point => point.energy.status === 'available' && point.energy.unit === energyUnit &&
    Number.isFinite(point.energy.value) && Number.isFinite(Date.parse(point.timestamp))
    ? { id: point.id, timestamp: point.timestamp, time: Date.parse(point.timestamp), value: point.energy.value }
    : null)
  const emissionsValues = chronological.map(point => point.emissions.status === 'available' && point.emissions.unit === emissionsUnit &&
    Number.isFinite(point.emissions.value) && Number.isFinite(Date.parse(point.timestamp))
    ? { id: point.id, timestamp: point.timestamp, time: Date.parse(point.timestamp), value: point.emissions.value }
    : null)
  const comparisonChronological = [...comparisonPoints].sort((a, b) => {
    const left = Date.parse(a.timestamp)
    const right = Date.parse(b.timestamp)
    return (Number.isFinite(left) ? left : Number.POSITIVE_INFINITY) - (Number.isFinite(right) ? right : Number.POSITIVE_INFINITY)
  })
  const previousEnergyValues = comparisonChronological.map(point => point.energy.status === 'available' && point.energy.unit === energyUnit &&
    Number.isFinite(point.energy.value) && Number.isFinite(Date.parse(point.timestamp))
    ? { id: point.id, time: Date.parse(point.timestamp), value: point.energy.value }
    : null)
  const previousEmissionsValues = comparisonChronological.map(point => point.emissions.status === 'available' && point.emissions.unit === emissionsUnit &&
    Number.isFinite(point.emissions.value) && Number.isFinite(Date.parse(point.timestamp))
    ? { id: point.id, time: Date.parse(point.timestamp), value: point.emissions.value }
    : null)
  const energyDomain = chartDomain([...energyValues, ...previousEnergyValues].flatMap(point => point ? [point.value] : []))
  const emissionsDomain = chartDomain([...emissionsValues, ...previousEmissionsValues].flatMap(point => point ? [point.value] : []))
  const coordinates = (values: readonly ({ id: string; time: number; value: number } | null)[], domain: ReturnType<typeof chartDomain>,
    range: Readonly<{ minimum: number; maximum: number }>): (PlotPoint | null)[] => values.map(point => point && ({
      id: point.id,
      x: range.maximum === range.minimum ? 300 : 8 + ((point.time - range.minimum) / (range.maximum - range.minimum)) * 584,
      y: 108 - ((point.value - domain.minimum) / (domain.maximum - domain.minimum)) * 108,
    }))
  const energyCoordinates = coordinates(energyValues, energyDomain, { minimum: minTime, maximum: maxTime })
  const emissionsCoordinates = coordinates(emissionsValues, emissionsDomain, { minimum: minTime, maximum: maxTime })
  const comparisonTimes = comparisonChronological.map(point => Date.parse(point.timestamp)).filter(Number.isFinite)
  const comparisonMinTime = comparisonTimes.length ? Math.min(...comparisonTimes) : 0
  const comparisonMaxTime = comparisonTimes.length ? Math.max(...comparisonTimes) : 0
  const comparisonRange = { minimum: comparisonMinTime, maximum: comparisonMaxTime }
  const previousEnergyCoordinates = coordinates(previousEnergyValues, energyDomain, comparisonRange)
  const previousEmissionsCoordinates = coordinates(previousEmissionsValues, emissionsDomain, comparisonRange)
  const energySegments = chartSegments(energyCoordinates, true)
  const emissionsSegments = chartSegments(emissionsCoordinates, false)
  const previousEnergySegments = chartSegments(previousEnergyCoordinates, false)
  const previousEmissionsSegments = chartSegments(previousEmissionsCoordinates, false)
  const barWidth = Math.max(1.5, Math.min(20, 584 / Math.max(chronological.length, 1) * 0.34))
  const markerGroups = new Map<number, { id: string; x: number; title: string; count: number }>()
  for (const event of events) {
    const time = Date.parse(event.at)
    if (!Number.isFinite(time) || time < minTime || time > maxTime || chronological.length === 0) continue
    const x = maxTime === minTime ? 300 : 8 + ((time - minTime) / (maxTime - minTime)) * 584
    const bucket = Math.floor(x / 24)
    const marker = markerGroups.get(bucket) ?? { id: `event-bin-${bucket}`, x: bucket * 24 + 12, title: labels.eventSummary(event), count: 0 }
    marker.count += 1
    markerGroups.set(bucket, marker)
  }
  const eventMarkers = [...markerGroups.values()].map(marker => ({ ...marker,
    title: marker.count > 1 ? `${marker.title} · ${marker.count}` : marker.title }))
  const visibleEventCount = eventMarkers.reduce((total, marker) => total + marker.count, 0)
  const hasGaps = chronological.some(point => point.energy.status !== 'available' || point.energy.unit !== energyUnit ||
    point.emissions.status !== 'available' || point.emissions.unit !== emissionsUnit)
  const axisPointCount = Math.min(7, chronological.length)
  const axisPoints = Array.from({ length: axisPointCount }, (_, index) => chronological[
    axisPointCount <= 1 ? 0 : Math.round(index * (chronological.length - 1) / (axisPointCount - 1))
  ])
  const activeIndex = activePoint ? chronological.findIndex(point => point.id === activePoint.id) : -1
  const activeEnergy = activeIndex >= 0 ? energyValues[activeIndex] : null
  const activeEmissions = activeIndex >= 0 ? emissionsValues[activeIndex] : null
  const activePreviousEnergy = activeIndex >= 0 ? previousEnergyValues[activeIndex] : null
  const activePreviousEmissions = activeIndex >= 0 ? previousEmissionsValues[activeIndex] : null
  const activeCoordinate = activeIndex >= 0
    ? activePoint?.metric === 'energy' ? energyCoordinates[activeIndex] : emissionsCoordinates[activeIndex]
    : null
  const hasPrevious = previousEnergySegments.length > 0 || previousEmissionsSegments.length > 0
  return <div className={styles.combinedChart}>
    <div className={styles.legend}>
      <span className={styles.energyLegend}>{labels.energy} ({energyUnit})</span>
      <span className={styles.emissionsLegend}>{labels.emissions} ({emissionsUnit})</span>
      {hasGaps && <span className={styles.gapLegend}>{labels.unavailableStatus}</span>}
      <span className={styles.axisLegend}>X · {labels.moment}</span>
      <span className={styles.axisLegend}>Y ← {labels.energy} ({energyUnit})</span>
      <span className={styles.axisLegend}>Y → {labels.emissions} ({emissionsUnit})</span>
      {hasPrevious && <span className={styles.previousLegend}>{labels.previousPeriod}</span>}
      {visibleEventCount > 0 && <span className={styles.eventLegend}>{visibleEventCount} · {labels.eventsHeading}</span>}
    </div>
    <div className={styles.comparisonPlot}>
      <div className={styles.yAxis} aria-hidden="true">{Array.from({ length: 5 }, (_, index) =>
        <span key={index}>{formatAnalysisNumber(energyDomain.maximum - energyDomain.step * index, locale)}</span>)}</div>
      <figure className={styles.chartFigure} aria-label={`${labels.energyChart} (${energyUnit}) · ${labels.emissionsChart} (${emissionsUnit})`}>
        <svg className={styles.chart} viewBox="0 0 600 108" preserveAspectRatio="none" role="group"
          aria-label={labels.heading}>
          {chronological.map(point => {
            if (point.energy.status === 'available' && point.emissions.status === 'available') return null
            const x = maxTime === minTime ? 300 : 8 + ((Date.parse(point.timestamp) - minTime) / (maxTime - minTime)) * 584
            const width = Math.min(48, 584 / Math.max(chronological.length, 1))
            const reasons = [...new Set([point.energy, point.emissions].flatMap(reading => reading.status === 'available' ? [] : [labels.reasons[reading.reason]]))]
            return <g key={`gap:${point.id}`} className={styles.gapBand}>
              <title>{formatDate(point.timestamp)} · {reasons.join(' · ')}</title>
              <rect x={Math.max(8, x - width / 2)} y="0" width={width} height="108" />
            </g>
          })}
          {Array.from({ length: 5 }, (_, index) => <line key={index} className={styles.grid} x1="8" y1={index * 27} x2="592" y2={index * 27} />)}
          <line className={styles.axis} x1="8" y1="108" x2="592" y2="108" />
          <line className={styles.axis} x1="8" y1="0" x2="8" y2="108" />
          <line className={styles.axis} x1="592" y1="0" x2="592" y2="108" />
          {chartStyle === 'line' && energySegments.map(segment => segment.area && <polygon key={`energy:${segment.key}:area`} className={styles.area} points={segment.area} />)}
          {previousEnergySegments.map(segment => <polyline key={`previous-energy:${segment.key}`} className={styles.previousSeries} points={segment.points} />)}
          {previousEmissionsSegments.map(segment => <polyline key={`previous-emissions:${segment.key}`} className={`${styles.previousSeries} ${styles.previousEmissionsSeries}`} points={segment.points} />)}
          {chartStyle === 'line' && energySegments.map(segment => <polyline key={`energy:${segment.key}`} points={segment.points} />)}
          {chartStyle === 'line' && emissionsSegments.map(segment => <polyline key={`emissions:${segment.key}`} className={styles.emissionsSeries} points={segment.points} />)}
          {chartStyle === 'columns' && energyCoordinates.map((point, index) => point && <rect key={`energy:${point.id}`} data-series-bar="energy"
            className={styles.energyBar} x={point.x - barWidth} y={point.y} width={barWidth} height={Math.max(0, 108 - point.y)}
            role="button" tabIndex={0}
            aria-label={`${formatDate(energyValues[index]!.timestamp)}: ${labels.energy} ${formatChartValue(energyValues[index]!.value, locale)} ${energyUnit}`}
            onMouseEnter={() => setActivePoint({ id: point.id, metric: 'energy' })}
            onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint({ id: point.id, metric: 'energy' })}
            onBlur={() => setActivePoint(null)} onKeyDown={event => { if (event.key === 'Escape') setActivePoint(null) }} />)}
          {chartStyle === 'columns' && emissionsCoordinates.map((point, index) => point && <rect key={`emissions:${point.id}`} data-series-bar="emissions"
            className={styles.emissionsBar} x={point.x} y={point.y} width={barWidth} height={Math.max(0, 108 - point.y)}
            role="button" tabIndex={0}
            aria-label={`${formatDate(emissionsValues[index]!.timestamp)}: ${labels.emissions} ${formatChartValue(emissionsValues[index]!.value, locale)} ${emissionsUnit}`}
            onMouseEnter={() => setActivePoint({ id: point.id, metric: 'emissions' })}
            onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint({ id: point.id, metric: 'emissions' })}
            onBlur={() => setActivePoint(null)} onKeyDown={event => { if (event.key === 'Escape') setActivePoint(null) }} />)}
          {chartStyle === 'line' && energyCoordinates.map((point, index) => point && <path key={`energy:${point.id}`} className={styles.point}
            d={`M${point.x} ${point.y}l0.01 0.01`} role="button" tabIndex={0}
            aria-label={`${formatDate(energyValues[index]!.timestamp)}: ${labels.energy} ${formatChartValue(energyValues[index]!.value, locale)} ${energyUnit}`}
            onMouseEnter={() => setActivePoint({ id: point.id, metric: 'energy' })} onMouseLeave={() => setActivePoint(null)}
            onFocus={() => setActivePoint({ id: point.id, metric: 'energy' })} onBlur={() => setActivePoint(null)} />)}
          {chartStyle === 'line' && emissionsCoordinates.map((point, index) => point && <path key={`emissions:${point.id}`} className={`${styles.point} ${styles.emissionsPoint}`}
            d={`M${point.x} ${point.y}l0.01 0.01`} role="button" tabIndex={0}
            aria-label={`${formatDate(emissionsValues[index]!.timestamp)}: ${labels.emissions} ${formatChartValue(emissionsValues[index]!.value, locale)} ${emissionsUnit}`}
            onMouseEnter={() => setActivePoint({ id: point.id, metric: 'emissions' })} onMouseLeave={() => setActivePoint(null)}
            onFocus={() => setActivePoint({ id: point.id, metric: 'emissions' })} onBlur={() => setActivePoint(null)} />)}
          {eventMarkers.map(event => <g key={event.id} data-series-event-marker="true" data-event-count={event.count} className={styles.eventMarker}>
            <title>{event.title}</title><line x1={event.x} y1="0" x2={event.x} y2="108" />
          </g>)}
        </svg>
        {activePoint && activeCoordinate && <div className={styles.chartTooltip} data-chart-tooltip="true" role="status" aria-live="polite"
          style={{ left: `clamp(8px, ${activeCoordinate.x / 6}%, calc(100% - 188px))`, top: `max(4px, calc(${activeCoordinate.y / 1.08}% - 80px))` }}>
          <span>{new Intl.DateTimeFormat(locale, { timeZone, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(chronological[activeIndex].timestamp))}</span>
          {activeEnergy && <span>{labels.tooltipCurrent} · {labels.energy}: {formatChartValue(activeEnergy.value, locale)} {energyUnit}</span>}
          {activeEmissions && <span>{labels.tooltipCurrent} · {labels.emissions}: {formatChartValue(activeEmissions.value, locale)} {emissionsUnit}</span>}
          {activePreviousEnergy && <span>{labels.tooltipPrevious} · {labels.energy}: {formatChartValue(activePreviousEnergy.value, locale)} {energyUnit}</span>}
          {activePreviousEmissions && <span>{labels.tooltipPrevious} · {labels.emissions}: {formatChartValue(activePreviousEmissions.value, locale)} {emissionsUnit}</span>}
        </div>}
      </figure>
      <div className={`${styles.yAxis} ${styles.rightAxis}`} aria-hidden="true">{Array.from({ length: 5 }, (_, index) =>
        <span key={index}>{formatAnalysisNumber(emissionsDomain.maximum - emissionsDomain.step * index, locale)}</span>)}</div>
    </div>
    <div className={`${styles.timeAxis} ${styles.comparisonTimeAxis}`}>{axisPoints.map(point => <time key={point.id} dateTime={point.timestamp}>
      {new Intl.DateTimeFormat(locale, { timeZone, month: '2-digit', day: '2-digit' }).format(new Date(point.timestamp))}
    </time>)}</div>
    {hasGaps && <p className={styles.gapNote}>{labels.gapsNote}</p>}
  </div>
}

type SeriesFilterProps = Readonly<{
  historyMode?: boolean
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
  invalidEmissionsRange, labels, onClear, onQueryChange, onUpdateDate, historyMode = false }: SeriesFilterProps) {
  const { t } = useTranslation('detail')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftQuery, setDraftQuery] = useState(query)
  const [draftFrom, setDraftFrom] = useState(fromDraft)
  const [draftTo, setDraftTo] = useState(toDraft)
  const filterButton = useRef<HTMLButtonElement>(null)
  const filterDialog = useRef<HTMLElement>(null)
  const closeFilters = () => { setFiltersOpen(false); filterButton.current?.focus() }
  useEffect(() => {
    if (!filtersOpen) return
    filterDialog.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeFilters(); return }
      if (event.key !== 'Tab') return
      const focusable = filterDialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleDialogKeys)
    return () => {
      document.removeEventListener('keydown', handleDialogKeys)
      document.body.style.overflow = previousOverflow
    }
  }, [filtersOpen])
  const isHistory = historyMode
  const updateDraft = (update: Partial<AnalysisSeriesQuery>) => setDraftQuery(current => ({ ...current, ...update }))
  const applyFilters = () => {
    const from = draftFrom === '' ? '' : parseDateTimeInputInZone(draftFrom, query.timeZone)
    const to = draftTo === '' ? '' : parseDateTimeInputInZone(draftTo, query.timeZone)
    if (from === null || to === null) return
    onQueryChange({ ...draftQuery, from, to })
    closeFilters()
  }
  return <div className={styles.filters}>
    <label className={styles.searchFilter}>{labels.search}<input type="search" value={query.search} placeholder={historyMode ? t('historySearchPlaceholder') : labels.searchPlaceholder}
      onChange={event => onQueryChange({ ...query, search: event.target.value })} /></label>
    {isHistory ? <button ref={filterButton} type="button" className={styles.filterTrigger} aria-expanded={filtersOpen}
      aria-controls="history-column-filters" onClick={() => {
        setDraftQuery(query); setDraftFrom(fromDraft); setDraftTo(toDraft); setFiltersOpen(true)
      }}>{labels.columnFilters}</button> : <details className={styles.columnFilters} open>
      <summary>{labels.columnFilters}</summary>
      <div className={styles.filterFields}>
        <button type="button" onClick={onClear}>{labels.clearFilters}</button>
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
    </details>}
    {isHistory && filtersOpen && <div className={styles.filterBackdrop} onMouseDown={event => {
      if (event.target === event.currentTarget) closeFilters()
    }}><section ref={filterDialog} id="history-column-filters" className={styles.filterDialog} role="dialog" aria-modal="true"
      aria-labelledby="history-filter-title" tabIndex={-1}>
      <header className={styles.filterDialogHeader}><div><h2 id="history-filter-title">{labels.columnFilters}</h2><p>{labels.searchPlaceholder}</p></div>
        <button type="button" aria-label={labels.closeFilters} onClick={closeFilters}>×</button></header>
      <div className={styles.filterDialogGrid}>
        <label>{labels.from}<input type="datetime-local" value={draftFrom} onChange={event => setDraftFrom(event.target.value)} /></label>
        <label>{labels.to}<input type="datetime-local" value={draftTo} onChange={event => setDraftTo(event.target.value)} /></label>
        <label>{labels.energyStatus}<select value={draftQuery.energyStatus} onChange={event => updateDraft({ energyStatus: parseAnalysisSeriesReadingStatus(event.target.value) })}>
          <option value="">{labels.allStatuses}</option><option value="available">{labels.availableStatus}</option><option value="unavailable">{labels.unavailableStatus}</option><option value="not-calculable">{labels.notCalculableStatus}</option>
        </select></label>
        <label>{labels.emissionsStatus}<select value={draftQuery.emissionsStatus} onChange={event => updateDraft({ emissionsStatus: parseAnalysisSeriesReadingStatus(event.target.value) })}>
          <option value="">{labels.allStatuses}</option><option value="available">{labels.availableStatus}</option><option value="unavailable">{labels.unavailableStatus}</option><option value="not-calculable">{labels.notCalculableStatus}</option>
        </select></label>
        <label>{labels.energyUnit}<select value={draftQuery.energyUnit} onChange={event => updateDraft({ energyUnit: event.target.value })}>
          <option value="">{labels.selectUnit}</option>{energyUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select></label>
        <label>{labels.energyMin}<input type="number" step="any" value={draftQuery.energyMin} disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0}
          aria-invalid={invalidEnergyRange || undefined} onChange={event => updateDraft({ energyMin: event.target.value })} /></label>
        <label>{labels.energyMax}<input type="number" step="any" value={draftQuery.energyMax} disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0}
          aria-invalid={invalidEnergyRange || undefined} onChange={event => updateDraft({ energyMax: event.target.value })} /></label>
        {emissionsUnits.length > 1 && <label>{labels.emissionsUnit}<select value={draftQuery.emissionsUnit} onChange={event => updateDraft({ emissionsUnit: event.target.value })}>
          <option value="">{labels.selectUnit}</option>{emissionsUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select></label>}
        <label>{labels.emissionsMin}<input type="number" step="any" value={draftQuery.emissionsMin} disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0}
          aria-invalid={invalidEmissionsRange || undefined} onChange={event => updateDraft({ emissionsMin: event.target.value })} /></label>
        <label>{labels.emissionsMax}<input type="number" step="any" value={draftQuery.emissionsMax} disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0}
          aria-invalid={invalidEmissionsRange || undefined} onChange={event => updateDraft({ emissionsMax: event.target.value })} /></label>
      </div>
      <footer className={styles.filterDialogFooter}><button type="button" onClick={() => { onClear(); closeFilters() }}>{labels.clearFilters}</button>
        <button type="button" onClick={applyFilters}>{labels.applyFilters}</button></footer>
    </section></div>}
  </div>
}

type SeriesTableProps = Readonly<{
  historyMode?: boolean
  historyRegionFallback?: string | null
  historyMethodologyFallback?: string | null
  activeFilterCount?: number
  tableEvents?: readonly AnalysisSeriesEvent[]
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

function SeriesTable({ points, filteredPoints, visiblePoints, page, pageCount, pageSize, firstRow, lastRow, tableEvents = [], activeFilterCount = 0,
  historyRegionFallback = null, historyMethodologyFallback = null,
  energyUnitRequired, emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit, energyUnits, emissionsUnits,
  locale, labels, formatDate, sortState, onSort, onPaginationChange, onInspectContributions, historyMode = false }: SeriesTableProps) {
  const { t } = useTranslation('detail')
  const { t: tCommon } = useTranslation('common')
  const emptyMessage = points.length === 0 ? labels.noPoints : labels.noMatches
  const metadataAt = (point: AnalysisSeriesPoint, eventType: 'region_changed' | 'methodology_changed', key: string) => {
    const events = (tableEvents ?? []).filter(event => event.type === eventType).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    const beforePoint = events.filter(event => Date.parse(event.at) <= Date.parse(point.timestamp)).at(-1)
    const snapshot = beforePoint?.details.after ?? events.find(event => Date.parse(event.at) > Date.parse(point.timestamp))?.details.before
    if (!snapshot || typeof snapshot !== 'object') return eventType === 'region_changed'
      ? historyRegionFallback ?? '—' : historyMethodologyFallback ?? '—'
    const value = (snapshot as Record<string, unknown>)[key]
    if (typeof value === 'string') return value
    if (key === 'regionCode') {
      const location = (snapshot as Record<string, unknown>).location
      if (location && typeof location === 'object' && typeof (location as Record<string, unknown>).regionCode === 'string') return (location as Record<string, unknown>).regionCode as string
    }
    return eventType === 'region_changed' ? historyRegionFallback ?? '—' : historyMethodologyFallback ?? '—'
  }
  const stateFor = (point: AnalysisSeriesPoint) => {
    if (point.energy.status === 'available' && point.emissions.status === 'available') return 'AVAILABLE' as const
    if (hasNoObservation(point.energy) && hasNoObservation(point.emissions)) return 'NO_METRICS' as const
    return 'UNAVAILABLE' as const
  }
  const statusReason = (point: AnalysisSeriesPoint) => [...new Set([point.energy, point.emissions]
    .flatMap(reading => reading.status === 'available' ? [] : [labels.reasons[reading.reason]]))].join(' · ')
  return <>
    {historyMode && <p className={styles.intervalStatus}>{filteredPoints.length} {t('historyIntervalsUnit')} · {activeFilterCount === 0 ? t('historyNoFilters') : t('historyActiveFilters', { count: activeFilterCount })}</p>}
    <table className={styles.table}>
      <thead><tr>
        <th scope="col" aria-sort={sortState('moment')}><button className={styles.sortButton} type="button" onClick={() => onSort('moment')}>{historyMode ? t('historyStart') : labels.moment}<span aria-hidden="true">{sortState('moment') === 'ascending' ? '↑' : sortState('moment') === 'descending' ? '↓' : ''}</span></button></th>
        <th scope="col" aria-sort={sortState('energy')}><button className={styles.sortButton} type="button" disabled={energyUnitRequired || invalidEnergyUnit || energyUnits.length === 0} onClick={() => onSort('energy')}>{labels.energy}<span aria-hidden="true">{sortState('energy') === 'ascending' ? '↑' : sortState('energy') === 'descending' ? '↓' : ''}</span></button></th>
        <th scope="col" aria-sort={sortState('emissions')}><button className={styles.sortButton} type="button" disabled={emissionsUnitRequired || invalidEmissionsUnit || emissionsUnits.length === 0} onClick={() => onSort('emissions')}>{labels.emissions}<span aria-hidden="true">{sortState('emissions') === 'ascending' ? '↑' : sortState('emissions') === 'descending' ? '↓' : ''}</span></button></th>
        {historyMode && <><th scope="col">{labels.coverage}</th><th scope="col">{labels.region}</th><th scope="col">{t('historyMethodology')}</th></>}
        {historyMode && <th scope="col">{tCommon('state.label')}</th>}
        {historyMode && onInspectContributions && <th scope="col">{t('historyAction')}</th>}
      </tr></thead>
      <tbody>{filteredPoints.length === 0
        ? <tr><td colSpan={historyMode ? onInspectContributions ? 8 : 7 : 3}>{emptyMessage}</td></tr>
        : visiblePoints.map(point => <tr key={point.id}>
          <td><time dateTime={point.timestamp}>{formatDate(point.timestamp)}</time>{historyMode && point.bucketEnd && <span className={styles.intervalEnd}> → {formatDate(point.bucketEnd)}</span>}{!historyMode && onInspectContributions && <button type="button" data-history-bucket={point.timestamp} onClick={() => onInspectContributions(point.timestamp)}>{labels.inspectContributions}</button>}</td>
          <td data-label={labels.energy}>{historyMode && hasNoObservation(point.energy) ? '—' : readingText(point.energy, locale, labels)}</td>
          <td data-label={labels.emissions}>{historyMode && hasNoObservation(point.emissions) ? '—' : readingText(point.emissions, locale, labels)}</td>
                    {historyMode && <><td className={styles.desktopMetadata} data-label={labels.region}>{metadataAt(point, 'region_changed', 'regionCode')}</td>
            <td className={styles.desktopMetadata} data-label={labels.methodology}>{metadataAt(point, 'methodology_changed', 'version')}</td>
            <td className={styles.desktopMetadata} data-label={labels.coverage}>{coverageText(point, locale)}</td>
            <td className={styles.mobileMetrics}>{hasNoObservation(point.energy) && hasNoObservation(point.emissions)
              ? t('historyViewGap') : `${readingText(point.energy, locale, labels)} · ${readingText(point.emissions, locale, labels)}`}</td>
            <td className={styles.mobileContext}>{metadataAt(point, 'region_changed', 'regionCode')} · {metadataAt(point, 'methodology_changed', 'version')} · {coverageText(point, locale)}</td></>}
          {historyMode && <td className={styles.intervalState}><details className={styles.stateDetails}><summary><span className={`state-badge state-${stateFor(point).toLowerCase()}`}><span aria-hidden="true">{stateIcons[stateFor(point)]}</span>{stateLabel(stateFor(point), tCommon)}</span></summary><span className={styles.stateMetadata}>{stateFor(point) === 'AVAILABLE' ? tCommon('reason.METRICS_VALID') : statusReason(point)}</span></details></td>}
          {historyMode && onInspectContributions && <td className={styles.intervalAction}><button type="button" aria-label={point.energy.status !== 'available' && point.emissions.status !== 'available' ? t('historyViewGap') : t('historyInspect')} data-history-bucket={point.timestamp} onClick={() => onInspectContributions(point.timestamp)}>{point.energy.status !== 'available' && point.emissions.status !== 'available' ? <>{t('historyViewGap')} →</> : <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>}</button></td>}
        </tr>)}</tbody>
    </table>
    <div className={styles.pagination}>
      <output aria-live="polite">{historyMode ? t('historyRange', { start: firstRow, end: lastRow, count: filteredPoints.length }) : labels.rangeStatus(firstRow, lastRow, filteredPoints.length)}</output>
      <label>{labels.pageSize}<select value={pageSize} onChange={event => onPaginationChange(1, parseAnalysisSeriesPageSize(event.target.value))}>
        {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
        <option value="all">{labels.allRows}</option>
      </select></label>
      <div className={styles.pageControls}>
        <button type="button" className={`button secondary ${styles.pageButton}`} aria-label={labels.previous} disabled={page <= 1} onClick={() => onPaginationChange(page - 1, pageSize)}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 4.5-5.5 5.5 5.5 5.5" /></svg></button>
        {paginationPages(page, pageCount).map(number => typeof number === 'number'
          ? <button key={number} type="button" aria-current={number === page ? 'page' : undefined} aria-label={labels.pageStatus(number, pageCount)} className={number === page ? styles.currentPage : styles.pageNumber} onClick={() => onPaginationChange(number, pageSize)}>{number}</button>
          : <span key={number} aria-hidden="true">…</span>)}
        <button type="button" className={`button secondary ${styles.pageButton}`} aria-label={labels.next} disabled={page >= pageCount} onClick={() => onPaginationChange(page + 1, pageSize)}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4.5 5.5 5.5-5.5 5.5" /></svg></button>
      </div>
    </div>
    {historyMode && <p className={styles.mobileTableNote}>{t('historyTableNote')}</p>}
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
  metric: 'energy' | 'emissions' | 'compare'
  locale: string
  timeZone: string
  comparisonPoints: readonly AnalysisSeriesPoint[]
  labels: ChartLabels
  formatDate: (value: string) => string
  historyMode: boolean
  chartStyle: 'line' | 'columns'
  invalidDateRange: boolean
  filterProps: SeriesFilterProps
  tableProps: SeriesTableProps
}>

function SeriesContent({ series, state, view, metric, locale, timeZone, comparisonPoints, labels, formatDate, historyMode, chartStyle, invalidDateRange, filterProps, tableProps }: SeriesContentProps) {
  if (series.status === 'unavailable') {
    const message = state === 'loading' ? labels.loading : `${labels.unavailable}: ${labels.reasons[series.reason]}`
    return <p><output aria-live="polite">{message}</output></p>
  }
  if (view === 'graph') {
    const energyUnits = collectSeriesUnits(series.points, 'energy')
    const emissionsUnits = collectSeriesUnits(series.points, 'emissions')
    if (historyMode && metric === 'compare' && energyUnits.length === 1 && emissionsUnits.length === 1)
      return <div className={styles.combinedCharts}>
        <ComparisonChart points={series.points} comparisonPoints={comparisonPoints} events={series.events ?? []}
          energyUnit={energyUnits[0]} emissionsUnit={emissionsUnits[0]} locale={locale} timeZone={timeZone}
          formatDate={formatDate} labels={labels} chartStyle={chartStyle} />
      </div>
    return <div className={styles.charts}>
      {(metric === 'energy' || metric === 'compare') && <Chart points={series.points} comparisonPoints={comparisonPoints} events={series.events ?? []} metric="energy" label={labels.energyChart}
        locale={locale} timeZone={timeZone} formatDate={formatDate} labels={labels} historyMode={historyMode} chartStyle={chartStyle} />
      }
      {(metric === 'emissions' || metric === 'compare') && <Chart points={series.points} comparisonPoints={comparisonPoints} events={series.events ?? []} metric="emissions" label={labels.emissionsChart}
        locale={locale} timeZone={timeZone} formatDate={formatDate} labels={labels} historyMode={historyMode} chartStyle={chartStyle} />}
    </div>
  }
  return <SeriesTableView {...filterProps} invalidDateRange={invalidDateRange} tableProps={tableProps} />
}

export function AnalysisSeries({ series, state, locale, labels, formatDate, page, pageSize, query, comparisonPoints, onPaginationChange, onQueryChange, onInspectContributions, controlContent, eventsHeading, eventSummary, historyMode = false, historyRegionFallback = null, historyMethodologyFallback = null }: Readonly<{
  series: AnalysisSeriesResult
  state: 'loading' | 'refreshing' | 'available' | 'unavailable' | 'error' | 'invalid-period'
  locale: string
  labels: Labels
  formatDate: (value: string) => string
  page: number
  pageSize: AnalysisSeriesPageSize
  query: AnalysisSeriesQuery
  comparisonPoints: readonly AnalysisSeriesPoint[]
  onPaginationChange: (page: number | null, pageSize: AnalysisSeriesPageSize) => void
  onQueryChange: (query: AnalysisSeriesQuery) => void
  onInspectContributions?: (bucketStart: string) => void
  controlContent?: ReactNode
  eventsHeading: string
  eventSummary: (event: AnalysisSeriesEvent) => string
  historyMode?: boolean
  historyRegionFallback?: string | null
  historyMethodologyFallback?: string | null
}>) {
  const { t } = useTranslation('detail')
  const [view, setView] = useState<'graph' | 'table'>('graph')
  const [chartStyle, setChartStyle] = useState<'line' | 'columns'>('line')
  const [metric, setMetric] = useState<'energy' | 'emissions' | 'compare'>(() => historyMode ? 'compare' : 'emissions')
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null)
  const eventRefs = useRef(new Map<string, HTMLLIElement>())
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
    try { return historyMode ? formatIntervalBoundary(value, locale, query.timeZone) : new Intl.DateTimeFormat(locale, { timeZone: query.timeZone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(timestamp)) }
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
      timeZone: defaultTimeZone(), energyUnit: '', emissionsUnit: '', energyMin: '', energyMax: '', emissionsMin: '', emissionsMax: '' })
  }
  const filterProps: SeriesFilterProps = {
    historyMode,
    query, fromDraft, toDraft, energyUnits, emissionsUnits, energyUnit, emissionsUnit, energyUnitRequired,
    emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit, invalidEnergyRange, invalidEmissionsRange,
    labels, onClear: clearFilters, onQueryChange, onUpdateDate: updateDate,
  }
  const tableProps: SeriesTableProps = {
    historyMode,
    historyRegionFallback, historyMethodologyFallback,
    activeFilterCount: [query.search, query.from, query.to, query.energyStatus, query.emissionsStatus,
      query.energyUnit, query.emissionsUnit, query.energyMin, query.energyMax, query.emissionsMin, query.emissionsMax].filter(Boolean).length,
    points, filteredPoints, visiblePoints, page: currentPage, pageCount, pageSize, firstRow: rowRange.first,
    lastRow: rowRange.last, energyUnitRequired, emissionsUnitRequired, invalidEnergyUnit, invalidEmissionsUnit,
    energyUnits, emissionsUnits, locale, labels, tableEvents: series.status === 'available' ? series.events : [], formatDate: formatSeriesDate, sortState, onSort: toggleSort,
    onPaginationChange, onInspectContributions,
  }
  const chartLabels: ChartLabels = { ...labels, eventsHeading, eventSummary }
  const events = series.status === 'available' ? series.events ?? [] : []
  return <section className={`${styles.section} ${historyMode ? styles.historyMode : ''} ${historyMode && chartStyle === 'columns' ? styles.columnView : ''}`} aria-label={labels.regionHeading}>
    <div className={`${styles.chartContent} ${historyMode ? styles.historyChart : ''}`}>
    <div className={styles.header}>
      <h2 id="analysis-series-heading">{labels.heading}</h2>
      <div className={styles.controls}>
      <div className={styles.metricToggle} role="group" aria-label={labels.metricToggle}>
        <button type="button" aria-pressed={metric === 'energy'} onClick={() => setMetric('energy')}>{labels.energy}</button>
        <button type="button" aria-pressed={metric === 'emissions'} onClick={() => setMetric('emissions')}>{labels.emissions}</button>
        <button type="button" aria-pressed={metric === 'compare'} onClick={() => setMetric('compare')}>{labels.compareMetrics}</button>
      </div>
      {historyMode && <div className={styles.toggle} role="group" aria-label={labels.heading}>
        <button type="button" aria-pressed={chartStyle === 'line'} onClick={() => setChartStyle('line')}>{labels.graph}</button>
        <button type="button" aria-pressed={chartStyle === 'columns'} onClick={() => setChartStyle('columns')}>{t('analysisColumns')}</button>
      </div>}
      {!historyMode && <div className={styles.toggle} aria-label={labels.heading}>
        <button type="button" aria-pressed={view === 'graph'} onClick={() => setView('graph')}>{labels.graph}</button>
        <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>{labels.table}</button>
      </div>}
      {controlContent}
      </div>
    </div>
    <p className={styles.timeZone}>{labels.timeZone(query.timeZone)}{labels.rangeBounds ? ` · ${labels.rangeBounds}` : ''}</p>
    <SeriesContent series={series} state={state} view={view} metric={metric} locale={locale} timeZone={query.timeZone} comparisonPoints={comparisonPoints} labels={chartLabels} formatDate={formatSeriesDate} historyMode={historyMode} chartStyle={chartStyle}
      invalidDateRange={invalidDateRange} filterProps={filterProps} tableProps={tableProps} />
    </div>
    {!historyMode && events.length > 0 && events.length <= 25 && <section className={styles.events} aria-label={eventsHeading}>
      <h3>{eventsHeading}</h3>
      <ul>{events.map((event) => <li key={event.id} ref={(element) => {
        if (element) eventRefs.current.set(event.id, element)
        else eventRefs.current.delete(event.id)
      }} tabIndex={-1} aria-current={focusedEventId === event.id ? 'true' : undefined}>
        <time dateTime={event.at}>{formatSeriesDate(event.at)}</time>
        <span>{eventSummary(event)}</span>
        <button type="button" onClick={() => {
          setFocusedEventId(event.id)
          eventRefs.current.get(event.id)?.focus()
        }}>{labels.focusEvent}</button>
      </li>)}</ul>
    </section>}
    {historyMode && <section className={styles.historyIntervals} aria-label={labels.historyIntervalsHeading}>
      <header><h3>{labels.historyIntervalsHeading}</h3><p className={styles.tableNote}>{t('historyTableNote')}</p></header>

      <SeriesContent series={series} state={state} view="table" metric={metric} locale={locale} timeZone={query.timeZone} chartStyle={chartStyle}
        comparisonPoints={comparisonPoints} labels={chartLabels} formatDate={formatSeriesDate} historyMode={historyMode} invalidDateRange={invalidDateRange}
        filterProps={filterProps} tableProps={tableProps} />
    </section>}
  </section>
}
