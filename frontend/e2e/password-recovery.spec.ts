import { expect, test } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`recuperação: navegação por teclado e placeholder em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => localStorage.setItem('greener:locale', 'pt-BR'))
    await mockCatalog(page, [])
    const requests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/auth/password-recovery/')) requests.push(request.url())
    })
    await page.goto('/login')
    const forgot = page.getByRole('button', { name: 'Esqueceu a senha?' })
    await forgot.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/recover-password$/)
    await expect(page.getByRole('heading', { name: 'Recuperação de senha', exact: true })).toBeVisible()
    await expect(page.locator('form, input')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `../.github/evidencias/160-recuperacao/placeholder-${viewport.width}.png`, fullPage: true })
    const back = page.getByRole('button', { name: 'Voltar para entrar' })
    await back.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/login$/)
    expect(requests).toEqual([])
  })
}
