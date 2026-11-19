import { expect, test } from '@playwright/test'

test('solicita recuperação sem revelar a existência de uma conta e permite repetir após falha', async ({ page }) => {
  let status = 429
  await page.route('**/api/auth/password-recovery/request', route => {
    expect(route.request().postDataJSON()).toEqual({ organization: 'team', email: 'user@example.test' })
    return route.fulfill({ status, json: status === 202 ? { code: 'PASSWORD_RECOVERY_REQUEST_ACCEPTED' } : {} })
  })
  await page.goto('/recover-password')
  await page.screenshot({ path: test.info().outputPath('recuperacao.png'), fullPage: true })
  await page.getByLabel('Identificador da organização', { exact: true }).fill('team')
  await page.getByLabel('E-mail institucional', { exact: true }).fill('user@example.test')
  await page.getByRole('button', { name: 'Enviar link de recuperação', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Muitas tentativas')
  status = 202
  await page.getByRole('button', { name: 'Enviar link de recuperação', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Se os dados corresponderem a uma conta elegível')
})

test('consome o token do fragmento, confirma a senha e não envia dados antes da validação', async ({ page }) => {
  let writes = 0
  await page.route('**/api/auth/password-recovery/complete', route => {
    writes++
    expect(route.request().postDataJSON()).toEqual({ token: 'temporary-token', password: 'new-password' })
    return route.fulfill({ status: 204 })
  })
  await page.goto('/recover-password#token=temporary-token')
  await expect(page).toHaveURL(/\/recover-password$/)
  await page.getByLabel('Nova senha', { exact: true }).fill('new-password')
  await page.getByLabel('Confirme a senha', { exact: true }).fill('different-password')
  await page.getByRole('button', { name: 'Redefinir senha', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('As senhas não coincidem.')
  expect(writes).toBe(0)
  await page.getByLabel('Confirme a senha', { exact: true }).fill('new-password')
  await page.getByRole('button', { name: 'Redefinir senha', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Senha alterada. Entre novamente.')
  expect(writes).toBe(1)
})

test('token expirado mantém o erro claro e não mostra confirmação de sucesso', async ({ page }) => {
  await page.route('**/api/auth/password-recovery/complete', route => route.fulfill({ status: 401, json: { code: 'PASSWORD_RECOVERY_TOKEN_INVALID' } }))
  await page.goto('/recover-password#token=expired-token')
  await page.getByLabel('Nova senha', { exact: true }).fill('new-password')
  await page.getByLabel('Confirme a senha', { exact: true }).fill('new-password')
  await page.getByRole('button', { name: 'Redefinir senha', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('expirou ou já foi utilizado')
  await expect(page.getByRole('status')).toHaveCount(0)
})
