import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

const period = { from: '2026-10-21T12:00:00.000Z', to: '2026-10-28T12:00:00.000Z' }
const timestamp = period.to
const availableMetric = { value: 10, unit: '%', status: 'available', collectedAt: timestamp, reasons: [] }
type DifferenceFixture = { absolute: number | null; unit: string | null; percentage: number | null; reason: string | null }
const noDifference: DifferenceFixture = { absolute: null, unit: null, percentage: null, reason: null }

for (const width of [1366, 390]) {
  test(`comparison help explains the reference and highlights each matching area at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 })
    await mockCatalog(page, [application(), application({ id: 'svc-0121', name: 'app-checkout' })])
    await page.route(/\/analysis\/comparison(?:\?.*)?$/, route => route.fulfill({ json: comparisonResponse(new URL(route.request().url())) }))
    await page.goto('/comparison?applicationIds=svc-0142&applicationIds=svc-0121&period=7d')
    await expect(page.getByRole('table', { name: 'Comparação no período' }).or(page.locator('#comparison-energy:visible'))).toBeVisible()
    const original = new URL(page.url()).searchParams.getAll('applicationIds')
    await page.getByRole('button', { name: 'Ajuda desta tela', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const targets = ['comparison-selection', 'comparison-period', 'comparison-reference', 'comparison-energy', 'comparison-emissions', 'comparison-energyCoverage']
    for (const [index, target] of targets.entries()) {
      await expect(page.locator(`[data-help="${target}"]:visible`)).toHaveCSS('outline-width', '3px')
      await expect(page.locator(`[data-help="${target}"]:visible`)).toHaveCSS('outline-style', 'solid')
      if (target === 'comparison-reference') await expect(dialog).toContainText('não é uma recomendação de melhor aplicação')
      if (index < targets.length - 1) await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
    }
    await page.screenshot({ path: testInfo.outputPath('comparison-help.png'), fullPage: true })
    await page.setViewportSize({ width: width === 390 ? 1366 : 390, height: 844 })
    await expect(page.locator('[data-help="comparison-energyCoverage"]:visible')).toHaveCSS('outline-style', 'solid')
    await expect(page.locator('[data-help="comparison-energyCoverage"]').filter({ visible: false })).toHaveCSS('outline-style', 'none')
    await dialog.getByRole('button', { name: 'Concluir', exact: true }).click()
    expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(original)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('comparison help keeps explanations available when results have no target yet', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/comparison')
  await page.getByRole('button', { name: 'Ajuda desta tela', exact: true }).click()
  const dialog = page.getByRole('dialog')
  for (let index = 0; index < 3; index++) await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
  await expect(dialog.getByRole('heading')).toHaveText('Energia')
  await expect(dialog).toContainText('kWh')
  for (const area of await page.locator('main [data-help]').all()) await expect(area).not.toHaveCSS('outline-style', 'solid')
})

function comparisonApplication(
  applicationId: string,
  name: string,
  energy: number | null,
  emissions: number | null,
  overrides: Readonly<{
    energyReasons?: { code: string }[]
    emissionsReasons?: { code: string }[]
    energyDifference?: DifferenceFixture
    emissionsDifference?: DifferenceFixture
  }> = {},
) {
  return {
    applicationId,
    name,
    state: 'AVAILABLE',
    locations: [{
      from: period.from, to: period.to,
      location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'São Paulo', latitude: -23.55, longitude: -46.63 },
      reasons: [],
    }],
    metrics: { cpu: availableMetric, memory: availableMetric, disk: availableMetric, network: availableMetric },
    energy: { value: energy, unit: 'kWh', reasons: overrides.energyReasons ?? [] },
    emissions: { value: emissions, unit: 'gCO2e', reasons: overrides.emissionsReasons ?? [] },
    coverage: { energy: 0.8, emissions: 0.6 },
    differences: {
      energy: overrides.energyDifference ?? noDifference,
      emissions: overrides.emissionsDifference ?? noDifference,
      metrics: { cpu: noDifference, memory: noDifference, disk: noDifference, network: noDifference },
      coverage: { energyPercentagePoints: null, emissionsPercentagePoints: null },
    },
  }
}

function comparisonResponse(url: URL) {
  const applicationIds = url.searchParams.getAll('applicationIds')
  return {
    status: 'complete',
    period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
    referenceApplicationId: url.searchParams.get('referenceApplicationId'),
    applications: applicationIds.map((id, index) => comparisonApplication(
      id,
      id === 'svc-0142' ? 'app-pagamentos' : id === 'svc-0121' ? 'app-checkout' : `app-${id}`,
      3 - index,
      index === 0 ? 1200 : 600,
    )),
  }
}

test('restores selected applications and presents the backend comparison', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  await mockCatalog(page, [
    application(),
    application({ id: 'svc-0121', name: 'app-checkout' }),
  ])
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ json: {
      status: 'complete',
      period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      referenceApplicationId: url.searchParams.get('referenceApplicationId'),
      applications: [
        comparisonApplication('svc-0142', 'app-pagamentos', 3, 1200),
        comparisonApplication('svc-0121', 'app-checkout', 2, 600),
      ],
    } })
  })

  await page.goto('/comparison?applicationIds=svc-0142&applicationIds=svc-0121&period=7d')

  await expect(page.getByRole('heading', { name: 'Comparação de aplicações', exact: true })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /app-pagamentos/ })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: /app-checkout/ })).toBeChecked()
  await expect(page.getByRole('combobox', { name: 'Aplicação de referência' })).toHaveValue('svc-0142')
  await expect(page.getByRole('table', { name: 'Comparação no período' })).toContainText('app-pagamentos')
  await expect(page.getByRole('table', { name: 'Comparação no período' })).toContainText('0,6 kgCO₂e')

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('table', { name: 'Comparação no período' })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Energia', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Emissões estimadas', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('starts without a comparison, requests automatically after two selections, and keeps filtered selections', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  await mockCatalog(page, [
    application(),
    application({ id: 'svc-0121', name: 'app-checkout' }),
    application({ id: 'svc-0033', name: 'app-inventario' }),
  ])
  let requests = 0
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async (route) => {
    requests += 1
    await route.fulfill({ json: comparisonResponse(new URL(route.request().url())) })
  })

  await page.goto('/comparison')
  const selection = page.locator('[aria-labelledby="comparison-selection-heading"]')
  const selectedApplications = page.getByRole('list', { name: 'Aplicações selecionadas' })
  await expect(selection.getByRole('checkbox', { name: /app-pagamentos/ })).toBeVisible()
  await expect(page.getByText(/Selecione de duas a cinco aplicações/)).toBeVisible()
  expect(requests).toBe(0)

  await selection.getByRole('checkbox', { name: /app-pagamentos/ }).check()
  expect(requests).toBe(0)
  await selection.getByRole('checkbox', { name: /app-checkout/ }).check()
  await expect(page.getByRole('table', { name: 'Comparação no período' })).toBeVisible()
  expect(requests).toBe(1)
  expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['svc-0142', 'svc-0121'])
  await expect(selectedApplications.getByRole('listitem')).toHaveCount(2)

  await selection.getByRole('searchbox', { name: 'Buscar em todas as colunas' }).fill('nao-existe')
  await expect(selection.getByText('Nenhuma aplicação corresponde à busca')).toBeVisible()
  await expect(selectedApplications.getByRole('listitem')).toHaveCount(2)
  expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['svc-0142', 'svc-0121'])
  expect(requests).toBe(1)
})

test('deduplicates restored IDs and leaves an invalid reference editable without requesting results', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  await mockCatalog(page, [
    application(),
    application({ id: 'svc-0121', name: 'app-checkout' }),
  ])
  let requests = 0
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async (route) => {
    requests += 1
    await route.fulfill({ json: comparisonResponse(new URL(route.request().url())) })
  })

  await page.goto('/comparison?applicationIds=svc-0142&applicationIds=svc-0142&applicationIds=svc-0121&referenceApplicationId=missing&period=7d')
  const selectedApplications = page.getByRole('list', { name: 'Aplicações selecionadas' })
  await expect(selectedApplications.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByRole('combobox', { name: 'Aplicação de referência' })).toHaveValue('missing')
  await expect(page.getByRole('alert')).toContainText('não está entre as aplicações selecionadas')
  await expect.poll(() => new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['svc-0142', 'svc-0121'])
  expect(requests).toBe(0)

  await page.getByRole('combobox', { name: 'Aplicação de referência' }).selectOption('svc-0121')
  await expect(page.getByRole('table', { name: 'Comparação no período' })).toBeVisible()
  expect(requests).toBe(1)
})

test('preserves search, sorting, page size and page in the URL while paging the full filtered catalog', async ({ page }) => {
  await mockCatalog(page, Array.from({ length: 21 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0')
    return application({ id: `svc-${suffix}`, name: `app-${suffix}` })
  }))
  await page.goto('/comparison')
  const selection = page.locator('[aria-labelledby="comparison-selection-heading"]')
  const table = selection.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(11)

  await page.getByRole('combobox', { name: 'Itens por página' }).selectOption('5')
  await expect(table.getByRole('row')).toHaveCount(6)
  await page.getByRole('button', { name: 'Página 2 de 5' }).click()
  await expect(table.getByRole('row')).toHaveCount(6)
  await page.getByRole('button', { name: /Nome ou identificador/ }).click()
  await expect(new URL(page.url()).searchParams.get('sort')).toBe('name')
  await expect(new URL(page.url()).searchParams.get('direction')).toBe('desc')
  await page.getByRole('searchbox', { name: 'Buscar em todas as colunas' }).fill('app-')
  await expect(new URL(page.url()).searchParams.get('q')).toBe('app-')
  await expect(new URL(page.url()).searchParams.get('page')).toBeNull()
  await page.getByRole('combobox', { name: 'Itens por página' }).selectOption('all')
  await expect(table.getByRole('row')).toHaveCount(22)
  expect(new URL(page.url()).searchParams.get('size')).toBe('all')
  await expect(page.getByText('Exibindo 1–21 de 21 aplicações', { exact: true })).toBeVisible()
})

test('enforces the five-application limit and changes reference when the selected reference is removed', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  const catalog = Array.from({ length: 21 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, '0')
    return application({ id: `svc-${suffix}`, name: `app-${suffix}` })
  })
  await mockCatalog(page, catalog)
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: comparisonResponse(new URL(route.request().url())) })
  })
  await page.goto('/comparison')
  const selection = page.locator('[aria-labelledby="comparison-selection-heading"]')

  for (let index = 1; index <= 5; index += 1) {
    const suffix = String(index).padStart(3, '0')
    await selection.getByRole('checkbox', { name: new RegExp(`app-${suffix}`) }).check()
  }
  const selectedApplications = page.getByRole('list', { name: 'Aplicações selecionadas' })
  await expect(selectedApplications.getByRole('listitem')).toHaveCount(5)
  const sixth = selection.getByRole('checkbox', { name: /app-006/ })
  await expect(sixth).toBeDisabled()

  await selectedApplications.getByRole('button', { name: /Remover app-001/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'A aplicação de referência foi alterada' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Aplicação de referência' })).toHaveValue('svc-002')
  await expect(sixth).toBeEnabled()
  expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['svc-002', 'svc-003', 'svc-004', 'svc-005'])
})

test('preserves partial readings and explains why a zero reference has no percentage', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  await mockCatalog(page, [application(), application({ id: 'svc-0121', name: 'app-checkout' })])
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ json: {
      status: 'partial',
      period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      referenceApplicationId: 'svc-0142',
      applications: [
        comparisonApplication('svc-0142', 'app-pagamentos', 0, null, {
          emissionsReasons: [{ code: 'NO_OBSERVATION' }],
        }),
        comparisonApplication('svc-0121', 'app-checkout', 5, null, {
          emissionsReasons: [{ code: 'NO_OBSERVATION' }],
          energyDifference: { absolute: 5, unit: 'kWh', percentage: null, reason: 'ZERO_REFERENCE' },
          emissionsDifference: { absolute: null, unit: 'gCO2e', percentage: null, reason: 'VALUE_UNAVAILABLE' },
        }),
      ],
    } })
  })

  await page.goto('/comparison?applicationIds=svc-0142&applicationIds=svc-0121&period=7d')
  const table = page.getByRole('table', { name: 'Comparação no período' })
  await expect(page.getByRole('status').filter({ hasText: 'A comparação é parcial' })).toBeVisible()
  await expect(table.getByRole('row', { name: /Energia/ })).toContainText('+5 kWh')
  await expect(table.getByRole('row', { name: /Energia/ })).toContainText('Referência igual a zero')
  await expect(table.getByRole('row', { name: /Emissões estimadas/ })).toContainText('Indisponível')
  await expect(table.getByRole('row', { name: /Emissões estimadas/ })).toContainText('Valor indisponível')
  await expect(table.getByRole('row', { name: /Emissões estimadas/ })).not.toContainText('0 kgCO₂e')
})

test('shows an accessible retry and never leaves the previous period results visible after a failure', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  await mockCatalog(page, [
    application(),
    application({ id: 'svc-0121', name: 'app-checkout' }),
  ])
  let requests = 0
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async (route) => {
    requests += 1
    if (requests === 2) {
      await route.fulfill({ status: 503, json: { code: 'ANALYSIS_COMPARISON_UNAVAILABLE' } })
      return
    }
    await route.fulfill({ json: comparisonResponse(new URL(route.request().url())) })
  })

  await page.goto('/comparison?applicationIds=svc-0142&applicationIds=svc-0121&period=7d')
  const table = page.getByRole('table', { name: 'Comparação no período' })
  await expect(table).toContainText('0,6 kgCO₂e')
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('30d')
  await expect(page.getByRole('alert')).toContainText('A comparação está indisponível')
  await expect(table).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')

  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(table).toContainText('0,6 kgCO₂e')
  expect(requests).toBe(3)
})
