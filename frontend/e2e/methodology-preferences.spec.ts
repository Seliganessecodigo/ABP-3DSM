import { expect, test, type Page } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'
import { mkdir } from 'node:fs/promises'

const names = ['Energia', 'Emissões de CO₂e', 'Cobertura dos dados', 'Padrão das análises']
const energy = { threshold: 10, unit: 'kWh', scope: 'application', referencePeriod: 'month', alertsEnabled: true }
const initial = () => ({ energy: { revision: 1, updatedAt: '2026-10-28T12:00:00Z', value: { ...energy } }, emissions: { revision: 1, updatedAt: '2026-10-28T12:00:00Z', value: { ...energy, threshold: 2, unit: 'kgCO2e' } }, coverage: { revision: 1, updatedAt: '2026-10-28T12:00:00Z', value: { thresholdPercent: 80, alertsEnabled: true } }, analysis: { revision: 1, updatedAt: '2026-10-28T12:00:00Z', value: { periodDays: 30, granularity: 'day' } } })
async function signIn(page: Page) {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', (route) => route.fulfill({ json: { accessToken: 'preferences-access', refreshToken: 'preferences-refresh', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { id: 'user-1', organizationId: 'org-1', name: 'Ana Silva', email: 'ana@example.test', role: 'ANALYST' } }))
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.getByRole('link', { name: 'Metodologia', exact: true }).click()
}
async function mockPreferences(page: Page, fail = 0) {
  const preferences = initial()
  await page.route('**/api/me/preferences', (route) => route.fulfill({ json: preferences }))
  await page.route('**/api/me/preferences/*', async (route) => {
    expect(route.request().headers().authorization).toBe('Bearer preferences-access')
    if (fail) return route.fulfill({ status: fail, json: { code: fail === 409 ? 'PREFERENCE_CONFLICT' : 'PREFERENCES_UNAVAILABLE' } })
    const tab = route.request().url().split('/').at(-1) as keyof typeof preferences
    const body = route.request().postDataJSON() as { expectedRevision: number; value: typeof preferences[typeof tab]['value'] }
    const result = { revision: body.expectedRevision + 1, value: body.value, updatedAt: '2026-10-28T13:00:00Z' }
    Object.assign(preferences[tab], result)
    return route.fulfill({ json: result })
  })
}

test('salva somente a aba atual e cancelar restaura a preferência ativa', async ({ page }) => {
  await mockPreferences(page)
  await signIn(page)
  const field = page.getByLabel('Limite em edição', { exact: true })
  await expect(field).toHaveValue('10')
  await field.fill('8')
  await expect(page.getByText('10 kWh por aplicação/mês', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar alterações' }).click()
  await expect(field).toHaveValue('10')
  await field.fill('8')
  await page.getByRole('button', { name: 'Salvar minhas preferências' }).click()
  await expect(page.getByText('8 kWh por aplicação/mês', { exact: true })).toBeVisible()
  await expect(page.getByText('Preferências salvas', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: names[1], exact: true }).click()
  await expect(field).toHaveValue('2')
})

test('diálogo preserva, descarta e salva antes da troca de aba; Escape retorna ao editor', async ({ page }) => {
  await mockPreferences(page)
  await signIn(page)
  const field = page.getByLabel('Limite em edição', { exact: true })
  await field.fill('8')
  await page.getByRole('tab', { name: names[2], exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Ativo: 10 kWh → Em edição: 8 kWh por aplicação/mês')
  await page.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(field).toHaveValue('8')
  await expect(page.getByRole('tab', { name: names[0], exact: true })).toBeFocused()
  await page.getByRole('tab', { name: names[2], exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await page.getByRole('tab', { name: names[2], exact: true }).click()
  await page.getByRole('button', { name: 'Descartar e trocar' }).click()
  await expect(page.getByRole('tab', { name: names[2], exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: names[0], exact: true }).click()
  await expect(field).toHaveValue('10')
  await field.fill('8')
  await page.getByRole('tab', { name: names[1], exact: true }).click()
  await page.getByRole('button', { name: 'Salvar e trocar', exact: true }).click()
  await expect(page.getByRole('tab', { name: names[1], exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: names[0], exact: true }).click()
  await expect(field).toHaveValue('8')
})

for (const status of [503, 409]) test(`falha ${status} mantém edição, valor ativo e aba`, async ({ page }) => {
  await mockPreferences(page, status)
  await signIn(page)
  await page.getByLabel('Limite em edição', { exact: true }).fill('8')
  await page.getByRole('tab', { name: names[2], exact: true }).click()
  await page.getByRole('button', { name: 'Salvar e trocar', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(status === 503 ? 'Não foi possível salvar' : 'outra sessão')
  await page.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(page.getByLabel('Limite em edição', { exact: true })).toHaveValue('8')
  await expect(page.getByText('10 kWh por aplicação/mês', { exact: true })).toBeVisible()
})

test('prévia pública combina avisos na aplicação e mantém estados distintos', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/methodology')
  const row = page.getByRole('row').filter({ hasText: 'app-checkout' })
  await expect(row).toContainText('3 avisos')
  await expect(row).toContainText('Energia: 9,4 > 8 kWh')
  await expect(row).toContainText('CO₂e: 1,8 > 1,5 kg')
  await expect(row).toContainText('Cobertura: 79% < 85%')
  await page.getByRole('switch', { name: 'Destacar e avisar quando ultrapassar' }).click()
  await expect(row).toContainText('2 avisos')
  await expect(row).not.toContainText('Energia:')
  await expect(page.getByRole('row').filter({ hasText: 'app-relatorios' })).toContainText('Sem métricas')
  await page.getByRole('button', { name: 'Salvar minhas preferências' }).click()
  await expect(page.getByRole('alert')).toContainText('Entre na sua conta')
})

test('valida cobertura e alterna indicador/tabela/gráfico da prévia de análise', async ({ page }) => {
  await page.goto('/methodology')
  await page.getByRole('tab', { name: names[2], exact: true }).click()
  await page.getByLabel('Referência em edição', { exact: false }).fill('101')
  await expect(page.getByRole('button', { name: 'Salvar minhas preferências' })).toBeDisabled()
  await page.getByRole('button', { name: 'Cancelar alterações' }).click()
  await page.getByRole('tab', { name: names[3], exact: true }).click()
  await expect(page.getByRole('img', { name: /Evolução ilustrativa/ })).toBeVisible()
  await page.getByRole('button', { name: 'Tabela', exact: true }).click()
  await expect(page.getByRole('cell', { name: '20/10', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'CO₂e', exact: true }).click()
  await expect(page.getByRole('columnheader', { name: 'CO₂e (kg CO₂e)' })).toBeVisible()
  await page.getByRole('button', { name: 'Gráfico', exact: true }).click()
  await page.getByLabel('Período em edição').selectOption('30')
  await expect(page.getByRole('heading', { name: 'Evolução do consumo e emissões · 30 dias' })).toBeVisible()
})

for (const viewport of [{ width: 1894, height: 1004 }, { width: 1366, height: 768 }, { width: 2560, height: 1440 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) test(`quatro abas sem overflow em ${viewport.width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize(viewport)
  await page.goto('/methodology')
  const directory = process.env.METHODOLOGY_SCREENSHOT_DIR ?? testInfo.outputPath('screenshots')
  await mkdir(directory, { recursive: true })
  for (const [index, name] of names.entries()) {
    await page.getByRole('tab', { name, exact: true }).click()
    await expect(page.getByRole('tabpanel')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const cards = await page.getByRole('tabpanel').locator('> section').all()
    for (const card of cards) expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await page.screenshot({ path: `${directory}/${viewport.width}-${index + 1}.png`, fullPage: true })
  }
})

test('renova JWT no salvamento sem apagar a edição nem perder a resposta salva', async ({ page }) => {
  await mockPreferences(page)
  let attempts = 0
  await page.route('**/api/me/preferences/energy', async (route) => {
    attempts++
    if (attempts === 1) return route.fulfill({ status: 401, json: { code: 'INVALID_ACCESS_TOKEN' } })
    expect(route.request().headers().authorization).toBe('Bearer renewed-access')
    const input = route.request().postDataJSON() as { value: unknown }
    return route.fulfill({ json: { revision: 2, updatedAt: '2026-10-28T13:00:00Z', value: input.value } })
  })
  await page.route('**/api/auth/sessions/refresh', (route) => route.fulfill({ json: { accessToken: 'renewed-access', refreshToken: 'renewed-refresh', tokenType: 'Bearer', expiresIn: 900 } }))
  await signIn(page)
  await page.getByLabel('Limite em edição', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Salvar minhas preferências' }).click()
  await expect(page.getByText('8 kWh por aplicação/mês', { exact: true })).toBeVisible()
  await expect(page.getByText('Preferências salvas', { exact: true })).toBeVisible()
  expect(attempts).toBe(2)
})

test('não apresenta preferência ativa quando a resposta tem unidade inválida e permite tentar novamente', async ({ page }) => {
  let invalid = true
  await page.route('**/api/me/preferences', (route) => {
    const preferences = initial()
    if (invalid) preferences.energy.value.unit = 'W'
    return route.fulfill({ json: preferences })
  })
  await signIn(page)
  await expect(page.getByText('Preferência indisponível', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Limite em edição', { exact: true })).toBeDisabled()
  await expect(page.getByText('10 kWh por aplicação/mês', { exact: true })).toHaveCount(0)
  invalid = false
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByLabel('Limite em edição', { exact: true })).toHaveValue('10')
})

test('resposta de salvamento inválida mantém valor ativo e alterações', async ({ page }) => {
  await mockPreferences(page)
  await page.route('**/api/me/preferences/energy', (route) => route.fulfill({ json: { revision: 0, updatedAt: 'invalid', value: energy } }))
  await signIn(page)
  await page.getByLabel('Limite em edição', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Salvar minhas preferências' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar')
  await expect(page.getByText('10 kWh por aplicação/mês', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Limite em edição', { exact: true })).toHaveValue('8')
})

test('padrões salvos preenchem a análise e respeitam filtros explícitos da URL', async ({ page }) => {
  await mockPreferences(page)
  await signIn(page)
  await mockCatalog(page, [application()])
  await page.getByRole('link', { name: 'Aplicações', exact: true }).click()
  await page.getByRole('link', { name: 'Ver detalhes', exact: true }).click()
  await expect(page).toHaveURL((url) => url.searchParams.get('period') === '30d' && url.searchParams.get('granularity') === 'day')
  await page.getByRole('link', { name: 'Aplicações', exact: true }).first().click()
  await page.evaluate(() => { history.pushState({}, '', '/services/svc-0142?period=7d&granularity=hour'); window.dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page).toHaveURL((url) => url.searchParams.get('period') === '7d' && url.searchParams.get('granularity') === 'hour')
})

test('as quatro abas têm textos traduzidos nos doze idiomas', async ({ page }) => {
  const titles: Record<string, string> = { 'pt-BR': 'Metodologia e minhas preferências', 'en-US': 'Methodology and my preferences', 'es-ES': 'Metodología y mis preferencias', 'fr-FR': 'Méthodologie et mes préférences', 'de-DE': 'Methodik und meine Einstellungen', 'it-IT': 'Metodologia e le mie preferenze', 'ja-JP': '計算方法と個人設定', 'zh-CN': '计算方法与我的偏好设置', 'ko-KR': '계산 방법과 내 환경설정', 'ru-RU': 'Методология и мои настройки', 'hi-IN': 'कार्यप्रणाली और मेरी प्राथमिकताएँ', 'id-ID': 'Metodologi dan preferensi saya' }
  await page.goto('/methodology')
  for (const [locale, title] of Object.entries(titles)) {
    await page.locator('select').filter({ has: page.locator('option[value="en-US"]') }).selectOption(locale)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click()
      await expect(page.getByRole('main')).not.toContainText(/\bpreferences\.[a-zA-Z]/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
})

test('captura edição e diálogo nas referências atuais', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1894, height: 1004 })
  await mockPreferences(page)
  await signIn(page)
  const directory = process.env.METHODOLOGY_SCREENSHOT_DIR ?? testInfo.outputPath('screenshots')
  await mkdir(directory, { recursive: true })
  for (const [index, name] of names.entries()) {
    await page.getByRole('tab', { name, exact: true }).click()
    if (index < 2) await page.getByLabel('Limite em edição', { exact: true }).fill(index === 0 ? '8' : '1.5')
    else if (index === 2) await page.getByLabel('Referência em edição', { exact: false }).fill('85')
    else { await page.getByLabel('Período em edição').selectOption('7'); await page.getByLabel('Granularidade em edição').selectOption('hour') }
    await page.getByRole('heading', { level: 1 }).click()
    await page.screenshot({ path: `${directory}/1894-edicao-${index + 1}.png`, fullPage: true })
    if (index === 0) {
      await page.getByRole('tab', { name: names[2], exact: true }).click()
      await page.screenshot({ path: `${directory}/1894-modal.png` })
      await page.getByRole('button', { name: 'Continuar editando' }).click()
    }
    await page.getByRole('button', { name: 'Cancelar alterações' }).click()
  }
})
