import { expect, test, type Page } from '@playwright/test'
import { application, gate, mockCatalog } from './support/catalog.ts'
import { mockPreferenceEffects } from './support/preferences.ts'
import { openDashboardApplications } from './support/dashboard.ts'

const desktops = [{ width: 1024, height: 768 }, { width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 2560, height: 1440 }]

async function mockDesktop(page: Page, temporalCoverage = 1) {
  const applications = Array.from({ length: 80 }, (_, index) => application({ id: `desktop-${index}`, name: `Aplicação ${index + 1}` }))
  await mockCatalog(page, applications)
  await mockPreferenceEffects(page)
  await page.route('**/analysis/summary?*', route => {
    const params = new URL(route.request().url()).searchParams
    const from = params.get('from')!, to = params.get('to')!
    const end = new Date(Math.min(Date.parse(from) + 3600000, Date.parse(to))).toISOString()
    const energy = { value: 2, unit: 'kWh', reasons: [] }, emissions = { value: 85, unit: 'gCO2e', reasons: [] }, coverage = { energy: temporalCoverage, emissions: temporalCoverage }
    return route.fulfill({ json: { status: 'available', period: { from, to }, dataAsOf: to,
      totals: { energy: { ...energy, value: 160 }, emissions: { ...emissions, value: 6800 } }, coverage,
      states: { AVAILABLE: 80, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 },
      applications: applications.map(app => ({ applicationId: app.id, name: app.name, state: app.state, energy, emissions, coverage })),
      provenance: { methodologies: [], factors: [], reasons: [] }, series: { granularity: params.get('granularity'), points: [{ bucketStart: from, bucketEnd: end, period: { from, to: end }, energy, emissions, coverage }] },
    } })
  })
}

for (const viewport of desktops) {
  test(`dashboard mantém a visão geral na tela em ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await mockDesktop(page, 0.75)
    await page.goto('/dashboard')
    const overview = page.getByRole('region', { name: 'Indicadores ambientais' })
    await expect(overview).toContainText('160 kWh')
    await expect(page.getByRole('img', { name: /Série temporal/ })).toBeVisible()
    await expect(page.getByRole('img', { name: /Série temporal/ })).toBeInViewport({ ratio: 1 })
    const positions = await overview.locator('> article').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top))
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1)
    const workspace = page.locator('.workspace')
    expect(await workspace.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1)
    for (const target of ['[data-help="dashboard-trend"]', '[data-help="dashboard-composition"]', '#dashboard-applications > summary']) {
      const bounds = await page.locator(target).boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1)
    }
    await page.screenshot({ path: test.info().outputPath('dashboard-overview.png') })
    await openDashboardApplications(page)
    await page.getByLabel('Itens por página', { exact: true }).selectOption('all')
    await expect(page.getByRole('table')).toContainText('Aplicação 24')
    const table = page.locator('[data-help="dashboard-results"] table').locator('..')
    expect(await table.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
    await table.evaluate(element => { element.scrollTop = element.scrollHeight })
    await expect(table.locator('tbody tr').last()).toBeInViewport()
    expect(await workspace.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: test.info().outputPath('dashboard-applications.png') })
  })

  test(`metodologia alinha as quatro abas em ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await mockDesktop(page)
    await page.goto('/methodology')
    for (const name of ['Energia', 'Emissões de CO₂e', 'Cobertura dos dados', 'Padrão das análises']) {
      await page.getByRole('tab', { name, exact: true }).click()
      const cards = page.getByRole('tabpanel').locator('> section')
      await expect(cards).toHaveCount(3)
      const bounds = await cards.evaluateAll(elements => elements.map(element => ({ y: element.getBoundingClientRect().y, height: element.getBoundingClientRect().height })))
      expect(Math.max(...bounds.map(item => item.y)) - Math.min(...bounds.map(item => item.y))).toBeLessThanOrEqual(1)
      expect(Math.max(...bounds.map(item => item.height)) - Math.min(...bounds.map(item => item.height))).toBeLessThanOrEqual(1)
      expect(await page.locator('.workspace').evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
      if (name === 'Energia') await page.screenshot({ path: test.info().outputPath('methodology-energy.png') })
    }
    await page.screenshot({ path: test.info().outputPath('methodology.png') })
  })
}

test('a ajuda retorna à visão geral e mantém a consulta da tabela', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await mockDesktop(page)
  await page.goto('/dashboard')
  await openDashboardApplications(page)
  await page.getByRole('searchbox', { name: 'Buscar aplicações' }).fill('Aplicação 24')
  await expect(page.getByRole('table')).toContainText('Aplicação 24')
  await page.getByRole('button', { name: 'Ajuda desta tela', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(page.locator('.workspace')).toHaveCSS('overflow-y', 'hidden')
  for (let index = 0; index < 4; index++) await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
  await expect(dialog.getByRole('heading', { name: 'Série temporal', exact: true })).toBeVisible()
  await expect(page.locator('[data-help="dashboard-trend"]')).toHaveCSS('outline-style', 'solid')
  await dialog.getByRole('button', { name: 'Fechar ajuda', exact: true }).click()
  await expect(page.locator('.workspace')).toHaveCSS('overflow-y', 'auto')
  await openDashboardApplications(page)
  await expect(page.getByRole('searchbox', { name: 'Buscar aplicações' })).toHaveValue('Aplicação 24')
  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(page.getByRole('searchbox', { name: 'Buscar aplicações' })).toHaveValue('Aplicação 24')
  await expect(page.getByRole('table')).toContainText('Aplicação 24')
})

test('janelas baixas mantêm os controles acessíveis e a nova rota começa no topo', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 480 })
  await mockDesktop(page)
  await page.goto('/methodology')
  const save = page.getByRole('button', { name: 'Salvar minhas preferências', exact: true })
  await save.scrollIntoViewIfNeeded()
  await expect(save).toBeInViewport()
  await page.locator('.sidebar').getByRole('link', { name: 'Aplicações', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aplicações')
  expect(await page.locator('.workspace').evaluate(element => element.scrollTop)).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

test('o período personalizado mantém os filtros na mesma linha', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await mockDesktop(page)
  await page.goto('/dashboard?period=custom&from=2026-11-01T00%3A00%3A00Z&to=2026-11-02T00%3A00%3A00Z')
  await expect(page.getByRole('region', { name: 'Indicadores ambientais' })).toBeVisible()
  const positions = []
  for (const name of ['Granularidade em edição', 'Região histórica', 'Estado atual']) {
    const bounds = await page.getByRole('combobox', { name, exact: true }).boundingBox()
    positions.push(bounds!.y)
  }
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1)
  await page.getByRole('button', { name: '24 horas', exact: true }).click()
  await expect(page).toHaveURL(/period=24h/)
  await expect(page.getByRole('combobox', { name: 'Estado atual', exact: true })).toBeInViewport()
})

test('atualizar dados mantém a posição dos gráficos e dos indicadores', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await mockDesktop(page)
  await page.goto('/dashboard')
  const trend = page.locator('[data-help="dashboard-trend"]')
  await expect(trend.getByRole('img')).toBeVisible()
  const before = await trend.boundingBox()
  const pending = gate()
  await page.route('**/analysis/summary?*', async route => { await pending.wait; await route.fallback() })
  try {
    await page.getByRole('button', { name: 'Atualizar dados', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Atualizando…', exact: true })).toHaveAttribute('aria-busy', 'true')
    const during = await trend.boundingBox()
    expect(Math.abs(during!.y - before!.y)).toBeLessThanOrEqual(1)
    expect(await page.locator('.workspace').evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
  } finally { pending.release() }
  await expect(page.getByRole('button', { name: 'Atualizar dados', exact: true })).toHaveAttribute('aria-busy', 'false')
})

for (const width of [1024, 1920]) {
  for (const path of ['/applications', '/comparison', '/ranking', '/regional-simulation', '/history', '/settings', '/login']) {
    test(`${path} preserva o enquadramento de desktop em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 768 })
      await mockDesktop(page)
      await page.route('**/api/carbon/regions', route => route.fulfill({ status: 503, json: {} }))
      await page.route('**/api/analysis/ranking?*', route => route.fulfill({ status: 503, json: {} }))
      await page.goto(path)
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(1)
      const sidebar = await page.locator('.sidebar').boundingBox()
      expect(sidebar!.y).toBe(0)
      expect(sidebar!.height).toBe(768)
      if (path === '/applications') {
        await page.getByLabel('Itens por página', { exact: true }).selectOption('all')
        await expect(page.locator('tbody tr')).toHaveCount(80)
        const table = page.getByRole('table').locator('..')
        expect(await table.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
      }
      await page.screenshot({ path: test.info().outputPath('page.png') })
    })
  }
}

test('a simulação mantém três cards alinhados no notebook', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await mockDesktop(page)
  const region = { code: 'US-VA', country: 'United States', region: 'Virginia', city: null, latitude: 38.9, longitude: -77.04, intensity: 80, unit: 'gCO2e/kWh', renewableSharePercent: 42 }
  await page.route('**/api/carbon/regions', route => route.fulfill({ json: { regions: [region], total: 1 } }))
  await page.route('**/api/applications/*/analysis/regional-simulation', route => {
    const { from, to } = route.request().postDataJSON() as { from: string; to: string }
    const factor = { id: 'factor-1', version: 'v1', regionCode: 'US-VA', country: region.country, region: region.region, city: null, intensity: 80, unit: 'gCO2e/kWh', queriedAt: to }
    return route.fulfill({ json: { status: 'available', applicationId: 'desktop-0', destinationRegionCode: 'US-VA', period: { from, to },
      energy: { value: 10, unit: 'kWh', reasons: [] }, reference: { value: 2000, unit: 'gCO2e', reasons: [] }, referenceFactors: [], destinationFactor: factor,
      destination: { value: 800, unit: 'gCO2e', reasons: [] }, coverage: { energy: 1, reference: 1, destination: 1 },
      difference: { absolute: { value: -1200, unit: 'gCO2e', reasons: [] }, percent: { value: -0.6, unit: '%', reasons: [] } },
    } })
  })
  await page.goto('/regional-simulation?applicationId=desktop-0&destinationRegionCode=US-VA&period=24h')
  await page.getByRole('button', { name: 'Simular cenário', exact: true }).click()
  const cards = page.locator('main article[data-help]')
  await expect(cards).toHaveCount(3)
  const bounds = await cards.evaluateAll(elements => elements.map(element => ({ y: element.getBoundingClientRect().y, height: element.getBoundingClientRect().height })))
  expect(Math.max(...bounds.map(item => item.y)) - Math.min(...bounds.map(item => item.y))).toBeLessThanOrEqual(1)
  expect(Math.max(...bounds.map(item => item.height)) - Math.min(...bounds.map(item => item.height))).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: test.info().outputPath('simulation.png') })
})
