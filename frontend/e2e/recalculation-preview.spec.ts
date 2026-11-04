import { expect, test } from '@playwright/test'
import { application } from './support/catalog.ts'

const period = { from: '2026-10-01T00:00:00.000Z', to: '2026-10-09T00:00:00.000Z' }

function analysis(value: { energy: number; emissions: number }) {
  return {
    status: 'available',
    applicationId: 'svc-0142',
    period,
    energy: { value: value.energy, unit: 'kWh', reasons: [] },
    emissions: { value: value.emissions, unit: 'gCO2e', reasons: [] },
    coverage: { energy: 1, emissions: 1 },
    provenance: {
      methodologies: [{ key: 'simplified-energy', version: '1', parameters: { cpuMaxPowerW: 100 } }],
      factors: [{ contractVersion: '0.1.0', regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null,
        intensity: 0.42, unit: 'gCO2e/kWh', version: 'factor-v3', source: null, validFrom: null, validUntil: null,
        queriedAt: { from: period.from, to: period.to } }],
      reasons: [],
    },
  }
}

test('solicita pelo botão e compara original e prévia no mesmo escopo', async ({ page }) => {
  const applications = [application(), application({ id: 'svc-0200', name: 'app-relatorios' })]
  const requests: { id: string; from: string; to: string }[] = []
  await page.route('**/api/applications', (route) => route.fulfill({ json: applications }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', async (route) => {
    requests.push({ id: new URL(route.request().url()).pathname.split('/')[3], ...route.request().postDataJSON() })
    await route.fulfill({ json: {
      status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
    } })
  })

  await page.goto('/administration/calculations')
  await expect(page.getByRole('heading', { level: 1, name: 'Administração' })).toBeVisible()
  await expect(page.getByText('Monitoramento, parâmetros, auditoria e controle de acesso • Área restrita')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Modelo de estimativa' })).toBeVisible()
  await expect(page.getByText('Energia (kWh) = potência (kW) × duração (h)')).toBeVisible()
  await expect(page.getByText('CO₂e (kg) = energia (kWh) × fator regional (gCO₂e/kWh) ÷ 1000')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeDisabled()
  await expect.poll(() => requests).toHaveLength(0)

  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()

  await expect.poll(() => requests).toHaveLength(1)
  expect(requests[0].id).toBe('svc-0142')
  expect(Date.parse(requests[0].to) - Date.parse(requests[0].from)).toBe(8 * 24 * 60 * 60 * 1000)
  await expect(page.getByRole('region', { name: 'Energia' }).getByText('2 kWh')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Energia' }).getByText('3 kWh')).toBeVisible()
  await expect(page.getByText('Diferença: +50%', { exact: true })).toBeVisible()
  await expect(page.getByText('simplified-energy v1', { exact: false })).toBeVisible()
  await expect(page.getByText(/factor-v3/)).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('recalculation-preview-result.png'), fullPage: true })
})

test('explica diferenças não calculáveis e mantém aviso e resultados parciais', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'partial',
    original: { ...analysis({ energy: 0, emissions: 0.8 }), coverage: { energy: 1, emissions: 1 } },
    preview: { ...analysis({ energy: 3, emissions: 1 }), coverage: { energy: 0.8, emissions: 0.5 } },
    warnings: [{ code: 'CARBON_FACTOR_UNAVAILABLE', regionCode: 'BR-SP' }],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()

  await expect(page.getByRole('status').getByText(/Resultado parcial/)).toBeVisible()
  await expect(page.getByText('Fator de intensidade de carbono está indisponível para BR-SP.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Energia' }).getByText('3 kWh')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Energia' }).getByText(/a cobertura não é equivalente/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'CO₂e' }).getByText(/a cobertura não é equivalente/)).toBeVisible()
})

test('mostra falha da API e voltar limpa a prévia sem perder os filtros', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ status: 503, json: { code: 'upstream-unavailable' } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível gerar a prévia')
  await expect(page.getByLabel('Aplicação')).toHaveValue('svc-0142')

  await page.unroute('**/api/applications/*/analysis/recalculation-preview')
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
  } }))
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await page.getByRole('button', { name: 'Voltar à aba' }).click()
  await expect(page.getByLabel('Aplicação')).toHaveValue('svc-0142')
  await expect(page.getByLabel('Início do período')).toHaveValue('2026-10-01')
  await expect(page.getByLabel('Fim do período')).toHaveValue('2026-10-08')
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeVisible()
  await expect(page.getByText('Diferença: +50%', { exact: true })).toHaveCount(0)
})

test('traduz estados vazios e parciais em vez de exibir códigos internos', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'empty',
    original: { ...analysis({ energy: 0, emissions: 0 }), status: 'empty', energy: { value: null, unit: 'kWh', reasons: [{ code: 'ENERGY_UNAVAILABLE' }] }, emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] } },
    preview: { ...analysis({ energy: 0, emissions: 0 }), status: 'empty', energy: { value: null, unit: 'kWh', reasons: [{ code: 'ENERGY_UNAVAILABLE' }] }, emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] } },
    warnings: [],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Idioma').selectOption('en-US')
  await page.getByRole('combobox', { name: 'Application' }).selectOption('svc-0142')
  await page.getByLabel('Period start').fill('2026-10-01')
  await page.getByLabel('Period end').fill('2026-10-08')
  await page.getByRole('button', { name: 'Generate preview' }).click()
  await expect(page.getByText('There are no environmental results for this period.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Energy' }).getByText('Not calculable')).toHaveCount(2)
  await expect(page.getByRole('region', { name: 'Energy' }).getByText('Difference unavailable: a comparable value is missing.')).toBeVisible()
  await expect(page.getByText('empty', { exact: true })).toHaveCount(0)
})

test('informa quando não há aplicações e não habilita a solicitação', async ({ page }) => {
  let previewRequests = 0
  await page.route('**/api/applications', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => {
    previewRequests += 1
    return route.fulfill({ json: {} })
  })
  await page.goto('/administration/calculations')
  await expect(page.getByRole('status').getByText('Nenhuma aplicação disponível.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeDisabled()
  expect(previewRequests).toBe(0)
})

test('explica o limite de configuração sem apresentar fórmula ilustrativa como efetiva', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.goto('/administration/calculations')
  await expect(page.getByText(/não permite escolher outra configuração/)).toBeVisible()
  await expect(page.getByText(/Energy \(kWh\) = power/)).toHaveCount(0)
})

test('não apresenta comparação se a API retornar outro período', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available', original: analysis({ energy: 2, emissions: 0.8 }),
    preview: { ...analysis({ energy: 3, emissions: 1 }), period: { from: '2026-09-01T00:00:00.000Z', to: '2026-09-09T00:00:00.000Z' } }, warnings: [],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível gerar a prévia')
  await expect(page.getByRole('region', { name: 'Energia' })).toHaveCount(0)
})

test('valida o limite de 30 dias e mantém formulário sem overflow em viewport móvel', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-31')
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('até 30 dias')
  await page.getByLabel('Fim do período').fill('2026-10-30')
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeEnabled()
  await expect(page.getByRole('status')).toHaveCount(0)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: test.info().outputPath('recalculation-preview-mobile.png'), fullPage: true })
})

test('explica limite de observações sem atribuí-lo às datas', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({
    status: 400, json: { code: 'RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED' },
  }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('alert')).toContainText('limite de observações')
  await expect(page.getByRole('alert')).not.toContainText('intervalo')
})

test('explica quando o original não é positivo e quando as unidades divergem', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available',
    original: { ...analysis({ energy: -2, emissions: 1 }), coverage: { energy: 0.5, emissions: 0.5 } },
    preview: { ...analysis({ energy: 3, emissions: 1000 }), energy: { value: 3, unit: 'kWh', reasons: [] },
      emissions: { value: 1000, unit: 'kgCO2e', reasons: [] }, coverage: { energy: 0.5, emissions: 0.5 } }, warnings: [],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('region', { name: 'Energia' }).getByText(/valor original precisa ser positivo/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'CO₂e' }).getByText(/unidades são incompatíveis/)).toBeVisible()
  await expect(page.getByText(/Diferença: [+-]?\d/)).toHaveCount(0)
})

test('descarta resposta atrasada quando o período muda durante a solicitação', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    try {
      await route.fulfill({ json: {
        status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
      } })
    } catch { /* the form aborts the request when its context changes */ }
  })
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Processando' })).toBeVisible()
  await page.getByLabel('Fim do período').fill('2026-10-09')
  await page.waitForTimeout(350)
  await expect(page.getByRole('region', { name: 'Energia' })).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeEnabled()
})

test('descarta resposta atrasada quando a aplicação muda durante a solicitação', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application(), application({ id: 'svc-0200', name: 'app-relatorios' })] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    try {
      await route.fulfill({ json: {
        status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
      } })
    } catch { /* the form aborts the request when its context changes */ }
  })
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Processando' })).toBeVisible()
  await page.getByLabel('Aplicação').selectOption('svc-0200')
  await page.waitForTimeout(350)
  await expect(page.getByRole('region', { name: 'Energia' })).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Gerar prévia' })).toBeEnabled()
})

test('estados e controles traduzidos permanecem disponíveis nos doze idiomas', async ({ page }) => {
  const locales = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN', 'ko-KR', 'ru-RU', 'hi-IN', 'id-ID']
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  for (const locale of locales) {
    await page.getByRole('combobox').first().selectOption(locale)
    const formButton = page.locator('main form button[type="submit"]')
    await expect(formButton).toBeEnabled()
    await formButton.click()
    const status = page.getByRole('status').first()
    await expect(status).not.toHaveText(/^(available|empty|partial)$/)
    await expect(status).not.toBeEmpty()
    await page.getByRole('button').last().click()
  }
})

test('submete a prévia com teclado e mantém controles acessíveis', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
  } }))
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  const submit = page.getByRole('button', { name: 'Gerar prévia' })
  await submit.focus()
  await expect(submit).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'Energia' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Prévia do recálculo' })).toBeFocused()
})

test('marca Configurações como página atual e mantém o tema do sistema na tela', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.goto('/administration/calculations')
  const navigation = page.getByRole('navigation').first()
  await expect(navigation.getByRole('link', { name: 'Configurações', exact: true })).toHaveAttribute('aria-current', 'page')
  const adminNavigation = page.getByRole('navigation', { name: 'Administração' })
  await expect(adminNavigation.getByRole('link', { name: 'Cálculos', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(adminNavigation.locator('span').filter({ hasText: 'Saúde' })).toHaveAttribute('aria-disabled', 'true')
  await expect(adminNavigation.locator('small').first()).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Aplicações', exact: true })).not.toHaveAttribute('aria-current', 'page')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const lightBackground = await page.locator('main').evaluate((element) => getComputedStyle(element).backgroundColor)

  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const darkBackground = await page.locator('main').evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(darkBackground).not.toBe(lightBackground)
})

test('prévia fica separada dos totais oficiais do dashboard', async ({ page }) => {
  await page.route('**/api/applications', (route) => route.fulfill({ json: [application()] }))
  await page.route('**/api/applications/*/analysis/recalculation-preview', (route) => route.fulfill({ json: {
    status: 'available', original: analysis({ energy: 2, emissions: 0.8 }), preview: analysis({ energy: 3, emissions: 1 }), warnings: [],
  } }))
  await page.route(/\/analysis\/summary(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ json: {
      status: 'available', period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') }, dataAsOf: period.to,
      totals: { energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 0.8, unit: 'gCO2e', reasons: [] } },
      coverage: { energy: 1, emissions: 1 }, states: { AVAILABLE: 1, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 },
      applications: [{ applicationId: 'svc-0142', name: 'app-exemplo', state: 'AVAILABLE',
        energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 0.8, unit: 'gCO2e', reasons: [] }, coverage: { energy: 1, emissions: 1 } }],
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
  await page.goto('/administration/calculations')
  await page.getByLabel('Aplicação').selectOption('svc-0142')
  await page.getByLabel('Início do período').fill('2026-10-01')
  await page.getByLabel('Fim do período').fill('2026-10-08')
  await page.getByRole('button', { name: 'Gerar prévia' }).click()
  await expect(page.getByRole('region', { name: 'Energia' }).getByText('3 kWh')).toBeVisible()

  await page.getByRole('navigation').first().getByRole('link', { name: 'Dashboard', exact: true }).click()
  const officialIndicators = page.getByRole('region', { name: 'Indicadores ambientais' })
  await expect(officialIndicators.getByText('2 kWh', { exact: true })).toBeVisible()
  await expect(officialIndicators.getByText('3 kWh', { exact: true })).toHaveCount(0)
})
