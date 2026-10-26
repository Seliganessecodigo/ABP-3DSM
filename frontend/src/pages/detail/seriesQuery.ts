export type AnalysisSeriesPageSize = 5 | 10 | 15 | 20 | 'all'
export type AnalysisSeriesReadingStatus = '' | 'available' | 'unavailable' | 'not-calculable'
export type AnalysisSeriesQuery = Readonly<{
  search: string
  energyStatus: AnalysisSeriesReadingStatus
  emissionsStatus: AnalysisSeriesReadingStatus
  from: string
  to: string
  timeZone: string
  energyUnit: string
  emissionsUnit: string
  energyMin: string
  energyMax: string
  emissionsMin: string
  emissionsMax: string
  sort: '' | 'moment' | 'energy' | 'emissions'
  direction: 'asc' | 'desc'
}>

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

type WallTime = Readonly<{ year: number; month: number; day: number; hour: number; minute: number }>

function wallTimeAt(instant: number, timeZone: string): WallTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(instant))
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') }
}

function wallTimeAsUtc(value: WallTime) {
  return Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute)
}

export function formatInstantForDateTimeInput(instant: string, timeZone: string) {
  const timestamp = Date.parse(instant)
  if (!Number.isFinite(timestamp)) return ''
  try {
    const { year, month, day, hour, minute } = wallTimeAt(timestamp, timeZone)
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  } catch {
    return ''
  }
}

export function parseDateTimeInputInZone(value: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const wall: WallTime = {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]),
  }
  const targetWall = wallTimeAsUtc(wall)
  const candidateDate = new Date(targetWall)
  if (candidateDate.getUTCFullYear() !== wall.year || candidateDate.getUTCMonth() + 1 !== wall.month ||
    candidateDate.getUTCDate() !== wall.day || wall.hour > 23 || wall.minute > 59) return null
  try {
    const offsets = new Set<number>()
    for (const hours of [-36, -12, 0, 12, 36]) {
      const sample = targetWall + hours * 60 * 60 * 1000
      const roundedSample = Math.floor(sample / 60_000) * 60_000
      offsets.add(wallTimeAsUtc(wallTimeAt(roundedSample, timeZone)) - roundedSample)
    }
    const candidates = [...offsets]
      .map(offset => targetWall - offset)
      .filter(candidate => wallTimeAsUtc(wallTimeAt(candidate, timeZone)) === targetWall)
    if (candidates.length !== 1) return null
    return new Date(candidates[0]).toISOString()
  } catch {
    return null
  }
}

export function parseAnalysisSeriesPageSize(value: string | null): AnalysisSeriesPageSize {
  if (value === 'all') return 'all'
  const size = Number(value)
  return size === 5 || size === 10 || size === 15 || size === 20 ? size : 10
}

const readingStatuses: AnalysisSeriesReadingStatus[] = ['', 'available', 'unavailable', 'not-calculable']

export function parseAnalysisSeriesReadingStatus(value: string): AnalysisSeriesReadingStatus {
  return readingStatuses.find(status => status === value) ?? ''
}

function parseAnalysisSeriesSort(value: string | null): AnalysisSeriesQuery['sort'] {
  return value === 'moment' || value === 'energy' || value === 'emissions' ? value : ''
}

export function readAnalysisSeriesQuery(params: URLSearchParams): AnalysisSeriesQuery {
  const energyStatus = params.get('seriesEnergyStatus')
  const emissionsStatus = params.get('seriesEmissionsStatus')
  return {
    search: params.get('seriesSearch') ?? '',
    energyStatus: energyStatus === null ? '' : parseAnalysisSeriesReadingStatus(energyStatus),
    emissionsStatus: emissionsStatus === null ? '' : parseAnalysisSeriesReadingStatus(emissionsStatus),
    from: params.get('seriesFrom') ?? '',
    to: params.get('seriesTo') ?? '',
    timeZone: params.get('seriesTimeZone') || getBrowserTimeZone(),
    energyUnit: params.get('seriesEnergyUnit') ?? '',
    emissionsUnit: params.get('seriesEmissionsUnit') ?? '',
    energyMin: params.get('seriesEnergyMin') ?? '',
    energyMax: params.get('seriesEnergyMax') ?? '',
    emissionsMin: params.get('seriesEmissionsMin') ?? '',
    emissionsMax: params.get('seriesEmissionsMax') ?? '',
    sort: parseAnalysisSeriesSort(params.get('seriesSort')),
    direction: params.get('seriesDirection') === 'desc' ? 'desc' : 'asc',
  }
}

export function writeAnalysisSeriesQuery(params: URLSearchParams, query: AnalysisSeriesQuery) {
  const values: Readonly<Record<string, string>> = {
    seriesSearch: query.search,
    seriesEnergyStatus: query.energyStatus,
    seriesEmissionsStatus: query.emissionsStatus,
    seriesFrom: query.from,
    seriesTo: query.to,
    seriesTimeZone: query.from || query.to ? query.timeZone : '',
    seriesEnergyUnit: query.energyUnit,
    seriesEmissionsUnit: query.emissionsUnit,
    seriesEnergyMin: query.energyMin,
    seriesEnergyMax: query.energyMax,
    seriesEmissionsMin: query.emissionsMin,
    seriesEmissionsMax: query.emissionsMax,
    seriesSort: query.sort,
    seriesDirection: query.sort ? query.direction : '',
  }
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  params.delete('seriesPage')
}
