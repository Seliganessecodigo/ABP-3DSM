import { expect, test } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'

test('sidebar cabe na viewport expandida e recolhida em telas de notebook', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/')
  for (const height of [900, 768, 720, 600]) {
    await page.setViewportSize({ width: 1366, height })
    for (const collapsed of [false, true]) {
      const toggle = page.locator('.sidebar-collapse-toggle')
      if ((await toggle.getAttribute('aria-expanded')) === String(collapsed)) await toggle.click()
      await expect.poll(() => page.locator('.sidebar').evaluate(el => ({
        vertical: el.scrollHeight > el.clientHeight,
        horizontal: el.scrollWidth > el.clientWidth,
        outsideViewport: el.getBoundingClientRect().bottom > window.innerHeight,
        detached: el.getBoundingClientRect().left !== 0 || el.getBoundingClientRect().top !== 0 || el.getBoundingClientRect().bottom !== window.innerHeight,
      }))).toEqual({ vertical: false, horizontal: false, outsideViewport: false, detached: false })
    }
  }
})

test('bandeira acompanha o idioma e permanece visível ao recolher e no mobile', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/')
  const language = page.locator('.language-control select')
  for (const locale of ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'ru-RU', 'hi-IN', 'id-ID', 'zh-CN']) {
    await language.selectOption(locale)
    await expect(page.locator(`[data-language-flag="${locale}"]`)).toBeVisible()
  }
  await page.locator('.sidebar-collapse-toggle').click()
  await expect(page.locator('[data-language-flag="zh-CN"]')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.mobile-menu-toggle').click()
  await expect(page.locator('[data-language-flag="zh-CN"]')).toBeVisible()
})
