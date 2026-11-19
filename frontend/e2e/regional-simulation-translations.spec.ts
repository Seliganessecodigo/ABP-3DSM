import { expect, test } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'

const labels = [
  ['ru-RU', 'Региональное моделирование', 'Смоделировать сценарий', 'Отмена'],
  ['de-DE', 'Regionale Simulation', 'Szenario simulieren', 'Abbrechen'],
  ['es-ES', 'Simulación regional', 'Simular escenario', 'Cancelar'],
  ['fr-FR', 'Simulation régionale', 'Simuler le scénario', 'Annuler'],
  ['it-IT', 'Simulazione regionale', 'Simula scenario', 'Annulla'],
  ['ja-JP', '地域シミュレーション', 'シナリオをシミュレート', 'キャンセル'],
  ['zh-CN', '区域模拟', '模拟场景', '取消'],
  ['ko-KR', '지역별 시뮬레이션', '시나리오 시뮬레이션', '취소'],
  ['hi-IN', 'क्षेत्रीय सिमुलेशन', 'परिदृश्य सिमुलेट करें', 'रद्द करें'],
  ['id-ID', 'Simulasi regional', 'Simulasikan skenario', 'Batal'],
] as const
for (const [locale, title, simulate, cancel] of labels) {
  test(`${locale}: a simulação e seus botões usam o idioma escolhido`, async ({ page }) => {
    await page.addInitScript(locale => localStorage.setItem('greener:locale', locale), locale)
    await mockCatalog(page, [])
    await page.route('**/carbon/regions', route => route.fulfill({ status: 503, json: {} }))
    await page.goto('/regional-simulation')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByRole('button', { name: simulate, exact: true })).toBeVisible()
    const application = page.locator('main [data-help="simulation-parameters"] button').first()
    await application.click()
    await expect(page.getByRole('dialog').getByRole('button', { name: cancel, exact: true })).toBeVisible()
    await expect(page.getByRole('main')).not.toContainText(/\b(?:Simulate scenario|Try again|Clear scenario|Cancel)\b/)
    if (locale === 'ru-RU') {
      await page.screenshot({ path: test.info().outputPath('simulacao-russo-desktop.png'), fullPage: true })
      await page.getByRole('dialog').getByRole('button', { name: cancel, exact: true }).click()
      await page.setViewportSize({ width: 390, height: 844 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: test.info().outputPath('simulacao-russo-mobile.png'), fullPage: true })
    }
  })
}
