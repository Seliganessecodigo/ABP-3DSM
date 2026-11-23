import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

for (const width of [1440, 390]) {
  test(`application analysis actions preserve context and open the application ranking at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 960 })
    await mockCatalog(page, [application(), application({ id: 'svc-other', name: 'app-estoque' })])
    await page.route(/\/carbon\/regions(?:\?.*)?$/, route => route.fulfill({ status: 503, json: {} }))
    await page.route('**/api/analysis/ranking?*', route => route.fulfill({ status: 503, json: {} }))
    const catalog = '/applications?period=30d&granularity=hour&q=app&state=AVAILABLE'
    await page.goto(catalog)
    const row = width > 640
      ? page.locator('[data-catalog-row-id="svc-0142"]')
      : page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'app-pagamentos', exact: true }) })
    const actions = row.locator('[data-help="application-actions"]')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(actions.getByRole('link', { name: 'Comparação', exact: true })).toHaveCSS('transition-duration', '0s')
    await expect(actions.getByRole('link', { name: 'Ranking', exact: true }).locator('svg')).toHaveAttribute('data-icon', 'ranking-star')
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
    await actions.getByRole('link', { name: 'Ranking', exact: true }).click()
    await expect(page).toHaveURL(url => url.pathname === '/ranking' && url.searchParams.get('filterApplicationId') === 'svc-0142')
    const ranking = new URL(page.url()).searchParams
    expect(ranking.getAll('applicationIds')).toEqual([])
    expect(Date.parse(ranking.get('to')!) - Date.parse(ranking.get('from')!)).toBe(30 * 24 * 60 * 60 * 1000)
    expect(ranking.has('q')).toBe(false)
    await page.goto('/applications?period=custom&from=2026-10-08T00%3A00%3A00Z&to=2026-10-10T00%3A00%3A00Z')
    const customRanking = new URL(await actions.getByRole('link', { name: 'Ranking', exact: true }).getAttribute('href') ?? '', page.url())
    expect(customRanking.searchParams.get('from')).toBe('2026-10-08T00:00:00Z')
    expect(customRanking.searchParams.get('to')).toBe('2026-10-10T00:00:00Z')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`application-actions-${width}.png`), fullPage: true })
  })
}
