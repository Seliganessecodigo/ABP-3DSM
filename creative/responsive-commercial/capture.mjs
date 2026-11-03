import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(process.argv[2] ?? resolve(here, '../../frontend'))
const require = createRequire(resolve(appRoot, 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
const now = '2026-11-03T15:00:00.000Z'
const applications = ['app-pagamentos', 'app-checkout', 'app-estoque', 'app-relatorios'].map((name, i) => ({
  id: ['svc-0142', 'svc-0121', 'svc-0487', 'svc-0900'][i], name,
  state: 'AVAILABLE', reason: 'METRICS_VALID',
  location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'São Paulo', latitude: -23.55, longitude: -46.63 },
  lastObservationAt: now, isStale: false, isCalculable: true, firstSeenAt: now,
  lastCheckedAt: now, removedAt: null, updatedAt: now,
}))
// Same contract and operational metric examples used in application-detail.spec.ts.
const evidence = { id: 'collection-demo', applicationId: 'svc-0142', intervalStart: '2026-11-03T14:30:00.000Z', intervalEnd: now, collectedAt: now,
  collectionIntervalSeconds: 1800, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID', lastCheckedAt: now,
  metrics: { cpu: { value: 38, unit: '%', status: 'available' }, memory: { value: null, unit: null, status: 'missing' },
    disk: { value: 0, unit: 'GB/s', status: 'available' }, network: { value: 1.2, unit: 'Mbps', status: 'available' } },
}
try {
  for (const mobile of [false, true]) {
    for (const dark of [false, true]) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        deviceScaleFactor: mobile ? 2 : 1, locale: 'pt-BR', colorScheme: dark ? 'dark' : 'light' })
      await page.clock.setFixedTime(new Date(now))
      await page.addInitScript(dark => localStorage.setItem('greener-theme', dark ? 'dark' : 'light'), dark)
      await page.route(/\/api\/applications(?:\/[^/?]+)?(?:\/collections\/[^/?]+)?(?:\?.*)?$/, async route => {
        const path = new URL(route.request().url()).pathname
        await route.fulfill({ json: path.includes('/collections/') ? evidence : path.endsWith('/applications') ? applications : applications[0] })
      })
      for (const detail of [false, true]) {
        if (dark && detail) continue
        await page.goto((process.argv[3] ?? 'http://127.0.0.1:4188') + (detail ? '/services/svc-0142' : '/'))
        if (detail) await page.getByRole('heading', { name: 'app-pagamentos', exact: true }).waitFor()
        else await page.getByText('app-pagamentos', { exact: true }).filter({ visible: true }).first().waitFor()
        await page.evaluate(() => document.fonts.ready)
        assert.equal(await page.getByRole('alert').count(), 0, 'Unexpected API error in capture')
        if (mobile) assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile capture must not overflow horizontally')
        const name = `${mobile ? 'mobile' : 'desktop'}-${detail ? 'detail' : 'catalog'}-${dark ? 'dark' : 'light'}`
        await page.screenshot({ path: resolve(here, `assets/${name}.png`), fullPage: true })
        console.log(`Captured ${name}`)
      }
      await page.close()
    }
  }
} finally { await browser.close() }
