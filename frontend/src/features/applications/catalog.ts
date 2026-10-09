export type ApplicationState = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'

export interface CatalogEntry {
  id: string
  name: string
  state: ApplicationState
  location: { regionCode: string; region: string } | null
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

// Interface para os testes isolados. O comportamento permanece na fase red.
export function selectCatalog<T extends CatalogEntry>(
  _applications: readonly T[],
  _query: CatalogQuery,
): CatalogPage<T> {
  throw new Error('Filtro e paginação do catálogo ainda não implementados')
}
