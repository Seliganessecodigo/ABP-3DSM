import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('detalhe consulta resumo e série no mesmo período e mostra os dados ambientais recebidos', async ({ page }) => {
  const initialTo = '2026-10-17T20:00:00.000Z'
  await page.clock.install({ time: new Date(initialTo) })
  await page.clock.pauseAt(new Date(initialTo))
  const requests: URL[] = []
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    requests.push(url)
    if (url.pathname.endsWith('/series')) {
      const previous = url.searchParams.get('from') === '2026-10-03T20:00:00.000Z'
      const from = previous ? '2026-10-03T20:00:00.000Z' : '2026-10-10T20:00:00.000Z'
      const points = [4, 6].map((value, index) => {
        const bucketStart = new Date(Date.parse(from) + index * 60 * 60 * 1000).toISOString()
        return { bucketStart, bucketEnd: new Date(Date.parse(bucketStart) + 60 * 60 * 1000).toISOString(),
          energy: { value, unit: 'kWh', reasons: [] }, emissions: { value: value * 340, unit: 'gCO2e', reasons: [] } }
      })
      await route.fulfill({ json: {
        status: 'available', applicationId: 'svc-0142',
        period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
        granularity: 'hour',
        totals: { energy: { value: 12.5, unit: 'kWh' }, emissions: { value: 4250, unit: 'gCO2e' } },
        coverage: { energy: 0.75, emissions: 0.5 }, points, events: [],
      } })
      return
    }
    await route.fulfill({ json: {
      status: 'available', applicationId: 'svc-0142',
      period: { from: '2026-10-10T20:00:00.000Z', to: '2026-10-17T20:00:00.000Z' },
      energy: { value: 12.5, unit: 'kWh', reasons: [] },
      emissions: { value: 4250, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.75, emissions: 0.5 },
      provenance: {
        methodologies: [{ key: 'energy-estimate', version: '2.1', parameters: { cpuWattsAt100Percent: 100 } }],
        factors: [{ contractVersion: '1', regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null,
          intensity: 340, unit: 'gCO2e/kWh', version: '2026.1', source: 'controlled provider',
          validFrom: '2026-01-01T00:00:00.000Z', validUntil: null,
          queriedAt: { from: '2026-10-10T20:00:00.000Z', to: '2026-10-17T20:00:00.000Z' } }],
        reasons: [],
      },
    } })
  })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?period=7d')

  await expect.poll(() => requests.length).toBe(3)
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/12,5\s*kWh/)
  await expect(analysis.getByRole('group', { name: 'CO₂e', exact: true })).toContainText(/4[.,]250\s*gCO2e/)
  await expect(page.getByRole('group', { name: 'Cobertura de energia', exact: true })).toContainText(/75\s*%/)
  await expect(page.getByRole('group', { name: 'Cobertura de emissões', exact: true })).toContainText(/50\s*%/)
  await page.locator('#analysis-details summary').click()
  await expect(page.getByText('2026.1', { exact: true })).toBeVisible()
  await expect(page.getByText('2.1', { exact: true })).toBeVisible()
  const series = page.getByRole('region', { name: 'Evolução do consumo e emissões' })
  await expect(series.getByText('Período anterior', { exact: true })).toBeVisible()
  await expect(series.locator('svg polyline[class*="previousSeries"]')).toHaveCount(1)
  expect(requests.map((url) => [url.searchParams.get('from'), url.searchParams.get('to')]).sort()).toEqual([
    ['2026-10-03T20:00:00.000Z', '2026-10-10T20:00:00.000Z'],
    ['2026-10-10T20:00:00.000Z', '2026-10-17T20:00:00.000Z'],
    ['2026-10-10T20:00:00.000Z', '2026-10-17T20:00:00.000Z'],
  ].sort())
})

test('mantém o resumo ambiental quando a consulta da série falha', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-17T20:00:00.000Z') })
  const paths: string[] = []
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    paths.push(url.pathname)
    if (url.pathname.endsWith('/series')) {
      await route.fulfill({ status: 503, json: { code: 'APPLICATION_ANALYSIS_UNAVAILABLE' } })
      return
    }
    await route.fulfill({ json: {
      status: 'available', applicationId: 'svc-0142',
      period: { from: '2026-10-10T20:00:00.000Z', to: '2026-10-17T20:00:00.000Z' },
      energy: { value: 12.5, unit: 'kWh', reasons: [] },
      emissions: { value: 4250, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.75, emissions: 0.5 },
      provenance: { methodologies: [{ key: 'energy-estimate', version: '2.1', parameters: {} }], factors: [], reasons: [] },
    } })
  })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?period=7d')

  await expect.poll(() => paths.length).toBe(2)
  expect(paths.some((path) => path.endsWith('/applications/svc-0142/analysis'))).toBe(true)
  expect(paths.some((path) => path.endsWith('/applications/svc-0142/analysis/series'))).toBe(true)
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis.getByRole('group', { name: 'Energia', exact: true })).toContainText(/12,5\s*kWh/)
  await expect(analysis.getByRole('group', { name: 'CO₂e', exact: true })).toContainText(/4[.,]250\s*gCO2e/)
})

test('mostra eventos retornados pela série sem arredondar os limites do período', async ({ page }) => {
  const from = '2026-10-10T20:00:37.456Z'
  const to = '2026-10-17T20:00:37.456Z'
  await page.clock.setFixedTime(new Date(to))
  const ranges: Array<[string | null, string | null]> = []
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    ranges.push([url.searchParams.get('from'), url.searchParams.get('to')])
    if (url.pathname.endsWith('/series')) {
      await route.fulfill({ json: {
        status: 'available', applicationId: 'svc-0142', period: { from, to }, granularity: 'hour',
        totals: { energy: { value: 12.5, unit: 'kWh' }, emissions: { value: 4250, unit: 'gCO2e' } },
        coverage: { energy: 0.75, emissions: 0.5 }, points: [],
        events: [{ id: 'event-status-1', at: '2026-10-17T19:00:00.000Z', type: 'status_changed',
          details: { before: { state: 'AVAILABLE' }, after: { state: 'UNAVAILABLE' } } }],
      } })
      return
    }
    await route.fulfill({ json: {
      status: 'available', applicationId: 'svc-0142', period: { from, to },
      energy: { value: 12.5, unit: 'kWh', reasons: [] },
      emissions: { value: 4250, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.75, emissions: 0.5 },
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?period=7d')

  await expect.poll(() => ranges.length).toBe(3)
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis).toContainText('Status alterado')
  await expect(analysis).toContainText('Disponível')
  await expect(analysis).toContainText('Indisponível')
  expect(ranges.sort()).toEqual([
    ['2026-10-03T20:00:37.456Z', from], [from, to], [from, to],
  ].sort())
})

test('mantém eventos persistidos quando resumo e série não têm observações', async ({ page }) => {
  const to = '2026-10-17T20:00:00.000Z'
  const from = '2026-10-16T20:00:00.000Z'
  await page.clock.setFixedTime(new Date(to))
  const ranges: Array<[string | null, string | null]> = []
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    ranges.push([url.searchParams.get('from'), url.searchParams.get('to')])
    if (url.pathname.endsWith('/series')) {
      const points = Array.from({ length: 24 }, (_, index) => {
        const start = new Date(Date.parse(from) + index * 60 * 60 * 1000).toISOString()
        const end = new Date(Date.parse(from) + (index + 1) * 60 * 60 * 1000).toISOString()
        return { bucketStart: start, bucketEnd: end, period: { from: start, to: end },
          energy: { value: null, unit: 'kWh', reasons: [] },
          emissions: { value: null, unit: 'gCO2e', reasons: [] }, coverage: { energy: 0, emissions: 0 } }
      })
      await route.fulfill({ json: {
        status: 'empty', applicationId: 'svc-0142', period: { from, to }, granularity: 'hour',
        totals: { energy: { value: null, unit: 'kWh', reasons: [] }, emissions: { value: null, unit: 'gCO2e', reasons: [] } },
        coverage: { energy: 0, emissions: 0 }, points,
        events: [{ id: 'event-empty-status-1', at: '2026-10-17T19:00:00.000Z', type: 'status_changed',
          details: { before: { state: 'AVAILABLE' }, after: { state: 'UNAVAILABLE' } } }],
      } })
      return
    }
    await route.fulfill({ json: {
      status: 'empty', applicationId: 'svc-0142', period: { from, to },
      energy: { value: null, unit: 'kWh', reasons: [] }, emissions: { value: null, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0, emissions: 0 }, provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?period=24h')

  await expect.poll(() => ranges.length).toBe(2)
  const analysis = page.getByRole('region', { name: 'Impacto ambiental', exact: true })
  await expect(analysis).toContainText('Nenhum dado ambiental encontrado para este período.')
  await expect(analysis).toContainText('Status alterado')
  await expect(analysis).toContainText('Disponível')
  await expect(analysis).toContainText('Indisponível')
  await expect(analysis).not.toContainText(/\b0(?:[,.]0*)?\s*(?:kWh|gCO2e|%)/)
  expect(ranges).toEqual([[from, to], [from, to]])
})

test('inspeciona as contribuições originais do ponto selecionado', async ({ page }) => {
  const to = '2026-10-17T20:00:37.456Z'
  const from = '2026-10-10T20:00:37.456Z'
  const bucketStart = '2026-10-17T19:00:00.000Z'
  const bucketEnd = '2026-10-17T20:00:00.000Z'
  await page.clock.install({ time: new Date(to) })
  await page.clock.pauseAt(new Date(to))
  const contributionsRequests: URL[] = []
  const intervalContributions = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(Date.parse(bucketStart) + index * 5 * 60_000).toISOString()
    const end = new Date(Date.parse(start) + 5 * 60_000).toISOString()
    const countedEnd = index === 0 ? new Date(Date.parse(start) + 150_000).toISOString() : end
    const originalValue = index + 1
    const value = index === 0 ? originalValue / 2 : originalValue
    return {
      collectionId: `collection-${index + 1}`,
      originalInterval: { from: start, to: end }, countedInterval: { from: start, to: countedEnd },
      collectedAt: new Date(Date.parse(end) + 30_000).toISOString(),
      energy: { originalValue, value, unit: 'kWh', reasons: [] },
      emissions: { originalValue: originalValue * 340, value: value * 340, unit: 'gCO2e', reasons: [] },
      durationRatio: index === 0 ? 0.5 : 1,
      methodology: { key: 'energy-estimate', version: `methodology-original-${index + 1}`, parameters: { cpuWattsAt100Percent: 100 } },
      factorSnapshot: { id: `factor-snapshot-${index + 1}`, contractVersion: 'contract-1', regionCode: 'BR-SP',
        country: 'Brasil', region: 'São Paulo', city: null, intensity: 340, unit: 'gCO2e/kWh',
        version: `factor-original-${index + 1}`, source: 'controlled provider', validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:00.000Z', queriedAt: '2026-10-17T19:42:00.000Z' },
    }
  })
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series(?:\/contributions)?)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/series/contributions')) {
      contributionsRequests.push(url)
      await route.fulfill({ json: {
        applicationId: 'svc-0142', period: { from, to }, granularity: 'hour',
        bucket: { start: bucketStart, end: bucketEnd, period: { from: bucketStart, to: bucketEnd } },
        totals: { energy: { value: 77.5, unit: 'kWh', reasons: [] }, emissions: { value: 26350, unit: 'gCO2e', reasons: [] } },
        coverage: { energy: 1, emissions: 1 },
        pagination: { page: 1, pageSize: 10, totalItems: 12, totalPages: 2, hasNextPage: true },
        contributions: intervalContributions.slice(0, 10), exclusions: [{ collectionId: null,
          interval: { from: '2026-10-17T18:55:00.000Z', to: bucketStart },
          energyReasons: [{ code: 'NO_OBSERVATION' }], emissionsReasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] }],
      } })
      return
    }
    if (url.pathname.endsWith('/series')) {
      await route.fulfill({ json: {
        status: 'available', applicationId: 'svc-0142', period: { from, to }, granularity: 'hour',
        totals: { energy: { value: 77.5, unit: 'kWh', reasons: [] }, emissions: { value: 26350, unit: 'gCO2e', reasons: [] } },
        coverage: { energy: 1, emissions: 1 },
        points: [{ bucketStart, bucketEnd, period: { from: bucketStart, to: bucketEnd },
          energy: { value: 77.5, unit: 'kWh', reasons: [] }, emissions: { value: 26350, unit: 'gCO2e', reasons: [] },
          coverage: { energy: 1, emissions: 1 } }], events: [],
      } })
      return
    }
    await route.fulfill({ json: {
      status: 'available', applicationId: 'svc-0142', period: { from, to },
      energy: { value: 77.5, unit: 'kWh', reasons: [] }, emissions: { value: 26350, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 1, emissions: 1 },
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
  await mockCatalog(page, [application()])
  await page.goto('/services/svc-0142?period=7d')
  await page.getByRole('button', { name: 'Tabela', exact: true }).click()

  const point = page.getByRole('row').filter({ hasText: /77,5\s*kWh/ })
  await point.getByRole('button', { name: 'Inspecionar contribuições', exact: true }).click()

  await expect.poll(() => contributionsRequests.length).toBe(1)
  const contributionsRequest = contributionsRequests[0]
  expect(contributionsRequest.searchParams.get('from')).toBe(from)
  expect(contributionsRequest.searchParams.get('to')).toBe(to)
  expect(contributionsRequest.searchParams.get('granularity')).toBe('hour')
  expect(contributionsRequest.searchParams.get('bucketStart')).toBe(bucketStart)
  expect(contributionsRequest.searchParams.get('pageSize') ?? '10').toBe('10')
  const inspection = page.getByRole('region', { name: 'Contribuições do intervalo selecionado', exact: true })
  await expect(inspection.getByText('factor-original-1', { exact: true })).toBeVisible()
  await expect(inspection.getByText('methodology-original-1', { exact: true })).toBeVisible()
  await expect(inspection).toContainText('factor-snapshot-1')
  await expect(inspection).toContainText('BR-SP')
  await expect(inspection).toContainText('Brasil')
  await expect(inspection).toContainText('340 gCO2e/kWh')
  await expect(inspection).toContainText('controlled provider')
  await expect(inspection).toContainText('16:42')
  await expect(inspection).toContainText('01/01/2026')
  await expect(inspection).toContainText('31/12/2026')
  await expect(inspection).toContainText('cpuWattsAt100Percent')
  const firstContribution = inspection.getByRole('listitem').first()
  await expect(firstContribution.getByRole('heading', { name: 'Coleta: collection-1', exact: true })).toBeVisible()
  await expect(firstContribution).toContainText('1 kWh')
  await expect(firstContribution).toContainText('0,5 kWh')
  await expect(firstContribution).toContainText('50%')
  await expect(inspection).toContainText('Sem observações disponíveis')
  await expect(inspection).toContainText('Fator de carbono indisponível')
  await expect(page.getByText('Página 1 de 2', { exact: true })).toBeVisible()
})
