import type { Page, Route } from '@playwright/test'

export interface ApplicationResponse {
  id: string
  name: string
  location: {
    regionCode: string
    country: string
    region: string
    city: string | null
    latitude: number
    longitude: number
  } | null
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'
  firstSeenAt: string
  lastCheckedAt: string | null
  removedAt: string | null
  updatedAt: string
}

export function application(overrides: Partial<ApplicationResponse> = {}): ApplicationResponse {
  return {
    id: 'svc-0142',
    name: 'app-pagamentos',
    location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'São Paulo', latitude: -23.55, longitude: -46.63 },
    state: 'AVAILABLE',
    firstSeenAt: '2026-10-09T12:00:00.000Z',
    lastCheckedAt: '2026-10-09T17:32:00.000Z',
    removedAt: null,
    updatedAt: '2026-10-09T17:32:00.000Z',
    ...overrides,
  }
}

export const mixedCatalog = [
  application(),
  application({ id: 'svc-0121', name: 'app-checkout', location: { regionCode: 'US-VA', country: 'Estados Unidos', region: 'Virginia', city: null, latitude: 38.9, longitude: -77.04 } }),
  application({ id: 'svc-0487', name: 'app-estoque', state: 'UNAVAILABLE' }),
  application({ id: 'svc-0900', name: 'app-relatorios', state: 'NO_METRICS' }),
  application({ id: 'svc-0065', name: 'app-legado', state: 'REMOVED', removedAt: '2026-10-09T16:00:00.000Z' }),
]

export function largeCatalog(): ApplicationResponse[] {
  return Array.from({ length: 21 }, (_, index) => {
    const id = String(index + 1).padStart(3, '0')
    return application({ id: `svc-${id}`, name: `api-${id}` })
  })
}

export async function mockApi(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(/\/applications(?:\/[^/?]+)?(?:\?.*)?$/, async (route) => {
    if (route.request().isNavigationRequest()) {
      await route.continue()
      return
    }
    await handler(route)
  })
}

export async function mockCatalog(page: Page, applications: ApplicationResponse[]) {
  await mockApi(page, async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/applications')) {
      await route.fulfill({ json: applications })
      return
    }
    const id = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/applications/') + '/applications/'.length))
    const found = applications.find((item) => item.id === id)
    await route.fulfill(found
      ? { json: found }
      : { status: 404, json: { code: 'APPLICATION_NOT_FOUND', message: 'Aplicação não encontrada' } })
  })
}

export async function unavailable(route: Route) {
  await route.fulfill({ status: 503, json: { code: 'CATALOG_UNAVAILABLE', message: 'Catálogo temporariamente indisponível' } })
}

export function row(page: Page, id: string) {
  return page.getByRole('row').filter({ has: page.getByText(id, { exact: true }) })
}

export function search(page: Page) {
  return page.getByRole('searchbox', { name: /buscar/i })
}

export function gate() {
  let resolve = () => {}
  const wait = new Promise<void>((release) => { resolve = release })
  return { wait, release: () => resolve() }
}
