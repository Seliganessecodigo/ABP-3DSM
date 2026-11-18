import { expect, test } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

test('catalog and comparison share neutral, ascending and descending sort indicators', async ({ page }) => {
  await mockCatalog(page, [application()])
  for (const path of ['/applications', '/comparison']) {
    await page.goto(path)
    const country = page.getByRole('columnheader', { name: 'País', exact: true })
    await expect(country).toHaveAttribute('aria-sort', 'none')
    await expect(country.locator('[data-sort-state]')).toHaveText('↕')
    const control = country.getByRole('button')
    await control.focus()
    await page.keyboard.press('Enter')
    await expect(country).toHaveAttribute('aria-sort', 'ascending')
    await expect(country.locator('[data-sort-state]')).toHaveText('↑')
    await page.keyboard.press('Enter')
    await expect(country).toHaveAttribute('aria-sort', 'descending')
    await expect(country.locator('[data-sort-state]')).toHaveText('↓')
    await expect(country.locator('[data-sort-state]')).toHaveAttribute('aria-hidden', 'true')
  }
})

test('breadcrumbs preserve catalog context when opening and returning from application details', async ({ page }) => {
  await mockCatalog(page, [application()])
  await page.route(/\/applications\/svc-0142\/analysis(?:\/.*)?(?:\?.*)?$/, route => route.fulfill({ status: 503, json: {} }))
  await page.goto('/applications?q=app&period=30d')
  const trail = page.getByRole('navigation', { name: 'Trilha de navegação', exact: true })
  await expect(trail.locator('[aria-current="page"]')).toHaveText('Aplicações')
  await expect(trail.getByRole('link', { name: 'Ir para Dashboard', exact: true })).toHaveAttribute('href', '/dashboard?period=30d')
  await page.locator('tr[data-catalog-row-id="svc-0142"]').getByRole('link', { name: 'Ver detalhes', exact: true }).click()
  await expect(trail.locator('[aria-current="page"]')).toHaveText('app-pagamentos')
  const parent = trail.getByRole('link').filter({ hasText: 'Aplicações' })
  await expect(parent).toHaveAttribute('href', /q=app/)
  await expect(parent).toHaveAttribute('href', /period=30d/)
  await parent.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('searchbox', { name: /buscar/i })).toHaveValue('app')
  expect(new URL(page.url()).searchParams.get('period')).toBe('30d')
})

for (const width of [390, 1440]) {
  test(`product pages use one breadcrumb landmark and contain their content at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 960 })
    await mockCatalog(page, [application()])
    await page.route(/\/carbon\/regions(?:\?.*)?$/, route => route.fulfill({ status: 503, json: {} }))
    for (const path of ['/applications', '/comparison', '/history', '/methodology', '/regional-simulation', '/settings']) {
      await page.goto(path)
      const trail = page.getByRole('navigation', { name: 'Trilha de navegação', exact: true })
      await expect(trail).toHaveCount(1)
      await expect(trail).toBeVisible()
      await expect(trail.locator('[aria-current="page"]')).toHaveCount(1)
      await expect(trail.getByRole('link', { name: 'Ir para Dashboard', exact: true }), path).toHaveAttribute('href', path === '/comparison' ? '/dashboard?period=7d' : '/dashboard')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      if (path === '/methodology') await page.screenshot({ path: testInfo.outputPath(`methodology-${width}.png`), fullPage: true })
    }
  })
}
