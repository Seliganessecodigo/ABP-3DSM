import { expect, test, type Page } from '@playwright/test'
import { application, mockCatalog } from './support/catalog.ts'

type Variant = 'zero' | 'missing' | 'coverage' | 'units'

async function mockComparison(page: Page, variant?: Variant) {
  await page.clock.setFixedTime(new Date('2026-10-17T20:00:00.000Z'))
  const requests: Array<{ from: string; to: string }> = []
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url())
    const from = url.searchParams.get('from')!
    const to = url.searchParams.get('to')!
    requests.push({ from, to })
    const duration = Date.parse(to) - Date.parse(from)
    const currentFrom = duration === 24 * 60 * 60 * 1000 ? '2026-10-16T20:00:00.000Z' : '2026-10-10T20:00:00.000Z'
    const isCurrent = from === currentFrom
    if (url.pathname.endsWith('/series')) {
      const previousValue = variant === 'zero' ? 0 : variant === 'missing' ? null : 2
      const value = isCurrent ? (duration === 24 * 60 * 60 * 1000 ? 4 : 3) : (previousValue ?? null)
      const energyUnit = !isCurrent && variant === 'units' ? 'Wh' : 'kWh'
      const points = value === null ? [] : Array.from({ length: 2 }, (_, index) => {
        const bucketStart = new Date(Date.parse(from) + index * 60 * 60 * 1000).toISOString()
        const bucketEnd = new Date(Date.parse(bucketStart) + 60 * 60 * 1000).toISOString()
        return { bucketStart, bucketEnd, energy: { value, unit: energyUnit, reasons: [] },
          emissions: { value: value * 340, unit: 'gCO2e', reasons: [] }, coverage: { energy: 1, emissions: 1 } }
      })
      await route.fulfill({ json: { status: 'available', applicationId: 'svc-0142', period: { from, to }, granularity: 'hour',
        totals: { energy: { value, unit: energyUnit, reasons: [] }, emissions: { value: value === null ? null : value * 340, unit: 'gCO2e', reasons: [] } },
        coverage: { energy: !isCurrent && variant === 'coverage' ? 0.25 : 0.75, emissions: 0.75 }, points, events: [] } })
      return
    }
    const currentValue = duration === 24 * 60 * 60 * 1000 ? 4 : 3
    await route.fulfill({ json: { status: 'available', applicationId: 'svc-0142', period: { from, to },
      energy: { value: currentValue, unit: 'kWh', reasons: [] }, emissions: { value: currentValue * 340, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.75, emissions: 0.75 },
      provenance: { methodologies: [], factors: [], reasons: [] } } })
  })
  await mockCatalog(page, [application()])
  await page.goto('/history?applicationId=svc-0142&period=7d')
  return requests
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`CT-037 S1–S3: períodos equivalentes e +50% (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const requests = await mockComparison(page)
    const content = page.locator('main')
    await expect(content).toContainText('svc-0142')
    await expect(content).toContainText('Período atual')
    await expect(content).toContainText('Período anterior')
    await expect(content).toContainText('10/10/2026, 17:00 – 17/10/2026, 17:00')
    await expect(content).toContainText('Período anterior: 03/10/2026, 17:00 BRT – 10/10/2026, 17:00 BRT')
    await expect(content).toContainText('+50% (3 kWh / 2 kWh)')
    await page.screenshot({ path: `test-evidence/ct037-s1-s3-${viewport.width}x${viewport.height}.png`, fullPage: true })
    await expect.poll(() => requests.length).toBeGreaterThanOrEqual(3)
    const previous = requests.find((range) => range.from === '2026-10-03T20:00:00.000Z')!
    const current = requests.find((range) => range.from === '2026-10-10T20:00:00.000Z')!
    expect(previous.to).toBe('2026-10-10T20:00:00.000Z')
    expect(current.to).toBe('2026-10-17T20:00:00.000Z')
    expect(previous.to).toBe(current.from)
    expect(Date.parse(previous.to) - Date.parse(previous.from)).toBe(7 * 24 * 60 * 60 * 1000)
    expect(Date.parse(current.to) - Date.parse(current.from)).toBe(7 * 24 * 60 * 60 * 1000)
  })
}

for (const variant of ['zero', 'missing', 'coverage', 'units'] as const) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`CT-037 S4: evita percentual sem base (${variant}, ${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await mockComparison(page, variant)
      const content = page.locator('main')
      await expect(content).toContainText('Não comparável')
      await expect(content).not.toContainText(/\+\d+(?:[,.]\d+)?% \(/)
    })
  }
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`CT-037 S5: atualiza período e métrica sem manter resultados antigos (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const requests = await mockComparison(page)
    const content = page.locator('main')
    await expect(content).toContainText('+50% (3 kWh / 2 kWh)')
    const metricGroup = page.getByRole('group', { name: 'Métrica do gráfico' })
    await metricGroup.getByRole('button', { name: 'CO₂e' }).click()
    await expect(metricGroup.getByRole('button', { name: 'CO₂e' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('figure', { name: /Evolução de CO₂e/ })).toBeVisible()
    await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('24h')
    await expect(content).toContainText('+100% (4 kWh / 2 kWh)')
    await expect(content).not.toContainText('+50% (3 kWh / 2 kWh)')
    await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('7d')
    await expect(content).toContainText('+50% (3 kWh / 2 kWh)')
    expect(requests.some((range) => range.from === '2026-10-15T20:00:00.000Z' && range.to === '2026-10-16T20:00:00.000Z')).toBe(true)
  })
}
