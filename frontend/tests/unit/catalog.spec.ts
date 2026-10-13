import { expect, test } from '@playwright/test'
import {
  selectCatalog,
  type CatalogEntry,
  type CatalogQuery,
} from '../../src/features/applications/catalog.ts'

const applications: CatalogEntry[] = [
  { id: 'svc-001', name: 'api-pagamentos', state: 'AVAILABLE', location: { regionCode: 'BR-SP', region: 'São Paulo' } },
  { id: 'svc-002', name: 'api-checkout', state: 'UNAVAILABLE', location: { regionCode: 'US-VA', region: 'Virginia' } },
  { id: 'svc-003', name: 'api-estoque', state: 'NO_METRICS', location: { regionCode: 'BR-SP', region: 'São Paulo' } },
  { id: 'svc-004', name: 'api-legado', state: 'REMOVED', location: null },
  { id: 'svc-005', name: 'api-pagamentos', state: 'AVAILABLE', location: null },
]

const query: CatalogQuery = { search: '', state: 'ALL', page: 1, pageSize: 10 }

test('catálogo vazio retorna zero itens e zero páginas', () => {
  expect(selectCatalog([], query)).toEqual({ items: [], total: 0, page: 1, pageCount: 0 })
})

test('Todas conserva as identidades, inclusive removidas e nomes iguais', () => {
  const result = selectCatalog(applications, query)
  expect(result.items.map((item) => item.id)).toEqual(['svc-001', 'svc-002', 'svc-003', 'svc-004', 'svc-005'])
  expect(result.total).toBe(5)
})

test('busca por parte do nome preserva aplicações com nomes iguais', () => {
  const result = selectCatalog(applications, { ...query, search: 'pagamentos' })
  expect(result.items.map((item) => item.id)).toEqual(['svc-001', 'svc-005'])
})

test('busca pelo identificador estável', () => {
  expect(selectCatalog(applications, { ...query, search: 'svc-003' }).items.map((item) => item.id)).toEqual(['svc-003'])
})

test('busca pelo nome da região', () => {
  expect(selectCatalog(applications, { ...query, search: 'São Paulo' }).items.map((item) => item.id)).toEqual(['svc-001', 'svc-003'])
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

test('primeira página contém apenas os primeiros itens, mantendo a ordem recebida', () => {
  const result = selectCatalog(applications, { ...query, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-001', 'svc-002'])
  expect({ total: result.total, page: result.page, pageCount: result.pageCount }).toEqual({ total: 5, page: 1, pageCount: 3 })
})

test('segunda página não repete as identidades da primeira', () => {
  const result = selectCatalog(applications, { ...query, page: 2, pageSize: 2 })
  expect(result.items.map((item) => item.id)).toEqual(['svc-003', 'svc-004'])
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
