import { expect, test, type Page } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'
import { supportedLocales } from '../src/i18n/types.ts'
import { readFileSync } from 'node:fs'

const admin = { id: 'user-admin', organizationId: 'organization-1', name: 'Ana Silva', email: 'ana@example.com', role: 'ADMIN' }
const account = { id: 'user-analyst', name: 'Bruno Lima', email: 'bruno@example.com', role: 'ANALYST', status: 'ACTIVE' }
const accounts = { items: [account], pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1, hasNextPage: false } }
async function signIn(page: Page, role = 'ADMIN') {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', route => route.fulfill({ json: { accessToken: 'access-test', refreshToken: 'refresh-test', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/me', route => route.fulfill({ json: { ...admin, role } }))
  await page.goto('/login')
  await page.locator('input[name="email"]').fill(admin.email)
  await page.locator('input[name="password"]').fill('test-password')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(url => url.pathname === '/')
}
async function openAccounts(page: Page) {
  await signIn(page)
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Usuários', exact: true })).toBeVisible()
}

test('visitante não consulta contas e recebe acesso ao login', async ({ page }) => {
  let requests = 0
  await page.route('**/api/auth/users?*', route => { requests++; return route.fulfill({ json: accounts }) })
  await page.goto('/administration/users')
  await expect(page.getByRole('main')).toContainText('Entre com uma conta de administrador')
  await expect(page.getByRole('main').getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
  expect(requests).toBe(0)
})

test('analista não vê menu e não consulta contas por navegação direta', async ({ page }) => {
  await signIn(page, 'ANALYST')
  await expect(page.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0)
  await page.evaluate(() => { history.pushState({}, '', '/administration/users'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('main')).toContainText('Somente administradores')
  await expect(page.locator('form')).toHaveCount(0)
})

test('admin lista contas e envia convite autenticado sem criar conta antecipadamente', async ({ page }) => {
  await page.route('**/api/auth/users?*', route => {
    expect(route.request().headers().authorization).toBe('Bearer access-test')
    return route.fulfill({ json: accounts })
  })
  await page.route('**/api/auth/sso/invitations', route => {
    expect(route.request().headers().authorization).toBe('Bearer access-test')
    expect(route.request().postDataJSON()).toEqual({ name: 'Maria Souza', email: 'maria@example.com', role: 'VISITOR' })
    return route.fulfill({ json: { expiresAt: '2026-11-11T12:00:00Z' } })
  })
  await openAccounts(page)
  await expect(page.getByRole('cell', { name: 'bruno@example.com' })).toBeVisible()
  await page.getByLabel('Nome completo').fill('Maria Souza')
  await page.getByLabel('E-mail da conta Google').fill('maria@example.com')
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Convite enviado')
  await expect(page.getByLabel('Nome completo')).toHaveValue('')
  await expect(page.getByRole('rowheader', { name: 'Maria Souza' })).toHaveCount(0)
})

test('prepara vínculo próprio e de conta existente mantendo papel sem enviar automaticamente', async ({ page }) => {
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: accounts }))
  await openAccounts(page)
  await page.getByRole('button', { name: 'Vincular minha conta Google' }).click()
  await expect(page.getByLabel('Nome completo')).toHaveValue(admin.name)
  await expect(page.getByLabel('E-mail da conta Google')).toHaveValue(admin.email)
  await expect(page.getByLabel('Papel', { exact: true })).toHaveValue('ADMIN')
  await expect(page.getByLabel('Nome completo')).toBeFocused()
  await page.getByRole('button', { name: 'Preparar convite para Bruno Lima' }).click()
  await expect(page.getByLabel('E-mail da conta Google')).toHaveValue(account.email)
  await expect(page.getByLabel('Papel', { exact: true })).toHaveValue('ANALYST')
})

test('falha de convite preserva formulário e não expõe resposta interna', async ({ page }) => {
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: accounts }))
  await page.route('**/api/auth/sso/invitations', route => route.fulfill({ status: 409, json: { message: 'sensitive internal detail' } }))
  await openAccounts(page)
  await page.getByRole('button', { name: 'Vincular minha conta Google' }).click()
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Esta conta não pode receber o convite')
  await expect(page.getByLabel('Nome completo')).toHaveValue(admin.name)
  await expect(page.getByText('sensitive internal detail')).toHaveCount(0)
})

test('rejeita lista inválida e permite atualizar sem apresentar vazio falso', async ({ page }) => {
  let valid=false
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: valid ? accounts : { items: [] } }))
  await openAccounts(page)
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar as contas')
  await expect(page.getByText('Nenhuma conta encontrada.')).toHaveCount(0)
  valid=true
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
  await expect(page.getByRole('cell', { name: account.email })).toBeVisible()
})

test('paginação usa total e página do servidor', async ({ page }) => {
  await page.route('**/api/auth/users?*', route => {
    const second = new URL(route.request().url()).searchParams.get('page') === '2'
    return route.fulfill({ json: { items: second ? [{ ...account, id: 'last', name: 'Última conta' }] : [account], pagination: { page: second ? 2 : 1, pageSize: 10, totalItems: 11, totalPages: 2, hasNextPage: !second } } })
  })
  await openAccounts(page)
  await page.getByRole('button', { name: 'Próxima', exact: true }).click()
  await expect(page.getByRole('rowheader', { name: 'Última conta' })).toBeVisible()
  await expect(page.getByText('Página 2 de 2 · 11 contas')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Próxima', exact: true })).toBeDisabled()
})

test('formulário bloqueia envio duplicado e cancela ao sair da tela', async ({ page }) => {
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: accounts }))
  let requests=0
  let release!: () => void
  const pending=new Promise<void>(resolve => { release=resolve })
  await page.route('**/api/auth/sso/invitations', async route => { requests++; await pending; await route.fulfill({ json: { expiresAt: '2026-11-11T12:00:00Z' } }).catch(() => {}) })
  await openAccounts(page)
  await page.getByRole('button', { name: 'Vincular minha conta Google' }).click()
  await page.getByRole('button', { name: 'Enviar convite', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Enviando…' })).toHaveAttribute('aria-disabled','true')
  await page.getByRole('button', { name: 'Enviando…' }).click({ force: true })
  await page.getByRole('link', { name: 'Aplicações', exact: true }).click()
  release()
  expect(requests).toBe(1)
  await expect(page.getByText('Convite enviado.')).toHaveCount(0)
})

test('nova página mantém textos nos doze idiomas e cabe no celular', async ({ page }) => {
  test.setTimeout(60_000)
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: accounts }))
  await openAccounts(page)
  await page.screenshot({path:'../.github/evidencias/google-access/users-desktop.png',fullPage:true})
  for(const locale of supportedLocales) {
    const strings=JSON.parse(readFileSync(new URL(`../src/pages/accounts/locales/${locale}.json`,import.meta.url),'utf8'))
    await page.locator('.sidebar select').first().selectOption(locale)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings.title)
    await expect(page.getByRole('button', { name: strings.send, exact: true })).toBeVisible()
  }
  await page.locator('.sidebar select').first().selectOption('pt-BR')
  await page.setViewportSize({ width:390,height:844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:'../.github/evidencias/google-access/users-mobile.png',fullPage:true})
})
