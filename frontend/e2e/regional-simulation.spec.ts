import { expect, test } from '@playwright/test'
import { application, largeCatalog, mockCatalog } from './support/catalog.ts'

const destination = {
  code: 'US-VA', country: 'United States', region: 'Virginia', city: null,
  latitude: 38.9, longitude: -77.04, intensity: 80, unit: 'gCO2e/kWh', renewableSharePercent: 42,
}

function availableResult() {
  const factor = {
    id: 'factor-1', version: 'v1', regionCode: 'US-VA', country: 'United States', region: 'Virginia',
    city: null, intensity: 80, unit: 'gCO2e/kWh', queriedAt: '2026-11-16T12:00:00.000Z',
  }
  return {
    status: 'available', applicationId: 'svc-0142', destinationRegionCode: 'US-VA',
    period: { from: '2026-11-15T12:00:00.000Z', to: '2026-11-16T12:00:00.000Z' },
    energy: { value: 10, unit: 'kWh', reasons: [] },
    reference: { value: 2000, unit: 'gCO2e', reasons: [] }, referenceFactors: [], destinationFactor: factor,
    destination: { value: 800, unit: 'gCO2e', reasons: [] },
    coverage: { energy: 1, reference: 1, destination: 1 },
    difference: {
      absolute: { value: -1200, unit: 'gCO2e', reasons: [] },
      percent: { value: -0.6, unit: '%', reasons: [] },
    },
  }
}

async function mockRegions(page: import('@playwright/test').Page) {
  await page.route('**/api/carbon/regions', (route) => route.fulfill({ json: { regions: [destination], total: 1 } }))
}

test('explains the simulation page areas through the shared page help guide', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockRegions(page)
  await page.goto('/regional-simulation')

  await page.getByRole('button', { name: 'Ajuda desta tela' }).click()
  const help = page.getByRole('dialog')
  await expect(help.getByRole('heading', { name: 'Parâmetros da simulação' })).toBeVisible()
  await expect(help).toContainText('Passo 1 de 4')
  await expect(help).toContainText('só é consultada ao clicar em Simular')
  await help.getByRole('button', { name: 'Próximo' }).click()
  await expect(help.getByRole('heading', { name: 'Resultado original' })).toBeVisible()
  await expect(help).toContainText('energia observada')
})

test('restores URL selections without submitting and uses 7d when period is absent', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockRegions(page)
  let simulations = 0
  await page.route('**/api/applications/*/analysis/regional-simulation', (route) => {
    simulations += 1
    return route.fulfill({ json: availableResult() })
  })

  await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=24h', { waitUntil: 'commit' })
  await expect(page.locator('h1')).toContainText(/simula.*regional/i)
  await expect(page.getByRole('button').filter({ hasText: 'app-pagamentos' })).toBeEnabled()
  await expect(page.locator('main select').first()).toHaveValue('24h')
  await expect(page.getByRole('button').filter({ hasText: 'US-VA' })).toBeVisible()
  await expect(page.getByRole('button', { name: /simular cen/i })).toBeEnabled()
  expect(simulations).toBe(0)

  await page.goto('/regional-simulation')
  await expect(page.locator('main select').first()).toHaveValue('7d')
})

test('simulates only on explicit action with the selected RFC3339 range and shows provenance', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-16T12:00:00.000Z') })
  await page.clock.setFixedTime(new Date('2026-11-16T12:00:00.000Z'))
  await mockCatalog(page, [application()])
  await mockRegions(page)
  const submissions: { id: string; body: unknown }[] = []
  await page.route('**/api/applications/*/analysis/regional-simulation', async (route) => {
    submissions.push({
      id: new URL(route.request().url()).pathname.split('/')[3],
      body: route.request().postDataJSON(),
    })
    await route.fulfill({ json: availableResult() })
  })

  await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=24h', { waitUntil: 'commit' })
  await expect(page.locator('h1')).toBeVisible()
  await expect.poll(() => submissions).toHaveLength(0)
  await page.getByRole('button', { name: /simular cen/i }).click()

  await expect.poll(() => submissions).toHaveLength(1)
  expect(submissions[0].id).toBe('svc-0142')
  const body = submissions[0].body as { from: string; to: string; destinationRegionCode: string }
  expect(Date.parse(body.to) - Date.parse(body.from)).toBe(24 * 60 * 60 * 1000)
  expect(Date.parse(body.from)).toBe(Date.parse('2026-11-15T12:00:00.000Z'))
  expect(Date.parse(body.to)).toBe(Date.parse('2026-11-16T12:00:00.000Z'))
  expect(body.destinationRegionCode).toBe('US-VA')

  await expect(page.getByRole('heading', { name: 'Resultado original' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Fator da regi.o escolhida/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resultado simulado' })).toBeVisible()
  await expect(page.getByText('2.000 gCO2e', { exact: true })).toBeVisible()
  await expect(page.getByText('800 gCO2e', { exact: true })).toBeVisible()
  await expect(page.getByText(/60% abaixo da refer.ncia/i)).toBeVisible()
  await expect(page.getByText('2026', { exact: false })).toBeVisible()
  await expect(page.getByText(/Consultado em/)).toBeVisible()
})

test('preserves context on API failure and retries without turning missing data into zero', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockRegions(page)
  let fail = true
  let submissions = 0
  await page.route('**/api/applications/*/analysis/regional-simulation', async (route) => {
    submissions += 1
    await route.fulfill(fail ? { status: 503, json: { code: 'CARBON_UNAVAILABLE' } } : { json: {
      ...availableResult(), status: 'partial', energy: { value: null, unit: 'kWh', reasons: [{ code: 'NO_CALCULABLE_ENERGY' }] },
      destination: { value: null, unit: 'gCO2e', reasons: [{ code: 'DESTINATION_FACTOR_UNAVAILABLE' }] },
      destinationFactor: null, difference: {
        absolute: { value: null, unit: 'gCO2e', reasons: [{ code: 'DESTINATION_FACTOR_UNAVAILABLE' }] },
        percent: { value: null, unit: '%', reasons: [{ code: 'REFERENCE_ZERO' }] },
      },
    } })
  })

  await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=7d')
  await page.getByRole('button', { name: /simular cen/i }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button').filter({ hasText: 'app-pagamentos' })).toBeVisible()
  await expect(page.getByRole('button').filter({ hasText: 'US-VA' })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: /tentar novamente/i }).click()
  await expect.poll(() => submissions).toBe(2)
  await expect(page.getByRole('status').filter({ hasText: /resultado parcial/i })).toBeVisible()
  await expect(page.getByText(/Sem energia calcul/).first()).toBeVisible()
  await expect(page.getByText('0 kWh', { exact: true })).toHaveCount(0)
})

test('marks prior results pending when URL criteria change and confirms clearing without changing official data', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockRegions(page)
  let submissions = 0
  await page.route('**/api/applications/*/analysis/regional-simulation', async (route) => {
    submissions += 1
    await route.fulfill({ json: availableResult() })
  })

  await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=24h')
  await page.getByRole('button', { name: /simular cen/i }).click()
  await expect(page.getByRole('heading', { name: 'Resultado simulado' })).toBeVisible()
  await page.locator('main select').first().selectOption('30d')
  await expect(page.getByRole('status').filter({ hasText: /par.metros mudaram/i })).toBeVisible()
  await expect(page.getByText('800 gCO2e', { exact: true })).toBeVisible()
  expect(submissions).toBe(1)
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')

  await page.getByRole('button', { name: /limpar cen.rio/i }).click()
  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: 'Cancelar' }).click()
  await expect(confirmation).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('applicationId')).toBe('svc-0142')

  await page.getByRole('button', { name: /limpar cen.rio/i }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: /limpar cen.rio/i }).click()
  await expect(page.locator('main select').first()).toHaveValue('7d')
  await expect(page.getByRole('heading', { name: 'Resultado simulado' })).toHaveCount(0)
  const cleared = new URL(page.url()).searchParams
  expect(cleared.has('applicationId')).toBe(false)
  expect(cleared.has('destinationRegionCode')).toBe(false)
  expect(cleared.has('period')).toBe(false)
})

test('keeps unsupported URL periods visible as validation and blocks simulation until corrected', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockRegions(page)
  let submissions = 0
  await page.route('**/api/applications/*/analysis/regional-simulation', async (route) => {
    submissions += 1
    await route.fulfill({ json: availableResult() })
  })

  await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=90d')
  await expect(page.getByRole('alert')).toContainText(/90d/)
  await expect(page.getByRole('button', { name: /simular cen/i })).toBeDisabled()
  expect(new URL(page.url()).searchParams.get('period')).toBe('90d')
  await page.locator('main select').first().selectOption('7d')
  await expect(page.getByRole('button', { name: /simular cen/i })).toBeEnabled()
  expect(new URL(page.url()).searchParams.get('period')).toBe('7d')
  expect(submissions).toBe(0)
})

test('searches and pages the application dialog while retaining the selected identity in the URL', async ({ page }) => {
  await mockCatalog(page, largeCatalog())
  await mockRegions(page)
  await page.goto('/regional-simulation')
  await page.getByRole('button', { name: /aplica/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[aria-pressed]')).toHaveCount(10)
  await dialog.getByRole('button', { name: /pr.xima/i }).click()
  await expect(dialog.locator('[aria-pressed]')).toHaveCount(10)
  await dialog.getByRole('searchbox').fill('api-011')
  await expect(dialog.locator('[aria-pressed]')).toHaveCount(1)
  await dialog.getByRole('button', { name: /api-011/ }).click()
  await expect(dialog).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('applicationId')).toBe('svc-011')
  await expect(page.getByRole('button').filter({ hasText: 'api-011' })).toBeVisible()
})

test('presents an empty response separately from zero', async ({ page }) => {
  await mockCatalog(page, [application()])
  await mockRegions(page)
  await page.route('**/api/applications/*/analysis/regional-simulation', (route) => route.fulfill({ json: {
    status: 'empty', applicationId: 'svc-0142', destinationRegionCode: 'US-VA',
    period: { from: '2026-11-09T12:00:00.000Z', to: '2026-11-16T12:00:00.000Z' },
    energy: { value: null, unit: 'kWh', reasons: [{ code: 'NO_OBSERVATION' }] },
    reference: { value: null, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] },
    referenceFactors: [], destinationFactor: null,
    destination: { value: null, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] },
    coverage: { energy: 0, reference: 0, destination: 0 },
    difference: {
      absolute: { value: null, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] },
      percent: { value: null, unit: '%', reasons: [{ code: 'NO_OBSERVATION' }] },
    },
  } }))
  await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=7d')
  await page.getByRole('button', { name: /simular cen/i }).click()
  await expect(page.getByRole('status')).toContainText(/nenhum dado no per/i)
  await expect(page.getByText(/aus.ncia de dados n.o significa consumo zero/i)).toBeVisible()
  await expect(page.getByText('0 kWh', { exact: true })).toHaveCount(0)
})
