import { expect, test } from '@playwright/test'

test('pessoa inicia login Google sem convite e mantém o login local disponível', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('combobox').selectOption('pt-BR')

  await expect(page.getByLabel('E-mail institucional')).toBeVisible()
  await expect(page.getByLabel('Senha')).toBeVisible()

  let startUrl: URL | undefined
  await page.route('**/api/auth/sso/google**', async (route) => {
    startUrl = new URL(route.request().url())
    await route.abort()
  })

  await page.getByRole('button', { name: 'Entrar com Google' }).click({ noWaitAfter: true })

  await expect.poll(() => startUrl?.pathname).toBe('/api/auth/sso/google')
  expect(startUrl?.pathname).toBe('/api/auth/sso/google')
  expect(startUrl?.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(startUrl?.searchParams.has('invite')).toBe(false)
})

test('pessoa aceita convite explicitamente e o fragmento não permanece na URL', async ({ page }) => {
  await page.goto('/login#sso_invite=invitation-secret')
  await page.getByRole('combobox').selectOption('pt-BR')
  await expect(page.getByLabel('E-mail institucional')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)

  let startUrl: URL | undefined
  await page.route('**/api/auth/sso/google**', async (route) => {
    startUrl = new URL(route.request().url())
    await route.abort()
  })
  await page.getByRole('button', { name: 'Aceitar convite e continuar com Google' }).click({ noWaitAfter: true })

  await expect.poll(() => startUrl?.searchParams.get('invite')).toBe('invitation-secret')
  expect(startUrl?.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
})

test('pessoa troca o handoff por sessão e o código some da URL', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => sessionStorage.setItem('greener.sso.verifier', 'v'.repeat(43)))
  expect(await page.evaluate(() => sessionStorage.getItem('greener.sso.verifier'))).toBe('v'.repeat(43))
  let exchangeBody: { code: string; codeVerifier: string } | undefined
  await page.route('**/api/auth/sso/handoff/exchange', async (route) => {
    exchangeBody = route.request().postDataJSON() as { code: string; codeVerifier: string }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'access-token', refreshToken: 'refresh-token', tokenType: 'Bearer', expiresIn: 300 }),
    })
  })
  await page.route('**/api/auth/me', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'user-1', organizationId: 'org-1', name: 'SSO Analyst', email: 'analyst@example.test', role: 'ANALYST' }),
  }))

  await page.goto('/sso/callback?code=single-use-handoff&return_to=https%3A%2F%2Fevil.example.test')

  await expect.poll(() => exchangeBody?.code).toBe('single-use-handoff')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('SSO Analyst')).toBeVisible()
  expect(exchangeBody).toEqual({ code: 'single-use-handoff', codeVerifier: 'v'.repeat(43) })
  expect(await page.evaluate(() => sessionStorage.getItem('greener.sso.verifier'))).toBeNull()
})

test('pessoa conclui desafio TOTP recebido no handoff SSO antes de ganhar sessão', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('combobox').selectOption('en-US')
  await page.evaluate(() => sessionStorage.setItem('greener.sso.verifier', 'v'.repeat(43)))
  await page.route('**/api/auth/sso/handoff/exchange', async route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'TOTP_REQUIRED', challengeToken: 'totp-challenge', expiresIn: 300 }),
  }))
  let submittedCode: string | undefined
  await page.route('**/api/auth/totp/challenge', async route => {
    submittedCode = (route.request().postDataJSON() as { code: string }).code
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'access-token', refreshToken: 'refresh-token', tokenType: 'Bearer', expiresIn: 300 }),
    })
  })
  await page.route('**/api/auth/me', async route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'admin-1', organizationId: 'org-1', name: 'SSO Admin', email: 'admin@example.test', role: 'ADMIN' }),
  }))

  await page.goto('/sso/callback?code=admin-handoff')
  await expect(page.getByRole('heading', { name: 'Two-step verification' })).toBeVisible()
  await page.getByLabel('Authenticator code').fill('123456')
  await page.getByRole('button', { name: 'Verify and sign in' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('SSO Admin')).toBeVisible()
  expect(submittedCode).toBe('123456')
})

test('callback recusado mostra erro genérico e permite repetir com convite na mesma aba', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('combobox').selectOption('en-US')
  await page.evaluate(() => sessionStorage.setItem('greener.sso.invite', 'invitation-secret'))
  await page.goto('/sso/callback?error=SSO_AUTHENTICATION_FAILED')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/sso\/callback$/)

  let retryUrl: URL | undefined
  await page.route('**/api/auth/sso/google**', async route => {
    retryUrl = new URL(route.request().url())
    await route.abort()
  })
  await page.getByRole('button', { name: 'Try Google again' }).click({ noWaitAfter: true })

  await expect.poll(() => retryUrl?.searchParams.get('invite')).toBe('invitation-secret')
  expect(retryUrl?.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
})

test('handoff expirado ou reutilizado não inicia sessão e oferece nova tentativa', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => sessionStorage.setItem('greener.sso.verifier', 'v'.repeat(43)))
  let sessionRequested = false
  await page.route('**/api/auth/sso/handoff/exchange', async route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'INVALID_SSO_HANDOFF', message: 'invalid' }),
  }))
  await page.route('**/api/auth/me', async route => { sessionRequested = true; await route.continue() })

  await page.goto('/sso/callback?code=expired-handoff')

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/sso\/callback$/)
  expect(sessionRequested).toBe(false)
  expect(await page.evaluate(() => sessionStorage.getItem('greener.sso.verifier'))).toBeNull()
})
