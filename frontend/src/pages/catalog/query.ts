import type { ApplicationState as State, CatalogColumnFilters, CatalogQuery, CatalogSortColumn, CatalogSortDirection } from '../../features/applications/catalog.ts'

export const states: Array<{ value: State | 'ALL' }> = [
  { value: 'ALL' }, { value: 'AVAILABLE' }, { value: 'UNAVAILABLE' }, { value: 'NO_METRICS' }, { value: 'REMOVED' },
]
const pageSizes = ['5', '10', '15', '20', 'all'] as const
const sortColumns: CatalogSortColumn[] = ['name', 'country', 'regionCode', 'city', 'state', 'lastCheckedAt']

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function safeTimeZone(value: string | null): string {
  if (!value) return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  try { return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone }
  catch { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }
}

export function readQuery(): CatalogQuery & { timeZone: string; dateRangeInvalid: boolean } {
  const params = new URLSearchParams(window.location.search)
  const state = params.get('state') as State | null
  const sortColumn = params.get('sort') as CatalogSortColumn | null
  const direction = params.get('direction') as CatalogSortDirection | null
  const size = params.get('size') ?? '10'
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const dateRangeInvalid = Boolean(from && to && Date.parse(from) > Date.parse(to))
  const filters: CatalogColumnFilters = {
    name: params.get('name') ?? '', country: params.get('country') ?? '',
    regionCode: params.get('regionCode') ?? params.get('region') ?? '', city: params.get('city') ?? '',
    cityIsMissing: params.get('cityMissing') === 'true', state: states.some((option) => option.value === params.get('columnState'))
      ? params.get('columnState') as State | 'ALL' : 'ALL',
    lastCheckedFrom: dateRangeInvalid ? '' : from, lastCheckedTo: dateRangeInvalid ? '' : to,
  }
  return {
    search: params.get('q') ?? '',
    state: states.some((option) => option.value === state) ? state as State : 'ALL',
    regionCode: '', page: positiveInteger(params.get('page'), 1),
    pageSize: pageSizes.includes(size as typeof pageSizes[number]) ? size === 'all' ? 'all' : Number(size) : 10,
    sort: sortColumns.includes(sortColumn as CatalogSortColumn) && (direction === 'asc' || direction === 'desc')
      ? { column: sortColumn as CatalogSortColumn, direction } : { column: 'name', direction: 'asc' },
    filters,
    timeZone: safeTimeZone(params.get('tz')),
    dateRangeInvalid,
  }
}

export function makeUrl(query: CatalogQuery & { timeZone: string }): string {
  const params = new URLSearchParams(window.location.search)
  const managed = ['q', 'state', 'region', 'regionCode', 'page', 'size', 'sort', 'direction', 'name', 'country', 'city', 'cityMissing', 'columnState', 'from', 'to', 'tz']
  for (const key of managed) params.delete(key)
  if (query.search) params.set('q', query.search)
  if (query.state !== 'ALL') params.set('state', query.state)
  if (query.page > 1) params.set('page', String(query.page))
  if (query.pageSize !== 10) params.set('size', String(query.pageSize))
  if (query.sort && (query.sort.column !== 'name' || query.sort.direction !== 'asc')) {
    params.set('sort', query.sort.column)
    params.set('direction', query.sort.direction)
  }
  const filters = query.filters ?? {}
  for (const key of ['name', 'country', 'regionCode', 'city'] as const) if (filters[key]) params.set(key === 'regionCode' ? 'regionCode' : key, filters[key]!)
  if (filters.cityIsMissing) params.set('cityMissing', 'true')
  if (filters.state && filters.state !== 'ALL') params.set('columnState', filters.state)
  if (filters.lastCheckedFrom) params.set('from', filters.lastCheckedFrom)
  if (filters.lastCheckedTo) params.set('to', filters.lastCheckedTo)
  if (query.timeZone) params.set('tz', query.timeZone)
  const queryString = params.toString()
  return queryString ? '/?' + queryString : '/'
}
