import { expect, test, type Page } from '@playwright/test'
import { application, mixedCatalog, mockCatalog } from './support/catalog.ts'
import { collectionResponse } from './support/collection.ts'

const viewports = [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
]

async function mockEnvironmentalData(page: Page) {
  await mockCatalog(page, mixedCatalog)
  await page.route('**/applications/svc-0142/collections/latest', route => route.fulfill({ json: collectionResponse() }))
  await page.route(/\/analysis\/summary\?/, route => {
    const url = new URL(route.request().url())
    const energy = { value: 2, unit: 'kWh', reasons: [] }
    const emissions = { value: 340, unit: 'gCO2e', reasons: [] }
    return route.fulfill({ json: { status: 'available',
      period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      dataAsOf: '2026-10-17T20:00:00.000Z', totals: { energy, emissions },
      coverage: { energy: 1, emissions: 1 }, states: { AVAILABLE: 1, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 },
      applications: [{ applicationId: application().id, name: application().name, state: 'AVAILABLE', energy, emissions, coverage: { energy: 1, emissions: 1 } }],
      provenance: { methodologies: [], factors: [], reasons: [] },
    } })
  })
  await page.route('**/applications/svc-0142/analysis**', route => {
    const url = new URL(route.request().url())
    const from = url.searchParams.get('from')!
    const to = url.searchParams.get('to')!
    const energy = { value: 2, unit: 'kWh', reasons: [] }
    const emissions = { value: 340, unit: 'gCO2e', reasons: [] }
    const common = { status: 'available', applicationId: application().id, period: { from, to }, coverage: { energy: 1, emissions: 1 } }
    return route.fulfill({ json: url.pathname.endsWith('/series')
      ? { ...common, granularity: 'day', totals: { energy, emissions }, events: [],
        points: Array.from({ length: 7 }, (_, i) => {
          const bucketStart = new Date(Date.parse(from) + (Date.parse(to) - Date.parse(from)) * i / 7).toISOString()
          const bucketEnd = new Date(Date.parse(from) + (Date.parse(to) - Date.parse(from)) * (i + 1) / 7).toISOString()
          return { id: `point-${i}`, bucketStart, bucketEnd, period: { from: bucketStart, to: bucketEnd },
            energy: { ...energy, value: i + 1 }, emissions: { ...emissions, value: 340 + i }, coverage: { energy: 1, emissions: 1 } }
        }) }
      : { ...common, energy, emissions, provenance: { methodologies: [], factors: [], reasons: [] } } })
  })
}

test('long application names stay inside mobile cards and breadcrumbs', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  const longName = 'aplicacao-de-processamento-de-pagamentos-internacionais'
  await mockEnvironmentalData(page)
  await mockCatalog(page, [application({ name: longName })])
  for (const path of ['/', '/services/svc-0142', '/services/svc-0142/methodology']) {
    await page.goto(path)
    await expect(page.getByRole('main')).toContainText(longName)
    const overflow = await page.getByRole('main').evaluate(main => ({
      main: main.scrollWidth - main.clientWidth,
      page: document.documentElement.scrollWidth - window.innerWidth,
    }))
    expect(overflow.main).toBeLessThanOrEqual(1)
    expect(overflow.page).toBeLessThanOrEqual(1)
  }
})

for (const viewport of viewports) {
  for (const path of ['/', '/dashboard', '/services/svc-0142', '/services/svc-0142/methodology']) {
    test(`${path} distributes content within ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await mockEnvironmentalData(page)
      await page.goto(path)
      await expect(page.getByRole('main').getByRole('heading').first()).toBeVisible()
      if (path === '/services/svc-0142') await expect(page.getByRole('heading', { name: application().name })).toBeVisible()
      if (path === '/dashboard') await expect(page.getByRole('region', { name: 'Indicadores ambientais' })).toBeVisible()
      if (path === '/services/svc-0142') await expect(page.getByRole('figure').first()).toBeVisible()
      const bounds = await page.getByRole('main').evaluate(main => {
        const rect = main.getBoundingClientRect()
        const workspace = main.parentElement!.getBoundingClientRect()
        return { left: rect.left - workspace.left, right: workspace.right - rect.right, width: rect.width,
          workspaceWidth: workspace.width, overflow: document.documentElement.scrollWidth - window.innerWidth }
      })
      expect(bounds.overflow).toBeLessThanOrEqual(1)
      expect(bounds.width).toBeGreaterThanOrEqual(bounds.workspaceWidth - 1)
      expect(Math.abs(bounds.left - bounds.right)).toBeLessThanOrEqual(1)
      const overflowingCards = await page.getByRole('main').evaluate(main => Array.from(main.querySelectorAll<HTMLElement>('*'))
        .filter(element => element.checkVisibility() && Number.parseFloat(getComputedStyle(element).borderTopWidth) > 0 && getComputedStyle(element).overflowX === 'visible' && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1)
        .map(element => ({ tag: element.tagName, className: element.className, width: element.clientWidth, scrollWidth: element.scrollWidth })))
      expect(overflowingCards).toEqual([])
      if (path === '/services/svc-0142' && viewport.width >= 1366) {
        const workspace = await page.locator('.workspace').evaluate(element => ({ height: element.clientHeight, scrollHeight: element.scrollHeight }))
        expect(workspace.scrollHeight).toBeLessThanOrEqual(workspace.height + 1)
        if (viewport.height >= 1080) {
          const chart = await page.getByRole('figure').first().boundingBox()
          expect(chart!.height).toBeGreaterThan(viewport.height / 3)
          const point = page.getByRole('figure').first().getByRole('button').first()
          await point.hover()
          const tooltip = page.getByRole('status')
          await expect(tooltip).toContainText('Atual:')
          expect((await tooltip.boundingBox())!.width).toBeLessThanOrEqual(180)
          await point.focus()
          await expect(tooltip).toBeVisible()
        }
      }
      await page.screenshot({ path: test.info().outputPath('page.png'), fullPage: true })
    })
  }
}
