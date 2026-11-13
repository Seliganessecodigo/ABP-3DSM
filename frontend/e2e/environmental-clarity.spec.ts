import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

for (const { width, height } of [{ width: 1440, height: 900 }, { width: 1280, height: 650 }, { width: 390, height: 900 }]) {
for (const partial of [false, true]) {
  test(`shows the numeric equivalent factor with ${partial ? 'partial' : 'full'} emissions coverage at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await page.clock.install({ time: new Date('2026-10-08T12:00:00.000Z') })
    await mockCatalog(page, [application()])
    await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?\?/, async (route) => {
      const url = new URL(route.request().url())
      const period = { from: url.searchParams.get('from'), to: url.searchParams.get('to') }
      if (url.pathname.endsWith('/series')) return route.fulfill({ json: { status: 'empty', applicationId: 'svc-0142', period, granularity: 'hour', points: [], events: [] } })
      await route.fulfill({ json: {
        status: 'available', applicationId: 'svc-0142', period,
        energy: { value: partial ? 10 : 4, unit: 'kWh', reasons: [] },
        emissions: { value: 430, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 1, emissions: partial ? 0.5 : 1 },
        calculation: { energyKwh: 4, intensity: 107.5 },
        provenance: { methodologies: [], reasons: [], factors: [85, 115].map((intensity) => ({
          contractVersion: '1', regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null, intensity,
          unit: 'gCO2e/kWh', version: `saved-${intensity}`, source: 'Saved source', validFrom: null, validUntil: null,
          queriedAt: { from: period.from, to: period.to },
        })) },
      } })
    })
    await page.goto('/services/svc-0142?period=7d')
    const card = page.getByRole('group', { name: 'Fator equivalente', exact: true })
    await expect(card).toContainText('107,5 gCO2e/kWh')
    const energy = page.getByRole('region', { name: 'Impacto ambiental', exact: true }).getByRole('group', { name: 'Energia', exact: true })
    const cardHeights = await Promise.all([energy, card].map((element) => element.evaluate((node) => node.getBoundingClientRect().height)))
    expect(Math.abs(cardHeights[0] - cardHeights[1])).toBeLessThanOrEqual(1)
    await expect(card.locator('details')).toHaveCount(0)
    const formula = page.getByRole('region', { name: 'Como este número foi calculado' }).locator(':scope > div')
    await expect(formula).toContainText('4 kWh')
    await expect(formula).toContainText('430 gCO2e')
    await expect(formula).not.toContainText('10 kWh')
    await page.locator('#analysis-details > summary').click()
    await expect(page.getByRole('region', { name: 'Fatores aplicados' })).toContainText('85 gCO2e/kWh')
    await expect(page.getByRole('region', { name: 'Fatores aplicados' })).toContainText('115 gCO2e/kWh')
    await page.getByRole('button', { name: 'Fechar detalhes' }).click()
    expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await card.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
    const coverage = page.getByRole('group', { name: 'Cobertura', exact: true })
    expect(await coverage.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`factor-${partial ? 'partial' : 'full'}.png`) })
  })
}
}
