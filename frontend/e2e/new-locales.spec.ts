import { expect, test } from '@playwright/test'
import { application, gate, mockApi, mockCatalog } from './support/catalog.ts'
import { collectionResponse } from './support/collection.ts'

const cases = [
  { locale: 'ko-KR', catalog: '애플리케이션', dashboard: '환경 대시보드', methodology: '산정 방법', language: '언어', loading: '애플리케이션 불러오는 중...' },
  { locale: 'ru-RU', catalog: 'Приложения', dashboard: 'Экологическая панель', methodology: 'Методика', language: 'Язык', loading: 'Загрузка приложений...' },
  { locale: 'hi-IN', catalog: 'ऐप्लिकेशन', dashboard: 'पर्यावरणीय डैशबोर्ड', methodology: 'गणना पद्धति', language: 'भाषा', loading: 'ऐप्लिकेशन लोड हो रहे हैं...' },
  { locale: 'id-ID', catalog: 'Aplikasi', dashboard: 'Dasbor lingkungan', methodology: 'Metodologi', language: 'Bahasa', loading: 'Memuat aplikasi...' },
]

for (const item of cases) {
  test(`${item.locale} translates all screens and persists the language`, async ({ page }) => {
    await mockCatalog(page, [application()])
    await page.route('**/applications/svc-0142/collections/latest', route => route.fulfill({ json: collectionResponse() }))
    await page.route('**/applications/svc-0142/analysis**', route => route.fulfill({ status: 503, json: {} }))
    await page.route('**/analysis/summary?*', route => route.fulfill({ status: 503, json: {} }))
    await page.goto('/')
    const selector = page.getByRole('combobox').filter({ has: page.locator(`option[value="${item.locale}"]`) })
    await expect(selector.locator('option')).toHaveCount(12)
    await selector.selectOption(item.locale)
    await expect(page.getByRole('heading', { level: 1, name: item.catalog, exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', item.locale)
    await expect(page.locator('[data-language-flag]')).toHaveAttribute('data-language-flag', item.locale)
    await page.reload()
    await expect(page.getByRole('combobox', { name: item.language })).toHaveValue(item.locale)
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1, name: item.dashboard })).toBeVisible()
    await page.goto('/services/svc-0142')
    await expect(page.getByRole('heading', { level: 1, name: application().name })).toBeVisible()
    await page.goto('/services/svc-0142/methodology')
    await expect(page.getByRole('heading', { level: 1, name: item.methodology, exact: true })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('12,5'.replace(',', item.locale === 'ru-RU' || item.locale === 'id-ID' ? ',' : '.'))
    await page.screenshot({ path: test.info().outputPath('methodology.png'), fullPage: true })
  })
}

test('new languages render mobile loading without fallback or horizontal overflow', async ({ page }) => {
  const pending = gate()
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApi(page, async route => {
    await pending.wait
    await route.fulfill({ json: [] })
  })
  await page.goto('/')
  try {
    for (const item of cases) {
      await page.locator('.mobile-menu-toggle').click()
      await page.getByRole('dialog').getByRole('combobox').selectOption(item.locale)
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-loading-state]').getByRole('status')).toContainText(item.loading)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
      await page.screenshot({ path: test.info().outputPath(`${item.locale}-loading.png`), fullPage: true })
    }
  } finally { pending.release() }
})
