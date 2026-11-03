import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(process.argv[2] ?? resolve(here, '../../frontend'))
const require = createRequire(resolve(appRoot, 'package.json'))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 980 }, locale: 'pt-BR', colorScheme: 'light', deviceScaleFactor: 1 })
  await page.addInitScript(() => localStorage.setItem('greener-theme', 'light'))
  const now = '2026-11-03T15:00:00.000Z'
  await page.clock.setFixedTime(new Date(now))
  const applications = [
    ['svc-0142', 'app-pagamentos', 'AVAILABLE', 'METRICS_VALID'],
    ['svc-0121', 'app-checkout', 'AVAILABLE', 'METRICS_VALID'],
    ['svc-0487', 'app-estoque', 'UNAVAILABLE', 'SOURCE_TIMEOUT'],
    ['svc-0900', 'app-relatorios', 'NO_METRICS', 'METRICS_MISSING'],
  ].map(([id, name, state, reason]) => ({ id, name, state, reason,
    location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: 'São Paulo', latitude: -23.55, longitude: -46.63 },
    lastObservationAt: state === 'AVAILABLE' ? now : null,
    isStale: false, isCalculable: state === 'AVAILABLE', firstSeenAt: now,
    lastCheckedAt: now, removedAt: null, updatedAt: now,
  }))
  await page.route(/\/applications(?:\?.*)?$/, async route => {
    if (route.request().isNavigationRequest()) return route.continue()
    await route.fulfill({ json: applications })
  })
  await page.goto(process.argv[3] ?? 'http://127.0.0.1:4187')
  await page.getByText('app-pagamentos', { exact: true }).first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.getByRole('alert').count(), 0, 'Capture must not contain integration errors')
  await page.screenshot({ path: resolve(here, 'assets/catalog.png') })
  console.log('Captured actual catalog UI with explicitly illustrative test data.')
} finally { await browser.close() }
