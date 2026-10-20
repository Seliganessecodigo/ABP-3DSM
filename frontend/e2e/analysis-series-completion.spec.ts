import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('aplica filtro antes da paginação e Todos mostra todos os pontos filtrados', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=series-pagination')

  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  const pageSize = series.getByRole('combobox', { name: 'Itens por página', exact: true })
  await expect(pageSize.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value)))
    .resolves.toEqual(['5', '10', '15', '20', 'all'])

  await series.getByLabel('Data inicial da série', { exact: true }).fill('2026-10-17T05:00')
  await series.getByLabel('Data final da série', { exact: true }).fill('2026-10-17T06:15')
  await series.getByRole('searchbox', { name: 'Buscar série', exact: true }).fill('kWh')
  await series.getByRole('combobox', { name: 'Status da energia', exact: true }).selectOption('available')
  await pageSize.selectOption('5')
  await expect(table.getByRole('row')).toHaveCount(6)
  await series.getByRole('combobox', { name: 'Página', exact: true }).selectOption('2')
  await expect(table.getByRole('row')).toHaveCount(2)

  await pageSize.selectOption('all')
  await expect(table.getByRole('row')).toHaveCount(7)
  await expect(series.getByText('Exibindo 1–6 de 6', { exact: true })).toBeVisible()
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/120\s*kWh/)
  const params = new URL(page.url()).searchParams
  expect(params.get('seriesSize')).toBe('all')
  expect(params.get('seriesSearch')).toBe('kWh')
  expect(params.get('seriesEnergyStatus')).toBe('available')
  expect(params.get('seriesFrom')).toBe('2026-10-17T08:00:00.000Z')
  expect(params.get('seriesTo')).toBe('2026-10-17T09:15:00.000Z')
  expect(params.get('seriesPage')).toBe('1')
  expect(params.get('period')).toBe('7d')
  expect(params.get('collectionId')).toBe('collection-history')
})

test('refresh que reduz a série remove a página que deixou de existir', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&seriesSize=5&fixture=series-refresh-shrink')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(6)
  await series.getByRole('combobox', { name: 'Página', exact: true }).selectOption('2')
  await expect(table.getByRole('row')).toHaveCount(6)
  expect(new URL(page.url()).searchParams.get('seriesPage')).toBe('2')

  await page.getByRole('region', { name: 'Evidências operacionais' })
    .getByRole('button', { name: 'Atualizar dados', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(4)
  expect(new URL(page.url()).searchParams.has('seriesPage')).toBe(false)
})

test('preserva deep link da página 2 até chegar uma série válida e só a clampa após refresh menor', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&seriesPage=2&seriesSize=5&fixture=series-page-loading-refresh')

  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('status')).toContainText('Carregando dados ambientais')
  expect(new URL(page.url()).searchParams.get('seriesPage')).toBe('2')
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()

  const table = series.getByRole('table')
  await expect(table.getByRole('row')).toHaveCount(6)
  await expect(series.getByRole('combobox', { name: 'Página', exact: true })).toHaveValue('2')
  expect(new URL(page.url()).searchParams.get('seriesPage')).toBe('2')

  await page.getByRole('region', { name: 'Evidências operacionais' })
    .getByRole('button', { name: 'Atualizar dados', exact: true }).click()
  await expect(table.getByRole('row')).toHaveCount(4)
  expect(new URL(page.url()).searchParams.has('seriesPage')).toBe(false)
  expect(new URL(page.url()).searchParams.get('seriesSize')).toBe('5')
})

test('distingue série vazia de uma busca sem correspondências', async ({ page }) => {
  await mockCatalog(page, [application()])
  const base = '/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&fixture='
  await page.goto(`${base}series-empty`)
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  await series.getByRole('button', { name: 'Tabela', exact: true }).click()
  let table = series.getByRole('table')
  await expect(table.getByRole('row').nth(1)).toContainText('Nenhum ponto disponível neste período')

  await page.goto(`${base}series-pagination&seriesSearch=not-found`)
  const filteredSeries = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  await filteredSeries.getByRole('button', { name: 'Tabela', exact: true }).click()
  table = filteredSeries.getByRole('table')
  await expect(table.getByRole('row').nth(1)).toContainText('Nenhum ponto corresponde aos filtros.')
  await expect(table.getByRole('row').nth(1)).not.toContainText('Nenhum ponto disponível neste período')
})

test('mantém análise histórica disponível para uma aplicação removida', async ({ page }) => {
  await mockCatalog(page, [application({ state: 'REMOVED', reason: 'REMOVAL_CONFIRMED', removedAt: '2026-10-18T17:00:00.000Z' })])
  await page.route(/\/applications\/svc-0142\/collections\/collection-history$/, async (route) => {
    await route.fulfill({ json: {
      id: 'collection-history', applicationId: 'svc-0142', intervalStart: '2026-10-17T17:00:00.000Z',
      intervalEnd: '2026-10-17T17:30:00.000Z', collectedAt: '2026-10-17T17:32:00.000Z',
      collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID',
      lastCheckedAt: '2026-10-17T17:32:00.000Z', isCalculable: true,
      metrics: {
        cpu: { value: 38, unit: '%', status: 'available' },
        memory: { value: null, unit: null, status: 'missing' },
        disk: { value: 0, unit: 'GB/s', status: 'available' },
        network: { value: 1.2, unit: 'Mbps', status: 'available' },
      },
    } })
  })
  await page.goto('/e2e/analysis-harness.html?applicationId=svc-0142&period=7d&collectionId=collection-history&fixture=design-review')

  await expect(page.getByRole('main')).toContainText('Removida')
  await expect(page.getByRole('region', { name: 'Impacto ambiental', exact: true })
    .getByRole('group', { name: 'Energia', exact: true })).toContainText(/3,5\s*kWh/)
  const evidence = page.getByRole('region', { name: 'Evidências operacionais', exact: true })
  await expect(evidence).toContainText('38')
  await expect(evidence).toContainText('1,2 Mbps')
})
