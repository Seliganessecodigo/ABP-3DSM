import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

for (const width of [1440, 390]) {
  test(`application analysis actions preserve context and keep ranking disabled at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 })
    await mockCatalog(page, [application(), application({ id: 'svc-other', name: 'app-estoque' })])
    await page.route(/\/carbon\/regions(?:\?.*)?$/, route => route.fulfill({ status: 503, json: {} }))
    const catalog = '/applications?period=30d&granularity=hour&q=app&state=AVAILABLE'
    await page.goto(catalog)
    const row = width > 640
      ? page.locator('[data-catalog-row-id="svc-0142"]')
      : page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'app-pagamentos', exact: true }) })
    const actions = row.locator('[data-help="application-actions"]')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(actions.getByRole('link', { name: 'Comparação', exact: true })).toHaveCSS('transition-duration', '0s')
    await expect(actions.getByRole('button', { name: 'Ranking', exact: true })).toBeDisabled()
    await expect(actions.getByRole('link', { name: 'Comparação', exact: true }).locator('svg')).toHaveAttribute('data-icon', 'arrow-right-arrow-left')
    await expect(actions.getByRole('link', { name: 'Simulação regional', exact: true }).locator('svg')).toHaveAttribute('data-icon', 'earth-americas')
    await actions.getByRole('link', { name: 'Comparação', exact: true }).click()
    expect(new URL(page.url()).searchParams.getAll('applicationIds')).toEqual(['svc-0142'])
    expect(new URL(page.url()).searchParams.get('period')).toBe('30d')
    expect(new URL(page.url()).searchParams.get('q')).toBeNull()
    await expect(page.getByRole('checkbox', { name: /app-pagamentos/ })).toBeChecked()
    await page.goto(catalog)
    await actions.getByRole('link', { name: 'Simulação regional', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Aplicação', exact: true })).toHaveText('app-pagamentos')
    expect(new URL(page.url()).searchParams.get('applicationId')).toBe('svc-0142')
    expect(new URL(page.url()).searchParams.get('period')).toBe('30d')
    expect(new URL(page.url()).searchParams.get('granularity')).toBeNull()
    await page.goto(catalog)
    await expect(actions.getByRole('link', { name: 'Comparação', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`application-actions-${width}.png`), fullPage: true })
  })
}
