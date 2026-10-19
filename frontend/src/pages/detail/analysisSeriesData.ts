import type { AnalysisPresentationReason, AnalysisReading, AnalysisSeriesPoint } from '../../features/analysis/source.ts'
import { formatInstantForDateTimeInput, parseDateTimeInputInZone } from './seriesQuery.ts'
import type { AnalysisSeriesPageSize, AnalysisSeriesQuery } from './seriesQuery.ts'

export type SeriesMetric = 'energy' | 'emissions'

export type SeriesLabels = Readonly<{
  unavailable: string
  notCalculable: string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>

export type NumericRange = Readonly<{
  active: boolean
  minimum: number | null
  maximum: number | null
  invalid: boolean
}>

export function formatSeriesNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)
}

export function formatSeriesReading(reading: AnalysisReading, locale: string, labels: SeriesLabels) {
  if (reading.status === 'available') return `${formatSeriesNumber(reading.value, locale)} ${reading.unit}`
  const message = reading.status === 'not-calculable' ? labels.notCalculable : labels.unavailable
  return `${message}: ${labels.reasons[reading.reason]}`
}

export function collectSeriesUnits(points: readonly AnalysisSeriesPoint[], metric: SeriesMetric) {
  return [...new Set(points.flatMap(point => {
    const reading = point[metric]
    return reading.status === 'available' && Number.isFinite(reading.value) ? [reading.unit] : []
  }))]
}

export function readNumericRange(minimumText: string, maximumText: string): NumericRange {
  const minimum = minimumText === '' ? null : Number(minimumText)
  const maximum = maximumText === '' ? null : Number(maximumText)
  const invalid = (minimum !== null && !Number.isFinite(minimum)) || (maximum !== null && !Number.isFinite(maximum)) ||
    (minimum !== null && maximum !== null && minimum > maximum)
  return { active: minimumText !== '' || maximumText !== '', minimum, maximum, invalid }
}

export function readSeriesRowRange(count: number, page: number, pageSize: AnalysisSeriesPageSize) {
  if (count === 0) return { first: 0, last: 0 }
  if (pageSize === 'all') return { first: 1, last: count }
  const first = (page - 1) * pageSize + 1
  return { first, last: Math.min(page * pageSize, count) }
}

export function hasExplicitTimeZone(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
}

export function hasInvalidDateRange(query: AnalysisSeriesQuery, fromDraft: string, toDraft: string) {
  const fromTime = query.from ? Date.parse(query.from) : null
  const toTime = query.to ? Date.parse(query.to) : null
  const invalidZone = formatInstantForDateTimeInput('2000-01-01T00:00:00.000Z', query.timeZone) === ''
  return {
    fromTime,
    toTime,
    invalid: invalidZone || (fromDraft !== '' && parseDateTimeInputInZone(fromDraft, query.timeZone) === null) ||
      (toDraft !== '' && parseDateTimeInputInZone(toDraft, query.timeZone) === null) ||
      (query.from !== '' && (!hasExplicitTimeZone(query.from) || !Number.isFinite(fromTime))) ||
      (query.to !== '' && (!hasExplicitTimeZone(query.to) || !Number.isFinite(toTime))) ||
      (fromTime !== null && toTime !== null && fromTime > toTime),
  }
}

function normalized(value: string, locale: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale)
}

type FilterOptions = Readonly<{
  query: AnalysisSeriesQuery
  locale: string
  energyUnit: string
  emissionsUnit: string
  energyUnits: readonly string[]
  emissionsUnits: readonly string[]
  energyRange: NumericRange
  emissionsRange: NumericRange
  fromTime: number | null
  toTime: number | null
  invalidDateRange: boolean
  invalidEnergyUnit: boolean
  invalidEmissionsUnit: boolean
  energyUnitRequired: boolean
  emissionsUnitRequired: boolean
  formatDate: (value: string) => string
  labels: SeriesLabels
}>

function matchesSearch(point: AnalysisSeriesPoint, options: FilterOptions) {
  if (!options.query.search) return true
  const content = [options.formatDate(point.timestamp), formatSeriesReading(point.energy, options.locale, options.labels),
    formatSeriesReading(point.emissions, options.locale, options.labels)].join(' ')
  return normalized(content, options.locale).includes(normalized(options.query.search, options.locale))
}

function matchesTime(point: AnalysisSeriesPoint, options: FilterOptions) {
  const timestamp = Date.parse(point.timestamp)
  return (options.fromTime === null || timestamp >= options.fromTime) &&
    (options.toTime === null || timestamp <= options.toTime)
}

function matchesStatuses(point: AnalysisSeriesPoint, options: FilterOptions) {
  return (!options.query.energyStatus || point.energy.status === options.query.energyStatus) &&
    (!options.query.emissionsStatus || point.emissions.status === options.query.emissionsStatus)
}

function readingValueInUnit(reading: AnalysisReading, unit: string) {
  return reading.status === 'available' && reading.unit === unit ? reading.value : null
}

function matchesUnits(point: AnalysisSeriesPoint, options: FilterOptions) {
  const energyMatches = options.energyUnits.length <= 1 || !options.energyUnit || point.energy.status !== 'available' ||
    point.energy.unit === options.energyUnit
  const emissionsMatches = options.emissionsUnits.length <= 1 || !options.emissionsUnit || point.emissions.status !== 'available' ||
    point.emissions.unit === options.emissionsUnit
  return energyMatches && emissionsMatches
}

function matchesRanges(point: AnalysisSeriesPoint, options: FilterOptions) {
  const energy = readingValueInUnit(point.energy, options.energyUnit)
  const emissions = readingValueInUnit(point.emissions, options.emissionsUnit)
  const energyMatches = !options.energyRange.active || (!options.energyUnitRequired && energy !== null &&
    (options.energyRange.minimum === null || energy >= options.energyRange.minimum) &&
    (options.energyRange.maximum === null || energy <= options.energyRange.maximum))
  const emissionsMatches = !options.emissionsRange.active || (!options.emissionsUnitRequired && emissions !== null &&
    (options.emissionsRange.minimum === null || emissions >= options.emissionsRange.minimum) &&
    (options.emissionsRange.maximum === null || emissions <= options.emissionsRange.maximum))
  return energyMatches && emissionsMatches
}

function matchesPoint(point: AnalysisSeriesPoint, options: FilterOptions) {
  if (options.invalidDateRange || options.energyRange.invalid || options.emissionsRange.invalid ||
    options.invalidEnergyUnit || options.invalidEmissionsUnit) return false
  return matchesTime(point, options) && matchesSearch(point, options) && matchesStatuses(point, options) &&
    matchesUnits(point, options) && matchesRanges(point, options)
}

function readSortValue(point: AnalysisSeriesPoint, sort: AnalysisSeriesQuery['sort'], energyUnit: string, emissionsUnit: string) {
  if (sort === 'moment') {
    const value = Date.parse(point.timestamp)
    return Number.isFinite(value) ? value : null
  }
  if (sort === 'energy') return readingValueInUnit(point.energy, energyUnit)
  if (sort === 'emissions') return readingValueInUnit(point.emissions, emissionsUnit)
  return null
}

function compareNullableValues(left: number | null, right: number | null, direction: AnalysisSeriesQuery['direction']) {
  if (left === null || right === null) {
    if (left === null && right !== null) return 1
    if (left !== null && right === null) return -1
    return 0
  }
  const difference = left - right
  return difference === 0 ? 0 : difference * (direction === 'asc' ? 1 : -1)
}

function compareSeriesPoints(left: AnalysisSeriesPoint, right: AnalysisSeriesPoint, options: FilterOptions) {
  const sort = options.query.sort
  if (!sort || (sort === 'energy' && options.energyUnitRequired) || (sort === 'emissions' && options.emissionsUnitRequired)) return 0
  const difference = compareNullableValues(readSortValue(left, sort, options.energyUnit, options.emissionsUnit),
    readSortValue(right, sort, options.energyUnit, options.emissionsUnit), options.query.direction)
  return difference || left.id.localeCompare(right.id)
}

export function selectSeriesPoints(points: readonly AnalysisSeriesPoint[], options: FilterOptions) {
  return points.filter(point => matchesPoint(point, options)).sort((left, right) => compareSeriesPoints(left, right, options))
}
