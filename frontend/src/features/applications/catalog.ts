export type ApplicationState = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'

export interface CatalogEntry {
  id: string
  name: string
  state: ApplicationState
  location: {
    regionCode: string
    region: string
    country?: string | null
    city?: string | null
  } | null
  firstSeenAt?: string
  lastCheckedAt?: string | null
  removedAt?: string | null
  updatedAt?: string
}

export type CatalogSortColumn = 'name' | 'country' | 'regionCode' | 'city' | 'state' | 'lastCheckedAt'
export type CatalogSortDirection = 'asc' | 'desc'

export interface CatalogColumnFilters {
  name?: string
  country?: string
  regionCode?: string
  city?: string
  cityIsMissing?: boolean
  state?: ApplicationState | 'ALL'
  lastCheckedFrom?: string
  lastCheckedTo?: string
}

export interface CatalogQuery {
  search: string
  state: ApplicationState | 'ALL'
  regionCode: string
  page: number
  pageSize: number | 'all'
  filters?: CatalogColumnFilters
  sort?: { column: CatalogSortColumn; direction: CatalogSortDirection }
}

export interface CatalogPage<T extends CatalogEntry> {
  items: T[]
  total: number
  page: number
  pageCount: number
}

export interface CatalogPresentation {
  locale: string
  timeZone: string
  stateLabels: Record<ApplicationState, string>
}

function normalize(value: string): string {
  return value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
}

function matchesText(value: string | null | undefined, term: string): boolean {
  return !term || (value !== null && value !== undefined && normalize(value).includes(term))
}

function parseInstant(value: string | undefined): number | undefined {
  if (!value) return undefined
  const instant = Date.parse(value)
  return Number.isFinite(instant) ? instant : undefined
}

function isMissingDate(value: string | null | undefined): boolean {
  return !value || !Number.isFinite(Date.parse(value))
}

function compareValues(left: string | number, right: string | number, collator: Intl.Collator): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return collator.compare(String(left), String(right))
}

export function selectCatalog<T extends CatalogEntry>(
  applications: readonly T[],
  query: CatalogQuery,
  presentation: CatalogPresentation = {
    locale: 'en-US',
    timeZone: 'UTC',
    stateLabels: {
      AVAILABLE: 'Available',
      UNAVAILABLE: 'Unavailable',
      NO_METRICS: 'No metrics',
      REMOVED: 'Removed',
    },
  },
): CatalogPage<T> {
  const searchTerm = normalize(query.search)
  const filters = query.filters ?? {}
  const nameTerm = normalize(filters.name ?? '')
  const countryTerm = normalize(filters.country ?? '')
  const regionTerm = normalize(filters.regionCode ?? query.regionCode)
  const cityTerm = normalize(filters.city ?? '')
  const columnState = filters.state
  const from = parseInstant(filters.lastCheckedFrom)
  const to = parseInstant(filters.lastCheckedTo)
  const collator = new Intl.Collator(presentation.locale, { sensitivity: 'base', numeric: true })

  const filtered = applications.filter((application) => {
    const country = application.location?.country
    const regionCode = application.location?.regionCode
    const city = application.location?.city
    const checkedAt = application.lastCheckedAt
    const checkedInstant = parseInstant(checkedAt ?? undefined)
    const matchesGeneralSearch = !searchTerm || [
      application.name,
      application.id,
      country,
      regionCode,
      city,
      presentation.stateLabels[application.state],
      checkedAt && new Intl.DateTimeFormat(presentation.locale, {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: presentation.timeZone, timeZoneName: 'short',
      }).format(new Date(checkedAt)),
    ].some((value) => matchesText(value, searchTerm))
    const matchesNameAndId = !nameTerm || matchesText(application.name, nameTerm) || matchesText(application.id, nameTerm)
    const matchesCountry = matchesText(country, countryTerm)
    const matchesRegion = matchesText(regionCode, regionTerm)
    const matchesCity = filters.cityIsMissing
      ? city === null || city === undefined || city === ''
      : matchesText(city, cityTerm)
    const matchesGlobalState = query.state === 'ALL' || application.state === query.state
    const matchesColumnState = columnState === undefined || columnState === 'ALL' || application.state === columnState
    const matchesFrom = from === undefined || (checkedInstant !== undefined && checkedInstant >= from)
    const matchesTo = to === undefined || (checkedInstant !== undefined && checkedInstant <= to)

    return matchesGeneralSearch && matchesNameAndId && matchesCountry && matchesRegion &&
      matchesCity && matchesGlobalState && matchesColumnState && matchesFrom && matchesTo
  })

  const sort = query.sort ?? { column: 'name' as const, direction: 'asc' as const }
  const sorted = [...filtered].sort((left, right) => {
    const leftDateMissing = sort.column === 'lastCheckedAt' && isMissingDate(left.lastCheckedAt)
    const rightDateMissing = sort.column === 'lastCheckedAt' && isMissingDate(right.lastCheckedAt)
    const leftValue = sort.column === 'name' ? left.name
      : sort.column === 'country' ? left.location?.country
        : sort.column === 'regionCode' ? left.location?.regionCode
          : sort.column === 'city' ? left.location?.city
            : sort.column === 'state' ? presentation.stateLabels[left.state]
              : parseInstant(left.lastCheckedAt ?? undefined)
    const rightValue = sort.column === 'name' ? right.name
      : sort.column === 'country' ? right.location?.country
        : sort.column === 'regionCode' ? right.location?.regionCode
          : sort.column === 'city' ? right.location?.city
            : sort.column === 'state' ? presentation.stateLabels[right.state]
              : parseInstant(right.lastCheckedAt ?? undefined)

    if (leftDateMissing !== rightDateMissing) return leftDateMissing ? 1 : -1
    const leftMissing = leftValue === null || leftValue === undefined || leftValue === ''
    const rightMissing = rightValue === null || rightValue === undefined || rightValue === ''
    if (leftMissing !== rightMissing) return leftMissing ? 1 : -1
    const order = leftMissing || rightMissing ? 0 : compareValues(leftValue!, rightValue!, collator)
    return (sort.direction === 'asc' ? order : -order) || collator.compare(left.id, right.id)
  })

  const total = sorted.length
  const pageSize = query.pageSize === 'all'
    ? Math.max(total, 1)
    : Number.isFinite(query.pageSize) ? Math.max(1, Math.floor(query.pageSize)) : 10
  const pageCount = Math.ceil(total / pageSize)
  const requestedPage = Number.isFinite(query.page) ? Math.max(1, Math.floor(query.page)) : 1
  const page = pageCount === 0 ? 1 : Math.min(requestedPage, pageCount)
  const start = (page - 1) * pageSize
  return { items: sorted.slice(start, start + pageSize), total, page, pageCount }
}
