import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'

const evidence = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../.github/evidencias/qa-energia-emissoes/backend-evidence.json'), 'utf8'))

for (const width of [390, 1440]) {
  test(`CT-023/024 unidades e metodologia registradas em ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const ui = evidence.captures.ui
    await mockCatalog(page, [ui.application, { ...ui.application, id: 'quality-worker', name: 'Quality worker' }])
    await page.route('**/applications/quality-api/collections/**', route => route.fulfill({ json: ui.collection }))
    await page.route(/\/applications\/quality-api\/analysis(?:\?.*)?$/, route => route.fulfill({ json: ui.detail }))
    await page.route(/\/analysis\/comparison(?:\?.*)?$/, route => route.fulfill({ json: ui.comparison }))
    for (const locale of ['pt-BR', 'en-US']) {
      await page.addInitScript(value => localStorage.setItem('greener:locale', value), locale)
      await page.goto(`/services/quality-api/methodology?collectionId=${ui.collection.id}`)
      const main = page.getByRole('main')
      await expect(main).toContainText('2 kWh')
      await expect(main).toContainText('200 gCO₂e')
      await expect(main).toContainText('100 gCO2e/kWh')
      await expect(main).toContainText('averagePowerW = cpuPercent / 100')
      await expect(main).toContainText('emissionsKilogramsCo2e = emissionsGramsCo2e / 1000')
      await expect(main).not.toContainText('NaN')
      await expect(main).not.toContainText('Infinity')
      await page.screenshot({ path: testInfo.outputPath(`ct023-metodologia-${locale}-${width}.png`), fullPage: true })
      const params = new URLSearchParams({ period: 'custom', from: ui.comparison.period.from, to: ui.comparison.period.to })
      params.append('applicationIds', 'quality-api')
      params.append('applicationIds', 'quality-worker')
      await page.goto(`/comparison?${params}`)
      const emissions = page.locator('[data-help="comparison-emissions"]:visible')
      await expect(emissions).toContainText(locale === 'pt-BR' ? '0,2 kgCO₂e' : '0.2 kgCO₂e')
      await page.screenshot({ path: testInfo.outputPath(`ct024-emissoes-${locale}-${width}.png`), fullPage: true })
    }
  })
}
