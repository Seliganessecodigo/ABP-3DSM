import { expect, test } from '@playwright/test'
import { application, gate, mockApi, mockCatalog, row } from './support/catalog.ts'

for (const width of [390, 1366]) {
  for (const path of ['/', '/dashboard', '/services/svc-0142', '/services/svc-0142/methodology']) {
    test(`loading uses a status and placeholders at ${width}px on ${path}`, async ({ page }) => {
      const pending = gate()
      await page.setViewportSize({ width, height: 844 })
      await mockCatalog(page, [application()])
      await page.route(/\/analysis\/summary\?/, route => route.fulfill({ status: 503, json: {} }))
      await page.route(url => /^\/(?:api\/)?(?:applications(?:\/[^/]+)?|analysis\/summary)$/.test(url.pathname), async route => {
        await pending.wait
        await route.fallback()
      })
      await page.goto(path)
      try {
        const loading = page.locator('[data-loading-state]').first()
        await expect(loading).toBeVisible()
        await expect(loading).toHaveAttribute('aria-busy', 'true')
        await expect(loading.getByRole('status')).toContainText(/carregando/i)
        await expect(loading.locator('[data-loading-skeleton]')).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        await page.screenshot({ path: test.info().outputPath('loading.png'), fullPage: true })
      } finally { pending.release() }
      await expect(page.locator('[data-loading-state]')).toHaveCount(0)
    })
  }
}

test('environmental loading preserves application and period without showing missing values', async ({ page }) => {
  const pending = gate()
  await mockCatalog(page, [application()])
  await page.setViewportSize({ width: 1366, height: 844 })
  await page.route('**/applications/svc-0142/analysis**', async route => {
    await pending.wait
    await route.fulfill({ status: 503, json: {} })
  })
  await page.goto('/services/svc-0142?period=30d')
  try {
    await expect(page.getByRole('heading', { name: application().name })).toBeVisible()
    await expect(page.getByRole('button', { name: '30 dias', exact: true })).toHaveAttribute('aria-pressed', 'true')
    const loading = page.locator('[data-loading-state="detail"]')
    await expect(loading).toBeVisible()
    await expect(loading.locator('[data-loading-skeleton]')).toBeVisible()
    await expect(loading).not.toContainText(/indisponível|0 kWh|0 gCO2e/i)
    await expect(page.getByRole('button', { name: '30 dias', exact: true })).toHaveAttribute('aria-disabled', 'true')
    await page.screenshot({ path: test.info().outputPath('environmental-loading.png'), fullPage: true })
  } finally { pending.release() }
  await expect(page.locator('[data-loading-state]')).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Impacto ambiental', exact: true })).toContainText('Indisponível')
})

test('refresh preserves visible data and focus and blocks duplicate keyboard actions', async ({ page }) => {
  const pending = gate()
  let requests = 0
  let refreshing = false
  await mockApi(page, async route => {
    requests += 1
    if (refreshing) await pending.wait
    await route.fulfill({ json: [application()] })
  })
  await page.goto('/')
  await expect(row(page, application().id)).toBeVisible()
  const initialRequests = requests
  refreshing = true
  const refresh = page.getByRole('button', { name: 'Atualizar catálogo' })
  await refresh.click()
  try {
    await expect(refresh).toHaveAttribute('aria-busy', 'true')
    await expect(refresh).toBeFocused()
    await expect(row(page, application().id)).toBeVisible()
    await expect(page.locator('[data-loading-skeleton]')).toHaveCount(0)
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    expect(requests).toBe(initialRequests + 1)
    await expect(page.getByRole('status')).toContainText(/carregando/i)
  } finally { pending.release() }
  await expect(refresh).not.toHaveAttribute('aria-busy', 'true')
  await expect(refresh).toBeFocused()
})

test('loading respects reduced motion preferences', async ({ page }) => {
  const pending = gate()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockApi(page, async route => {
    await pending.wait
    await route.fulfill({ json: [] })
  })
  await page.goto('/')
  try {
    const loading = page.locator('[data-loading-state]')
    await expect(loading).toBeVisible()
    const animations = await loading.locator('span').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationName))
    expect(animations.every(name => name === 'none')).toBe(true)
  } finally { pending.release() }
})
