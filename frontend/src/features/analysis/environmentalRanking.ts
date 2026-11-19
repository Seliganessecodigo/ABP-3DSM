export type RankingMetric = 'energy' | 'emissions'
export type RankingDirection = 'asc' | 'desc'
export type RankingState = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'
export type RankingReason = Readonly<{ code: string; metric?: string }>
export type RankingMeasure = Readonly<{ value: number | null; unit: string; reasons: readonly RankingReason[] }>
export type RankingItem = Readonly<{
  applicationId: string
  name: string
  state: RankingState
  stateReason: string | null
  location: Readonly<{ regionCode: string | null; country: string | null; region: string | null; city: string | null }>
  energy: RankingMeasure
  emissions: RankingMeasure
  coverage: Readonly<{ energy: number; emissions: number }>
  rankability: 'ranked' | 'unranked'
  position: number | null
  participation: number | null
}>
export type EnvironmentalRanking = Readonly<{
  status: 'available' | 'empty'
  metric: RankingMetric
  direction: RankingDirection
  period: Readonly<{ from: string; to: string }>
  scope: Readonly<{
    applicationCount: number
    rankedCount: number
    unrankedCount: number
    energy: RankingMeasure
    emissions: RankingMeasure
    coverage: Readonly<{ energy: number; emissions: number }>
  }>
  presentation: Readonly<{ rankedCount: number; unrankedCount: number }>
  pagination: Readonly<{ page: number; pageSize: number | 'all'; totalItems: number; totalPages: number }>
  items: readonly RankingItem[]
}>

export type EnvironmentalRankingQuery = Readonly<{
  from: string
  to: string
  metric: RankingMetric
  direction: RankingDirection
  states?: readonly RankingState[]
  regionCodes?: readonly string[]
  applicationIds?: readonly string[]
  search?: string
  sortBy?: string
  sortDirection?: RankingDirection
  page?: number
  pageSize?: number | 'all'
  columnFilters?: Readonly<Record<string, string>>
}>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function readMeasure(value: unknown): RankingMeasure {
  if (!isRecord(value) || typeof value.unit !== 'string' ||
    !(value.value === null || typeof value.value === 'number' && Number.isFinite(value.value) && value.value >= 0) ||
    !Array.isArray(value.reasons) || !value.reasons.every(reason => isRecord(reason) && typeof reason.code === 'string' &&
      (reason.metric === undefined || typeof reason.metric === 'string'))) {
    throw new Error('Invalid environmental ranking measure')
  }
  return { value: value.value, unit: value.unit, reasons: value.reasons as RankingReason[] }
}

function readCoverage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function readItem(value: unknown): RankingItem {
  if (!isRecord(value)) throw new Error('Invalid environmental ranking item')
  const energy = readMeasure(value.energy)
  const emissions = readMeasure(value.emissions)
  const location = value.location
  if (!isRecord(location) || !['regionCode', 'country', 'region', 'city'].every(key => isNullableString(location[key]))) {
    throw new Error('Invalid environmental ranking item location')
  }
  if (typeof value.applicationId !== 'string' || !value.applicationId ||
    typeof value.name !== 'string' || !value.name ||
    !['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'].includes(String(value.state)) ||
    !(value.stateReason === null || typeof value.stateReason === 'string') ||
    !isRecord(value.coverage) || !readCoverage(value.coverage.energy) || !readCoverage(value.coverage.emissions) ||
    !(value.rankability === 'ranked' || value.rankability === 'unranked') ||
    !(value.position === null || Number.isSafeInteger(value.position) && Number(value.position) >= 1) ||
    !(value.participation === null || typeof value.participation === 'number' && Number.isFinite(value.participation) && value.participation >= 0 && value.participation <= 1)) {
    throw new Error('Invalid environmental ranking item')
  }
  if ((value.rankability === 'ranked') !== (value.position !== null) ||
    energy.unit !== 'kWh' || emissions.unit !== 'gCO2e') {
    throw new Error('Invalid environmental ranking classification or units')
  }
  return {
    applicationId: value.applicationId,
    name: value.name,
    state: value.state as RankingState,
    stateReason: value.stateReason,
    location: location as RankingItem['location'],
    energy,
    emissions,
    coverage: { energy: value.coverage.energy, emissions: value.coverage.emissions },
    rankability: value.rankability,
    position: value.position as number | null,
    participation: value.participation as number | null,
  }
}

export function parseEnvironmentalRanking(value: unknown, query: EnvironmentalRankingQuery): EnvironmentalRanking {
  const periodFrom = Date.parse(query.from)
  const periodTo = Date.parse(query.to)
  if (!isRecord(value) || !['available', 'empty'].includes(String(value.status)) ||
    value.metric !== query.metric || value.direction !== query.direction ||
    !isRecord(value.period) || typeof value.period.from !== 'string' || typeof value.period.to !== 'string' ||
    Date.parse(value.period.from) !== periodFrom || Date.parse(value.period.to) !== periodTo ||
    !isRecord(value.scope) || !isCount(value.scope.applicationCount) || !isCount(value.scope.rankedCount) || !isCount(value.scope.unrankedCount) ||
    !isRecord(value.scope.coverage) || !readCoverage(value.scope.coverage.energy) || !readCoverage(value.scope.coverage.emissions) ||
    !isRecord(value.presentation) || !isCount(value.presentation.rankedCount) || !isCount(value.presentation.unrankedCount) ||
    !isRecord(value.pagination) || !isCount(value.pagination.totalItems) || !isCount(value.pagination.totalPages) ||
    !Number.isSafeInteger(value.pagination.page) || Number(value.pagination.page) < 1 ||
    !(value.pagination.pageSize === 'all' || [5, 10, 15, 20].includes(Number(value.pagination.pageSize))) ||
    !Array.isArray(value.items)) {
    throw new Error('Invalid environmental ranking response')
  }
  const items = value.items.map(readItem)
  if (items.length !== value.pagination.totalItems && value.pagination.pageSize === 'all') {
    throw new Error('Incomplete environmental ranking response')
  }
  if (value.scope.rankedCount + value.scope.unrankedCount !== value.scope.applicationCount ||
    value.presentation.rankedCount + value.presentation.unrankedCount !== value.pagination.totalItems ||
    value.scope.applicationCount < items.length) {
    throw new Error('Inconsistent environmental ranking counts')
  }
  return {
    status: value.status as EnvironmentalRanking['status'],
    metric: value.metric as RankingMetric,
    direction: value.direction as RankingDirection,
    period: { from: value.period.from, to: value.period.to },
    scope: {
      applicationCount: value.scope.applicationCount as number,
      rankedCount: value.scope.rankedCount as number,
      unrankedCount: value.scope.unrankedCount as number,
      energy: readMeasure(value.scope.energy),
      emissions: readMeasure(value.scope.emissions),
      coverage: { energy: value.scope.coverage.energy, emissions: value.scope.coverage.emissions },
    },
    presentation: { rankedCount: value.presentation.rankedCount, unrankedCount: value.presentation.unrankedCount },
    pagination: {
      page: value.pagination.page as number,
      pageSize: value.pagination.pageSize as number | 'all',
      totalItems: value.pagination.totalItems,
      totalPages: value.pagination.totalPages,
    },
    items,
  }
}

export async function getEnvironmentalRanking(query: EnvironmentalRankingQuery, signal: AbortSignal): Promise<EnvironmentalRanking> {
  const params = new URLSearchParams({ from: query.from, to: query.to, metric: query.metric, direction: query.direction })
  for (const value of query.states ?? []) params.append('states', value)
  for (const value of query.regionCodes ?? []) params.append('regionCodes', value)
  for (const value of query.applicationIds ?? []) params.append('applicationIds', value)
  if (query.search) params.set('search', query.search)
  if (query.sortBy && query.sortDirection) { params.set('sortBy', query.sortBy); params.set('sortDirection', query.sortDirection) }
  if (query.page && query.page > 1) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  for (const [key, value] of Object.entries(query.columnFilters ?? {})) if (value) params.set(key, value)
  const base = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/+$/, '')
  const response = await fetch(`${base}/analysis/ranking?${params}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Environmental ranking request failed: ${response.status}`)
  return parseEnvironmentalRanking(await response.json() as unknown, query)
}
