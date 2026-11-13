import { expect, test, type Locator, type Page } from '@playwright/test'
import { supportedLocales } from '../src/i18n/types.ts'
import { application, mockCatalog } from './support/catalog.ts'

async function mockDashboard(page: Page) {
  await mockCatalog(page, [application()])
  await page.route(/\/analysis\/summary(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ json: {
      status: 'available', period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      dataAsOf: '2026-10-08T12:00:00.000Z',
      totals: { energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 85, unit: 'gCO2e', reasons: [] } },
      coverage: { energy: 1, emissions: 1 }, states: { AVAILABLE: 1, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 },
      applications: [{ applicationId: 'svc-0142', name: 'app-pagamentos', state: 'AVAILABLE',
        energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 85, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 1, emissions: 1 } }],
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
}

async function expectFields(fields: Locator, height: number, fontSize = 13) {
  expect(await fields.count()).toBeGreaterThan(0)
  for (const field of await fields.all()) {
    await expect(field).toHaveCSS('height', `${height}px`)
    await expect(field).toHaveCSS('border-radius', '8px')
    await expect(field).toHaveCSS('font-size', `${fontSize}px`)
    await expect(field).not.toHaveCSS('font-family', 'Arial')
  }
}

for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`form controls keep their density across pages at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((value) => localStorage.setItem('greener-theme', value), theme)
      await mockDashboard(page)
      await page.goto('/dashboard')
      await expect(page.getByLabel('Região histórica')).toBeEnabled()
      await expectFields(page.getByLabel('Região histórica').or(page.getByLabel('Estado atual')), 44)
      await expect(page.getByRole('button', { name: '7 dias', exact: true })).toHaveCSS('height', '44px')
      await expectFields(page.getByRole('searchbox'), 44)
      await expectFields(page.getByLabel('Itens por página'), width <= 640 ? 44 : 36, 12)
      await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true })
      await page.locator('button[aria-controls="dashboard-table-filters"]').click()
      await expectFields(page.locator('#dashboard-table-filters input:not([type="checkbox"]), #dashboard-table-filters select'), 44)

      await page.goto('/')
      await expectFields(page.getByLabel('Itens por página'), width <= 640 ? 44 : 36, 12)
      await page.getByRole('button', { name: /filtros/i }).click()
      const dialog = page.getByRole('dialog')
      await expectFields(dialog.locator('input:not([type="checkbox"]), select'), 44)
      const firstField = dialog.locator('input').first()
      await firstField.focus()
      await expect(firstField).toHaveCSS('outline-width', '3px')
      await page.screenshot({ path: testInfo.outputPath('catalog-filters.png') })

      await page.goto('/history')
      await expectFields(page.getByRole('main').getByRole('combobox'), 44)
      await page.goto('/methodology')
      await expectFields(page.getByRole('main').getByRole('combobox'), 50, 17)
      await page.goto('/login')
      await expectFields(page.getByRole('main').locator('input'), 50, 17)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
}

for (const locale of supportedLocales) {
  test(`dashboard controls retain their geometry in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript((value) => localStorage.setItem('greener:locale', value), locale)
    await mockDashboard(page)
    await page.goto('/dashboard')
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    const summaryFilters = page.locator('main select[aria-label]')
    await expectFields(summaryFilters, 44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), locale).toBe(true)
  })
}
