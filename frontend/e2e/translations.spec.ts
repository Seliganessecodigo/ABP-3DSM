import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { supportedLocales } from '../src/i18n/types.ts'
import { application, mockCatalog } from './support/catalog.ts'
import { collectionResponse } from './support/collection.ts'

function translations(page: string, locale: string): Record<string, string> {
  return JSON.parse(readFileSync(new URL(`../src/pages/${page}/locales/${locale}.json`, import.meta.url), 'utf8'))
}

for (const locale of supportedLocales) {
  test(`${locale}: páginas, abas e erros usam o idioma escolhido`, async ({ page }) => {
    test.setTimeout(60_000)
    const catalog = translations('catalog', locale)
    const detail = translations('detail', locale)
    const methodology = translations('methodology', locale)
    const login = translations('login', locale)
    const recalculation = translations('recalculationPreview', locale)
    const common: Record<string, string> = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}.json`, import.meta.url), 'utf8'))
    await page.addInitScript(value => localStorage.setItem('greener:locale', value), locale)
    await mockCatalog(page, [application()])
    await page.route('**/applications/svc-0142/collections/latest', route => route.fulfill({ json: collectionResponse() }))
    await page.route('**/applications/svc-0142/analysis**', route => route.fulfill({ status: 503, json: {} }))
    await page.route('**/analysis/summary?*', route => route.fulfill({ status: 503, json: {} }))
    await page.route('**/api/auth/login', route => route.fulfill({ status: 401, json: {} }))

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(catalog.title)
    await expect(page.getByRole('link', { name: common['auth.login'], exact: true })).toBeVisible()
    await page.getByRole('button', { name: catalog.columnFilters, exact: true }).click()
    await expect(page.getByRole('dialog').locator('legend')).toContainText(common['date.lastCheck'])
    await page.getByRole('button', { name: catalog.closeFilters, exact: true }).click()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(translations('dashboard', locale).title)
    await expect(page.getByRole('main')).toContainText(translations('dashboard', locale).error)
    await page.goto('/history', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(detail.historyTitle)
    await page.goto('/services/svc-0142', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('main')).toContainText(detail.analysisError)
    await page.goto('/services/svc-0142/methodology', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(methodology.title)
    await expect(page.getByRole('main')).toContainText(methodology.estimateNotice)
    await page.goto('/methodology', { waitUntil: 'domcontentloaded' })
    for (const tab of ['energy', 'emissions', 'coverage', 'analysis']) {
      await page.getByRole('tab', { name: methodology[`preferences.tabs.${tab}`], exact: true }).click()
      await expect(page.getByRole('tabpanel')).toContainText(methodology[`preferences.${tab}.title`])
    }
    await page.goto('/administration/calculations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(recalculation.title)
    await expect(page.getByRole('button', { name: recalculation.generate, exact: true })).toBeVisible()
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(login.heading)
    if (locale === 'ko-KR') await page.screenshot({ path: test.info().outputPath('login-ko-KR.png'), fullPage: true })
    await page.getByLabel(login.email, { exact: true }).fill('review@example.com')
    await page.getByLabel(login.password, { exact: true }).fill('invalid-password')
    await page.getByRole('button', { name: login.submit, exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText(login.invalidCredentials)
    await page.getByRole('combobox').selectOption(locale === 'en-US' ? 'pt-BR' : 'en-US')
    await expect(page.getByRole('alert')).toHaveText(translations('login', locale === 'en-US' ? 'pt-BR' : 'en-US').invalidCredentials)
    await page.goto('/sso/callback?error=denied', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('alert')).toHaveText(login.ssoFailed)
    await expect(page.locator('html')).toHaveAttribute('lang', locale)
    await expect(page.getByRole('main')).not.toContainText(/\?{2,}|\p{L}\?\p{L}|\uFFFD|US-18/u)
  })

  test(`${locale}: autenticador traduz configuração, validação e confirmação de cópia`, async ({ page }) => {
    const login = translations('login', locale)
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.addInitScript(value => localStorage.setItem('greener:locale', value), locale)
    await mockCatalog(page, [])
    await page.route('**/api/auth/login', route => route.fulfill({ json: {
      status: 'TOTP_SETUP_REQUIRED', setupToken: 'setup-token', expiresIn: 300,
    } }))
    await page.route('**/api/auth/totp/setup', route => route.fulfill({ json: {
      setupToken: 'confirmation-token', expiresIn: 600,
      provisioningUri: 'otpauth://totp/GreenER:review?secret=JBSWY3DPEHPK3PXP&issuer=GreenER',
    } }))
    await page.goto('/login')
    await page.getByLabel(login.email, { exact: true }).fill('review@example.com')
    await page.getByLabel(login.password, { exact: true }).fill('password123')
    await page.getByRole('button', { name: login.submit, exact: true }).click()
    await expect(page.getByRole('heading', { name: login.totpSetupHeading, exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: login.totpQrLabel, exact: true })).toBeVisible()
    await page.getByText(login.totpManualSetup, { exact: true }).click()
    await page.getByRole('button', { name: login.totpCopySecret, exact: true }).click()
    await expect(page.getByRole('status')).toHaveText(login.totpCopied)
    await page.getByRole('button', { name: login.totpSetupSubmit, exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText(login.totpInvalidFormat)
    const nextLocale = locale === 'en-US' ? 'pt-BR' : 'en-US'
    await page.getByRole('combobox').selectOption(nextLocale)
    await expect(page.getByRole('alert')).toHaveText(translations('login', nextLocale).totpInvalidFormat)
    await expect(page.getByRole('status')).toHaveText(translations('login', nextLocale).totpCopied)
  })
}

test('filtros do histórico usam texto legível e datas traduzidas nos doze idiomas', async ({ page }) => {
  test.setTimeout(120_000)
  await mockCatalog(page, [application()])
  await page.route(/\/applications\/svc-0142\/analysis(?:\/series)?(?:\?.*)?$/, async route => {
    const url = new URL(route.request().url())
    const period = { from: url.searchParams.get('from')!, to: url.searchParams.get('to')! }
    const energy = { value: 1, unit: 'kWh', reasons: [] }
    const emissions = { value: 400, unit: 'gCO2e', reasons: [] }
    const coverage = { energy: 1, emissions: 1 }
    const base = { status: 'available', applicationId: 'svc-0142', period, coverage }
    await route.fulfill({ json: url.pathname.endsWith('/series') ? {
      ...base, granularity: url.searchParams.get('granularity'), totals: { energy, emissions }, events: [],
      points: [{ bucketStart: period.from, bucketEnd: period.to, energy, emissions, coverage }],
    } : { ...base, energy, emissions, provenance: { methodologies: [], factors: [], reasons: [] } } })
  })
  await page.goto('/history?applicationId=svc-0142&period=7d&granularity=day')
  for (const locale of supportedLocales) {
    const detail = translations('detail', locale)
    await page.getByRole('combobox').filter({ has: page.locator('option[value="en-US"]') }).selectOption(locale)
    await expect(page.getByRole('main')).toContainText(detail.historyNoFilters)
    await page.getByRole('button', { name: detail.analysisSeriesColumnFilters, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel(detail.analysisSeriesFrom, { exact: true })).toBeVisible()
    await expect(dialog.getByLabel(detail.analysisSeriesTo, { exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: detail.analysisSeriesApply, exact: true })).toBeVisible()
    await expect(dialog).not.toContainText(/\?{2,}|\p{L}\?\p{L}|\uFFFD|Shuukei/u)
    if (locale === 'ja-JP') await page.screenshot({ path: test.info().outputPath('history-filters-ja-JP.png'), fullPage: true })
    await dialog.getByRole('button', { name: detail.analysisSeriesCloseFilters, exact: true }).click()
  }
})

test('falha de conexão no login não pede um código e acompanha a troca entre os doze idiomas', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', route => route.fulfill({ status: 503, json: {} }))
  await page.goto('/login')
  await page.getByRole('combobox').selectOption('pt-BR')
  await page.getByLabel('E-mail institucional').fill('review@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  for (const locale of supportedLocales) {
    await page.getByRole('combobox').selectOption(locale)
    await expect(page.getByRole('alert')).toHaveText(translations('login', locale).signInFailed)
  }
})
