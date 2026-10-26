import { readPeriodSelection, type PeriodPreset } from '../../features/analysis/periodContext.ts'
import type { EnvironmentalSummaryState } from '../../features/analysis/environmentalSummary.ts'

export const dashboardSortColumns = ['name', 'state', 'region', 'energy', 'emissions', 'energyCoverage', 'emissionsCoverage'] as const
export type DashboardSortColumn = (typeof dashboardSortColumns)[number]
export type DashboardSort = Readonly<{ column: DashboardSortColumn; direction: 'asc' | 'desc' }>
export type DashboardPageSize = 5 | 10 | 15 | 20 | 'all'
export type DashboardTableFilters = Readonly<{
  name: string
  state: EnvironmentalSummaryState | 'ALL'
  region: string
  energyMin: string
  energyMax: string
  energyMissing: boolean
  emissionsMin: string
  emissionsMax: string
  emissionsMissing: boolean
  energyCoverageMin: string
  energyCoverageMax: string
  emissionsCoverageMin: string
  emissionsCoverageMax: string
}>
export type DashboardQuery = Readonly<{
  period: PeriodPreset | null
  regionCode: string
  state: EnvironmentalSummaryState | 'ALL'
  search: string
  page: number
  pageSize: DashboardPageSize
  sort: DashboardSort
  filters: DashboardTableFilters
}>

const defaultSort: DashboardSort = { column: 'emissions', direction: 'desc' }
const pageSizes: readonly (string | number)[] = [5, 10, 15, 20, 'all']
const states: readonly (EnvironmentalSummaryState | 'ALL')[] = ['ALL', 'AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED']
const managedParameters = [
  'period', 'regionCode', 'dashboardState', 'q', 'page', 'size', 'sort', 'direction',
  'tableName', 'tableState', 'tableRegion', 'energyMin', 'energyMax', 'energyMissing',
  'emissionsMin', 'emissionsMax', 'emissionsMissing', 'energyCoverageMin', 'energyCoverageMax',
  'emissionsCoverageMin', 'emissionsCoverageMax',
]

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function readFilters(params: URLSearchParams): DashboardTableFilters {
  const state = params.get('tableState') as EnvironmentalSummaryState | null
  return {
    name: params.get('tableName') ?? '',
    state: states.includes(state ?? 'ALL') ? state ?? 'ALL' : 'ALL',
    region: params.get('tableRegion') ?? '',
    energyMin: params.get('energyMin') ?? '',
    energyMax: params.get('energyMax') ?? '',
    energyMissing: params.get('energyMissing') === 'true',
    emissionsMin: params.get('emissionsMin') ?? '',
    emissionsMax: params.get('emissionsMax') ?? '',
    emissionsMissing: params.get('emissionsMissing') === 'true',
    energyCoverageMin: params.get('energyCoverageMin') ?? '',
    energyCoverageMax: params.get('energyCoverageMax') ?? '',
    emissionsCoverageMin: params.get('emissionsCoverageMin') ?? '',
    emissionsCoverageMax: params.get('emissionsCoverageMax') ?? '',
  }
}

export function readDashboardQuery(search: string): DashboardQuery {
  const params = new URLSearchParams(search)
  const period = readPeriodSelection(search)
  const state = params.get('dashboardState') as EnvironmentalSummaryState | null
  const sortColumn = params.get('sort') as DashboardSortColumn | null
  const direction = params.get('direction')
  const size = params.get('size') ?? '10'
  return {
    period,
    regionCode: params.get('regionCode') ?? '',
    state: states.includes(state ?? 'ALL') ? state ?? 'ALL' : 'ALL',
    search: params.get('q') ?? '',
    page: positiveInteger(params.get('page'), 1),
    pageSize: pageSizes.includes(size) ? size === 'all' ? 'all' : Number(size) as Exclude<DashboardPageSize, 'all'> : 10,
    sort: dashboardSortColumns.includes(sortColumn as DashboardSortColumn) && (direction === 'asc' || direction === 'desc')
      ? { column: sortColumn as DashboardSortColumn, direction }
      : defaultSort,
    filters: readFilters(params),
  }
}

export function dashboardQueryUrl(query: DashboardQuery): string {
  const params = new URLSearchParams(window.location.search)
  for (const key of managedParameters) params.delete(key)
  if (query.period && query.period !== '7d') params.set('period', query.period)
  if (query.regionCode) params.set('regionCode', query.regionCode)
  if (query.state !== 'ALL') params.set('dashboardState', query.state)
  if (query.search) params.set('q', query.search)
  if (query.page > 1) params.set('page', String(query.page))
  if (query.pageSize !== 10) params.set('size', String(query.pageSize))
  if (query.sort.column !== defaultSort.column || query.sort.direction !== defaultSort.direction) {
    params.set('sort', query.sort.column)
    params.set('direction', query.sort.direction)
  }
  const { filters } = query
  if (filters.name) params.set('tableName', filters.name)
  if (filters.state !== 'ALL') params.set('tableState', filters.state)
  if (filters.region) params.set('tableRegion', filters.region)
  for (const key of ['energyMin', 'energyMax', 'emissionsMin', 'emissionsMax', 'energyCoverageMin', 'energyCoverageMax', 'emissionsCoverageMin', 'emissionsCoverageMax'] as const) {
    if (filters[key]) params.set(key, filters[key])
  }
  for (const key of ['energyMissing', 'emissionsMissing'] as const) {
    if (filters[key]) params.set(key, 'true')
  }
  const queryString = params.toString()
  return queryString ? `/dashboard?${queryString}` : '/dashboard'
}
