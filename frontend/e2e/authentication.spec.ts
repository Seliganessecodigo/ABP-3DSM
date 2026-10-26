import { expect, test } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'

test('visitante consegue abrir o login a partir do catálogo público', async ({ page }) => {
  await mockCatalog(page, [])
  await page.goto('/')

  await page.getByRole('link', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Login administrativo' })).toBeVisible()
  await expect(page.getByLabel('Organização')).toHaveCount(0)
})

test('usuário entra com credenciais válidas e retorna à tela inicial', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ email: 'ana@example.com', password: 'password123' })
    await route.fulfill({ json: { accessToken: 'access-test', refreshToken: 'refresh-test', tokenType: 'Bearer', expiresIn: 900 } })
  })
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { id: 'user-1', organizationId: 'org-1', name: 'Ana Silva', email: 'ana@example.com', role: 'ANALYST' } })
  })
  await page.route('**/api/auth/sessions/logout', async (route) => {
    await route.fulfill({ status: 500, json: { message: 'temporary revocation failure' } })
  })
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Ana Silva')).toBeVisible()
  await expect(page.getByText('Analista')).toBeVisible()
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByText('Ana Silva')).toHaveCount(0)
})

test('credenciais inválidas mostram erro genérico e limpam apenas a senha', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({ status: 401, json: { message: 'sensitive backend detail' } }))
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.com')
  await page.getByLabel('Senha').fill('wrong-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos. Confira os dados e tente novamente.')
  await expect(page.getByLabel('E-mail institucional')).toHaveValue('ana@example.com')
  await expect(page.getByLabel('Senha')).toHaveValue('')
  await expect(page.getByText('sensitive backend detail')).toHaveCount(0)
})

test('renova a sessão uma vez quando a consulta inicial do perfil retorna 401', async ({ page }) => {
  await mockCatalog(page, [])
  let profileRequests = 0
  await page.route('**/api/auth/login', async (route) => route.fulfill({ json: { accessToken: 'expired-access', refreshToken: 'refresh-test', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/sessions/refresh', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ refreshToken: 'refresh-test' })
    await route.fulfill({ json: { accessToken: 'new-access', refreshToken: 'new-refresh', tokenType: 'Bearer', expiresIn: 900 } })
  })
  await page.route('**/api/auth/me', async (route) => {
    profileRequests += 1
    if (profileRequests === 1) return route.fulfill({ status: 401, json: { message: 'expired' } })
    expect(route.request().headers().authorization).toBe('Bearer new-access')
    await route.fulfill({ json: { id: 'user-1', organizationId: 'org-1', name: 'Ana Silva', email: 'ana@example.com', role: 'ANALYST' } })
  })
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Ana Silva')).toBeVisible()
  expect(profileRequests).toBe(2)
})

test('desafio TOTP não cria sessão até que a pessoa informe o código', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({ json: { status: 'TOTP_REQUIRED', challengeToken: 'challenge-test', expiresIn: 300 } }))
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible()
  await expect(page.getByLabel('Código do autenticador')).toBeVisible()
  await expect(page.getByText('Ana Silva')).toHaveCount(0)
})

test('recarregar a página encerra a sessão mantida apenas em memória', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({ json: { accessToken: 'access-test', refreshToken: 'refresh-test', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/me', async (route) => route.fulfill({ json: { id: 'user-1', organizationId: 'org-1', name: 'Ana Silva', email: 'ana@example.com', role: 'ANALYST' } }))
  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('ana@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('Ana Silva')).toBeVisible()

  await page.reload()

  await expect(page.getByText('Ana Silva')).toHaveCount(0)
})
