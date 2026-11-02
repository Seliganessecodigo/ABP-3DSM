import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('history selection shows the environmental series and focuses recorded events without changing its context', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-28T12:00:00.000Z'))
  await mockCatalog(page, [application()])
  await page.route(/\/applications\/svc-0142\/analysis\/series\/contributions(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    const bucketStart = url.searchParams.get('bucketStart')!
    const bucketEnd = new Date(Date.parse(bucketStart) + 60 * 60_000).toISOString()
    await route.fulfill({ json: {
      applicationId: 'svc-0142',
      period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      granularity: url.searchParams.get('granularity'),
      bucket: { start: bucketStart, end: bucketEnd, period: { from: bucketStart, to: bucketEnd } },
      totals: { energy: { value: 1, unit: 'kWh' }, emissions: { value: 400, unit: 'gCO2e' } },
      coverage: { energy: 1, emissions: 1 },
      pagination: { page: 1, pageSize: 10, totalItems: 2, totalPages: 1, hasNextPage: false },
      contributions: ['history-collection-1', 'history-collection-2'].map((collectionId, index) => ({
        collectionId,
        originalInterval: { from: bucketStart, to: bucketEnd },
        countedInterval: { from: bucketStart, to: bucketEnd },
        collectedAt: bucketEnd,
        energy: { originalValue: 0.5, value: 0.5, unit: 'kWh', reasons: [] },
        emissions: { originalValue: 200, value: 200, unit: 'gCO2e', reasons: [] },
        durationRatio: index === 0 ? 1 : 0.5,
        methodology: { key: 'energy-estimate', version: index === 0 ? 'v1' : 'v2', parameters: {} },
        factorSnapshot: null,
      })),
      exclusions: [],
    } })
  })
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    const period = { from: url.searchParams.get('from'), to: url.searchParams.get('to') }
    if (url.pathname.endsWith('/series')) {
      await route.fulfill({ json: {
        status: 'available', applicationId: 'svc-0142', period, granularity: url.searchParams.get('granularity'),
        totals: { energy: { value: 3, unit: 'kWh' }, emissions: { value: 1200, unit: 'gCO2e' } },
        coverage: { energy: 0.75, emissions: 0.75 },
        points: [
          { bucketStart: '2026-10-27T00:00:00.000Z', bucketEnd: '2026-10-27T01:00:00.000Z',
            energy: { value: 1, unit: 'kWh', reasons: [] }, emissions: { value: 400, unit: 'gCO2e', reasons: [] } },
          { bucketStart: '2026-10-27T01:00:00.000Z', bucketEnd: '2026-10-27T02:00:00.000Z',
            energy: { value: null, unit: 'kWh', reasons: [{ code: 'NO_OBSERVATION' }] },
            emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] } },
          { bucketStart: '2026-10-27T02:00:00.000Z', bucketEnd: '2026-10-27T03:00:00.000Z',
            energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 800, unit: 'gCO2e', reasons: [] } },
        ],
        events: [{ id: 'region-change-1', at: '2026-10-27T01:30:00.000Z', type: 'region_changed',
          details: { before: { regionCode: 'BR-SP' }, after: { regionCode: 'BR-RJ' } } }],
      } })
      return
    }
    await route.fulfill({ json: {
      status: 'available', applicationId: 'svc-0142', period,
      energy: { value: 3, unit: 'kWh', reasons: [] },
      emissions: { value: 1200, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.75, emissions: 0.75 },
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })

  await page.goto('/history')
  const applicationSelect = page.getByRole('combobox', { name: 'Aplicação', exact: true })
  await applicationSelect.selectOption('svc-0142')

  await expect(page.getByRole('heading', { name: 'Histórico ambiental', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Período de análise', exact: true })).toHaveValue('7d')
  await expect(page.getByText('Intervalos do histórico', { exact: true })).toBeVisible()
  await expect(page.locator('main [class*="metrics"] > fieldset > h3'))
    .toHaveText(['Energia', 'CO₂e', 'Cobertura', 'Contexto do cálculo'])
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões', exact: true })
  await expect(series.getByRole('button', { name: 'Comparar métricas', exact: true })).toBeVisible()
  await expect(series.getByRole('figure')).toHaveCount(1)
  await expect(series.getByText('Energia (kWh)', { exact: true })).toBeVisible()
  await expect(series.getByText('CO₂e (kgCO2e)', { exact: true })).toBeVisible()
  await expect(series.getByRole('button', { name: /Energia.*kWh/ }).first()).toBeVisible()
  await expect(series.getByRole('button', { name: /CO₂e.*kgCO2e/ }).first()).toBeVisible()
  await expect(series.getByRole('table')).toContainText('Sem observações disponíveis')

  const event = series.getByRole('region', { name: 'Eventos do período', exact: true })
  await expect(event).toContainText('Região alterada')
  await event.getByRole('button', { name: 'Ver', exact: true }).click()
  await expect(event.getByRole('listitem').first()).toHaveAttribute('aria-current', 'true')
  await expect(event.getByRole('listitem').first()).toContainText('26/10/2026')
  expect(new URL(page.url()).pathname).toBe('/history')
  const params = new URL(page.url()).searchParams
  expect(params.get('applicationId')).toBe('svc-0142')

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Cobertura', exact: true })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: '75%' })).toBeVisible()
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390)
  await expect(series.locator('table')).toHaveJSProperty('scrollWidth',
    await series.locator('table').evaluate(table => table.clientWidth))

  await series.getByRole('button', { name: 'Inspecionar contribuições', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Inspeção do intervalo', exact: true })).toBeVisible()
  const contributions = page.getByRole('table', { name: 'Contribuições que compõem o agregado', exact: true })
  await expect(contributions.getByRole('row')).toHaveCount(3)
  const selectedContribution = page.getByRole('region', { name: 'Detalhes da contribuição', exact: true })
  await expect(selectedContribution).toContainText('history-collection-1')
  await contributions.getByRole('button', { name: 'Abrir', exact: true }).nth(1).click()
  await expect(selectedContribution).toContainText('history-collection-2')
  expect(new URL(page.url()).searchParams.get('inspectionBucket')).toBe('2026-10-27T00:00:00.000Z')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Inspeção do intervalo', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Detalhes da contribuição', exact: true })).toContainText('history-collection-1')
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390)
  await page.getByRole('button', { name: 'Voltar ao histórico', exact: false }).click()
  await expect(page.getByRole('heading', { name: 'Histórico ambiental', exact: true })).toBeVisible()
  const returnedParams = new URL(page.url()).searchParams
  expect(returnedParams.has('inspectionBucket')).toBe(false)
  expect(returnedParams.get('applicationId')).toBe('svc-0142')
  expect(returnedParams.get('period')).toBe('7d')
  expect(returnedParams.get('granularity')).toBe('day')
  expect(returnedParams.get('seriesTimeZone')).toBe('America/Sao_Paulo')

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Aplicação', exact: true })).toHaveValue('svc-0142')
  await expect(page.getByRole('region', { name: 'Eventos do período', exact: true })).toContainText('Região alterada')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('combobox', { name: 'Período de análise', exact: true })).toBeVisible()
  await expect(page.getByText('Intervalos do histórico', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.goto('/history?applicationId=svc-0142&period=7d&granularity=day&seriesTimeZone=America%2FSao_Paulo&inspectionBucket=2026-10-27T00%3A00%3A00.000Z')
  await expect(page.getByRole('heading', { name: 'Inspeção do intervalo', exact: true })).toBeVisible()
})
