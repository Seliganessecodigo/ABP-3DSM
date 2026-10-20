import { expect, test } from '@playwright/test'
import { application, gate, mixedCatalog, mockApi, mockCatalog, row, unavailable } from './support/catalog.ts'

test('interruptor único Modo escuro alterna entre claro e escuro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await mockCatalog(page, [])
  await page.goto('/')
  const toggle = page.getByRole('switch', { name: 'Modo escuro', exact: true })
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await expect(toggle.locator('.theme-switch > span')).toHaveCSS('transition-duration', '0.18s')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
  await expect(page.getByRole('button', { name: 'Usar tema do sistema', exact: true })).toHaveCount(0)
})

test('interruptor respeita a preferência por movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await mockCatalog(page, [])
  await page.goto('/')
  await expect(page.getByRole('switch', { name: 'Modo escuro', exact: true }).locator('.theme-switch > span'))
    .toHaveCSS('transition-property', 'none')
})

test('preferências de tema têm nomes acessíveis nos oito idiomas', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/')
  const language = page.getByRole('combobox').filter({ has: page.locator('option[value="en-US"]') })
  const cases = [
    ['pt-BR', 'Modo escuro'],
    ['en-US', 'Dark mode'],
    ['es-ES', 'Modo oscuro'],
    ['fr-FR', 'Mode sombre'],
    ['de-DE', 'Dunkelmodus'],
    ['it-IT', 'Modalità scura'],
    ['ja-JP', 'ダークモード'],
    ['zh-CN', '深色模式'],
  ]
  for (const [locale, label] of cases) {
    await language.selectOption(locale)
    await expect(page.getByRole('switch', { name: label, exact: true })).toBeVisible()
  }
})

test('escolha explícita persiste na recarga e na navegação sem perder filtros', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await mockCatalog(page, [application()])
  await page.goto('/?search=pagamentos')
  await page.getByRole('switch', { name: 'Modo escuro', exact: true }).click()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Modo escuro', exact: true })).toHaveAttribute('aria-checked', 'true')
  await row(page, 'svc-0142').getByRole('link').click()
  await page.locator('#analysis-details summary').click()
  await expect(page.getByRole('heading', { name: 'Identificação e situação', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await page.getByRole('link', { name: /voltar/i }).click()
  await expect(page).toHaveURL(/search=pagamentos/)
  await page.getByRole('switch', { name: 'Modo escuro', exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
  await expect(page.getByRole('switch', { name: 'Modo escuro', exact: true })).toHaveAttribute('aria-checked', 'false')
})

test('sistema acompanha mudanças até a primeira escolha manual', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await mockCatalog(page, [])
  await page.goto('/')
  const toggle = page.getByRole('switch', { name: 'Modo escuro', exact: true })
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await toggle.click()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
})

for (const saved of ['light', 'dark', 'system', 'invalid', null]) {
  test(`preferência ${saved ?? 'ausente'} é aplicada antes de carregar o React`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript((value) => {
      if (value !== null) localStorage.setItem('greener-theme', value)
    }, saved)
    await page.route('**/src/main.tsx', (route) => route.abort())
    await page.goto('/')
    await expect(page.locator('#root')).toBeEmpty()
    await expect(page.locator('html')).toHaveCSS('color-scheme', saved === 'light' ? 'light' : 'dark')
  })
}

test('controles funcionam por teclado na sidebar recolhida e no mobile', async ({ page }) => {
  await mockCatalog(page, mixedCatalog)
  await page.goto('/')
  await page.getByRole('button', { name: 'Recolher navegação' }).click()
  const dark = page.getByRole('switch', { name: 'Modo escuro', exact: true })
  await dark.focus()
  await page.keyboard.press('Enter')
  await expect(dark).toHaveAttribute('aria-checked', 'true')
  await expect(dark).toBeFocused()
  await expect(dark).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Space')
  await expect(dark).toHaveAttribute('aria-checked', 'false')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(dark).toBeVisible()
  const size = await dark.boundingBox()
  expect(size?.height).toBeGreaterThanOrEqual(44)
  await dark.click()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'app-pagamentos', exact: true })).toBeVisible()
})

test('armazenamento bloqueado não impede carregar e escolher o tema na sessão', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
  })
  await mockCatalog(page, [])
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Aplicações', exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Modo escuro', exact: true }).click()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
  await page.emulateMedia({ colorScheme: 'light' })
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.getByRole('switch', { name: 'Modo escuro', exact: true })).toHaveAttribute('aria-checked', 'false')
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
})

test('texto, estados e controles mantêm contraste nos dois temas', async ({ page }, testInfo) => {
  await mockCatalog(page, mixedCatalog)
  await page.goto('/')
  for (const name of ['Claro', 'Escuro']) {
    const toggle = page.getByRole('switch', { name: 'Modo escuro', exact: true })
    if ((await toggle.getAttribute('aria-checked')) !== String(name === 'Escuro')) await toggle.click()
    const checks = await page.evaluate(() => {
      function luminance(color: string) {
        const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
      }
      function ratio(a: string, b: string) {
        const first = luminance(a), second = luminance(b)
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
      }
      function background(element: Element): string {
        const color = getComputedStyle(element).backgroundColor
        return color === 'rgba(0, 0, 0, 0)' && element.parentElement ? background(element.parentElement) : color
      }
      const text = [...document.querySelectorAll('h1, .page-heading p, th, td, .identifier, .detail-link, .state-badge, .theme-toggle, .button:not(:disabled)')]
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => ({ label: element.textContent, minimum: 4.5, actual: ratio(getComputedStyle(element).color, background(element)) }))
      const search = document.querySelector('input[type="search"]')!.parentElement!
      text.push({ label: 'search control border', minimum: 3, actual: ratio(getComputedStyle(search).borderColor, background(search)) })
      return text
    })
    for (const check of checks) expect(check.actual, `${name}: ${check.label}`).toBeGreaterThanOrEqual(check.minimum)
    await page.screenshot({ path: testInfo.outputPath(`catalog-${name}.png`), fullPage: true })
  }
})

for (const theme of ['Claro', 'Escuro']) {
  test(`${theme}: carregamento, erro, recuperação e vazio continuam legíveis`, async ({ page }, testInfo) => {
    const pending = gate()
    let response: 'error' | 'success' | 'empty' = 'error'
    await mockApi(page, async (route) => {
      await pending.wait
      if (response === 'error') await unavailable(route)
      else {
        const isCatalog = new URL(route.request().url()).pathname.endsWith('/applications')
        await route.fulfill({ json: isCatalog ? (response === 'success' ? [application()] : []) : application() })
      }
    })
    await page.goto('/')
    const toggle = page.getByRole('switch', { name: 'Modo escuro', exact: true })
    if ((await toggle.getAttribute('aria-checked')) !== String(theme === 'Escuro')) await toggle.click()
    try {
      await expect(page.getByText('Carregando aplicações...', { exact: true })).toBeVisible()
    } finally { pending.release() }
    await expect(page.getByRole('alert')).toContainText('Não foi possível consultar o catálogo')
    await page.screenshot({ path: testInfo.outputPath(`error-${theme}.png`), fullPage: true })
    response = 'success'
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(row(page, 'svc-0142')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await page.getByRole('button', { name: 'Filtros por coluna', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`filters-${theme}.png`), fullPage: true })
    await page.keyboard.press('Escape')
    await row(page, 'svc-0142').getByRole('link').click()
    await page.locator('#analysis-details summary').click()
    await expect(page.getByRole('heading', { name: 'Identificação e situação', exact: true })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`detail-${theme}.png`), fullPage: true })
    await page.getByRole('link', { name: /voltar/i }).click()
    response = 'empty'
    await page.getByRole('button', { name: 'Atualizar catálogo' }).click()
    await expect(page.getByRole('heading', { name: 'Nenhuma aplicação reconhecida', exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme === 'Claro' ? 'light' : 'dark')
  })
}
