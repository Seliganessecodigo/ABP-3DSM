import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { supportedLocales } from '../src/i18n/types.ts'

test('accepts the invitation once, clears the fragment and guides the user to email confirmation', async ({ page }) => {
  let calls = 0
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/auth/invitations/accept', async route => {
    calls++
    expect(route.request().postDataJSON()).toEqual({ token: 'invitation-fixture', name: 'Ana Silva', email: 'ana@example.test' })
    await pending
    await route.fulfill({ status: 202, json: { message: 'Confirmation sent' } })
  })
  await page.goto('/setup-admin#token=invitation-fixture')
  await expect(page).toHaveURL(/\/setup-admin$/)
  await page.screenshot({ path: test.info().outputPath('invitation-desktop.png'), fullPage: true })
  await page.getByLabel('Nome completo').fill('Ana Silva')
  await page.getByLabel('E-mail institucional').fill('ana@example.test')
  await page.getByRole('button', { name: 'Aceitar convite', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
  release!()
  await expect(page.getByRole('status')).toContainText('Enviamos um link')
  await expect(page.getByRole('textbox')).toHaveCount(0)
  expect(calls).toBe(1)
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([])
})

test('creates the password only after matching confirmation and continues to the existing login', async ({ page }) => {
  let calls = 0
  await page.route('**/api/auth/email/confirm', async route => {
    calls++
    expect(route.request().postDataJSON()).toEqual({ token: 'confirmation-fixture', password: 'Example-password-123' })
    await route.fulfill({ json: { message: 'Email confirmed' } })
  })
  await page.goto('/confirm-email#token=confirmation-fixture')
  await page.getByLabel('Nova senha', { exact: true }).waitFor()
  await page.screenshot({ path: test.info().outputPath('password-desktop.png'), fullPage: true })
  await page.getByLabel('Nova senha', { exact: true }).fill('Example-password-123')
  await page.getByLabel('Confirme a senha', { exact: true }).fill('Different-password')
  await page.getByRole('button', { name: 'Confirmar e criar senha' }).click()
  await expect(page.getByRole('alert')).toHaveText('As senhas não coincidem.')
  expect(calls).toBe(0)
  await page.getByLabel('Confirme a senha', { exact: true }).fill('Example-password-123')
  await page.getByRole('button', { name: 'Confirmar e criar senha' }).click()
  await expect(page.getByRole('heading', { name: 'Sua conta está pronta' })).toBeVisible()
  await expect(page.locator('input[type=password]')).toHaveCount(0)
  expect(calls).toBe(1)
  await page.getByRole('link', { name: 'Voltar ao login' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Acesso administrativo' })).toBeVisible()
})

for (const path of ['/setup-admin', '/confirm-email']) {
  test(`${path}: missing token and reopening a consumed fragment show an actionable message`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('alert')).toContainText('Reabra o link do e-mail')
    await expect(page.locator('form')).toHaveCount(0)
    await page.goto(`${path}#token=expired`)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Link indisponível' })).toBeVisible()
  })
}

for (const { status, body, message } of [
  { status: 401, body: { code: 'INVALID_INVITATION' }, message: 'Este link está ausente' },
  { status: 409, body: { code: 'EMAIL_ALREADY_IN_USE' }, message: 'Este e-mail já está em uso' },
  { status: 429, body: {}, message: 'Muitas tentativas' },
  { status: 503, body: {}, message: 'Não foi possível concluir' },
  { status: 202, body: {}, message: 'Não foi possível concluir' },
]) {
  test(`invitation handles HTTP ${status} without trusting malformed success responses`, async ({ page }) => {
    await page.route('**/api/auth/invitations/accept', route => route.fulfill({ status, json: body }))
    await page.goto('/setup-admin#token=invitation-fixture')
    await page.getByLabel('Nome completo').fill('Ana')
    await page.getByLabel('E-mail institucional').fill('ana@example.test')
    await page.getByRole('button', { name: 'Aceitar convite', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(message)
    await expect(page.getByRole('button', { name: 'Aceitar convite', exact: true })).toBeEnabled()
  })
}

test('confirmation clears passwords after a failed request and allows retry', async ({ page }) => {
  let calls = 0
  await page.route('**/api/auth/email/confirm', route => {
    calls++
    return route.fulfill({ status: calls === 1 ? 503 : 200, json: { message: 'Result' } })
  })
  await page.goto('/confirm-email#token=confirmation-fixture')
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByLabel('Nova senha', { exact: true }).fill('Example-password-123')
    await page.getByLabel('Confirme a senha', { exact: true }).fill('Example-password-123')
    await page.getByRole('button', { name: 'Confirmar e criar senha' }).click()
    if (attempt === 0) {
      await expect(page.getByRole('alert')).toContainText('Não foi possível concluir')
      await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue('')
    }
  }
  await expect(page.getByRole('status')).toContainText('Entre com seu e-mail e senha')
})

for (const locale of supportedLocales) {
  test(`${locale}: account setup renders both steps and errors at mobile width`, async ({ page }) => {
    const text = JSON.parse(readFileSync(new URL(`../src/pages/login/locales/${locale}.json`, import.meta.url), 'utf8'))
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(value => localStorage.setItem('greener:locale', value), locale)
    await page.goto('/setup-admin#token=fixture')
    await expect(page.getByRole('heading', { name: text.setupInvitationTitle, exact: true })).toBeVisible()
    await expect(page.getByLabel(text.setupName, { exact: true })).toBeVisible()
    await page.goto('/confirm-email#token=fixture')
    await expect(page.getByLabel(text.setupNewPassword, { exact: true })).toBeVisible()
    if (locale === 'pt-BR') await page.screenshot({ path: test.info().outputPath('password-mobile.png'), fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.goto('/confirm-email')
    await expect(page.getByRole('alert')).toHaveText(text.setupInvalidLink)
  })
}
