import { expect, test } from '@playwright/test'
import { application, mockCatalog, row } from './support/catalog.ts'

test('troca o idioma, persiste a preferência e atualiza o atributo lang', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/')
  const selector = page.getByRole('combobox', { name: 'Idioma' })
  await selector.selectOption('en-US')
  await expect(page.getByRole('heading', { level: 1, name: 'Applications' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('greener:locale'))).toBe('en-US')
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue('en-US')
  await expect(page.getByRole('heading', { level: 1, name: 'Applications' })).toBeVisible()
})

test('catálogo e detalhe estão traduzidos nos oito idiomas', async ({ page }) => {
  const cases = [
    { locale: 'pt-BR', title: 'Aplicações', available: 'Disponível', details: 'Ver detalhes', identity: 'Identificação e situação', location: 'Localização' },
    { locale: 'en-US', title: 'Applications', available: 'Available', details: 'View details', identity: 'Identity and status', location: 'Location' },
    { locale: 'es-ES', title: 'Aplicaciones', available: 'Disponible', details: 'Ver detalles', identity: 'Identificación y estado', location: 'Ubicación' },
    { locale: 'fr-FR', title: 'Applications', available: 'Disponible', details: 'Voir les détails', identity: 'Identification et état', location: 'Emplacement' },
    { locale: 'de-DE', title: 'Anwendungen', available: 'Verfügbar', details: 'Details anzeigen', identity: 'Identität und Status', location: 'Standort' },
    { locale: 'it-IT', title: 'Applicazioni', available: 'Disponibile', details: 'Visualizza dettagli', identity: 'Identificazione e stato', location: 'Posizione' },
    { locale: 'ja-JP', title: 'アプリケーション', available: '利用可能', details: '詳細を見る', identity: '識別情報と状態', location: '位置情報' },
    { locale: 'zh-CN', title: '应用程序', available: '可用', details: '查看详情', identity: '标识信息和状态', location: '位置' },
  ]
  await mockCatalog(page, [application()])
  await page.goto('/')
  const languageSelector = page.getByRole('combobox').filter({ has: page.locator('option[value="en-US"]') })
  for (const item of cases) {
    await languageSelector.selectOption(item.locale)
    await expect(page.locator('html')).toHaveAttribute('lang', item.locale)
    await expect(page.getByRole('heading', { level: 1, name: item.title, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: new RegExp(`^${item.available} \\(`) })).toBeVisible()
    await row(page, 'svc-0142').getByRole('link', { name: item.details, exact: false }).click()
    await page.locator('#analysis-details summary').click()
    await expect(page.getByRole('heading', { name: item.identity, exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: item.location, exact: true })).toBeVisible()
    await page.goto('/')
  }
})

test('controles do menu móvel são acessíveis nos oito idiomas', async ({ page }) => {
  const cases = [
    { locale: 'pt-BR', open: 'Abrir menu', close: 'Fechar menu' },
    { locale: 'en-US', open: 'Open menu', close: 'Close menu' },
    { locale: 'es-ES', open: 'Abrir menú', close: 'Cerrar menú' },
    { locale: 'fr-FR', open: 'Ouvrir le menu', close: 'Fermer le menu' },
    { locale: 'de-DE', open: 'Menü öffnen', close: 'Menü schließen' },
    { locale: 'it-IT', open: 'Apri menu', close: 'Chiudi menu' },
    { locale: 'ja-JP', open: 'メニューを開く', close: 'メニューを閉じる' },
    { locale: 'zh-CN', open: '打开菜单', close: '关闭菜单' },
  ]
  await page.setViewportSize({ width: 390, height: 844 })
  await mockCatalog(page, [application()])
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click()

  for (const [index, item] of cases.entries()) {
    if (index > 0) await page.getByRole('button', { name: cases[index - 1].open, exact: true }).click()
    await page.getByRole('dialog').getByRole('combobox').selectOption(item.locale)
    const opener = page.getByRole('button', { name: item.open, exact: true })
    await expect(page.getByRole('dialog').getByRole('button', { name: item.close, exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(opener).toHaveAttribute('aria-expanded', 'false')
  }
})

