import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url))
const { chromium, expect } = require('@playwright/test')
const base = process.argv[2]
if (!base) throw new Error('Usage: node measure-alert-lookups.mjs http://127.0.0.1:PORT')
const count = 500
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR' })
  await page.addInitScript(count => {
    const profile = { lookups: 0, comparisons: 0 }
    window.alertLookupProfile = profile
    const original = Array.prototype.find
    Array.prototype.find = function(predicate, thisArg) {
      if (this.length === count && this[0]?.evaluations) {
        profile.lookups++
        return original.call(this, (value, index, array) => { profile.comparisons++; return predicate.call(thisArg, value, index, array) })
      }
      return original.call(this, predicate, thisArg)
    }
  }, count)
  const at = '2026-10-02T00:00:00Z'
  const apps = Array.from({ length: count }, (_, index) => ({ id: `app-${String(index).padStart(4, '0')}`, name: `Application ${String(index).padStart(4, '0')}`,
    location: { regionCode: 'BR-SP', country: 'Brasil', region: 'SP', city: null, latitude: -23, longitude: -46 },
    state: 'AVAILABLE', reason: 'METRICS_VALID', lastObservationAt: at, lastCheckedAt: at, firstSeenAt: at, updatedAt: at, removedAt: null, isStale: false, isCalculable: true }))
  const period = { kind: 'custom', from: '2026-10-01T00:00:00Z', to: at }
  await page.route('**/api/applications**', route => route.fulfill({ json: apps }))
  await page.route('**/api/analysis/summary?*', route => route.fulfill({ status: 503, json: {} }))
  await page.route('**/api/me/preferences', route => route.fulfill({ json: { energy: null, emissions: null, coverage: null, analysis: null } }))
  await page.route('**/api/me/preferences/alerts', route => route.fulfill({ json: { configured: true, evaluatedAt: at, applications: apps.map(app => ({ applicationId: app.id, name: app.name,
    evaluations: [{ metric: 'energy', status: 'exceeded', value: 12, threshold: 10, unit: 'kWh', coveragePercent: 50, period, from: period.from, to: at }] })) } }))
  await page.route('**/api/auth/login', route => route.fulfill({ json: { accessToken: 'fixture-token', refreshToken: 'fixture-refresh', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/me', route => route.fulfill({ json: { id: 'analyst', organizationId: 'org', name: 'Fixture', email: 'fixture@example.test', role: 'ANALYST' } }))
  await page.goto(`${base}/login`)
  await page.locator('input[name=email]').fill('fixture@example.test')
  await page.locator('input[name=password]').fill('fixture-password')
  await page.locator('form button[type=submit]').click()
  await expect(page).toHaveURL(url => url.pathname === '/')
  await page.locator('.sidebar a[href="/applications"]').click()
  await expect(page.locator('[data-catalog-row-id]').first()).toContainText('Limite ultrapassado')
  await page.evaluate(() => { window.alertLookupProfile.lookups = 0; window.alertLookupProfile.comparisons = 0 })
  await page.locator('select:has(option[value="all"])').first().selectOption('all')
  await expect(page.locator('[data-catalog-row-id]')).toHaveCount(count)
  await expect(page.locator('[data-catalog-row-id="app-0499"]')).toContainText('Limite ultrapassado')
  console.log(JSON.stringify({ applications: count, rows: await page.locator('[data-catalog-row-id]').count(), ...await page.evaluate(() => window.alertLookupProfile) }))
} finally { await browser.close() }
