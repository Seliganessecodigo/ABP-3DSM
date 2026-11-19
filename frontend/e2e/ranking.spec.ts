import { expect, test } from '@playwright/test'

const period = {
  from: '2026-11-01T00:00:00.000Z',
  to: '2026-11-08T00:00:00.000Z',
}

test('ranking separates applications without a usable value from the ranked table', async ({ page }) => {
  let requestedUrl: URL | undefined
  await page.route(/\/analysis\/ranking(?:\?.*)?$/, async route => {
    requestedUrl = new URL(route.request().url())
    await route.fulfill({ json: {
      status: 'empty',
      metric: 'emissions',
      direction: 'desc',
      period,
      scope: {
        applicationCount: 1,
        rankedCount: 0,
        unrankedCount: 1,
        energy: { value: null, unit: 'kWh', reasons: [] },
        emissions: { value: null, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 0, emissions: 0 },
      },
      presentation: { rankedCount: 0, unrankedCount: 1 },
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      items: [{
        applicationId: 'svc-stock',
        name: 'app-estoque',
        state: 'AVAILABLE',
        stateReason: 'METRICS_VALID',
        location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null },
        energy: { value: null, unit: 'kWh', reasons: [{ code: 'NO_OBSERVATION' }] },
        emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] },
        coverage: { energy: 0, emissions: 0 },
        rankability: 'unranked',
        position: null,
        participation: null,
      }],
    } })
  })
  await page.route(/\/applications(?:\?.*)?$/, route => route.fulfill({ json: [] }))

  await page.goto(`/ranking?from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(period.to)}`)

  await expect(page.getByRole('heading', { name: 'Ranking por impacto' })).toBeVisible()
  await expect(page.getByText('app-estoque')).toBeVisible()
  await expect(page.getByText('Ainda não há observação válida')).toBeVisible()
  await expect(page.getByText('Métricas válidas')).toHaveCount(0)
  await expect(page.getByText('NO_OBSERVATION')).toHaveCount(0)
  expect(requestedUrl?.searchParams.get('from')).toBe(period.from)
  expect(requestedUrl?.searchParams.get('to')).toBe(period.to)
  expect(requestedUrl?.searchParams.get('metric')).toBe('emissions')
  expect(requestedUrl?.searchParams.get('direction')).toBe('desc')
})

test('ranking applies domain and presentation filters through the documented query', async ({ page }) => {
  const requested: URL[] = []
  await page.route(/\/analysis\/ranking(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url())
    requested.push(url)
    await route.fulfill({ json: {
      status: 'available', metric: 'energy', direction: 'desc', period,
      scope: {
        applicationCount: 1, rankedCount: 1, unrankedCount: 0,
        energy: { value: 8.4, unit: 'kWh', reasons: [] }, emissions: { value: 20, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 0.91, emissions: 0.8 },
      },
      presentation: { rankedCount: 1, unrankedCount: 0 },
      pagination: { page: Number(url.searchParams.get('page') ?? 1), pageSize: url.searchParams.get('pageSize') === 'all' ? 'all' : Number(url.searchParams.get('pageSize') ?? 10), totalItems: 1, totalPages: 1 },
      items: [{
        applicationId: 'svc-stock', name: 'app-estoque', state: 'AVAILABLE', stateReason: null,
        location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null },
        energy: { value: 8.4, unit: 'kWh', reasons: [] }, emissions: { value: 20, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 0.91, emissions: 0.8 }, rankability: 'ranked', position: 1, participation: 1,
      }],
    } })
  })
  await page.route(/\/applications(?:\?.*)?$/, route => route.fulfill({ json: [] }))

  await page.goto(`/ranking?from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(period.to)}&metric=energy&regionCodes=BR-SP&states=AVAILABLE`)
  await expect(page.getByRole('table')).toContainText('app-estoque')
  const breadcrumb = page.getByRole('navigation', { name: 'Trilha de navegação' })
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Ranking por impacto')
  await expect(page.locator('thead [data-sort-state]')).toHaveCount(5)
  const help = page.getByRole('button', { name: 'Ajuda desta tela', exact: true })
  await help.click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
  await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
  await dialog.getByRole('button', { name: 'Concluir', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(help).toBeFocused()
  await page.screenshot({ path: test.info().outputPath('ranking-desktop.png'), fullPage: true })

  const allBefore = requested.filter(url => url.searchParams.get('pageSize') === 'all').length
  await page.getByRole('combobox', { name: 'Itens por página', exact: true }).selectOption('all')
  await expect.poll(() => requested.filter(url => url.searchParams.get('pageSize') === 'all').length).toBeGreaterThan(allBefore)
  await expect(page.getByText('Carregando ranking…', { exact: true })).toHaveCount(0)
  expect(requested.filter(url => url.searchParams.get('pageSize') === 'all').length - allBefore).toBe(1)

  await expect.poll(() => requested.length).toBeGreaterThan(0)
  expect(requested[0].searchParams.get('regionCodes')).toBe('BR-SP')
  expect(requested[0].searchParams.get('states')).toBe('AVAILABLE')

  await page.getByRole('button', { name: /Filtros por coluna/ }).click()
  await page.getByRole('group', { name: 'Energia (kWh)' }).getByLabel('Mínimo').fill('1')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect.poll(() => requested.at(-1)?.searchParams.get('energyMin')).toBe('1')

  await page.setViewportSize({ width: 320, height: 800 })
  const periodSummary = page.getByRole('button').filter({ hasText: 'UTC' })
  await expect(periodSummary).toBeVisible()
  await expect(page.getByLabel('Início (UTC)')).toBeHidden()
  await periodSummary.click()
  await expect(page.getByLabel('Início (UTC)')).toBeVisible()
  await periodSummary.click()
  await expect(page.getByRole('table')).toBeHidden()
  await expect(page.locator('article').filter({ hasText: 'app-estoque' })).toBeVisible()
  await expect(page.locator('article').filter({ hasText: '8,4 kWh' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sentido da classificação' })).toContainText('Maior para menor')
  const mobileFilters = page.getByRole('button', { name: 'Filtros', exact: true })
  await expect(mobileFilters).toBeVisible()
  await mobileFilters.click()
  await mobileFilters.click()
  await expect(page.locator('#ranking-scope-filters')).toBeVisible()
  await expect(page.locator('#ranking-column-filters')).toBeVisible()
  await mobileFilters.click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
