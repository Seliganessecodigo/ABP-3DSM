import { expect, test, type Page } from '@playwright/test'
import { mockCatalog } from './support/catalog.ts'

const admin = { id: 'admin-1', organizationId: 'org-1', name: 'Marina Alves', email: 'marina@example.org', role: 'ADMIN' }
const account = { id: 'analyst-1', name: 'Camila Souza', email: 'camila@example.org', role: 'ANALYST', status: 'ACTIVE' }
const health = {
  state: 'ACTIVE', paused: false, schedulerRunning: true, intervalSeconds: 60,
  knownApplications: 24, staleApplications: 2, lastObservationAt: '2026-11-17T17:31:48Z',
  latestCycle: { id: 'cycle-1', status: 'PARTIAL', startedAt: '2026-11-17T17:32:00Z', finishedAt: '2026-11-17T17:32:20Z', processedCount: 24, failedCount: 2 },
  sources: [{ integration: 'metrics', status: 'RECOVERED', lastAttemptAt: '2026-11-17T17:32:00Z', lastSuccessAt: '2026-11-17T17:32:00Z', lastFailureAt: null, openIncidentCount: 0 }, { integration: 'carbon-factor', status: 'DEGRADED', lastAttemptAt: '2026-11-17T17:32:00Z', lastSuccessAt: '2026-11-17T17:25:00Z', lastFailureAt: '2026-11-17T17:32:00Z', openIncidentCount: 2 }],
}
async function login(page: Page, role = 'ADMIN') {
  await mockCatalog(page, [])
  await page.route('**/api/me/preferences/alerts', route => route.fulfill({ json: { configured: false, evaluatedAt: '2026-11-17T17:00:00Z', applications: [] } }))
  await page.route('**/api/auth/login', route => route.fulfill({ json: { accessToken: 'settings-token', refreshToken: 'refresh', tokenType: 'Bearer', expiresIn: 900 } }))
  await page.route('**/api/auth/me', route => route.fulfill({ json: { ...admin, role } }))
  await page.route('**/api/monitoring/health', route => route.fulfill({ json: health }))
  await page.goto('/login')
  await page.locator('input[name=email]').fill(admin.email)
  await page.locator('input[name=password]').fill('test-password')
  await page.locator('form button[type=submit]').click()
  await expect(page).toHaveURL(url => url.pathname === '/dashboard')
  await page.getByRole('link', { name: 'Configurações', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Configurações', exact: true })).toBeVisible()
}
async function mockAccounts(page: Page) {
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: { items: [account], pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1, hasNextPage: false } } }))
}

test('integra usuários nas configurações e mantém o endereço antigo', async ({ page }) => {
  await mockAccounts(page)
  await login(page)
  await expect(page.locator('.sidebar').getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await expect(page).toHaveURL(/\/settings\?tab=users/)
  await expect(page.getByRole('cell', { name: account.email })).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.locator('.sidebar').getByRole('link', { name: 'Configurações', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.evaluate(() => { history.pushState({}, '', '/administration/users?users.search=camila'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page).toHaveURL(url => url.pathname === '/settings' && url.searchParams.get('tab') === 'users' && url.searchParams.get('users.search') === 'camila')
  await expect(page.getByRole('searchbox')).toHaveValue('camila')
  await page.screenshot({ path: test.info().outputPath('usuarios-integrados-desktop.png'), fullPage: true })
})

test('confirma pausa, mantém motivo na falha e atualiza somente após sucesso', async ({ page }) => {
  let paused = false
  let fail = true
  let writes = 0
  await login(page)
  await page.route('**/api/monitoring/health', route => route.fulfill({ json: { ...health, state: paused ? 'PAUSED' : 'ACTIVE', paused } }))
  await page.route('**/api/monitoring/control', route => {
    writes++
    expect(route.request().headers().authorization).toBe('Bearer settings-token')
    expect(route.request().postDataJSON()).toEqual({ paused: true, reason: 'Manutenção programada' })
    if (!fail) paused = true
    return route.fulfill(fail ? { status: 503, json: {} } : { json: { paused: true, changed: true, updatedAt: '2026-11-17T18:00:00Z' } })
  })
  await page.getByRole('button', { name: 'Pausar coleta', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('lacunas no histórico')
  expect(writes).toBe(0)
  await dialog.getByLabel('Motivo obrigatório').fill('Manutenção programada')
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(dialog.getByLabel('Motivo obrigatório')).toHaveValue('Manutenção programada')
  await expect(page.getByRole('heading', { name: 'Coleta ativa', exact: true })).toBeVisible()
  fail = false
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Coleta pausada', exact: true })).toBeVisible()
  await expect(dialog).not.toBeVisible()
  expect(writes).toBe(2)
  await page.screenshot({ path: test.info().outputPath('monitoramento-desktop.png'), fullPage: true })
})

test('erro de diagnóstico preserva dados identificados e payload inválido não vira saúde normal', async ({ page }) => {
  await login(page)
  await expect(page.getByRole('heading', { name: 'Coleta ativa', exact: true })).toBeVisible()
  await page.route('**/api/monitoring/health', route => route.fulfill({ json: { state: 'ACTIVE', paused: false } }))
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Dados anteriores')
  await expect(page.getByRole('heading', { name: 'Coleta ativa', exact: true })).toBeVisible()
  await page.route('**/api/monitoring/health', route => route.fulfill({ status: 403, json: {} }))
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Somente administradores')
  await expect(page.getByRole('heading', { name: 'Coleta ativa', exact: true })).toHaveCount(0)
})

test('cancelar pausa por Escape devolve foco sem enviar comando', async ({ page }) => {
  let writes = 0
  await page.route('**/api/monitoring/control', route => { writes++; return route.fulfill({ status: 500 }) })
  await login(page)
  const trigger = page.getByRole('button', { name: 'Pausar coleta', exact: true })
  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(trigger).toBeFocused()
  expect(writes).toBe(0)
})

test('usuário comum acessa conta, tema sincronizado e metodologia sem consultas administrativas', async ({ page }) => {
  let reads = 0
  await page.route('**/api/auth/users?*', route => { reads++; return route.fulfill({ status: 403 }) })
  await login(page, 'ANALYST')
  const main = page.getByRole('main')
  await expect(main.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0)
  await expect(main.getByText(admin.email, { exact: true })).toBeVisible()
  await main.getByLabel('Tema', { exact: true }).selectOption('dark')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('.sidebar').getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  await page.locator('.sidebar').getByRole('switch').click()
  await expect(main.getByLabel('Tema', { exact: true })).toHaveValue('light')
  await expect(main.getByRole('link', { name: 'Abrir metodologia e minhas preferências' })).toHaveAttribute('href', '/methodology')
  await page.evaluate(() => { history.pushState({}, '', '/settings?tab=users'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(main.getByRole('alert')).toContainText('Somente administradores')
  expect(reads).toBe(0)
})

test('cria conta sem receber senha e recarrega a lista após confirmação', async ({ page }) => {
  await mockAccounts(page)
  let writes = 0
  await page.route('**/api/auth/users', route => {
    writes++
    expect(route.request().postDataJSON()).toEqual({ name: 'João Silva', email: 'joao@example.org', role: 'VISITOR', reason: 'Novo integrante' })
    return route.fulfill({ json: { ...account, id: 'new', name: 'João Silva', email: 'joao@example.org', role: 'VISITOR' } })
  })
  await login(page)
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('não envia e-mail automaticamente')
  await dialog.getByLabel('Nome completo').fill('João Silva')
  await dialog.getByLabel('E-mail', { exact: true }).fill('joao@example.org')
  await dialog.getByLabel('Motivo obrigatório').fill('Novo integrante')
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Operação confirmada' })).toBeVisible()
  expect(writes).toBe(1)
})

test('bloqueio confirma estado esperado e preserva dados na falha de permissão', async ({ page }) => {
  await mockAccounts(page)
  let status = 'ACTIVE'
  await page.route('**/api/auth/users/analyst-1/status', route => {
    expect(route.request().postDataJSON()).toEqual({ status: 'BLOCKED', expectedStatus: 'ACTIVE', reason: 'Revisão de acesso' })
    status = 'BLOCKED'
    return route.fulfill({ json: { userId: account.id, status, changed: true } })
  })
  await login(page)
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await expect(page.getByRole('cell', { name: account.email })).toBeVisible()
  await page.getByRole('button', { name: 'Gerenciar Camila Souza', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Operação', { exact: true }).selectOption('status')
  await dialog.getByLabel('Situação', { exact: true }).selectOption('BLOCKED')
  await dialog.getByLabel('Motivo obrigatório').fill('Revisão de acesso')
  await dialog.getByRole('button', { name: 'Revisar alteração', exact: true }).click()
  await expect(dialog).toContainText('Ativa → Bloqueada')
  expect(status).toBe('ACTIVE')
  await page.route('**/api/auth/users?*', route => route.fulfill({ json: { items: [{ ...account, status }], pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1, hasNextPage: false } } }))
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Bloqueada', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Gerenciar Camila Souza', exact: true }).click()
  await dialog.getByLabel('Papel', { exact: true }).selectOption('VISITOR')
  await dialog.getByLabel('Motivo obrigatório').fill('Revisar papel')
  await page.route('**/api/auth/users/analyst-1/role', route => route.fulfill({ status: 403, json: { message: 'private detail' } }))
  await dialog.getByRole('button', { name: 'Revisar alteração', exact: true }).click()
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Somente administradores')
  await expect(dialog).toContainText('Revisar papel')
  await expect(page.getByText('private detail')).toHaveCount(0)
})

test('auditoria consulta filtros no servidor, apresenta antes/depois e preserva contexto entre abas', async ({ page }) => {
  const queries: URLSearchParams[] = []
  await page.route('**/api/monitoring/audit?*', route => {
    queries.push(new URL(route.request().url()).searchParams)
    return route.fulfill({ json: { items: [{ id: 'event-1', actor: admin.id, actorLabel: admin.name, createdAt: '2026-11-17T17:20:00Z', action: 'monitoring.resumed', entityType: 'monitoring', entityId: 'global', before: { paused: true }, after: { paused: false }, reason: 'Manutenção concluída', outcome: 'success' }], pagination: { page: 1, pageSize: queries.at(-1)?.get('pageSize') === 'all' ? 'all' : 10, totalItems: 1, totalPages: 1, hasNextPage: false } } })
  })
  await login(page)
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'monitoring.resumed', exact: true })).toBeVisible()
  await page.getByRole('searchbox').fill('manutencao')
  await expect.poll(() => queries.at(-1)?.get('search')).toBe('manutencao')
  await page.getByLabel('Itens por página', { exact: true }).selectOption('all')
  await expect.poll(() => queries.at(-1)?.get('pageSize')).toBe('all')
  await page.getByRole('button', { name: 'Detalhes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Detalhes do evento' })).toBeVisible()
  await expect(page.getByText('"paused": true', { exact: false })).toBeVisible()
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click()
  await page.getByRole('link', { name: 'Auditoria', exact: true }).click()
  await expect(page.getByRole('searchbox')).toHaveValue('manutencao')
  await page.screenshot({ path: test.info().outputPath('auditoria-desktop.png'), fullPage: true })
})

test('configurações pessoais e usuários cabem no celular e mantêm navegação por teclado', async ({ page }) => {
  await mockAccounts(page)
  await login(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('main').getByRole('link', { name: 'Minha conta', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('conta-mobile.png'), fullPage: true })
  await page.getByRole('main').getByRole('link', { name: 'Usuários', exact: true }).click()
  await expect(page.getByRole('cell', { name: account.email })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Gerenciar Camila Souza', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.screenshot({ path: test.info().outputPath('usuarios-mobile.png'), fullPage: true })
})

for (const operation of [
  { kind: 'status', initial: 'BLOCKED', next: 'ACTIVE' },
  { kind: 'status', initial: 'ACTIVE', next: 'DEACTIVATED' },
  { kind: 'role', initial: 'ACTIVE', next: 'VISITOR' },
]) {
  test(`confirma ${operation.kind} para ${operation.next} e usa estado esperado do servidor`, async ({ page }) => {
    let current = { ...account, status: operation.initial }
    await page.route('**/api/auth/users?*', route => route.fulfill({ json: { items: [current], pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1, hasNextPage: false } } }))
    await page.route(`**/api/auth/users/analyst-1/${operation.kind}`, route => {
      const body = route.request().postDataJSON()
      expect(body.reason).toBe('Ajuste autorizado')
      if (operation.kind === 'role') {
        expect(body).toEqual({ role: operation.next, expectedRole: account.role, reason: 'Ajuste autorizado' })
        current = { ...current, role: operation.next }
        return route.fulfill({ json: current })
      }
      expect(body).toEqual({ status: operation.next, expectedStatus: operation.initial, reason: 'Ajuste autorizado' })
      current = { ...current, status: operation.next }
      return route.fulfill({ json: { userId: account.id, status: operation.next, changed: true } })
    })
    await login(page)
    await page.getByRole('link', { name: 'Usuários', exact: true }).click()
    await page.getByRole('button', { name: 'Gerenciar Camila Souza', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Operação', { exact: true }).selectOption(operation.kind)
    await dialog.getByLabel(operation.kind === 'role' ? 'Papel' : 'Situação', { exact: true }).selectOption(operation.next)
    await dialog.getByLabel('Motivo obrigatório').fill('Ajuste autorizado')
    await dialog.getByRole('button', { name: 'Revisar alteração', exact: true }).click()
    await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Operação confirmada' })).toBeVisible()
  })
}

test('conflito de papel preserva a confirmação e não atualiza a conta', async ({ page }) => {
  await mockAccounts(page)
  await page.route('**/api/auth/users/analyst-1/role', route => route.fulfill({ status: 409, json: { code: 'LAST_ADMIN' } }))
  await login(page)
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await page.getByRole('button', { name: 'Gerenciar Camila Souza', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Papel', { exact: true }).selectOption('ADMIN')
  await dialog.getByLabel('Motivo obrigatório').fill('Alteração em revisão')
  await dialog.getByRole('button', { name: 'Revisar alteração', exact: true }).click()
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Nenhuma alteração foi aplicada')
  await expect(dialog).toContainText('Alteração em revisão')
  await expect(page.getByRole('cell', { name: 'Analista', exact: true })).toBeVisible()
})

test('ausência de diagnóstico não apresenta saúde normal e bloqueia controle sem estado conhecido', async ({ page }) => {
  await login(page)
  await page.route('**/api/monitoring/health', route => route.fulfill({ json: { ...health, state: 'UNAVAILABLE', paused: null, latestCycle: null, sources: [], lastObservationAt: null } }))
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Monitoramento indisponível', exact: true })).toBeVisible()
  await expect(page.getByText('Não há diagnóstico das fontes.', { exact: false })).toBeVisible()
  await expect(page.getByText('Nenhum ciclo registrado.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pausar coleta', exact: true })).toBeDisabled()
})

test('usuários envia filtros e ordenação antes de paginar e preserva ordem ao limpar', async ({ page }) => {
  const queries: URLSearchParams[] = []
  await page.route('**/api/auth/users?*', route => {
    const query = new URL(route.request().url()).searchParams
    queries.push(query)
    const pageSize = query.get('pageSize') === 'all' ? 'all' : Number(query.get('pageSize'))
    return route.fulfill({ json: { items: [account], pagination: { page: 1, pageSize, totalItems: 1, totalPages: 1, hasNextPage: false } } })
  })
  await login(page)
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  const listing = page.getByRole('region', { name: 'Contas da organização', exact: true })
  await expect(listing.getByRole('columnheader', { name: 'Nome completo', exact: true })).toHaveAttribute('aria-sort', 'ascending')
  await listing.getByRole('searchbox').fill('São Paulo')
  await listing.getByRole('combobox', { name: 'Papel', exact: true }).selectOption('ANALYST')
  await expect.poll(() => queries.at(-1)?.get('role')).toBe('ANALYST')
  expect(queries.at(-1)?.get('search')).toBe('São Paulo')
  await listing.getByRole('button', { name: 'Nome completo', exact: true }).click()
  await expect.poll(() => queries.at(-1)?.get('sortDirection')).toBe('desc')
  await expect(listing.getByRole('columnheader', { name: 'Nome completo', exact: true })).toHaveAttribute('aria-sort', 'descending')
  await listing.getByLabel('Itens por página', { exact: true }).selectOption('all')
  await expect.poll(() => queries.at(-1)?.get('pageSize')).toBe('all')
  await page.getByRole('link', { name: 'Minha conta', exact: true }).click()
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await expect(listing.getByRole('searchbox')).toHaveValue('São Paulo')
  await listing.getByRole('button', { name: 'Limpar busca e filtros', exact: true }).click()
  await expect.poll(() => queries.at(-1)?.get('search')).toBeNull()
  expect(queries.at(-1)?.get('role')).toBeNull()
  expect(queries.at(-1)?.get('sortDirection')).toBe('desc')
  expect(queries.at(-1)?.get('page')).toBe('1')
})

test('troca a senha em Minha conta, trata falhas e pede novo login', async ({ page }) => {
  let writes = 0
  let responseStatus = 403
  await login(page, 'ANALYST')
  await page.screenshot({ path: test.info().outputPath('minha-conta.png'), fullPage: true })
  await page.route('**/api/auth/password/change', route => {
    writes++
    expect(route.request().headers().authorization).toBe('Bearer settings-token')
    expect(route.request().postDataJSON()).toEqual({ currentPassword: 'old-password', password: 'new-password' })
    return route.fulfill({ status: responseStatus })
  })
  await page.route('**/api/auth/sessions/logout', route => route.fulfill({ status: 204 }))
  const form = page.getByRole('heading', { name: 'Trocar senha', exact: true }).locator('..').locator('..').locator('form')
  const fill = async (confirmation = 'new-password') => {
    await form.getByLabel('Senha atual', { exact: true }).fill('old-password')
    await form.getByLabel('Nova senha', { exact: true }).fill('new-password')
    await form.getByLabel('Repita a nova senha', { exact: true }).fill(confirmation)
    await form.getByRole('button', { name: 'Trocar senha', exact: true }).click()
  }
  await fill('different-password')
  await expect(form.getByRole('alert')).toHaveText('As senhas não coincidem.')
  expect(writes).toBe(0)
  await fill()
  await expect(form.getByRole('alert')).toContainText('Confira a senha atual')
  await expect(form.getByLabel('Senha atual', { exact: true })).toHaveValue('')
  responseStatus = 503
  await fill()
  await expect(form.getByRole('alert')).toContainText('Não foi possível trocar a senha')
  responseStatus = 204
  await fill()
  await expect(page).toHaveURL(/\/login\?passwordChanged=true/)
  await expect(page.getByRole('status')).toHaveText('Senha alterada. Entre novamente.')
  expect(writes).toBe(3)
})
