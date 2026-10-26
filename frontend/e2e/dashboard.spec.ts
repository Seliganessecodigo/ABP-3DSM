import { expect, test, type Page } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

type SummaryApplication = {
  applicationId: string
  name: string
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'
  energy: { value: number | null; unit: string; reasons: { code: string }[] }
  emissions: { value: number | null; unit: string; reasons: { code: string }[] }
  coverage: { energy: number; emissions: number }
}

function contribution(
  applicationId: string,
  name: string,
  emissions: number | null,
  overrides: Partial<SummaryApplication> = {},
): SummaryApplication {
  return {
    applicationId,
    name,
    state: 'AVAILABLE',
    energy: { value: 2, unit: 'kWh', reasons: [] },
    emissions: { value: emissions, unit: 'gCO2e', reasons: [] },
    coverage: { energy: 1, emissions: emissions === null ? 0 : 0.85 },
    ...overrides,
  }
}

function summaryResponse(routeUrl: URL, applications: SummaryApplication[]) {
  const energyValue = applications.reduce((total, application) => total + (application.energy.value ?? 0), 0)
  const emissionsValues = applications.flatMap((application) => application.emissions.value === null ? [] : [application.emissions.value])
  const emissionsValue = emissionsValues.length === 0 ? null : emissionsValues.reduce((total, value) => total + value, 0)
  return {
    status: applications.length === 0 ? 'empty' : 'available',
    period: { from: routeUrl.searchParams.get('from'), to: routeUrl.searchParams.get('to') },
    dataAsOf: '2026-10-08T12:00:00.000Z',
    totals: {
      energy: { value: applications.length === 0 ? null : energyValue, unit: 'kWh', reasons: [] },
      emissions: { value: emissionsValue, unit: 'gCO2e', reasons: [] },
    },
    coverage: { energy: applications.length === 0 ? 0 : 0.75, emissions: emissionsValue === null ? 0 : 0.5 },
    states: { AVAILABLE: applications.length, UNAVAILABLE: 1, NO_METRICS: 1, REMOVED: 0 },
    applications,
    provenance: { methodologies: [], factors: [], reasons: [] },
  }
}

async function mockSummary(page: Page, handler: (routeUrl: URL) => Promise<{ status?: number; json: unknown }> | { status?: number; json: unknown }) {
  await page.route(/\/analysis\/summary(?:\?.*)?$/, async (route) => {
    const routeUrl = new URL(route.request().url())
    await route.fulfill(await handler(routeUrl))
  })
}

test('dashboard presents real summary values, separate coverage and contribution composition', async ({ page }) => {
  await mockCatalog(page, [
    application({ id: 'svc-1', name: 'api-estoque', location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null, latitude: -23, longitude: -46 } }),
    application({ id: 'svc-2', name: 'api-checkout', location: { regionCode: 'US-VA', country: 'United States', region: 'Virginia', city: null, latitude: 38, longitude: -77 } }),
  ])
  await mockSummary(page, (url) => ({ json: summaryResponse(url, [
    contribution('svc-1', 'api-estoque', 8.4),
    contribution('svc-2', 'api-checkout', 4.2),
  ]) }))

  await page.goto('/dashboard')

  await expect(page.getByRole('heading', { name: 'Dashboard ambiental' })).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('4 kWh', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Indicadores ambientais' }).getByText('12,6 gCO2e', { exact: true })).toBeVisible()
  await expect(page.getByText(/série histórica agregada ainda não faz parte/i)).toBeVisible()
  await expect(page.getByText(/comparação com período anterior indisponível/i)).toBeVisible()
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toHaveCount(2)
  await expect(page.locator('tbody tr').nth(0)).toContainText('api-estoque')
  await expect(page.locator('tbody tr').nth(1)).toContainText('api-checkout')
  await expect(page.getByRole('link', { name: /ver detalhes: api-estoque/i })).toHaveAttribute('href', /\/services\/svc-1/)
})

test('summary filter preserves the period and applies the historical region filter to the API', async ({ page }) => {
  await mockCatalog(page, [
    application({ id: 'svc-1', location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null, latitude: -23, longitude: -46 } }),
    application({ id: 'svc-2', location: { regionCode: 'US-VA', country: 'United States', region: 'Virginia', city: null, latitude: 38, longitude: -77 } }),
  ])
  const requests: URL[] = []
  await mockSummary(page, (url) => {
    requests.push(url)
    const selectedRegion = url.searchParams.get('regionCodes')
    const selectedState = url.searchParams.get('states')
    const results = [
      contribution('svc-1', 'api-sao-paulo', 8.4, { state: 'AVAILABLE' }),
      contribution('svc-2', 'api-virginia', 4.2, { state: 'UNAVAILABLE' }),
    ].filter((item) => (!selectedRegion || item.applicationId === (selectedRegion === 'BR-SP' ? 'svc-1' : 'svc-2')) &&
      (!selectedState || item.state === selectedState))
    return { json: summaryResponse(url, results) }
  })

  await page.goto('/dashboard?period=30d')
  await page.getByLabel('Estado atual').selectOption('UNAVAILABLE')
  await page.getByLabel('Região histórica').selectOption('US-VA')

  await expect.poll(() => requests.at(-1)?.searchParams.get('states')).toBe('UNAVAILABLE')
  await expect.poll(() => requests.at(-1)?.searchParams.get('regionCodes')).toBe('US-VA')
  await expect.poll(() => requests.at(-1)?.searchParams.get('from')).toBeTruthy()
  await expect(page).toHaveURL(/dashboard\?.*period=30d.*regionCode=US-VA.*dashboardState=UNAVAILABLE/)
})

test('failed refresh preserves the previous summary and retry recovers without reload', async ({ page }) => {
  await mockCatalog(page, [application({ id: 'svc-1' })])
  let fail = false
  await mockSummary(page, (url) => {
    if (fail) return { status: 503, json: { code: 'ANALYSIS_SUMMARY_UNAVAILABLE' } }
    return { json: summaryResponse(url, [contribution('svc-1', 'api-pagamentos', 85)]) }
  })

  await page.goto('/dashboard')
  const emissionsIndicator = page.getByRole('region', { name: 'Indicadores ambientais' }).getByText('85 gCO2e', { exact: true })
  await expect(emissionsIndicator).toBeVisible()
  fail = true
  await page.getByRole('button', { name: 'Atualizar dados' }).click()
  await expect(page.getByRole('alert')).toContainText(/falha na atualização/i)
  await expect(emissionsIndicator).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Atualizar dados' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(emissionsIndicator).toBeVisible()
})

test('dashboard table search and pagination operate on the filtered set', async ({ page }) => {
  const catalog = Array.from({ length: 12 }, (_, index) => application({
    id: `svc-${index}`,
    name: index === 0 ? 'api-são-paulo' : `api-${String(index).padStart(2, '0')}`,
  }))
  await mockCatalog(page, catalog)
  await mockSummary(page, (url) => ({ json: summaryResponse(url, catalog.map((item, index) =>
    contribution(item.id, item.name, 100 - index))) }))

  await page.goto('/dashboard')
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toHaveCount(10)
  await page.getByRole('searchbox', { name: 'Buscar aplicações' }).fill('sao-paulo')
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toHaveCount(1)
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toContainText('api-são-paulo')
  await page.getByRole('searchbox', { name: 'Buscar aplicações' }).fill('')
  await expect(page.getByLabel('Itens por página')).toHaveValue('10')
  await page.getByLabel('Itens por página').selectOption('5')
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toHaveCount(5)
  await expect(page).toHaveURL(/size=5/)
})

test('mobile dashboard keeps compact indicators and readable application rows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application({ id: 'svc-1', name: 'api-pagamentos' })])
  await mockSummary(page, (url) => ({ json: summaryResponse(url, [
    contribution('svc-1', 'api-pagamentos', 8.4),
  ]) }))

  await page.goto('/dashboard')

  const indicators = page.getByRole('region', { name: 'Indicadores ambientais' })
  await expect(indicators.locator('article')).toHaveCount(4)
  await expect.poll(() => indicators.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toContainText('api-pagamentos')
  await expect(page.locator('tbody tr[data-dashboard-application-id]').getByText('8,4 gCO2e')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
