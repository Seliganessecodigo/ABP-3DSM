import { expect, test } from '@playwright/test'
import {
  selectCatalog,
  type CatalogEntry,
  type CatalogQuery,
} from '../../src/features/applications/catalog.ts'

const applications: CatalogEntry[] = [
  { id: 'svc-001', name: 'api-pagamentos', state: 'AVAILABLE', location: { regionCode: 'BR-SP', region: 'Sudeste', country: 'Brasil', city: 'São Paulo' } },
  { id: 'svc-002', name: 'api-checkout', state: 'UNAVAILABLE', location: { regionCode: 'US-VA', region: 'Virginia', country: 'Estados Unidos', city: 'Virginia' } },
  { id: 'svc-003', name: 'api-estoque', state: 'NO_METRICS', location: { regionCode: 'BR-SP', region: 'Sudeste', country: 'Brasil', city: null } },
  { id: 'svc-004', name: 'api-legado', state: 'REMOVED', location: null },
  { id: 'svc-005', name: 'api-pagamentos', state: 'AVAILABLE', location: null },
]

const query: CatalogQuery = { search: '', state: 'ALL', regionCode: '', page: 1, pageSize: 10 }

test('catálogo vazio retorna zero itens e zero páginas', () => {
  expect(selectCatalog([], query)).toEqual({ items: [], total: 0, page: 1, pageCount: 0 })
})

test('Todas conserva as identidades, inclusive removidas e nomes iguais, em ordem inicial por nome', () => {
  const result = selectCatalog(applications, query)
  expect(result.items.map((item) => item.id)).toEqual(['svc-002', 'svc-003', 'svc-004', 'svc-001', 'svc-005'])
  expect(result.total).toBe(5)
})

test('busca por parte do nome preserva aplicações com nomes iguais', () => {
  const result = selectCatalog(applications, { ...query, search: 'pagamentos' })
  expect(result.items.map((item) => item.id)).toEqual(['svc-001', 'svc-005'])
})

test('busca pelo identificador estável', () => {
  expect(selectCatalog(applications, { ...query, search: 'svc-003' }).items.map((item) => item.id)).toEqual(['svc-003'])
})

test('busca por cidade visível', () => {
  expect(selectCatalog(applications, { ...query, search: 'São Paulo' }).items.map((item) => item.id)).toEqual(['svc-001'])
})

test('busca pelo código regional', () => {
  expect(selectCatalog(applications, { ...query, search: 'US-VA' }).items.map((item) => item.id)).toEqual(['svc-002'])
})

test('busca não depende de maiúsculas e minúsculas', () => {
  expect(selectCatalog(applications, { ...query, search: 'API-CHECKOUT' }).items.map((item) => item.id)).toEqual(['svc-002'])
})

for (const [state, ids] of [
  ['AVAILABLE', ['svc-001', 'svc-005']],
  ['UNAVAILABLE', ['svc-002']],
  ['NO_METRICS', ['svc-003']],
  ['REMOVED', ['svc-004']],
] satisfies Array<[CatalogEntry['state'], string[]]>) {
  test(`filtro ${state} retorna somente as identidades desse estado`, () => {
    const result = selectCatalog(applications, { ...query, state })
    expect(result.items.map((item) => item.id)).toEqual(ids)
    expect(result.total).toBe(ids.length)
  })
}

test('combina busca regional com estado', () => {
  const result = selectCatalog(applications, { ...query, search: 'BR-SP', state: 'AVAILABLE' })
  expect(result.items.map((item) => item.id)).toEqual(['svc-001'])
  expect(result.total).toBe(1)
})

test('localização nula não impede busca por nome', () => {
  expect(selectCatalog(applications, { ...query, search: 'legado' }).items.map((item) => item.id)).toEqual(['svc-004'])
})

test('localização nula não impede busca por ID', () => {
  expect(selectCatalog(applications, { ...query, search: 'svc-005' }).items.map((item) => item.id)).toEqual(['svc-005'])
})

test('busca sem correspondência retorna resultado vazio', () => {
  expect(selectCatalog(applications, { ...query, search: 'inexistente' })).toEqual({ items: [], total: 0, page: 1, pageCount: 0 })
})

test('primeira página contém os primeiros itens da ordenação inicial por nome', () => {
  const result = selectCatalog(applications, { ...query, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-002', 'svc-003'])
  expect({ total: result.total, page: result.page, pageCount: result.pageCount }).toEqual({ total: 5, page: 1, pageCount: 3 })
})

test('segunda página não repete as identidades da primeira', () => {
  const result = selectCatalog(applications, { ...query, page: 2, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-004', 'svc-001'])
  expect(result.page).toBe(2)
})

test('última página pode conter menos itens que o tamanho de página', () => {
  const result = selectCatalog(applications, { ...query, page: 3, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-005'])
  expect(result.pageCount).toBe(3)
})

test('filtra antes de paginar e calcula o total do resultado filtrado', () => {
  const result = selectCatalog(applications, { ...query, search: 'pagamentos', page: 2, pageSize: 1 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-005'])
  expect({ total: result.total, page: result.page, pageCount: result.pageCount }).toEqual({ total: 2, page: 2, pageCount: 2 })
})

test('página além do resultado é ajustada para a última página válida', () => {
  const result = selectCatalog(applications, { ...query, page: 9, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-005'])
  expect(result.page).toBe(3)
})

test('redução por filtro conserva uma página válida', () => {
  const result = selectCatalog(applications, { ...query, search: 'checkout', page: 3, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-002'])
  expect({ page: result.page, pageCount: result.pageCount }).toEqual({ page: 1, pageCount: 1 })
})

test('paginação não altera a coleção recebida nem seus registros', () => {
  const input = [
    { id: 'b', name: 'Beta', state: 'AVAILABLE', location: null },
    { id: 'a', name: 'Alfa', state: 'REMOVED', location: null },
  ] satisfies CatalogEntry[]
  selectCatalog(input, { ...query, pageSize: 1 })
  expect(input).toEqual([
    { id: 'b', name: 'Beta', state: 'AVAILABLE', location: null },
    { id: 'a', name: 'Alfa', state: 'REMOVED', location: null },
  ])
})

const catalogLabels = {
  AVAILABLE: 'Disponível',
  UNAVAILABLE: 'Indisponível',
  NO_METRICS: 'Sem métricas',
  REMOVED: 'Removida',
} satisfies Record<CatalogEntry['state'], string>

const detailedApplications: CatalogEntry[] = [
  { id: 'svc-z', name: 'Zeta', state: 'AVAILABLE', location: { regionCode: 'BR-SP', region: 'Sudeste', country: 'Brasil', city: 'São Paulo' }, lastCheckedAt: '2026-10-15T14:00:00.000Z' },
  { id: 'svc-b', name: 'Alpha', state: 'UNAVAILABLE', location: { regionCode: 'BR-SU', region: 'Sul', country: 'Brasil', city: null }, lastCheckedAt: '2026-10-15T15:00:00.000Z' },
  { id: 'svc-a', name: 'Alpha', state: 'NO_METRICS', location: null, lastCheckedAt: null },
]

const detailedQuery = {
  ...query,
  filters: { name: '', country: '', regionCode: '', city: '', cityIsMissing: false, state: 'ALL' as const, lastCheckedFrom: '', lastCheckedTo: '' },
}

test('busca geral ignora acentos e caixa em todos os campos exibidos', () => {
  const result = selectCatalog(detailedApplications, { ...detailedQuery, search: ' SAO ' }, {
    locale: 'pt-BR', timeZone: 'UTC', stateLabels: catalogLabels,
  })
  expect(result.items.map((item) => item.id)).toEqual(['svc-z'])
})

test('busca geral encontra estado traduzido e data de verificação apresentada', () => {
  const unavailable = selectCatalog(detailedApplications, { ...detailedQuery, search: 'indisponivel' }, {
    locale: 'pt-BR', timeZone: 'UTC', stateLabels: catalogLabels,
  })
  const checkedTime = selectCatalog(detailedApplications, { ...detailedQuery, search: '15:00' }, {
    locale: 'pt-BR', timeZone: 'UTC', stateLabels: catalogLabels,
  })
  expect(unavailable.items.map((item) => item.id)).toEqual(['svc-b'])
  expect(checkedTime.items.map((item) => item.id)).toEqual(['svc-b'])
})

test('filtros de coluna combinam com busca geral por interseção', () => {
  const result = selectCatalog(detailedApplications, {
    ...detailedQuery,
    search: 'Brasil',
    filters: { ...detailedQuery.filters, name: 'alpha', country: 'Brasil' },
  }, { locale: 'pt-BR', timeZone: 'UTC', stateLabels: catalogLabels })
  expect(result.items.map((item) => item.id)).toEqual(['svc-b'])
})

test('estado da coluna combina com os filtros de estado existentes', () => {
  const matching = selectCatalog(detailedApplications, {
    ...detailedQuery,
    state: 'ALL',
    filters: { ...detailedQuery.filters, state: 'UNAVAILABLE' },
  })
  const conflicting = selectCatalog(detailedApplications, {
    ...detailedQuery,
    state: 'AVAILABLE',
    filters: { ...detailedQuery.filters, state: 'UNAVAILABLE' },
  })
  expect(matching.items.map((item) => item.id)).toEqual(['svc-b'])
  expect(conflicting.items).toEqual([])
})

test('filtro de cidade permite selecionar explicitamente a ausência', () => {
  const result = selectCatalog(detailedApplications, {
    ...detailedQuery,
    filters: { ...detailedQuery.filters, cityIsMissing: true },
  })
  expect(result.items.map((item) => item.id)).toEqual(['svc-a', 'svc-b'])
})

test('ordenação inicial é nome crescente e desempata por ID sem mutar a lista', () => {
  const input = [...detailedApplications]
  const result = selectCatalog(input, { ...detailedQuery, pageSize: 'all' })
  expect(result.items.map((item) => item.id)).toEqual(['svc-a', 'svc-b', 'svc-z'])
  expect(input.map((item) => item.id)).toEqual(['svc-z', 'svc-b', 'svc-a'])
})

test('ordenação textual mantém valores ausentes no fim nas duas direções', () => {
  const ascending = selectCatalog(detailedApplications, { ...detailedQuery, sort: { column: 'city', direction: 'asc' }, pageSize: 'all' })
  const descending = selectCatalog(detailedApplications, { ...detailedQuery, sort: { column: 'city', direction: 'desc' }, pageSize: 'all' })
  expect(ascending.items.map((item) => item.id)).toEqual(['svc-z', 'svc-a', 'svc-b'])
  expect(descending.items.map((item) => item.id)).toEqual(['svc-z', 'svc-a', 'svc-b'])
})

test('ordenação de última verificação compara instantes e mantém datas ausentes no fim', () => {
  const result = selectCatalog(detailedApplications, { ...detailedQuery, sort: { column: 'lastCheckedAt', direction: 'desc' }, pageSize: 'all' })
  expect(result.items.map((item) => item.id)).toEqual(['svc-b', 'svc-z', 'svc-a'])
})

test('Todos retorna o conjunto filtrado inteiro em uma única página', () => {
  const result = selectCatalog(detailedApplications, { ...detailedQuery, search: 'alpha', page: 3, pageSize: 'all' })
  expect(result.items.map((item) => item.id)).toEqual(['svc-a', 'svc-b'])
  expect({ total: result.total, page: result.page, pageCount: result.pageCount }).toEqual({ total: 2, page: 1, pageCount: 1 })
})
