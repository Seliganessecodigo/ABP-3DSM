import { expect, test, type Page } from '@playwright/test'
import { application, mockCatalog, gate } from './support/catalog.ts'
import type { ComparisonDifference } from '../src/features/analysis/comparison.ts'
import type { SimulationFactor, SimulationMeasure } from '../src/features/analysis/regionalSimulation.ts'

const ids = Array.from({ length: 21 }, (_, i) => `qa-${String(i + 1).padStart(2, '0')}`)
const catalog = ids.map((id, i) => application({ id, name: `Aplicação QA ${String(i + 1).padStart(2, '0')}` }))
const period = { from: '2026-11-15T12:00:00.000Z', to: '2026-11-16T12:00:00.000Z' }
const noDifference: ComparisonDifference = { absolute: null, unit: null, percentage: null, reason: null }
function measure(value: number | null, unit: string, reasons: { code: string }[] = []): SimulationMeasure { return { value, unit, reasons } }
function comparison(url: URL) {
  const selected = url.searchParams.getAll('applicationIds')
  const reference = url.searchParams.get('referenceApplicationId') ?? selected[0]
  const value = (id: string) => ids.indexOf(id) + 2
  return {
    status: 'complete', period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') }, referenceApplicationId: reference,
    applications: selected.map(id => ({
      applicationId: id, name: catalog.find(item => item.id === id)!.name, state: 'AVAILABLE',
      locations: [{ ...period, location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'Histórica QA', latitude: -23.55, longitude: -46.63 }, reasons: [] }],
      metrics: Object.fromEntries(['cpu', 'memory', 'disk', 'network'].map(key => [key, { value: 10, unit: key === 'cpu' ? '%' : 'GB', status: 'available', collectedAt: period.to, reasons: [] }])),
      energy: measure(value(id), 'kWh'), emissions: measure(value(id) * 100, 'gCO2e'),
      coverage: { energy: 1, emissions: 1 },
      differences: { energy: id === reference ? noDifference : { absolute: value(id) - value(reference), unit: 'kWh', percentage: (value(id) - value(reference)) / value(reference) * 100, reason: null }, emissions: noDifference,
        metrics: { cpu: noDifference, memory: noDifference, disk: noDifference, network: noDifference }, coverage: { energyPercentagePoints: 0, emissionsPercentagePoints: 0 } },
    })),
  }
}
async function shot(page: Page, name: string) {
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: true })
}
const resultArea = (page: Page, metric: string) => page.locator(`[data-help="comparison-${metric}"]:visible`)
const selection = (page: Page) => page.locator('[aria-labelledby="comparison-selection-heading"]')
async function openSelection(page: Page) {
  const details = selection(page)
  if (await details.getAttribute('open') === null) await details.locator('summary').click()
}

test('CT-052 S1–S5 seleção automática, cálculo, limite, paginação e histórico de URL', async ({ page }) => {
  await page.clock.setFixedTime(new Date(period.to))
  await mockCatalog(page, catalog)
  const requests: string[] = []
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, route => {
    requests.push(route.request().url())
    return route.fulfill({ json: comparison(new URL(route.request().url())) })
  })
  await page.goto('/comparison')
  await selection(page).getByRole('checkbox', { name: /ID qa-01/ }).check()
  expect(requests).toHaveLength(0)
  await shot(page, 'ct052-s1-uma-aplicacao')
  await selection(page).getByRole('checkbox', { name: /ID qa-02/ }).check()
  await expect(resultArea(page, 'energy')).toContainText('+1 kWh')
  await expect(resultArea(page, 'energy')).toContainText('+50%')
  await shot(page, 'ct052-s2-diferenca-50-porcento')
  for (const id of ['03', '04', '05']) await selection(page).getByRole('checkbox', { name: new RegExp(`ID qa-${id}`) }).check()
  await expect(selection(page).getByRole('checkbox', { name: /ID qa-06/ })).toBeDisabled()
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('30d')
  await expect.poll(() => new URL(requests.at(-1)!).searchParams.getAll('applicationIds').length).toBe(5)
  const request = new URL(requests.at(-1)!)
  expect(Date.parse(request.searchParams.get('to')!) - Date.parse(request.searchParams.get('from')!)).toBe(30 * 86400000)
  await page.getByRole('combobox', { name: 'Itens por página' }).selectOption('5')
  await page.getByRole('button', { name: 'Próxima página', exact: true }).click()
  await expect(page.getByRole('list', { name: 'Aplicações selecionadas' }).getByRole('listitem')).toHaveCount(5)
  await selection(page).getByRole('searchbox').fill('QA 21')
  await expect(selection(page)).toContainText('Aplicação QA 21')
  await expect(page.getByRole('list', { name: 'Aplicações selecionadas' }).getByRole('listitem')).toHaveCount(5)
  await selection(page).getByRole('searchbox').fill('')
  await selection(page).getByRole('button', { name: /Nome ou identificador/ }).click()
  await expect.poll(() => new URL(page.url()).searchParams.get('direction')).toBe('desc')
  await page.getByRole('list', { name: 'Aplicações selecionadas' }).getByRole('button', { name: /Remover Aplicação QA 01/ }).click()
  await expect(page.getByRole('combobox', { name: 'Aplicação de referência' })).toHaveValue('qa-02')
  await shot(page, 'ct052-s4-selecao-preservada')
  const selected = new URL(page.url()).searchParams.getAll('applicationIds')
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Aplicação de referência' })).toHaveValue('qa-02')
  expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(selected)
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('24h')
  await page.goBack()
  await expect(page.getByRole('combobox', { name: 'Período de análise' })).toHaveValue('30d')
  await page.goForward()
  await expect(page.getByRole('combobox', { name: 'Período de análise' })).toHaveValue('24h')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await shot(page, 'ct052-s5-url-restaurada')
})

test('CT-053 S1–S5 referência inválida, partial/empty, razões, corrida e retry', async ({ page }) => {
  await mockCatalog(page, catalog)
  let mode = 'complete'
  const delayed = gate()
  let pending = false
  await page.route(/\/analysis\/comparison(?:\?.*)?$/, async route => {
    const response = comparison(new URL(route.request().url()))
    if (mode === 'delay') { pending = true; await delayed.wait }
    if (mode === 'error') return route.fulfill({ status: 503, json: { code: 'ANALYSIS_COMPARISON_UNAVAILABLE' } })
    if (mode === 'partial' || mode === 'empty') {
      response.status = mode
      response.applications[0].energy = measure(0, 'kWh')
      response.applications[0].coverage.emissions = 0
      const second = response.applications[1]
      second.coverage = { energy: 0.5, emissions: 0 }
      second.differences.energy = { absolute: 3, unit: 'kWh', percentage: null, reason: 'ZERO_REFERENCE' }
      second.differences.metrics.memory = { absolute: null, unit: null, percentage: null, reason: 'INCOMPATIBLE_UNIT' }
      second.differences.coverage.energyPercentagePoints = -50
      for (const item of response.applications) {
        item.emissions = measure(null, 'gCO2e', [{ code: 'NO_OBSERVATION' }])
        item.differences.emissions = { absolute: null, unit: 'gCO2e', percentage: null, reason: 'VALUE_UNAVAILABLE' }
        if (mode === 'empty') item.energy = measure(null, 'kWh', [{ code: 'NO_OBSERVATION' }])
      }
    }
    await route.fulfill({ json: response }).catch(() => {})
  })
  await page.goto('/comparison?applicationIds=qa-01&applicationIds=qa-01&applicationIds=qa-02&referenceApplicationId=missing&period=7d')
  await expect(page.getByRole('alert')).toContainText('não está entre as aplicações selecionadas')
  expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['qa-01', 'qa-02'])
  await shot(page, 'ct053-s1-referencia-invalida')
  mode = 'partial'
  await page.getByRole('combobox', { name: 'Aplicação de referência' }).selectOption('qa-01')
  await expect(page.getByRole('status').filter({ hasText: 'A comparação é parcial' })).toBeVisible()
  await expect(resultArea(page, 'energy')).toContainText('Referência igual a zero')
  await expect(resultArea(page, 'emissions')).toContainText('Valor indisponível')
  await expect(resultArea(page, 'memory')).toContainText('Unidade incompatível')
  await expect(resultArea(page, 'energyCoverage')).toContainText('-50')
  await shot(page, 'ct053-s2-s3-parcial-razoes-coberturas')
  mode = 'empty'
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('24h')
  await expect(page.getByText('Não há resultados utilizáveis para as aplicações neste período.', { exact: true })).toBeVisible()
  await shot(page, 'ct053-s2-vazio')
  mode = 'delay'
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('30d')
  await expect.poll(() => pending).toBe(true)
  mode = 'complete'
  await openSelection(page)
  await selection(page).getByRole('checkbox', { name: /ID qa-02/ }).uncheck()
  await selection(page).getByRole('checkbox', { name: /ID qa-03/ }).check()
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('7d')
  await expect(resultArea(page, 'energy')).toContainText('+2 kWh')
  delayed.release()
  await expect.poll(() => new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['qa-01', 'qa-03'])
  await expect(resultArea(page, 'energy')).toContainText('+2 kWh')
  await shot(page, 'ct053-s4-resposta-atual')
  mode = 'error'
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('24h')
  await expect(page.getByRole('alert')).toContainText('A comparação está indisponível')
  await expect(resultArea(page, 'energy')).toHaveCount(0)
  await shot(page, 'ct053-s5-erro')
  mode = 'complete'
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(resultArea(page, 'energy')).toContainText('+2 kWh')
  await shot(page, 'ct053-s5-recuperado')
})

const destination = { code: 'US-VA', country: 'United States', region: 'Virginia', city: null, latitude: 38.9, longitude: -77.04, intensity: 80, unit: 'gCO2e/kWh', renewableSharePercent: 42 }
function simulationFactor(): SimulationFactor | null { return { ...destination, regionCode: destination.code, id: 'qa-factor', version: 'v1', queriedAt: period.to } }
function simulation() {
  return { status: 'available', applicationId: 'qa-01', destinationRegionCode: 'US-VA', period,
    energy: measure(10, 'kWh'), reference: measure(2000, 'gCO2e'),
    referenceFactors: [], destinationFactor: simulationFactor(),
    destination: measure(800, 'gCO2e'), coverage: { energy: 1, reference: 1, destination: 1 },
    difference: { absolute: measure(-1200, 'gCO2e'), percent: measure(-0.6, '%') } }
}

test('CT-055 variações: região alterada durante requisição e falhas independentes das listas', async ({ page }) => {
  await mockCatalog(page, catalog)
  const other = { ...destination, code: 'US-CA', region: 'California' }
  let failCatalog = false
  let emptyRegions = false
  await page.route('**/api/applications', route => route.fulfill(failCatalog ? { status: 503, json: { code: 'CATALOG_UNAVAILABLE' } } : { json: catalog }))
  await page.route('**/api/carbon/regions', route => route.fulfill({ json: { regions: emptyRegions ? [] : [destination, other], total: emptyRegions ? 0 : 2 } }))
  const held = gate()
  let started = false
  let requests = 0
  await page.route('**/api/applications/*/analysis/regional-simulation', async route => {
    requests++
    const input = route.request().postDataJSON()
    if (input.destinationRegionCode === 'US-VA') { started = true; await held.wait }
    const response = simulation()
    response.destinationRegionCode = input.destinationRegionCode
    response.destinationFactor = { ...simulationFactor()!, regionCode: input.destinationRegionCode }
    await route.fulfill({ json: response }).catch(() => {})
  })
  await page.goto('/regional-simulation?applicationId=qa-01&destinationRegionCode=US-VA&period=7d')
  await page.getByRole('button', { name: 'Simular cenário', exact: true }).click()
  await expect.poll(() => started).toBe(true)
  await page.getByRole('button', { name: 'Região do cenário', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: /US-CA/ }).click()
  expect(new URL(page.url()).searchParams.get('destinationRegionCode')).toBe('US-CA')
  held.release()
  await expect(page.getByRole('heading', { name: 'Resultado simulado' })).toHaveCount(0)
  expect(requests).toBe(1)
  await page.getByRole('button', { name: 'Simular cenário', exact: true }).click()
  await expect(page.getByRole('article', { name: 'Fator da região escolhida' })).toContainText('US-CA')
  await shot(page, 'ct055-regiao-atual-apos-cancelamento')
  failCatalog = true
  await page.reload()
  await expect(page.getByText('Não foi possível carregar as aplicações.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Região do cenário', exact: true })).toBeEnabled()
  await shot(page, 'ct055-erro-catalogo-regioes-disponiveis')
  failCatalog = false
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Aplicação', exact: true })).toContainText('QA 01')
  emptyRegions = true
  await page.reload()
  await expect(page.getByRole('button', { name: 'Região do cenário', exact: true })).toBeDisabled()
  await expect(page.getByText('Não foi possível consultar as regiões atuais.')).toHaveCount(0)
  await shot(page, 'ct055-lista-regioes-vazia-sem-erro')
})
test('CT-055 S1–S5 validação, ausência, pendência, cancelamento, retry e limpeza', async ({ page }) => {
  await mockCatalog(page, catalog)
  let regionFail = false
  await page.route('**/api/carbon/regions', route => route.fulfill(regionFail ? { status: 503, json: { code: 'CARBON_UNAVAILABLE' } } : { json: { regions: [destination], total: 1 } }))
  let mode = 'complete'
  const delayed = gate()
  let submissions = 0
  await page.route('**/api/applications/*/analysis/regional-simulation', async route => {
    submissions++
    if (mode === 'delay') await delayed.wait
    if (mode === 'error') return route.fulfill({ status: 503, json: { code: 'CARBON_UNAVAILABLE' } })
    const response = simulation()
    if (mode === 'partial' || mode === 'empty' || mode === 'zero') {
      response.status = mode === 'empty' ? 'empty' : 'partial'
      if (mode !== 'zero') response.destinationFactor = null
      if (mode === 'empty') {
        response.energy = measure(null, 'kWh', [{ code: 'NO_CALCULABLE_ENERGY' }])
        response.reference = measure(null, 'gCO2e', [{ code: 'NO_OBSERVATION' }])
        response.coverage = { energy: 0, reference: 0, destination: 0 }
      } else if (mode === 'zero') response.reference = measure(0, 'gCO2e')
      if (mode !== 'zero') response.destination = measure(null, 'gCO2e', [{ code: 'DESTINATION_FACTOR_UNAVAILABLE' }])
      response.difference = { absolute: measure(null, 'gCO2e'), percent: measure(null, '%', [{ code: mode === 'zero' ? 'ZERO_REFERENCE' : 'DESTINATION_FACTOR_UNAVAILABLE' }]) }
      response.coverage.destination = mode === 'zero' ? 1 : 0
    }
    await route.fulfill({ json: response }).catch(() => {})
  })
  const url = '/regional-simulation?applicationId=qa-01&destinationRegionCode=US-VA&period='
  await page.goto(url + '90d')
  await expect(page.getByRole('alert')).toContainText('90d')
  await expect(page.getByRole('button', { name: 'Simular cenário', exact: true })).toBeDisabled()
  await shot(page, 'ct055-s1-periodo-invalido')
  await page.goto('/regional-simulation?applicationId=missing&destinationRegionCode=missing&period=7d')
  await expect(page.getByRole('button', { name: 'Simular cenário', exact: true })).toBeDisabled()
  await page.goto(url + '7d')
  const appButton = page.getByRole('button', { name: 'Aplicação', exact: true })
  await appButton.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('[aria-pressed]')).toHaveCount(21)
  await dialog.getByRole('combobox', { name: 'Ordenar por' }).selectOption('name:desc')
  await expect(dialog.locator('[aria-pressed]').first()).toContainText('QA 21')
  await dialog.getByRole('searchbox').fill('sem-correspondencias')
  await expect(dialog).toContainText('Nenhuma aplicação corresponde')
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await shot(page, 'ct055-overlay-apos-escape')
  const run = page.getByRole('button', { name: 'Simular cenário', exact: true })
  mode = 'partial'
  await run.click()
  await expect(page.getByText('Fator de destino indisponível', { exact: true })).toBeVisible()
  await expect(page.getByText('10 kWh', { exact: true }).first()).toBeVisible()
  await shot(page, 'ct055-s2-fator-ausente')
  mode = 'empty'
  await run.click()
  await expect(page.getByRole('status').filter({ hasText: 'Nenhum dado no período' })).toBeVisible()
  await expect(page.getByText('0 kWh', { exact: true })).toHaveCount(0)
  await shot(page, 'ct055-s2-sem-energia')
  mode = 'zero'
  await run.click()
  await expect(page.getByText('Variação percentual não aplicável')).toBeVisible()
  await shot(page, 'ct055-s2-referencia-zero')
  mode = 'complete'
  await run.click()
  await expect(page.getByText('800 gCO2e', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('30d')
  await expect(page.getByRole('status').filter({ hasText: 'Os parâmetros mudaram' })).toBeVisible()
  await shot(page, 'ct055-s3-pendente')
  await page.goBack()
  await expect(page.getByRole('combobox', { name: 'Período de análise' })).toHaveValue('7d')
  await page.goForward()
  await expect(page.getByRole('combobox', { name: 'Período de análise' })).toHaveValue('30d')
  mode = 'delay'
  await run.click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible()
  const beforeCancel = submissions
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  delayed.release()
  await expect(run).toBeEnabled()
  expect(submissions).toBe(beforeCancel)
  mode = 'error'
  await run.click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar a simulação')
  await shot(page, 'ct055-s4-erro')
  mode = 'complete'
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByText('800 gCO2e', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar cenário', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByText('800 gCO2e', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Limpar cenário', exact: true }).click()
  await shot(page, 'ct055-s5-confirmacao-limpeza')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Limpar cenário', exact: true }).click()
  expect(new URL(page.url()).searchParams.toString()).toBe('')
  await expect(page.getByRole('combobox', { name: 'Período de análise' })).toHaveValue('7d')
  await expect(page.getByRole('heading', { name: 'Resultado simulado' })).toHaveCount(0)
  regionFail = true
  await page.reload()
  await expect(page.getByText('Não foi possível consultar as regiões atuais.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aplicação', exact: true })).toBeEnabled()
  regionFail = false
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Região do cenário', exact: true })).toBeEnabled()
  await shot(page, 'ct055-listas-recuperadas')
})

test('CT-055 bug #494: Escape devolve foco ao acionador do seletor', async ({ page }) => {
  test.fail(process.env.QA_EXPECT_FOCUS_BUG === 'true', 'Rodada anterior à correção #494: foco termina em BODY ao remover o diálogo')
  await mockCatalog(page, catalog)
  await page.route('**/api/carbon/regions', route => route.fulfill({ json: { regions: [destination], total: 1 } }))
  await page.goto('/regional-simulation')
  await page.getByRole('button', { name: 'Aplicação', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).focus()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName, label: document.activeElement?.getAttribute('aria-label') }))
  await test.info().attach('foco-observado', { body: JSON.stringify(focused), contentType: 'application/json' })
  await shot(page, 'ct055-bug494-foco-perdido')
  expect(focused).toEqual({ tag: 'BUTTON', label: 'Aplicação' })
})
