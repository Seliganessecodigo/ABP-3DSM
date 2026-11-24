import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

const region = { code: 'US-VA', country: 'United States', region: 'Virginia', city: null, latitude: 38.9, longitude: -77.04, intensity: 80, unit: 'gCO2e/kWh', renewableSharePercent: 42 }

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`regional simulation returns dialog focus at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await mockCatalog(page, [application(), application({ id: 'svc-0121', name: 'app-checkout' })])
    await page.route('**/api/carbon/regions', route => route.fulfill({ json: { regions: [region], total: 1 } }))
    await page.goto('/regional-simulation?applicationId=svc-0142&destinationRegionCode=US-VA&period=24h')
    const applicationButton = page.getByRole('button', { name: 'Aplicação', exact: true })
    await applicationButton.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).focus()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(applicationButton).toBeFocused()
    await page.screenshot({ path: testInfo.outputPath('escape-focus.png'), fullPage: true })

    await applicationButton.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click()
    await expect(applicationButton).toBeFocused()
    await applicationButton.click()
    await page.getByRole('dialog').getByRole('button', { name: /app-checkout/ }).click()
    await expect(applicationButton).toBeFocused()
    await expect(applicationButton).toContainText('app-checkout')

    const regionButton = page.getByRole('button', { name: 'Região do cenário', exact: true })
    await regionButton.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(regionButton).toBeFocused()
    await regionButton.click()
    await page.getByRole('dialog').getByRole('button', { name: /US-VA.*Virginia/ }).click()
    await expect(regionButton).toBeFocused()

    const clearButton = page.getByRole('button', { name: 'Limpar cenário', exact: true })
    await clearButton.click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(clearButton).toBeFocused()
    await clearButton.click()
    await page.keyboard.press('Escape')
    await expect(clearButton).toBeFocused()
    await clearButton.click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Limpar cenário', exact: true }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(clearButton).toBeDisabled()
  })
}
