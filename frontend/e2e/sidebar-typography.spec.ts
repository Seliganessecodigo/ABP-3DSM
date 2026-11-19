import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'
import { mockPreferenceEffects } from './support/preferences.ts'

for (const width of [1366, 1920]) {
  test(`metodologia preserva a tipografia da sidebar em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockCatalog(page, [application()])
    await mockPreferenceEffects(page)
    await page.goto('/applications')
    const ranking = page.locator('.sidebar').getByRole('link', { name: 'Ranking', exact: true })
    const typography = () => ranking.evaluate(element => {
      const style = getComputedStyle(element)
      return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize }
  })
  const before = await typography()
  await page.locator('.sidebar').getByRole('link', { name: 'Metodologia', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Metodologia e minhas preferências')
  expect(await typography()).toEqual(before)
  if (width == 1920) await page.screenshot({ path: test.info().outputPath("sidebar-metodologia-1920.png"), fullPage: true })
  await page.locator('.sidebar').getByRole('link', { name: 'Aplicações', exact: true }).click()
  expect(await typography()).toEqual(before)
  })
}
