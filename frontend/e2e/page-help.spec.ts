import { expect, test, type Page } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'
import { supportedLocales } from '../src/i18n/types.ts'
import { readFileSync } from 'node:fs'

async function mockAnalysis(page: Page) {
  await mockCatalog(page, [application()])
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?\?/, async route => {
    const url = new URL(route.request().url())
    const period = { from: url.searchParams.get('from'), to: url.searchParams.get('to') }
    const common = { status: 'available', applicationId: 'svc-0142', period }
    if (url.pathname.endsWith('/series')) return route.fulfill({ json: { ...common, granularity: url.searchParams.get('granularity'),
      totals: { energy: { value: 4, unit: 'kWh' }, emissions: { value: 430, unit: 'gCO2e' } }, coverage: { energy: 0.96, emissions: 0.96 },
      points: [{ id: 'point-1', bucketStart: period.from, bucketEnd: period.to, period, energy: { value: 4, unit: 'kWh', reasons: [] }, emissions: { value: 430, unit: 'gCO2e', reasons: [] }, coverage: { energy: 0.96, emissions: 0.96 } }], events: [] } })
    await route.fulfill({ json: { ...common, energy: { value: 4, unit: 'kWh', reasons: [] },
      emissions: { value: 430, unit: 'gCO2e', reasons: [] }, coverage: { energy: 0.96, emissions: 0.96 },
      provenance: { methodologies: [], factors: [], reasons: [] } } })
  })
}

test('catalog opens the selected application history and keeps Applications active', async ({ page }) => {
  await mockCatalog(page, [application(), application({ id: 'other-app', name: 'Outra aplicação' })])
  await page.goto('/')
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  await expect(navigation.getByRole('link', { name: 'Histórico', exact: true })).toHaveCount(0)
  await page.locator('[data-catalog-row-id="other-app"]').getByRole('link', { name: 'Histórico', exact: true }).click()
  await expect(page).toHaveURL(/\/history\?applicationId=other-app/)
  await expect(page.getByRole('combobox', { name: 'Aplicação', exact: true })).toHaveValue('other-app')
  await expect(navigation.getByRole('link', { name: 'Aplicações', exact: true })).toHaveAttribute('aria-current', 'page')
})

for (const width of [1366, 390]) {
  test(`help can advance, go back, close, restart and keep keyboard focus at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 })
    await mockCatalog(page, [application()])
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Ajuda desta tela', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Passo 1 de 3')
    await expect(dialog.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled()
    await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(dialog).toContainText('Passo 2 de 3')
    await expect(page.locator('[data-help="catalog-filters"]')).toHaveCSS('outline-width', '3px')
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
    await dialog.getByRole('button', { name: 'Anterior', exact: true }).click()
    await expect(dialog).toContainText('Passo 1 de 3')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(dialog).toContainText('Passo 1 de 3')
    await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
    await dialog.getByRole('button', { name: 'Próximo', exact: true }).click()
    await expect(dialog).toContainText('Use Detalhes')
    await page.screenshot({ path: testInfo.outputPath('help.png'), fullPage: true })
    await dialog.getByRole('button', { name: 'Concluir', exact: true }).click()
    await expect(trigger).toBeFocused()
    await expect(page.locator('[data-help="catalog-filters"]')).toHaveCSS('outline-style', 'none')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const path of ['/dashboard', '/services/svc-0142', '/history?applicationId=svc-0142', '/history', '/methodology', '/administration/calculations', '/login', '/administration/users']) {
  test(`help is available on ${path}`, async ({ page }) => {
    await mockAnalysis(page)
    await page.goto(path)
    await page.getByRole('button', { name: 'Ajuda desta tela', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading')).not.toBeEmpty()
    await expect(dialog.locator('p')).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Fechar ajuda', exact: true }).click()
    await expect(dialog).toBeHidden()
  })
}

for (const locale of supportedLocales) {
  test(`help controls and content are translated in ${locale}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('greener:locale', value), locale)
    await mockCatalog(page, [application()])
    await page.goto('/')
    const common: Record<string, string> = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
    await page.getByRole('button', { name: common['help.open'], exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: common['help.next'], exact: true }).click()
    await dialog.getByRole('button', { name: common['help.next'], exact: true }).click()
    await expect(dialog.locator('p')).not.toBeEmpty()
    await expect(dialog).not.toContainText('helpActions')
    await dialog.getByRole('button', { name: common['help.finish'], exact: true }).click()
    await expect(dialog).toBeHidden()
  })
}

for (const width of [1366, 996, 390]) {
  test(`history actions and cards share their row height at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 996 ? 619 : 844 })
    await mockAnalysis(page)
    await page.goto('/history?applicationId=svc-0142&period=7d')
    const details = page.getByRole('link', { name: 'Ver detalhes da aplicação', exact: true })
    const preview = page.getByRole('link', { name: 'Prévia de recálculo', exact: true })
    await expect(details).toBeVisible()
    const actions = await Promise.all([details.boundingBox(), preview.boundingBox()])
    if (width > 900) expect(Math.abs(actions[0]!.y - actions[1]!.y)).toBeLessThanOrEqual(1)
    await expect(page.getByRole('group', { name: 'Energia', exact: true })).toContainText('4 kWh')
    await expect(page.getByRole('figure').first()).toBeVisible()
    const cards = await Promise.all(['Energia', 'CO₂e', 'Cobertura', 'Contexto do cálculo'].map(name => page.getByRole('group', { name, exact: true }).boundingBox()))
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
      if (Math.abs(cards[i]!.y - cards[j]!.y) <= 1) expect(Math.abs(cards[i]!.height - cards[j]!.height)).toBeLessThanOrEqual(1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('history.png'), fullPage: true })
  })
}
