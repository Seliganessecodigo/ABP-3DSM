import { expect, test, type Page } from '@playwright/test'
import { application, gate, mockApi, mockCatalog } from './support/catalog.ts'

type SummaryApplication = {
  applicationId: string
  name: string
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED'
  energy: { value: number | null; unit: string; reasons: { code: string }[] }
  emissions: { value: number | null; unit: string; reasons: { code: string }[] }
  coverage: { energy: number; emissions: number }
  collectionSuccessRate?: number | null
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
    collectionSuccess: { successful: 18, total: 20, rate: 0.9, firstAttemptAt: routeUrl.searchParams.get('from'), lastAttemptAt: routeUrl.searchParams.get('from') },
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

for (const width of [1440, 390]) {
  test(`dashboard headings have space for their icons and distinguish collection success at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await mockCatalog(page, [application()])
    await mockSummary(page, url => ({ json: summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)]) }))
    await page.goto('/dashboard')
    const coverage = page.getByRole('heading', { name: 'Sucesso das coletas', exact: true })
    await expect(coverage.locator('svg')).toHaveAttribute('data-icon', 'circle-check')
    await expect(page.locator('#dashboard-collection-success')).toContainText('90%')
    await expect(page.locator('#dashboard-collection-success')).not.toContainText('50%')
    await expect(page.getByRole('heading', { name: 'Composição de CO₂e por aplicação', exact: true }).locator('svg')).toHaveAttribute('data-icon', 'chart-pie')
    for (const heading of await page.locator('main h2:has(svg)').all()) {
      const gap = await heading.evaluate(element => {
        const icon = element.querySelector('svg')!
        const text = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())!
        const range = document.createRange()
        range.setStart(text, 0)
        range.setEnd(text, 1)
        return range.getBoundingClientRect().left - icon.getBoundingClientRect().right
      })
      expect(gap, await heading.innerText()).toBeGreaterThanOrEqual(10)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`dashboard-spacing-${width}.png`), fullPage: true })
  })
}

test('rota raiz abre o dashboard e marca sua navegação como ativa', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockSummary(page, (url) => ({ json: summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)]) }))

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Dashboard ambiental' })).toBeVisible()
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  await expect(navigation.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(navigation.getByRole('link', { name: 'Aplicações', exact: true })).not.toHaveAttribute('aria-current', 'page')
})

test('dashboard starts on a preset and allows a shareable custom UTC range', async ({ page }, testInfo) => {
  const requests: URL[] = []
  await page.setViewportSize({ width: 390, height: 900 })
  await mockCatalog(page, [application()])
  await mockSummary(page, url => {
    requests.push(url)
    return { json: summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85, { collectionSuccessRate: 0.2 })]) }
  })
  await page.goto('/dashboard')
  const preset = page.getByRole('button', { name: '7 dias', exact: true })
  const custom = page.getByRole('button', { name: 'Intervalo personalizado', exact: true })
  const apply = page.getByRole('button', { name: 'Aplicar período', exact: true })
  await expect(preset).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('20%', { exact: true })).toBeVisible()
  await custom.click()
  const start = page.getByLabel('Início (UTC)', { exact: true })
  const end = page.getByLabel('Fim exclusivo (UTC)', { exact: true })
  await start.fill('2026-10-01T06:00')
  await end.fill('2026-10-01T05:59')
  await expect(apply).toBeDisabled()
  await expect(preset).toHaveAttribute('aria-pressed', 'true')
  await end.fill('2026-10-08T14:15')
  await expect(apply).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await page.screenshot({ path: testInfo.outputPath('dashboard-intervalo-personalizado.png'), fullPage: true })
  await apply.click()
  await expect(custom).toHaveAttribute('aria-pressed', 'true')
  await expect(start).toBeHidden()
  await expect.poll(() => requests.at(-1)?.searchParams.get('from')).toBe('2026-10-01T06:00:00.000Z')
  expect(requests.at(-1)?.searchParams.get('to')).toBe('2026-10-08T14:15:00.000Z')
  expect(new URL(page.url()).searchParams.get('period')).toBe('custom')

  await page.reload()
  await expect(custom).toHaveAttribute('aria-pressed', 'true')
  await custom.click()
  await expect(start).toHaveValue('2026-10-01T06:00')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(custom).toHaveAttribute('aria-pressed', 'true')
  await preset.click()
  await expect(preset).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => new URL(page.url()).searchParams.has('from')).toBe(false)
})

for (const successful of [0, 20, null, undefined]) {
  test(`collection success preserves the ${String(successful)} attempts state without borrowing temporal coverage`, async ({ page }, testInfo) => {
    await mockCatalog(page, [application()])
    await mockSummary(page, url => {
      expect(url.searchParams.get('includeCollectionSuccess')).toBe('true')
      const response = summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)])
      return { json: { ...response, collectionSuccess: successful === undefined ? undefined : successful === null
        ? { successful: 0, total: 0, rate: null, firstAttemptAt: null, lastAttemptAt: null }
        : { ...response.collectionSuccess, successful, rate: successful / 20 } } }
    })
    await page.goto('/dashboard')
    const card = page.locator('#dashboard-collection-success')
    await expect(card.getByRole('heading', { name: 'Sucesso das coletas', exact: true })).toBeVisible()
    if (successful === null || successful === undefined) {
      await expect(card).toContainText(successful === null ? 'Sem coletas registradas no período.' : 'Taxa de sucesso indisponível.')
      await expect(card.getByRole('img')).toHaveCount(0)
      await expect(card).not.toContainText('0%')
    } else {
      await expect(card.getByRole('img')).toHaveAccessibleName(`Sucesso das coletas: ${successful === 0 ? '0%' : '100%'}`)
      await expect(card).toContainText('Tentativas registradas')
      await expect(card).not.toContainText('50%')
    }
    if (successful === 20) await page.screenshot({ path: testInfo.outputPath('sucesso-coletas.png'), fullPage: true })
  })
}

test('collection success and its help are translated in Russian', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockSummary(page, url => ({ json: summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)]) }))
  await page.goto('/dashboard')
  await page.locator('select').filter({ has: page.locator('option[value="ru-RU"]') }).selectOption('ru-RU')
  await expect(page.locator('#dashboard-collection-success')).toContainText('Успешность сбора')
  await expect(page.locator('#dashboard-collection-success')).toContainText('Учтённые попытки')
})

test('dashboard renders persisted temporal results and preserves missing intervals', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-08T12:00:00.000Z') })
  await mockCatalog(page, [application()])
  await mockSummary(page, (url) => ({ json: {
    ...summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)]),
    series: { granularity: 'hour', points: [
      { bucketStart: '2026-10-08T10:00:00.000Z', bucketEnd: '2026-10-08T11:00:00.000Z', period: { from: '2026-10-08T10:00:00.000Z', to: '2026-10-08T11:00:00.000Z' }, energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 85, unit: 'gCO2e', reasons: [] }, coverage: { energy: 1, emissions: 1 } },
      { bucketStart: '2026-10-08T11:00:00.000Z', bucketEnd: '2026-10-08T12:00:00.000Z', period: { from: '2026-10-08T11:00:00.000Z', to: '2026-10-08T12:00:00.000Z' }, energy: { value: null, unit: 'kWh', reasons: [] }, emissions: { value: null, unit: 'gCO2e', reasons: [] }, coverage: { energy: 0, emissions: 0 } },
    ] },
  } }))
  await page.goto('/dashboard')
  const panel = page.getByRole('region', { name: 'Série temporal', exact: true })
  await expect(panel.getByRole('img')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('dashboard-series.png') })
  await panel.getByRole('button', { name: 'Tabela', exact: true }).click()
  await expect(panel.getByRole('table')).toContainText('85 gCO2e')
  await expect(panel.getByRole('table')).toContainText('Sem resultado')
})

test('temporal series shows both metrics in the graph and in its hover details', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-08T12:00:00.000Z') })
  await mockCatalog(page, [application()])
  await mockSummary(page, url => ({ json: {
    ...summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)]),
    series: { granularity: 'hour', points: [
      { bucketStart: '2026-10-08T10:00:00.000Z', bucketEnd: '2026-10-08T11:00:00.000Z', period: { from: '2026-10-08T10:00:00.000Z', to: '2026-10-08T11:00:00.000Z' }, energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 85, unit: 'gCO2e', reasons: [] }, coverage: { energy: 1, emissions: 1 } },
      { bucketStart: '2026-10-08T11:00:00.000Z', bucketEnd: '2026-10-08T12:00:00.000Z', period: { from: '2026-10-08T11:00:00.000Z', to: '2026-10-08T12:00:00.000Z' }, energy: { value: 4, unit: 'kWh', reasons: [] }, emissions: { value: 40, unit: 'gCO2e', reasons: [] }, coverage: { energy: 1, emissions: 1 } },
    ] },
  } }))
  await page.goto('/dashboard')

  const panel = page.getByRole('region', { name: 'Série temporal', exact: true })
  await panel.getByRole('button', { name: 'Energia + CO₂e', exact: true }).click()
  await expect(panel.locator('svg rect[data-metric="energy"]')).toHaveCount(2)
  await expect(panel.locator('svg rect[data-metric="emissions"]')).toHaveCount(2)
  await panel.locator('svg rect[data-metric="energy"]').first().hover()
  await expect(panel.getByRole('status')).toContainText('2 kWh')
  await expect(panel.getByRole('status')).toContainText('85 gCO2e')

  await panel.getByRole('button', { name: 'Tabela', exact: true }).click()
  await expect(panel.getByRole('table').locator('thead')).toContainText('kWh')
  await expect(panel.getByRole('table').locator('thead')).toContainText('gCO2e')
  await expect(panel.getByRole('table')).toContainText('4 kWh')
  await expect(panel.getByRole('table')).toContainText('40 gCO2e')
})

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
  await expect(page.getByText('Não foi possível consultar a série temporal.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ajuda desta tela', exact: true }).click()
  while (await page.getByRole('dialog').getByRole('heading').innerText() !== 'Série temporal') {
    await page.getByRole('dialog').getByRole('button', { name: 'Próximo', exact: true }).click()
  }
  await expect(page.getByRole('dialog')).toContainText('Lacunas indicam ausência de dados; não representam zero.')
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar ajuda', exact: true }).click()
  await expect(page.locator('tbody tr[data-dashboard-application-id]')).toHaveCount(2)
  await expect(page.locator('tbody tr').nth(0)).toContainText('api-estoque')
  await expect(page.locator('tbody tr').nth(1)).toContainText('api-checkout')
  await expect(page.getByRole('link', { name: /ver detalhes: api-estoque/i })).toHaveAttribute('href', /\/services\/svc-1/)
})

test('composition gives every application a distinct arc and keeps the legend compact', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockSummary(page, (url) => ({ json: summaryResponse(url, [
    contribution('svc-1', 'primeira', 40),
    contribution('svc-2', 'segunda', 30),
    contribution('svc-3', 'terceira', 20),
    contribution('svc-4', 'quarta', 3),
    contribution('svc-5', 'quinta', 2),
    contribution('svc-6', 'sexta', 2),
    contribution('svc-7', 'sétima', 2),
    contribution('svc-8', 'oitava', 1),
  ]) }))

  await page.goto('/dashboard')
  const composition = page.locator('[data-help="dashboard-composition"]')
  const donut = composition.locator('div[role="group"]')
  await expect(donut).toHaveAttribute('aria-label', /8 aplicações, total 100 gCO2e/)
  const arcs = composition.locator('svg g[role="button"]')
  await expect(arcs).toHaveCount(8)
  expect(new Set(await arcs.evaluateAll((segments) => segments.map((segment) => {
    const shape = segment.querySelector('path, circle, rect[fill^="url"]')
    return shape?.getAttribute('stroke') ?? shape?.getAttribute('fill')
  }))).size).toBe(8)
  await expect(composition.locator('svg g[role="button"] path[stroke-linecap="round"]')).toHaveCount(3)
  await expect(composition.locator('svg rect[rx]')).toHaveCount(5)
  await expect(composition.getByText('primeira')).toBeVisible()
  await expect(composition.getByText('quarta')).toBeHidden()
  await expect(composition.locator('details summary')).toContainText('Outras aplicações (5)')
  await expect(composition.locator('details summary')).toContainText('10%')

  const firstApplication = composition.locator('ul').first().getByRole('button', { name: /primeira/ })
  await firstApplication.click()
  await expect(firstApplication).toHaveAttribute('aria-pressed', 'true')
  await expect(donut).toHaveAttribute('aria-label', /^primeira: 40 gCO2e \(40%\)/)
  await expect(composition.locator('svg g[role="button"][opacity="0.42"]')).toHaveCount(7)
  await firstApplication.click()
  await expect(composition.locator('svg g[role="button"][opacity="0.42"]')).toHaveCount(0)

  const smallestSegment = composition.locator('svg g[role="button"][aria-label^="oitava:"]')
  await smallestSegment.hover()
  await expect(composition.getByRole('tooltip')).toContainText('oitava')
  await smallestSegment.click()
  await expect(smallestSegment).toHaveAttribute('aria-pressed', 'true')
  await expect(donut).toHaveAttribute('aria-label', /^oitava: 1 gCO2e \(1%\)/)
  await smallestSegment.press('Space')
  await expect(smallestSegment).toHaveAttribute('aria-pressed', 'false')

  const cardHeight = await composition.evaluate((element) => element.getBoundingClientRect().height)
  await composition.locator('details summary').click()
  expect(await composition.evaluate((element) => element.getBoundingClientRect().height)).toBe(cardHeight)
  expect(await composition.locator('details ul').evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await expect(composition.getByText('quarta')).toBeVisible()
  await expect(composition.locator('details')).toContainText('oitava')
  await expect(composition.locator('details')).toContainText('3 gCO2e')
  await expect(composition.locator('details')).toContainText('1 gCO2e')
  await composition.locator('details ul').getByRole('button', { name: /quarta/ }).click()
  await expect(donut).toHaveAttribute('aria-label', /^quarta: 3 gCO2e \(3%\)/)

  await composition.getByRole('button', { name: 'Ver barras' }).click()
  await expect(composition.locator('details')).toHaveCount(0)
  await expect(composition.getByText('quinta')).toBeVisible()
  await expect(composition.locator('ul').first().getByRole('button', { name: /quarta/ })).toHaveAttribute('aria-pressed', 'true')
  const barPositions = await composition.locator('li[class*="barRow"]').evaluateAll((rows) => rows.flatMap((row) =>
    [...row.querySelectorAll('[data-metric]')].map((metric) => {
      const track = metric.querySelector('[class*="barTrack"]')?.getBoundingClientRect()
      const value = metric.querySelector('[class*="barMetricValue"]')?.getBoundingClientRect()
      return { trackX: track?.left ?? 0, valueX: value?.left ?? 0, trackY: track ? track.top + track.height / 2 : 0, valueY: value ? value.top + value.height / 2 : 0 }
    }),
  ))
  expect(Math.max(...barPositions.map((row) => row.trackX)) - Math.min(...barPositions.map((row) => row.trackX))).toBeLessThan(1)
  expect(Math.max(...barPositions.map((row) => row.valueX)) - Math.min(...barPositions.map((row) => row.valueX))).toBeLessThan(1)
  expect(barPositions.every((row) => Math.abs(row.trackY - row.valueY) < 2)).toBe(true)
  await composition.getByRole('button', { name: 'Crescente', exact: true }).click()
  await composition.getByRole('button', { name: 'Ver rosca' }).click()
  await expect(composition.getByText('primeira')).toBeVisible()
  await expect(composition.getByText('quinta')).toBeHidden()
  await expect(donut).toHaveAttribute('aria-label', /^quarta: 3 gCO2e \(3%\)/)

  await page.setViewportSize({ width: 375, height: 812 })
  await composition.getByRole('button', { name: 'Ver barras' }).click()
  const mobileBars = composition.locator('li[class*="barRow"]').first().locator('..')
  expect(await mobileBars.evaluate((list) => list.scrollHeight <= list.clientHeight)).toBe(true)
  expect(await composition.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
})

test('summary filter preserves the period and applies the historical region filter to the API', async ({ page }) => {
  let catalogRequests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/applications') catalogRequests += 1
  })
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
  await expect(page.getByLabel('Região histórica')).toBeEnabled()
  const initialCatalogRequests = catalogRequests
  await page.getByRole('button', { name: '90 dias', exact: true }).click()
  await page.getByLabel('Estado atual').selectOption('UNAVAILABLE')
  await page.getByLabel('Região histórica').selectOption('US-VA')

  await expect.poll(() => requests.at(-1)?.searchParams.get('states')).toBe('UNAVAILABLE')
  await expect.poll(() => requests.at(-1)?.searchParams.get('regionCodes')).toBe('US-VA')
  await expect.poll(() => requests.at(-1)?.searchParams.get('from')).toBeTruthy()
  await expect(page).toHaveURL(/dashboard\?.*period=90d.*regionCode=US-VA.*dashboardState=UNAVAILABLE/)
  expect(catalogRequests).toBe(initialCatalogRequests)
  await page.getByRole('button', { name: 'Atualizar dados' }).click()
  await expect.poll(() => catalogRequests).toBe(initialCatalogRequests + 1)
})

test('dashboard catalog polling remains independent from a slow summary and stops after navigation', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00.000Z') })
  let catalogRequests = 0
  const pendingSummary = gate()
  await mockApi(page, async (route) => {
    catalogRequests += 1
    await route.fulfill({ json: [application()] })
  })
  await mockSummary(page, async (url) => {
    await pendingSummary.wait
    return { json: summaryResponse(url, []) }
  })
  await page.goto('/dashboard')
  await expect(page.getByLabel('Região histórica')).toBeEnabled()
  const initialCatalogRequests = catalogRequests
  await page.clock.fastForward(60_000)
  await expect.poll(() => catalogRequests).toBe(initialCatalogRequests + 1)
  await page.getByRole('navigation').getByRole('link', { name: /metodologia/i }).click()
  pendingSummary.release()
  const requestsAfterNavigation = catalogRequests
  await page.clock.fastForward(120_000)
  expect(catalogRequests).toBe(requestsAfterNavigation)
})

test('dashboard preserves catalog regions after a failed refresh and retries independently', async ({ page }) => {
  let failing = false
  await mockApi(page, async (route) => {
    await route.fulfill(failing
      ? { status: 503, json: { code: 'CATALOG_UNAVAILABLE' } }
      : { json: [application()] })
  })
  await mockSummary(page, (url) => ({ json: summaryResponse(url, [contribution('svc-0142', 'app-pagamentos', 85)]) }))
  await page.goto('/dashboard')
  const region = page.getByLabel('Região histórica')
  await expect(region).toBeEnabled()
  await expect(region.locator('option[value="BR-SP"]')).toHaveCount(1)
  failing = true
  await page.getByRole('button', { name: 'Atualizar dados' }).click()
  await expect(region).toBeDisabled()
  await expect(region.locator('option[value="BR-SP"]')).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Indicadores ambientais' })).toContainText('85 gCO2e')
  failing = false
  await expect(page.getByRole('button', { name: 'Atualizar dados' })).toHaveAttribute('aria-disabled', 'false')
  await page.getByRole('button', { name: 'Atualizar dados' }).click()
  await expect(region).toBeEnabled()
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
