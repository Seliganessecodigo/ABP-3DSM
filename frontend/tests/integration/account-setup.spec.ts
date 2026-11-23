import { expect, test, type APIRequestContext } from '@playwright/test'

async function emailLink(request: APIRequestContext, recipient: string, path: string): Promise<string> {
  const response = await request.get('http://127.0.0.1:4302')
  const messages: Array<{ to: string; text: string }> = await response.json()
  const message = messages.find(item => item.to === recipient && item.text.includes(path))
  expect(message).toBeDefined()
  const url = message!.text.match(/http:\/\/127\.0\.0\.1:4300\/\S+/)?.[0]
  expect(url).toBeTruthy()
  return url!
}

test('first administrator follows real invitation and confirmation emails, then reaches required TOTP setup', async ({ page, request }) => {
  await page.goto(await emailLink(request, 'representative@example.test', '/setup-admin'))
  await page.getByLabel('Nome completo').fill('Admin de homologação')
  await page.getByLabel('E-mail institucional').fill('admin-onboarding@example.test')
  await page.getByRole('button', { name: 'Aceitar convite', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Confira seu e-mail' })).toBeVisible()
  const confirmation = await emailLink(request, 'admin-onboarding@example.test', '/confirm-email')
  await page.goto(confirmation)
  await page.getByLabel('Nova senha', { exact: true }).fill('Fixture-password-2026')
  await page.getByLabel('Confirme a senha', { exact: true }).fill('Fixture-password-2026')
  await page.getByRole('button', { name: 'Confirmar e criar senha' }).click()
  await expect(page.getByRole('heading', { name: 'Sua conta está pronta' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao login' }).click()
  await page.getByLabel('E-mail institucional').fill('admin-onboarding@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('Fixture-password-2026')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Configure seu autenticador', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'QR Code para configurar o autenticador', exact: true })).toBeVisible()
  // A consumed confirmation cannot be used to replace the password.
  await page.goto(confirmation)
  await page.getByLabel('Nova senha', { exact: true }).fill('Other-fixture-password')
  await page.getByLabel('Confirme a senha', { exact: true }).fill('Other-fixture-password')
  await page.getByRole('button', { name: 'Confirmar e criar senha' }).click()
  await expect(page.getByRole('alert')).toContainText('expirou ou já foi utilizado')
})
