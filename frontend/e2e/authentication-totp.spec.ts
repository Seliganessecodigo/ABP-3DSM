import { expect, test } from '@playwright/test'
import { gate, mockCatalog } from './support/catalog.ts'

test('Admin cadastra o autenticador e só recebe sessão após confirmar um código válido', async ({ page }) => {
  await mockCatalog(page, [])
  let profileRequests = 0

  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: 'admin@example.com',
      password: 'password123',
    })
    await route.fulfill({ json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'initial-setup-token', expiresIn: 300 } })
  })
  await page.route('**/api/auth/totp/setup', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ setupToken: 'initial-setup-token' })
    await route.fulfill({
      json: {
        setupToken: 'setup-confirmation-token',
        provisioningUri: 'otpauth://totp/GreenER:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GreenER&algorithm=SHA1&digits=6&period=30',
        expiresIn: 600,
      },
    })
  })
  await page.route('**/api/auth/totp/setup/confirm', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ setupToken: 'setup-confirmation-token', code: '000123' })
    await route.fulfill({ json: { accessToken: 'admin-access', refreshToken: 'admin-refresh', tokenType: 'Bearer', expiresIn: 900 } })
  })
  await page.route('**/api/auth/me', async (route) => {
    profileRequests += 1
    await route.fulfill({ json: { id: 'admin-1', organizationId: 'org-1', name: 'Admin GreenER', email: 'admin@example.com', role: 'ADMIN' } })
  })

  await page.goto('/login')
  await page.getByRole('combobox').selectOption('pt-BR')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  const setupHeading = page.getByRole('heading', { name: 'Configure seu autenticador' })
  await expect(setupHeading).toBeVisible()
  await expect(setupHeading).toBeFocused()
  await expect(page.getByRole('img', { name: 'QR code para configurar o autenticador' })).toBeVisible()
  expect(profileRequests).toBe(0)
  await page.getByLabel('Código do autenticador').fill('000123')
  await page.getByRole('button', { name: 'Confirmar e entrar' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Admin GreenER')).toBeVisible()
  expect(profileRequests).toBe(1)
})

test('código incorreto no cadastro mantém o QR e permite uma nova tentativa', async ({ page }) => {
  await mockCatalog(page, [])
  let confirmationRequests = 0
  let profileRequests = 0

  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'initial-setup-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/setup', async (route) => route.fulfill({
    json: {
      setupToken: 'setup-confirmation-token',
      provisioningUri: 'otpauth://totp/GreenER:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GreenER&algorithm=SHA1&digits=6&period=30',
      expiresIn: 600,
    },
  }))
  await page.route('**/api/auth/totp/setup/confirm', async (route) => {
    confirmationRequests += 1
    if (confirmationRequests === 1) {
      await route.fulfill({ status: 401, json: { code: 'INVALID_TOTP_CODE', message: 'internal detail' } })
      return
    }
    await route.fulfill({ json: { accessToken: 'admin-access', refreshToken: 'admin-refresh', tokenType: 'Bearer', expiresIn: 900 } })
  })
  await page.route('**/api/auth/me', async (route) => {
    profileRequests += 1
    await route.fulfill({ json: { id: 'admin-1', organizationId: 'org-1', name: 'Admin GreenER', email: 'admin@example.com', role: 'ADMIN' } })
  })

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Configure seu autenticador' })).toBeVisible()
  await page.getByLabel('Código do autenticador').fill('123456')
  await page.getByRole('button', { name: 'Confirmar e entrar' }).click()

  await expect(page.getByRole('alert')).toHaveText('Código inválido. Confira o aplicativo e tente novamente.')
  await expect(page.getByLabel('Código do autenticador')).toHaveValue('')
  await expect(page.getByRole('img', { name: 'QR Code para configurar o autenticador' })).toBeVisible()
  expect(profileRequests).toBe(0)

  await page.getByLabel('Código do autenticador').fill('000123')
  await page.getByRole('button', { name: 'Confirmar e entrar' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(confirmationRequests).toBe(2)
  expect(profileRequests).toBe(1)
})

test('chave manual fica recolhida e pode ser copiada quando solicitada', async ({ page }) => {
  await mockCatalog(page, [])
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'initial-setup-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/setup', async (route) => route.fulfill({
    json: {
      setupToken: 'setup-confirmation-token',
      provisioningUri: 'otpauth://totp/GreenER:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GreenER&algorithm=SHA1&digits=6&period=30',
      expiresIn: 600,
    },
  }))

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  const secret = page.getByText('JBSWY3DPEHPK3PXP', { exact: true })
  await expect(secret).toBeHidden()
  await page.getByText('Não consegue escanear?').click()
  await expect(secret).toBeVisible()
  await page.getByRole('button', { name: 'Copiar chave' }).click()
  await expect(page.getByRole('status')).toHaveText('Chave copiada.')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('JBSWY3DPEHPK3PXP')
})

test('Admin só recebe sessão após validar o desafio TOTP e o código preserva zeros iniciais', async ({ page }) => {
  await mockCatalog(page, [])
  let challengeRequests = 0
  let profileRequests = 0

  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_REQUIRED', challengeToken: 'login-challenge-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/challenge', async (route) => {
    challengeRequests += 1
    expect(route.request().postDataJSON()).toEqual({ challengeToken: 'login-challenge-token', code: '000007' })
    await route.fulfill({ json: { accessToken: 'admin-access', refreshToken: 'admin-refresh', tokenType: 'Bearer', expiresIn: 900 } })
  })
  await page.route('**/api/auth/me', async (route) => {
    profileRequests += 1
    await route.fulfill({ json: { id: 'admin-1', organizationId: 'org-1', name: 'Admin GreenER', email: 'admin@example.com', role: 'ADMIN' } })
  })

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible()
  expect(profileRequests).toBe(0)
  await page.getByLabel('Código do autenticador').fill('000007')
  await page.getByRole('button', { name: 'Verificar e entrar' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Admin GreenER')).toBeVisible()
  expect(challengeRequests).toBe(1)
  expect(profileRequests).toBe(1)
})

test('mantém desafio após códigos rejeitados e retorna ao login quando a API invalida a credencial', async ({ page }) => {
  await mockCatalog(page, [])
  let challengeRequests = 0
  let profileRequests = 0
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_REQUIRED', challengeToken: 'login-challenge-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/challenge', async (route) => {
    challengeRequests += 1
    const code = route.request().postDataJSON().code
    expect(code).toBe('123456')
    await route.fulfill(challengeRequests <= 5
      ? { status: 401, json: { code: 'INVALID_TOTP_CODE', message: 'internal detail' } }
      : { status: 401, json: { code: 'INVALID_TOTP_CHALLENGE', message: 'internal detail' } })
  })
  await page.route('**/api/auth/me', async (route) => {
    profileRequests += 1
    await route.fulfill({ json: { id: 'admin-1', organizationId: 'org-1', name: 'Admin GreenER', email: 'admin@example.com', role: 'ADMIN' } })
  })

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible()

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const codeInput = page.getByLabel('Código do autenticador')
    await codeInput.fill('123456')
    await page.getByRole('button', { name: 'Verificar e entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('Código inválido ou expirado. Tente novamente.')
    await expect(codeInput).toHaveValue('')
    await expect(codeInput).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible()
  }

  await page.getByLabel('Código do autenticador').fill('123456')
  await page.getByRole('button', { name: 'Verificar e entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Login administrativo' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText('A etapa de autenticação expirou. Entre novamente com suas credenciais.')
  await expect(page.getByLabel('Código do autenticador')).toHaveCount(0)
  expect(challengeRequests).toBe(6)
  expect(profileRequests).toBe(0)
})

test('cancelar o cadastro limpa o fluxo temporário e não persiste credenciais', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'initial-setup-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/setup', async (route) => route.fulfill({
    json: {
      setupToken: 'setup-confirmation-token',
      provisioningUri: 'otpauth://totp/GreenER:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GreenER&algorithm=SHA1&digits=6&period=30',
      expiresIn: 600,
    },
  }))

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('img', { name: 'QR Code para configurar o autenticador' })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar ao login' }).click()

  await expect(page.getByRole('heading', { name: 'Login administrativo' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'QR Code para configurar o autenticador' })).toHaveCount(0)
  await expect(page).toHaveURL('http://127.0.0.1:4173/login')
  const browserState = await page.evaluate(() => JSON.stringify({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    url: location.href,
  }))
  expect(browserState).not.toContain('initial-setup-token')
  expect(browserState).not.toContain('setup-confirmation-token')
  expect(browserState).not.toContain('JBSWY3DPEHPK3PXP')
})

test('formato inválido é anunciado no cliente sem chamar a API de desafio', async ({ page }) => {
  await mockCatalog(page, [])
  let challengeRequests = 0
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_REQUIRED', challengeToken: 'login-challenge-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/challenge', async (route) => {
    challengeRequests += 1
    await route.fulfill({ json: { accessToken: 'unused', refreshToken: 'unused', tokenType: 'Bearer', expiresIn: 900 } })
  })

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  const codeInput = page.getByLabel('Código do autenticador')
  await codeInput.fill('123')
  await page.getByRole('button', { name: 'Verificar e entrar' }).click()

  await expect(page.getByRole('alert')).toHaveText('Informe um código com seis dígitos.')
  await expect(codeInput).toBeFocused()
  expect(challengeRequests).toBe(0)
})

test('bloqueia novo envio enquanto a validação TOTP está pendente', async ({ page }) => {
  await mockCatalog(page, [])
  const validation = gate()
  let challengeRequests = 0
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_REQUIRED', challengeToken: 'login-challenge-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/challenge', async (route) => {
    challengeRequests += 1
    await validation.wait
    await route.fulfill({ json: { accessToken: 'admin-access', refreshToken: 'admin-refresh', tokenType: 'Bearer', expiresIn: 900 } })
  })
  await page.route('**/api/auth/me', async (route) => route.fulfill({
    json: { id: 'admin-1', organizationId: 'org-1', name: 'Admin GreenER', email: 'admin@example.com', role: 'ADMIN' },
  }))

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByLabel('Código do autenticador').fill('123456')
  await page.getByRole('button', { name: 'Verificar e entrar' }).click()
  const submitting = page.getByRole('button', { name: 'Verificando…' })
  await expect(submitting).toBeVisible()
  await expect(submitting).toBeDisabled()
  expect(challengeRequests).toBe(1)
  validation.release()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Admin GreenER')).toBeVisible()
})

test('credencial de setup recusada retorna ao login sem renovar credenciais', async ({ page }) => {
  await mockCatalog(page, [])
  let setupRequests = 0
  let confirmationRequests = 0
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'expired-setup-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/setup', async (route) => {
    setupRequests += 1
    await route.fulfill({ status: 401, json: { code: 'INVALID_TOTP_CHALLENGE', message: 'internal detail' } })
  })
  await page.route('**/api/auth/totp/setup/confirm', async (route) => {
    confirmationRequests += 1
    await route.fulfill({ json: { accessToken: 'unused', refreshToken: 'unused', tokenType: 'Bearer', expiresIn: 900 } })
  })

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('heading', { name: 'Login administrativo' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText('A etapa de autenticação expirou. Entre novamente com suas credenciais.')
  await expect(page.getByRole('img', { name: 'QR Code para configurar o autenticador' })).toHaveCount(0)
  expect(setupRequests).toBe(1)
  expect(confirmationRequests).toBe(0)
})

test('recarregar durante o desafio retorna ao login sem persistir a credencial temporária', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_REQUIRED', challengeToken: 'temporary-challenge-token', expiresIn: 300 },
  }))

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible()
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Login administrativo' })).toBeVisible()
  await expect(page.getByLabel('Código do autenticador')).toHaveCount(0)
  await expect(page).toHaveURL('http://127.0.0.1:4173/login')
  const browserState = await page.evaluate(() => JSON.stringify({
    local: Object.entries(localStorage),
    session: Object.entries(sessionStorage),
    url: location.href,
  }))
  expect(browserState).not.toContain('temporary-challenge-token')
})

test('limite de novos desafios mostra orientação sem expor detalhes do backend', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    status: 429,
    json: { code: 'TOTP_CHALLENGE_RATE_LIMITED', message: 'internal detail' },
  }))

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('alert')).toHaveText('Muitas tentativas de autenticação. Aguarde um pouco antes de tentar novamente.')
  await expect(page.getByText('internal detail')).toHaveCount(0)
  await expect(page.getByLabel('Senha')).toHaveValue('')
})

test('atraso progressivo orienta a pessoa a aguardar antes de novo login', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    status: 429,
    json: { code: 'TOTP_CHALLENGE_DELAYED', message: 'internal detail', retryAfterSeconds: 2 },
  }))

  await page.goto('/login')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('alert')).toHaveText('Aguarde um momento antes de tentar novamente.')
  await expect(page.getByText('internal detail')).toHaveCount(0)
})

test('cadastro TOTP apresenta textos nas oito localidades suportadas', async ({ page }) => {
  await mockCatalog(page, [])
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'initial-setup-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/setup', async (route) => route.fulfill({
    json: {
      setupToken: 'setup-confirmation-token',
      provisioningUri: 'otpauth://totp/GreenER:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GreenER&algorithm=SHA1&digits=6&period=30',
      expiresIn: 600,
    },
  }))
  const cases = [
    { locale: 'pt-BR', heading: 'Configure seu autenticador' },
    { locale: 'en-US', heading: 'Set up your authenticator' },
    { locale: 'es-ES', heading: 'Configura tu autenticador' },
    { locale: 'fr-FR', heading: 'Configurer votre authentificateur' },
    { locale: 'de-DE', heading: 'Authenticator einrichten' },
    { locale: 'it-IT', heading: 'Configura l’autenticatore' },
    { locale: 'ja-JP', heading: '認証アプリを設定' },
    { locale: 'zh-CN', heading: '设置身份验证器' },
  ]

  await page.goto('/login')
  await page.getByRole('combobox').selectOption('pt-BR')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  for (const item of cases) {
    await page.getByRole('combobox').selectOption(item.locale)
    await expect(page.locator('html')).toHaveAttribute('lang', item.locale)
    await expect(page.getByRole('heading', { level: 2, name: item.heading, exact: true })).toBeVisible()
    await expect(page.getByRole('textbox')).toHaveCount(1)
  }
})

test('cadastro do autenticador cabe em uma tela móvel sem rolagem horizontal', async ({ page }) => {
  await mockCatalog(page, [])
  await page.setViewportSize({ width: 320, height: 780 })
  await page.route('**/api/auth/login', async (route) => route.fulfill({
    json: { status: 'TOTP_SETUP_REQUIRED', setupToken: 'initial-setup-token', expiresIn: 300 },
  }))
  await page.route('**/api/auth/totp/setup', async (route) => route.fulfill({
    json: {
      setupToken: 'setup-confirmation-token',
      provisioningUri: 'otpauth://totp/GreenER:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=GreenER&algorithm=SHA1&digits=6&period=30',
      expiresIn: 600,
    },
  }))

  await page.goto('/login')
  await page.getByRole('combobox').selectOption('pt-BR')
  await page.getByLabel('E-mail institucional').fill('admin@example.com')
  await page.getByLabel('Senha').fill('password123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('img', { name: 'QR Code para configurar o autenticador' })).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
})
