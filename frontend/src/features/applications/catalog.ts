export type ApplicationState = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'

export interface CatalogEntry {
  id: string
  name: string
  state: ApplicationState
  location: { regionCode: string; region: string } | null
  firstSeenAt?: string
  lastCheckedAt?: string | null
  removedAt?: string | null
  updatedAt?: string
}

export interface CatalogQuery {
  search: string
  state: ApplicationState | 'ALL'
  page: number
  pageSize: number
}

export interface CatalogPage<T extends CatalogEntry> {
  items: T[]
  total: number
  page: number
  pageCount: number
}

export function selectCatalog<T extends CatalogEntry>(
  applications: readonly T[],
  query: CatalogQuery,
): CatalogPage<T> {
  const term = query.search.trim().toLocaleLowerCase()
  const filtered = applications.filter((application) => {
    const matchesState = query.state === 'ALL' || application.state === query.state
    const searchable = [
      application.name,
      application.id,
      application.location?.regionCode,
      application.location?.region,
    ].filter(Boolean).join(' ').toLocaleLowerCase()
    return matchesState && (!term || searchable.includes(term))
  })

  const pageSize = Number.isFinite(query.pageSize) ? Math.max(1, Math.floor(query.pageSize)) : 10
  const pageCount = Math.ceil(filtered.length / pageSize)
  const requestedPage = Number.isFinite(query.page) ? Math.max(1, Math.floor(query.page)) : 1
  const page = pageCount === 0 ? 1 : Math.min(requestedPage, pageCount)
  const start = (page - 1) * pageSize
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageCount }
}
