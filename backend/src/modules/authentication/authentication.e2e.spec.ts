import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { createHash, createHmac, createSign, generateKeyPairSync, randomBytes } from 'node:crypto'
import { AppModule } from '../../app.module'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../../database/migrations/1791350000000-DiscoverApplications'
import { ApplicationOperationalStatus1791360000000 } from '../../database/migrations/1791360000000-ApplicationOperationalStatus'
import { AuthenticationAndOrganizations1791370000000 } from '../../database/migrations/1791370000000-AuthenticationAndOrganizations'
import { AdminTotpAuthentication1791380000000 } from '../../database/migrations/1791380000000-AdminTotpAuthentication'
import { SsoAuthentication1791390000000 } from '../../database/migrations/1791390000000-SsoAuthentication'
import { EMAIL_DELIVERY, EmailDelivery } from './email-delivery'
import { AuthenticationService } from './authentication.service'
import { AUTH_CLOCK, AuthClock } from './clock'
import { PasswordHasher } from './password-hasher.service'
import {
  GOOGLE_OIDC_TRANSPORT,
  GoogleOidcTransport,
} from './google-oidc-transport'
import { AccessTokenService } from './access-token.service'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip

describeWithDatabase('autenticação por HTTP com PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
  let organizationId: string
  let otherOrganizationId: string
  let userId: string
  const previousEnvironment = new Map<string, string | undefined>()
  const createdOrganizationSlugs: string[] = []
  let testNow = new Date()
  const testClock: AuthClock = { now: () => new Date(testNow) }
  const sentEmails: Array<{ to: string; subject: string; text: string }> = []
  const emailDelivery: EmailDelivery = {
    send: async (to, subject, text) => {
      sentEmails.push({ to, subject, text })
    },
  }
  const googleKeys = generateKeyPairSync('rsa', { modulusLength: 2048 })
  let expectedGoogleNonce = ''
  let googleIdentity = {
    subject: 'google-test-subject',
    email: 'new-analyst@example.test',
    emailVerified: true,
  }
  let googleClaimOverrides: Record<string, unknown> = {}
  let receivedGoogleCodeVerifier = ''
  const googleTransport: GoogleOidcTransport = {
    exchangeCode: async (input) => {
      receivedGoogleCodeVerifier = input.codeVerifier
      return {
        id_token: signedGoogleIdToken(googleKeys.privateKey, {
        iss: 'https://accounts.google.com',
        aud: 'test-google-client-id',
        sub: googleIdentity.subject,
        email: googleIdentity.email,
        email_verified: googleIdentity.emailVerified,
        nonce: expectedGoogleNonce,
        exp: Math.floor(testNow.getTime() / 1000) + 300,
        ...googleClaimOverrides,
        }),
      }
    },
    getSigningKeys: async () => ({
      keys: [
        {
          ...googleKeys.publicKey.export({ format: 'jwk' }),
          kid: 'test-google-key',
          alg: 'RS256',
          use: 'sig',
        },
      ],
    }),
  }

  beforeAll(async () => {
    if (!testDatabaseUrl)
      throw new Error('TEST_DATABASE_URL é obrigatório para este teste')
    for (const key of [
      'DATABASE_URL',
      'AUTH_JWT_SECRET',
      'AUTH_PASSWORD_PEPPER',
      'AUTH_PASSWORD_PEPPER_KEYS',
      'AUTH_PASSWORD_PEPPER_VERSION',
      'AUTH_TOTP_ENCRYPTION_KEYS',
      'AUTH_TOTP_ENCRYPTION_KEY_VERSION',
      'APP_BASE_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_CALLBACK_URL',
      'SSO_RETURN_URL',
    ]) {
      previousEnvironment.set(key, process.env[key])
    }
    process.env.DATABASE_URL = testDatabaseUrl
    process.env.AUTH_JWT_SECRET = 'test-only-jwt-signing-secret-with-32-bytes'
    process.env.AUTH_PASSWORD_PEPPER =
      'test-only-password-pepper-with-at-least-32-bytes'
    process.env.AUTH_PASSWORD_PEPPER_VERSION = 'v1'
    process.env.AUTH_PASSWORD_PEPPER_KEYS = JSON.stringify({
      v1: process.env.AUTH_PASSWORD_PEPPER,
    })
    process.env.AUTH_TOTP_ENCRYPTION_KEY_VERSION = 'test-v1'
    process.env.AUTH_TOTP_ENCRYPTION_KEYS = JSON.stringify({
      'test-v1': Buffer.alloc(32, 7).toString('base64'),
    })
    process.env.APP_BASE_URL = 'https://app.example.test'

    database = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      migrations: [
        InitialSchema1791240000000,
        CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000,
        CarbonFactorSnapshots1791340000000,
        DiscoverApplications1791350000000,
        ApplicationOperationalStatus1791360000000,
        AuthenticationAndOrganizations1791370000000,
        AdminTotpAuthentication1791380000000,
        SsoAuthentication1791390000000,
      ],
    })
    await database.initialize()
    await database.runMigrations()

    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_DELIVERY)
      .useValue(emailDelivery)
      .overrideProvider(AUTH_CLOCK)
      .useValue(testClock)
      .overrideProvider(GOOGLE_OIDC_TRANSPORT)
      .useValue(googleTransport)
      .compile()
    app = testingModule.createNestApplication({ logger: false })
    await app.listen(0, '127.0.0.1')
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    process.env.GOOGLE_CALLBACK_URL = `${await app.getUrl()}/auth/sso/google/callback`
    process.env.SSO_RETURN_URL = 'https://app.example.test/sso/callback'

    const [organization] = await database.query(
      `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
      ['Authentication Test', `auth-test-${Date.now()}`],
    )
    organizationId = organization.id as string
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    const [user] = await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ANALYST', true, $4, now()) RETURNING id`,
      ['Test Analyst', 'analyst@example.test', passwordHash, organizationId],
    )
    userId = user.id as string
  })

  afterAll(async () => {
    if (database?.isInitialized && organizationId) {
      await database.query(
        `DELETE FROM audit_logs
         WHERE "entityId" = ANY($1::text[])
            OR "actorUserId" = ANY($2::uuid[])`,
        [[organizationId, userId], [userId]],
      )
      await database.query('DELETE FROM users WHERE "organizationId" = $1', [
        organizationId,
      ])
      if (otherOrganizationId) {
        await database.query('DELETE FROM organizations WHERE id = $1', [
          otherOrganizationId,
        ])
      }
      await database.query('DELETE FROM organizations WHERE id = $1', [
        organizationId,
      ])
      for (const slug of createdOrganizationSlugs) {
        const [organization] = await database.query(
          'SELECT id FROM organizations WHERE slug = $1',
          [slug],
        )
        if (organization) {
          await database.query(
            `DELETE FROM audit_logs
             WHERE "entityId" = $1::text
                OR "entityId" IN (SELECT id::text FROM users WHERE "organizationId" = $2::uuid)
                OR "actorUserId" IN (SELECT id FROM users WHERE "organizationId" = $2::uuid)`,
            [organization.id, organization.id],
          )
          await database.query(
            'DELETE FROM users WHERE "organizationId" = $1',
            [organization.id],
          )
        }
        await database.query('DELETE FROM organizations WHERE slug = $1', [
          slug,
        ])
      }
      await database.destroy()
    }
    await app?.close()
    for (const [key, value] of previousEnvironment) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  beforeEach(() => {
    sentEmails.splice(0, sentEmails.length)
    testNow = new Date()
    expectedGoogleNonce = ''
    googleIdentity = {
      subject: `google-${randomBytes(8).toString('hex')}`,
      email: 'new-analyst@example.test',
      emailVerified: true,
    }
    googleClaimOverrides = {}
    receivedGoogleCodeVerifier = ''
  })

  async function login(
    email = 'analyst@example.test',
    password = 'testing password phrase',
  ) {
    const response = await fetch(new URL('/auth/login', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return {
      response,
      body: (await response.json()) as Record<string, unknown>,
    }
  }

  async function createSsoAdminSession(email: string) {
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ADMIN', true, $4, now())`,
      ['SSO Test Admin', email, passwordHash, organizationId],
    )
    const firstLogin = await login(email, 'testing password phrase')
    const setup = await fetch(new URL('/auth/totp/setup', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setupToken: firstLogin.body.setupToken }),
    })
    const setupBody = (await setup.json()) as Record<string, unknown>
    const secret = new URL(setupBody.provisioningUri as string)
      .searchParams.get('secret')!
    const confirmedSetup = await fetch(
      new URL('/auth/totp/setup/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          setupToken: setupBody.setupToken,
          code: totpCode(secret, testNow.getTime() - 30_000),
        }),
      },
    )
    return (await confirmedSetup.json()) as Record<string, unknown>
  }

  function invitationTokenFromEmail(text: string): string {
    const inviteUrl = new URL(text.match(/https:\/\/\S+/)![0])
    const token =
      inviteUrl.searchParams.get('token') ??
      new URLSearchParams(inviteUrl.hash.slice(1)).get('sso_invite')
    if (!token) throw new Error('SSO invitation token missing from test email')
    return token
  }

  async function createSsoInvitation(
    email: string,
    name: string,
    role: 'ADMIN' | 'ANALYST' | 'VISITOR' = 'ANALYST',
    organization = organizationId,
  ): Promise<string> {
    const token = randomBytes(48).toString('base64url')
    await database.query(
      `INSERT INTO sso_invitations (
        "tokenHash", "organizationId", email, name, role, "createdByUserId",
        "expiresAt", "consumedAt", "revokedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL)`,
      [
        app.get(AccessTokenService).hashOpaqueToken(token),
        organization,
        email,
        name,
        role,
        userId,
        new Date(testNow.getTime() + 24 * 60 * 60 * 1000),
      ],
    )
    return token
  }

  async function beginGoogleSso(codeVerifier: string, inviteToken?: string) {
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
    const url = new URL('/auth/sso/google', await app.getUrl())
    url.searchParams.set('code_challenge', codeChallenge)
    if (inviteToken) url.searchParams.set('invite', inviteToken)
    const response = await fetch(url, { redirect: 'manual' })
    const authorizationUrl = new URL(response.headers.get('location')!)
    expectedGoogleNonce = authorizationUrl.searchParams.get('nonce') ?? ''
    const setCookieHeader = response.headers.get('set-cookie')!
    const stateCookie = setCookieHeader.split(';', 1)[0]
    return { response, authorizationUrl, stateCookie, setCookieHeader }
  }

  async function finishGoogleSso(stateCookie: string, state: string) {
    const url = new URL('/auth/sso/google/callback', await app.getUrl())
    url.searchParams.set('code', 'test-google-authorization-code')
    url.searchParams.set('state', state)
    return fetch(url, {
      redirect: 'manual',
      headers: { cookie: stateCookie },
    })
  }

  async function exchangeHandoff(code: string, codeVerifier: string) {
    return fetch(new URL('/auth/sso/handoff/exchange', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, codeVerifier }),
    })
  }

  beforeAll(async () => {
    const [otherOrganization] = await database.query(
      'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
      ['Other Authentication Test', `other-auth-test-${Date.now()}`],
    )
    otherOrganizationId = otherOrganization.id as string
  })

  it('autentica e retorna somente os dados públicos da conta', async () => {
    const { response, body } = await login()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 })
    expect(typeof body.accessToken).toBe('string')
    expect(typeof body.refreshToken).toBe('string')
    expect(JSON.stringify(body)).not.toContain('passwordHash')

    const me = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${body.accessToken as string}` },
    })
    expect(me.status).toBe(200)
    expect(await me.json()).toEqual({
      id: userId,
      organizationId,
      name: 'Test Analyst',
      email: 'analyst@example.test',
      role: 'ANALYST',
    })

    const publicHealth = await fetch(new URL('/health', await app.getUrl()))
    expect(publicHealth.status).toBe(200)
  })

  it('aceita pepper legado durante rotação e falha fechado para hash inválido', async () => {
    const originalVersion = process.env.AUTH_PASSWORD_PEPPER_VERSION
    const originalKeys = process.env.AUTH_PASSWORD_PEPPER_KEYS
    const legacyPepper = 'test-only-legacy-pepper-with-at-least-32-bytes'
    const nextPepper = 'test-only-next-pepper-with-at-least-32-bytes'
    try {
      process.env.AUTH_PASSWORD_PEPPER_KEYS = JSON.stringify({
        legacy: legacyPepper,
        v1: process.env.AUTH_PASSWORD_PEPPER,
        v2: nextPepper,
      })
      process.env.AUTH_PASSWORD_PEPPER_VERSION = 'legacy'
      const legacyHash = await app
        .get(PasswordHasher)
        .hash('testing password phrase')
      const unversionedHash = legacyHash.replace(/^pepper\$legacy\$/, '')
      const legacyEmail = `legacy-pepper-${Date.now()}@example.test`
      await database.query(
        `INSERT INTO users (
          name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
        ) VALUES ($1, $2, $3, 'ANALYST', true, $4, now())`,
        ['Legacy Pepper User', legacyEmail, unversionedHash, organizationId],
      )
      const malformedEmail = `malformed-hash-${Date.now()}@example.test`
      await database.query(
        `INSERT INTO users (
          name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
        ) VALUES ($1, $2, $3, 'ANALYST', true, $4, now())`,
        [
          'Malformed Hash User',
          malformedEmail,
          'pepper$v1$not-a-valid-argon-hash',
          organizationId,
        ],
      )

      process.env.AUTH_PASSWORD_PEPPER_VERSION = 'v2'
      const migratedLogin = await login(legacyEmail, 'testing password phrase')
      expect(migratedLogin.response.status).toBe(200)
      const malformedLogin = await login(
        malformedEmail,
        'testing password phrase',
      )
      expect(malformedLogin.response.status).toBe(401)
    } finally {
      process.env.AUTH_PASSWORD_PEPPER_VERSION = originalVersion
      if (originalKeys === undefined) delete process.env.AUTH_PASSWORD_PEPPER_KEYS
      else process.env.AUTH_PASSWORD_PEPPER_KEYS = originalKeys
    }
  })

  it('não cria sessão para Admin sem TOTP e inicia configuração limitada', async () => {
    const email = `admin-totp-${Date.now()}@example.test`
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ADMIN', true, $4, now())`,
      ['TOTP Admin', email, passwordHash, organizationId],
    )
    const { response, body } = await login(
      email,
      'testing password phrase',
    )

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ status: 'TOTP_SETUP_REQUIRED', expiresIn: 300 })
    expect(typeof body.setupToken).toBe('string')
    expect(body).not.toHaveProperty('accessToken')
    expect(body).not.toHaveProperty('refreshToken')
    const privateResponse = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${body.setupToken as string}` },
    })
    expect(privateResponse.status).toBe(401)
  })

  it('configura TOTP do primeiro Admin e exige código em logins seguintes', async () => {
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe(
      '287082',
    )
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1_111_111_109_000)).toBe(
      '081804',
    )
    const email = `admin-totp-flow-${Date.now()}@example.test`
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ADMIN', true, $4, now())`,
      ['TOTP Flow Admin', email, passwordHash, organizationId],
    )

    const firstLogin = await login(email, 'testing password phrase')
    const setup = await fetch(new URL('/auth/totp/setup', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setupToken: firstLogin.body.setupToken }),
    })
    expect(setup.status).toBe(200)
    const setupBody = (await setup.json()) as Record<string, unknown>
    const provisioningUri = new URL(setupBody.provisioningUri as string)
    const secret = provisioningUri.searchParams.get('secret')
    expect(provisioningUri.protocol).toBe('otpauth:')
    expect(provisioningUri.searchParams.get('algorithm')).toBe('SHA1')
    expect(provisioningUri.searchParams.get('digits')).toBe('6')
    expect(provisioningUri.searchParams.get('period')).toBe('30')
    expect(secret).toBeTruthy()

    const confirmation = await fetch(
      new URL('/auth/totp/setup/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          setupToken: setupBody.setupToken,
          code: totpCode(secret!, testNow.getTime() - 30_000),
        }),
      },
    )
    expect(confirmation.status).toBe(200)
    const session = (await confirmation.json()) as Record<string, unknown>
    expect(session.accessToken).toBeTruthy()
    const setupMe = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${session.accessToken as string}` },
    })
    expect(setupMe.status).toBe(200)

    const nextStep = Math.floor(testNow.getTime() / 30_000) + 1
    testNow = new Date(nextStep * 30_000)
    const secondLogin = await login(email, 'testing password phrase')
    expect(secondLogin.body).toMatchObject({
      status: 'TOTP_REQUIRED',
      expiresIn: 300,
    })
    expect(secondLogin.body).not.toHaveProperty('accessToken')

    const immediateRetry = await login(email, 'testing password phrase')
    expect(immediateRetry.response.status).toBe(429)
    testNow = new Date(testNow.getTime() + 1_000)

    const verified = await fetch(
      new URL('/auth/totp/challenge', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          challengeToken: secondLogin.body.challengeToken,
          code: totpCode(secret!, testNow.getTime() + 30_000),
        }),
      },
    )
    expect(verified.status).toBe(200)
    expect((await verified.json()).accessToken).toBeTruthy()

    testNow = new Date(testNow.getTime() + 2_000)
    const replayChallenge = await login(email, 'testing password phrase')
    expect(replayChallenge.body.status).toBe('TOTP_REQUIRED')
    const replay = await fetch(new URL('/auth/totp/challenge', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        challengeToken: replayChallenge.body.challengeToken,
        code: totpCode(secret!, testNow.getTime()),
      }),
    })
    expect(replay.status).toBe(401)

    testNow = new Date(testNow.getTime() + 2_000)
    const exhaustedChallenge = await login(email, 'testing password phrase')
    expect(exhaustedChallenge.body.status).toBe('TOTP_REQUIRED')
    const submitWrongCode = async () =>
      fetch(new URL('/auth/totp/challenge', await app.getUrl()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          challengeToken: exhaustedChallenge.body.challengeToken,
          code: '000000',
        }),
      })
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await submitWrongCode()).status).toBe(401)
    }
    const exhausted = await submitWrongCode()
    expect(await exhausted.json()).toMatchObject({ code: 'INVALID_TOTP_CHALLENGE' })

    testNow = new Date(testNow.getTime() + 4_000)
    const fourthChallenge = await login(email, 'testing password phrase')
    expect(fourthChallenge.body.status).toBe('TOTP_REQUIRED')
    testNow = new Date(testNow.getTime() + 8_000)
    const fifthChallenge = await login(email, 'testing password phrase')
    expect(fifthChallenge.body.status).toBe('TOTP_REQUIRED')
    const rateLimited = await login(email, 'testing password phrase')
    expect(rateLimited.response.status).toBe(429)
    expect(rateLimited.body).toMatchObject({
      code: 'TOTP_CHALLENGE_RATE_LIMITED',
    })
    testNow = new Date(testNow.getTime() + 5 * 60_000 + 1)
    const expiredChallenge = await fetch(
      new URL('/auth/totp/challenge', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          challengeToken: fifthChallenge.body.challengeToken,
          code: totpCode(secret!, testNow.getTime()),
        }),
      },
    )
    expect(expiredChallenge.status).toBe(401)
  })

  it('expira a credencial de setup em cinco minutos e o cadastro pendente em dez', async () => {
    const email = `admin-totp-expiry-${Date.now()}@example.test`
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ADMIN', true, $4, now())`,
      ['TOTP Expiry Admin', email, passwordHash, organizationId],
    )
    const expiredSetup = await login(email, 'testing password phrase')
    testNow = new Date(testNow.getTime() + 5 * 60_000 + 1)
    const expiredPreparation = await fetch(
      new URL('/auth/totp/setup', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setupToken: expiredSetup.body.setupToken }),
      },
    )
    expect(expiredPreparation.status).toBe(401)

    const freshSetup = await login(email, 'testing password phrase')
    const preparation = await fetch(
      new URL('/auth/totp/setup', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ setupToken: freshSetup.body.setupToken }),
      },
    )
    const preparationBody = (await preparation.json()) as Record<string, unknown>
    const secret = new URL(preparationBody.provisioningUri as string)
      .searchParams.get('secret')!
    testNow = new Date(testNow.getTime() + 10 * 60_000 + 1)
    const expiredConfirmation = await fetch(
      new URL('/auth/totp/setup/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          setupToken: preparationBody.setupToken,
          code: totpCode(secret, testNow.getTime()),
        }),
      },
    )
    expect(expiredConfirmation.status).toBe(401)
  })

  it('troca o autenticador somente após reautenticação e revoga as sessões antigas', async () => {
    const email = `admin-totp-replace-${Date.now()}@example.test`
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ADMIN', true, $4, now())`,
      ['TOTP Replacement Admin', email, passwordHash, organizationId],
    )
    const setupLogin = await login(email, 'testing password phrase')
    const setup = await fetch(new URL('/auth/totp/setup', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setupToken: setupLogin.body.setupToken }),
    })
    const setupBody = (await setup.json()) as Record<string, unknown>
    const oldSecret = new URL(setupBody.provisioningUri as string)
      .searchParams.get('secret')!
    const activated = await fetch(
      new URL('/auth/totp/setup/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          setupToken: setupBody.setupToken,
          code: totpCode(oldSecret, testNow.getTime() - 30_000),
        }),
      },
    )
    const oldSession = (await activated.json()) as Record<string, unknown>

    const replacement = await fetch(
      new URL('/auth/totp/replacement', await app.getUrl()),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${oldSession.accessToken as string}`,
        },
        body: JSON.stringify({
          password: 'testing password phrase',
          currentCode: totpCode(oldSecret, testNow.getTime()),
        }),
      },
    )
    expect(replacement.status).toBe(200)
    const replacementBody = (await replacement.json()) as Record<string, unknown>
    const newSecret = new URL(replacementBody.provisioningUri as string)
      .searchParams.get('secret')!
    expect(newSecret).not.toBe(oldSecret)

    const confirmedReplacement = await fetch(
      new URL('/auth/totp/replacement/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${oldSession.accessToken as string}`,
        },
        body: JSON.stringify({
          confirmationToken: replacementBody.confirmationToken,
          code: totpCode(newSecret, testNow.getTime()),
        }),
      },
    )
    expect(confirmedReplacement.status).toBe(200)
    expect(
      (
        await fetch(new URL('/auth/me', await app.getUrl()), {
          headers: { authorization: `Bearer ${oldSession.accessToken as string}` },
        })
      ).status,
    ).toBe(401)

    testNow = new Date((Math.floor(testNow.getTime() / 30_000) + 1) * 30_000)
    const nextLogin = await login(email, 'testing password phrase')
    expect(nextLogin.body.status).toBe('TOTP_REQUIRED')
    const verify = async (code: string) =>
      fetch(new URL('/auth/totp/challenge', await app.getUrl()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          challengeToken: nextLogin.body.challengeToken,
          code,
        }),
      })
    const oldCode = await verify(totpCode(oldSecret, testNow.getTime()))
    expect(oldCode.status).toBe(401)
    const newCode = await verify(totpCode(newSecret, testNow.getTime()))
    expect(newCode.status).toBe(200)
  })

  it('responde da mesma forma para senha e e-mail inválidos', async () => {
    const wrongPassword = await login('analyst@example.test', 'wrong password')
    const unknownEmail = await login('missing@example.test')
    expect(wrongPassword.response.status).toBe(401)
    expect(unknownEmail.response.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
  })

  it('autentica pelo e-mail sem exigir organização no corpo da requisição', async () => {
    const { response, body } = await login()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 })
    expect(body).not.toHaveProperty('organization')
  })

  it('não aceita organização como campo obrigatório do contrato de login', async () => {
    const response = await fetch(new URL('/auth/login', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@example.test', password: 'testing password phrase' }),
    })
    expect(response.status).toBe(200)
  })

  it('rotaciona refresh tokens e rejeita o valor anterior', async () => {
    const first = await login()
    const refresh = async (token: string) =>
      fetch(new URL('/auth/sessions/refresh', await app.getUrl()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      })
    const second = await refresh(first.body.refreshToken as string)
    expect(second.status).toBe(200)
    const secondBody = (await second.json()) as Record<string, unknown>
    expect(secondBody.refreshToken).not.toBe(first.body.refreshToken)
    expect((await refresh(first.body.refreshToken as string)).status).toBe(401)
  })

  it('revoga somente a sessão atual ao sair', async () => {
    const first = await login()
    const second = await login()
    const logout = await fetch(
      new URL('/auth/sessions/logout', await app.getUrl()),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${first.body.accessToken as string}`,
        },
      },
    )
    expect(logout.status).toBe(204)
    const firstSession = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${first.body.accessToken as string}` },
    })
    const secondSession = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${second.body.accessToken as string}` },
    })
    expect(firstSession.status).toBe(401)
    expect(secondSession.status).toBe(200)
  })

  it('bloqueia imediatamente uma conta desativada com sessão aberta', async () => {
    const session = await login()
    const anotherSession = await login()
    await database.query('UPDATE users SET "isActive" = false WHERE id = $1', [
      userId,
    ])
    const response = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: {
        authorization: `Bearer ${session.body.accessToken as string}`,
      },
    })
    expect(response.status).toBe(401)
    const otherResponse = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: {
        authorization: `Bearer ${anotherSession.body.accessToken as string}`,
      },
    })
    expect(otherResponse.status).toBe(401)
    await database.query('UPDATE users SET "isActive" = true WHERE id = $1', [
      userId,
    ])
  })

  it('expira o access token após 15 minutos e a sessão após 12 horas sem atividade', async () => {
    const accessSession = await login()
    testNow = new Date(testNow.getTime() + 15 * 60 * 1000 + 1)
    const expiredAccess = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: {
        authorization: `Bearer ${accessSession.body.accessToken as string}`,
      },
    })
    expect(expiredAccess.status).toBe(401)

    const idleSession = await login()
    testNow = new Date(testNow.getTime() + 12 * 60 * 60 * 1000 + 1)
    const expiredIdle = await fetch(
      new URL('/auth/sessions/refresh', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: idleSession.body.refreshToken }),
      },
    )
    expect(expiredIdle.status).toBe(401)
  })

  it('exige JWT para a rota privada e mantém as rotas públicas acessíveis', async () => {
    const privateResponse = await fetch(new URL('/auth/me', await app.getUrl()))
    const publicResponse = await fetch(new URL('/health', await app.getUrl()))
    expect(privateResponse.status).toBe(401)
    expect(publicResponse.status).toBe(200)
  })

  it('aplica o limite absoluto de sete dias mesmo com atividade recente', async () => {
    const session = await login()
    testNow = new Date(testNow.getTime() + 6 * 24 * 60 * 60 * 1000)
    const [sessionRecord] = await database.query(
      'SELECT id FROM auth_sessions WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [userId],
    )
    await database.query(
      'UPDATE auth_sessions SET "lastActivityAt" = $1 WHERE id = $2',
      [testNow, sessionRecord.id],
    )
    const refreshed = await fetch(
      new URL('/auth/sessions/refresh', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.body.refreshToken }),
      },
    )
    expect(refreshed.status).toBe(200)
    const refreshedBody = (await refreshed.json()) as Record<string, unknown>
    testNow = new Date(testNow.getTime() + 24 * 60 * 60 * 1000 + 1)
    const refresh = await fetch(
      new URL('/auth/sessions/refresh', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshedBody.refreshToken }),
      },
    )
    expect(refresh.status).toBe(401)
  })

  it('permite a Admin ativo emitir convite SSO sem revelar o token', async () => {
    const email = `sso-invite-admin-${Date.now()}@example.test`
    const passwordHash = await app
      .get(PasswordHasher)
      .hash('testing password phrase')
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'ADMIN', true, $4, now())`,
      ['SSO Invitation Admin', email, passwordHash, organizationId],
    )

    const firstLogin = await login(email, 'testing password phrase')
    const setup = await fetch(new URL('/auth/totp/setup', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setupToken: firstLogin.body.setupToken }),
    })
    const setupBody = (await setup.json()) as Record<string, unknown>
    const secret = new URL(setupBody.provisioningUri as string)
      .searchParams.get('secret')!
    const confirmedSetup = await fetch(
      new URL('/auth/totp/setup/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          setupToken: setupBody.setupToken,
          code: totpCode(secret, testNow.getTime() - 30_000),
        }),
      },
    )
    const adminSession = (await confirmedSetup.json()) as Record<
      string,
      unknown
    >

    const response = await fetch(
      new URL('/auth/sso/invitations', await app.getUrl()),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminSession.accessToken as string}`,
        },
        body: JSON.stringify({
          email: 'new-analyst@example.test',
          name: 'New Analyst',
          role: 'ANALYST',
        }),
      },
    )
    const responseBody = await response.text()

    expect(response.status).toBe(201)
    expect(sentEmails).toHaveLength(1)
    expect(sentEmails[0].to).toBe('new-analyst@example.test')
    const invitationLink = new URL(
      sentEmails[0].text.match(/https:\/\/\S+/)![0],
    )
    const invitationToken =
      invitationLink.searchParams.get('token') ??
      new URLSearchParams(invitationLink.hash.slice(1)).get('sso_invite')
    expect(invitationToken).toBeTruthy()
    expect(responseBody).not.toContain(invitationToken)
  })

  it('revoga convite anterior ao reemitir e limita a emissão a Admin ativo', async () => {
    const admin = await createSsoAdminSession(
      `sso-reissue-admin-${Date.now()}@example.test`,
    )
    const targetEmail = `sso-reissue-${Date.now()}@example.test`
    const issue = async (token: string) =>
      fetch(new URL('/auth/sso/invitations', await app.getUrl()), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: targetEmail, name: 'Reissued Member', role: 'ANALYST' }),
      })
    const first = await issue(admin.accessToken as string)
    expect(first.status).toBe(201)
    expect(await first.json()).toEqual({
      expiresAt: new Date(testNow.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    })
    const firstToken = invitationTokenFromEmail(sentEmails[0].text)
    const second = await issue(admin.accessToken as string)
    expect(second.status).toBe(201)
    const secondToken = invitationTokenFromEmail(sentEmails[1].text)
    expect(secondToken).not.toBe(firstToken)

    const analyst = await login()
    const denied = await issue(analyst.body.accessToken as string)
    expect(denied.status).toBe(403)
    expect(sentEmails).toHaveLength(2)

    googleIdentity = {
      subject: `google-${Date.now()}`,
      email: targetEmail,
      emailVerified: true,
    }
    const verifier = randomBytes(32).toString('base64url')
    const firstStart = await beginGoogleSso(verifier, firstToken)
    const firstCallback = await finishGoogleSso(
      firstStart.stateCookie,
      firstStart.authorizationUrl.searchParams.get('state')!,
    )
    expect(new URL(firstCallback.headers.get('location')!).searchParams.get('error')).toBe(
      'SSO_AUTHENTICATION_FAILED',
    )
    const secondStart = await beginGoogleSso(verifier, secondToken)
    const secondCallback = await finishGoogleSso(
      secondStart.stateCookie,
      secondStart.authorizationUrl.searchParams.get('state')!,
    )
    expect(new URL(secondCallback.headers.get('location')!).searchParams.get('code')).toBeTruthy()
  })

  it('autentica uma conta convidada e troca o handoff uma única vez via PKCE', async () => {
    const email = `sso-analyst-${Date.now()}@example.test`
    const inviteToken = await createSsoInvitation(email, 'Invited Analyst')
    googleIdentity = {
      subject: `google-${Date.now()}`,
      email,
      emailVerified: true,
    }
    const codeVerifier = randomBytes(32).toString('base64url')
    const started = await beginGoogleSso(codeVerifier, inviteToken)

    expect(started.response.status).toBe(302)
    expect(started.authorizationUrl.origin).toBe('https://accounts.google.com')
    expect(started.authorizationUrl.searchParams.get('scope')).toBe('openid email')
    expect(started.authorizationUrl.searchParams.get('response_type')).toBe('code')
    expect(started.authorizationUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(started.authorizationUrl.searchParams.get('code_challenge')).toBeTruthy()
    expect(started.setCookieHeader).toContain('HttpOnly')
    const callback = await finishGoogleSso(
      started.stateCookie,
      started.authorizationUrl.searchParams.get('state')!,
    )
    expect(callback.status).toBe(302)
    const returnUrl = new URL(callback.headers.get('location')!)
    expect(returnUrl.origin).toBe('https://app.example.test')
    expect(returnUrl.searchParams.has('error')).toBe(false)
    expect(returnUrl.searchParams.has('accessToken')).toBe(false)
    expect(returnUrl.searchParams.has('refreshToken')).toBe(false)
    const handoffCode = returnUrl.searchParams.get('code')!
    const stateReplay = await finishGoogleSso(
      started.stateCookie,
      started.authorizationUrl.searchParams.get('state')!,
    )
    expect(new URL(stateReplay.headers.get('location')!).searchParams.get('error')).toBe(
      'SSO_AUTHENTICATION_FAILED',
    )
    expect(
      createHash('sha256')
        .update(receivedGoogleCodeVerifier)
        .digest('base64url'),
    ).toBe(started.authorizationUrl.searchParams.get('code_challenge'))
    expect(receivedGoogleCodeVerifier).toBeTruthy()

    const wrongVerifier = await exchangeHandoff(handoffCode, randomBytes(32).toString('base64url'))
    expect(wrongVerifier.status).toBe(401)
    const exchanged = await exchangeHandoff(handoffCode, codeVerifier)
    expect(exchanged.status).toBe(200)
    const session = (await exchanged.json()) as Record<string, unknown>
    expect(session.accessToken).toBeTruthy()
    expect(session.refreshToken).toBeTruthy()
    const replay = await exchangeHandoff(handoffCode, codeVerifier)
    expect(replay.status).toBe(401)

    const me = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${session.accessToken as string}` },
    })
    expect(me.status).toBe(200)
    expect(await me.json()).toMatchObject({
      organizationId,
      name: 'Invited Analyst',
      email,
      role: 'ANALYST',
    })
    expect((await login(email, 'any local password')).response.status).toBe(401)

    const linkedSubject = googleIdentity.subject
    googleIdentity.subject = `google-replay-${Date.now()}`
    const replayVerifier = randomBytes(32).toString('base64url')
    const replayStart = await beginGoogleSso(replayVerifier, inviteToken)
    const invitationReplay = await finishGoogleSso(
      replayStart.stateCookie,
      replayStart.authorizationUrl.searchParams.get('state')!,
    )
    expect(
      new URL(invitationReplay.headers.get('location')!).searchParams.get('error'),
    ).toBe('SSO_AUTHENTICATION_FAILED')

    googleIdentity.subject = linkedSubject
    const returningVerifier = randomBytes(32).toString('base64url')
    const returningStart = await beginGoogleSso(returningVerifier)
    const returningCallback = await finishGoogleSso(
      returningStart.stateCookie,
      returningStart.authorizationUrl.searchParams.get('state')!,
    )
    expect(new URL(returningCallback.headers.get('location')!).searchParams.get('code')).toBeTruthy()
  })

  it('exige TOTP GreenER antes de criar sessão SSO para Admin', async () => {
    const email = `sso-admin-${Date.now()}@example.test`
    const inviteToken = await createSsoInvitation(email, 'Invited Admin', 'ADMIN')
    googleIdentity = {
      subject: `google-${Date.now()}`,
      email,
      emailVerified: true,
    }
    const codeVerifier = randomBytes(32).toString('base64url')
    const started = await beginGoogleSso(codeVerifier, inviteToken)
    const callback = await finishGoogleSso(
      started.stateCookie,
      started.authorizationUrl.searchParams.get('state')!,
    )
    const code = new URL(callback.headers.get('location')!).searchParams.get('code')!
    const exchanged = await exchangeHandoff(code, codeVerifier)
    const result = (await exchanged.json()) as Record<string, unknown>

    expect(exchanged.status).toBe(200)
    expect(result).toMatchObject({ status: 'TOTP_SETUP_REQUIRED', expiresIn: 300 })
    expect(result).not.toHaveProperty('accessToken')
    expect(result).not.toHaveProperty('refreshToken')
    const privateResponse = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${result.setupToken as string}` },
    })
    expect(privateResponse.status).toBe(401)
    const totpSetup = await fetch(new URL('/auth/totp/setup', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ setupToken: result.setupToken }),
    })
    expect(totpSetup.status).toBe(200)
  })

  it('vincula conta existente sem trocar nome, papel ou senha local', async () => {
    const email = `sso-existing-${Date.now()}@example.test`
    const password = 'existing local password'
    const passwordHash = await app.get(PasswordHasher).hash(password)
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'VISITOR', true, $4, now())`,
      ['Existing GreenER Name', email, passwordHash, organizationId],
    )
    const inviteToken = await createSsoInvitation(email, 'Ignored Invite Name', 'ADMIN')
    googleIdentity = {
      subject: `google-${Date.now()}`,
      email,
      emailVerified: true,
    }
    const codeVerifier = randomBytes(32).toString('base64url')
    const started = await beginGoogleSso(codeVerifier, inviteToken)
    const callback = await finishGoogleSso(
      started.stateCookie,
      started.authorizationUrl.searchParams.get('state')!,
    )
    const handoff = new URL(callback.headers.get('location')!).searchParams.get('code')!
    const exchanged = await exchangeHandoff(handoff, codeVerifier)
    const session = (await exchanged.json()) as Record<string, unknown>
    expect(exchanged.status).toBe(200)
    const me = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${session.accessToken as string}` },
    })
    expect(await me.json()).toMatchObject({ name: 'Existing GreenER Name', role: 'VISITOR' })
    expect((await login(email, password)).response.status).toBe(200)
  })

  it('permite Admin re-vincular conta por convite sem auto-desvinculação', async () => {
    const email = `sso-relink-${Date.now()}@example.test`
    const password = 'preserved local password'
    const passwordHash = await app.get(PasswordHasher).hash(password)
    await database.query(
      `INSERT INTO users (
        name, email, "passwordHash", role, "isActive", "organizationId", "emailVerifiedAt"
      ) VALUES ($1, $2, $3, 'VISITOR', true, $4, now())`,
      ['Relinked User', email, passwordHash, organizationId],
    )
    const inviteToken = await createSsoInvitation(email, 'Ignored Name')
    googleIdentity = { subject: `google-old-${Date.now()}`, email, emailVerified: true }
    const firstVerifier = randomBytes(32).toString('base64url')
    const firstStart = await beginGoogleSso(firstVerifier, inviteToken)
    const firstCallback = await finishGoogleSso(
      firstStart.stateCookie,
      firstStart.authorizationUrl.searchParams.get('state')!,
    )
    const firstCode = new URL(firstCallback.headers.get('location')!).searchParams.get('code')!
    const firstSession = (await (await exchangeHandoff(firstCode, firstVerifier)).json()) as Record<
      string,
      unknown
    >
    const firstMe = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${firstSession.accessToken as string}` },
    })
    const account = (await firstMe.json()) as Record<string, unknown>

    const adminSession = await createSsoAdminSession(
      `sso-relink-admin-${Date.now()}@example.test`,
    )
    const self = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${adminSession.accessToken as string}` },
    })
    const admin = (await self.json()) as Record<string, unknown>
    const selfRevoke = await fetch(
      new URL(`/auth/sso/identities/${admin.id as string}`, await app.getUrl()),
      {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminSession.accessToken as string}` },
      },
    )
    expect(selfRevoke.status).toBe(403)

    const revoked = await fetch(
      new URL(`/auth/sso/identities/${account.id as string}`, await app.getUrl()),
      {
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminSession.accessToken as string}` },
      },
    )
    expect(revoked.status).toBe(204)
    const invitation = await fetch(
      new URL('/auth/sso/invitations', await app.getUrl()),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminSession.accessToken as string}`,
        },
        body: JSON.stringify({ email, name: 'Ignored New Name', role: 'ADMIN' }),
      },
    )
    expect(invitation.status).toBe(201)
    const newInviteToken = invitationTokenFromEmail(sentEmails[0].text)
    googleIdentity = { subject: `google-new-${Date.now()}`, email, emailVerified: true }
    const newVerifier = randomBytes(32).toString('base64url')
    const newStart = await beginGoogleSso(newVerifier, newInviteToken)
    const newCallback = await finishGoogleSso(
      newStart.stateCookie,
      newStart.authorizationUrl.searchParams.get('state')!,
    )
    const newCode = new URL(newCallback.headers.get('location')!).searchParams.get('code')!
    const newSession = (await (await exchangeHandoff(newCode, newVerifier)).json()) as Record<
      string,
      unknown
    >
    const newMe = await fetch(new URL('/auth/me', await app.getUrl()), {
      headers: { authorization: `Bearer ${newSession.accessToken as string}` },
    })
    expect(await newMe.json()).toMatchObject({ id: account.id, name: 'Relinked User', role: 'VISITOR' })
    expect((await login(email, password)).response.status).toBe(200)
  })

  it('recusa convite de outra organização para identidade Google já vinculada', async () => {
    const firstEmail = `sso-global-first-${Date.now()}@example.test`
    const firstInvite = await createSsoInvitation(firstEmail, 'First Member')
    const sharedSubject = `google-${Date.now()}`
    googleIdentity = { subject: sharedSubject, email: firstEmail, emailVerified: true }
    const firstVerifier = randomBytes(32).toString('base64url')
    const firstStart = await beginGoogleSso(firstVerifier, firstInvite)
    const firstCallback = await finishGoogleSso(
      firstStart.stateCookie,
      firstStart.authorizationUrl.searchParams.get('state')!,
    )
    const firstCode = new URL(firstCallback.headers.get('location')!).searchParams.get('code')!
    expect((await exchangeHandoff(firstCode, firstVerifier)).status).toBe(200)

    const secondEmail = `sso-global-second-${Date.now()}@example.test`
    const secondInvite = await createSsoInvitation(
      secondEmail,
      'Second Member',
      'ANALYST',
      otherOrganizationId,
    )
    googleIdentity.email = secondEmail
    const secondVerifier = randomBytes(32).toString('base64url')
    const secondStart = await beginGoogleSso(secondVerifier, secondInvite)
    const secondCallback = await finishGoogleSso(
      secondStart.stateCookie,
      secondStart.authorizationUrl.searchParams.get('state')!,
    )
    const location = new URL(secondCallback.headers.get('location')!)
    expect(location.searchParams.get('error')).toBe('SSO_AUTHENTICATION_FAILED')
    expect(location.searchParams.has('code')).toBe(false)
  })

  it('recusa callback sem cookie de state e identidade Google sem e-mail verificado', async () => {
    const email = `sso-invalid-${Date.now()}@example.test`
    const inviteToken = await createSsoInvitation(email, 'Invalid Claim User')
    googleIdentity = { subject: `google-${Date.now()}`, email, emailVerified: true }
    const initialVerifier = randomBytes(32).toString('base64url')
    const initialStart = await beginGoogleSso(initialVerifier, inviteToken)
    const state = initialStart.authorizationUrl.searchParams.get('state')!
    const missingCookie = await fetch(
      new URL(`/auth/sso/google/callback?code=code&state=${state}`, await app.getUrl()),
      { redirect: 'manual' },
    )
    expect(new URL(missingCookie.headers.get('location')!).searchParams.get('error')).toBe(
      'SSO_AUTHENTICATION_FAILED',
    )
    const invalidClaims: Record<string, unknown>[] = [
      { email_verified: false },
      { iss: 'https://attacker.example' },
      { aud: 'another-client' },
      { exp: Math.floor(testNow.getTime() / 1000) - 1 },
      { nonce: 'different-nonce' },
    ]
    for (const claims of invalidClaims) {
      googleClaimOverrides = claims
      const verifier = randomBytes(32).toString('base64url')
      const started = await beginGoogleSso(verifier, inviteToken)
      const callback = await finishGoogleSso(
        started.stateCookie,
        started.authorizationUrl.searchParams.get('state')!,
      )
      expect(new URL(callback.headers.get('location')!).searchParams.get('error')).toBe(
        'SSO_AUTHENTICATION_FAILED',
      )
    }
    googleClaimOverrides = {}
    googleIdentity.email = `mismatch-${email}`
    const mismatchVerifier = randomBytes(32).toString('base64url')
    const mismatchStart = await beginGoogleSso(mismatchVerifier, inviteToken)
    const mismatchCallback = await finishGoogleSso(
      mismatchStart.stateCookie,
      mismatchStart.authorizationUrl.searchParams.get('state')!,
    )
    expect(
      new URL(mismatchCallback.headers.get('location')!).searchParams.get('error'),
    ).toBe('SSO_AUTHENTICATION_FAILED')
  })

  it('expira o handoff GreenER após 60 segundos', async () => {
    const email = `sso-handoff-expiry-${Date.now()}@example.test`
    const invitation = await createSsoInvitation(email, 'Handoff Expiry')
    googleIdentity = { subject: `google-${Date.now()}`, email, emailVerified: true }
    const verifier = randomBytes(32).toString('base64url')
    const started = await beginGoogleSso(verifier, invitation)
    const callback = await finishGoogleSso(
      started.stateCookie,
      started.authorizationUrl.searchParams.get('state')!,
    )
    const code = new URL(callback.headers.get('location')!).searchParams.get('code')!
    testNow = new Date(testNow.getTime() + 60_001)
    expect((await exchangeHandoff(code, verifier)).status).toBe(401)
  })

  it('recusa convite SSO expirado mesmo quando identidade e state são válidos', async () => {
    const email = `sso-expired-invite-${Date.now()}@example.test`
    const inviteToken = await createSsoInvitation(email, 'Expired SSO Invite')
    await database.query(
      'UPDATE sso_invitations SET "expiresAt" = $1 WHERE "tokenHash" = $2',
      [
        new Date(testNow.getTime() - 1),
        app.get(AccessTokenService).hashOpaqueToken(inviteToken),
      ],
    )
    googleIdentity = { subject: `google-${Date.now()}`, email, emailVerified: true }
    const verifier = randomBytes(32).toString('base64url')
    const started = await beginGoogleSso(verifier, inviteToken)
    const callback = await finishGoogleSso(
      started.stateCookie,
      started.authorizationUrl.searchParams.get('state')!,
    )
    expect(new URL(callback.headers.get('location')!).searchParams.get('error')).toBe(
      'SSO_AUTHENTICATION_FAILED',
    )
  })

  it('convida o representante, confirma o e-mail do Admin e inicia setup TOTP', async () => {
    const auth = app.get(AuthenticationService)
    const slug = `invite-test-${Date.now()}`
    createdOrganizationSlugs.push(slug)
    await auth.createOrganizationInvitation({
      name: 'Invite Test',
      slug,
      representativeEmail: 'representative@example.test',
    })
    expect(sentEmails).toHaveLength(1)
    expect(sentEmails[0].to).toBe('representative@example.test')
    const inviteToken = new URL(
      sentEmails[0].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)

    const accepted = await fetch(
      new URL('/auth/invitations/accept', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken,
          name: 'First Admin',
          email: 'admin@example.test',
        }),
      },
    )
    expect(accepted.status).toBe(202)
    expect(sentEmails).toHaveLength(2)
    expect(sentEmails[1].to).toBe('admin@example.test')
    const originalConfirmationToken = new URL(
      sentEmails[1].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)

    const resent = await fetch(
      new URL('/auth/email/confirmation/resend', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          organization: slug,
          email: 'admin@example.test',
        }),
      },
    )
    expect(resent.status).toBe(200)
    expect(sentEmails[2].to).toBe('admin@example.test')
    const confirmationToken = new URL(
      sentEmails[2].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)

    const beforeConfirmation = await fetch(
      new URL('/auth/login', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.test',
          password: 'new secure password',
        }),
      },
    )
    expect(beforeConfirmation.status).toBe(401)

    const tooShortPassword = await fetch(
      new URL('/auth/email/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: confirmationToken, password: '1234567' }),
      },
    )
    expect(tooShortPassword.status).toBe(400)

    const confirmed = await fetch(
      new URL('/auth/email/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: confirmationToken,
          password: '12345678',
        }),
      },
    )
    expect(confirmed.status).toBe(200)
    const replayConfirmation = await fetch(
      new URL('/auth/email/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: confirmationToken,
          password: '12345678',
        }),
      },
    )
    expect(replayConfirmation.status).toBe(401)
    const replacedConfirmation = await fetch(
      new URL('/auth/email/confirm', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: originalConfirmationToken,
          password: '12345678',
        }),
      },
    )
    expect(replacedConfirmation.status).toBe(401)
    const afterConfirmation = await fetch(
      new URL('/auth/login', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.test',
          password: '12345678',
        }),
      },
    )
    expect(afterConfirmation.status).toBe(200)
    expect(await afterConfirmation.json()).toMatchObject({
      status: 'TOTP_SETUP_REQUIRED',
      expiresIn: 300,
    })

    const replay = await fetch(
      new URL('/auth/invitations/accept', await app.getUrl()),
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken,
          name: 'Second Admin',
          email: 'other@example.test',
        }),
      },
    )
    expect(replay.status).toBe(401)
  })

  it('invalida o convite anterior ao reenviar e rejeita convites expirados', async () => {
    const auth = app.get(AuthenticationService)
    const slug = `resend-test-${Date.now()}`
    createdOrganizationSlugs.push(slug)
    await auth.createOrganizationInvitation({
      name: 'Resend Test',
      slug,
      representativeEmail: 'representative@example.test',
    })
    const firstToken = new URL(
      sentEmails[0].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)

    await auth.issueAdminInvitation(slug, 'representative@example.test')
    const secondToken = new URL(
      sentEmails[1].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)
    const accept = async (token: string) =>
      fetch(new URL('/auth/invitations/accept', await app.getUrl()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          name: 'First Admin',
          email: 'first-admin@example.test',
        }),
      })

    expect((await accept(firstToken)).status).toBe(401)
    expect((await accept(secondToken)).status).toBe(202)
    const expiredSlug = `expired-test-${Date.now()}`
    createdOrganizationSlugs.push(expiredSlug)
    await auth.createOrganizationInvitation({
      name: 'Expired Test',
      slug: expiredSlug,
      representativeEmail: 'representative@example.test',
    })
    const expiredToken = new URL(
      sentEmails[2].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)
    const [organization] = await database.query(
      'SELECT id FROM organizations WHERE slug = $1',
      [expiredSlug],
    )
    await database.query(
      `UPDATE auth_tokens SET "expiresAt" = $1 WHERE "organizationId" = $2 AND "kind" = 'ADMIN_INVITATION'`,
      [new Date(testNow.getTime() - 1000), organization.id],
    )
    expect((await accept(expiredToken)).status).toBe(401)
  })

  it('exige um e-mail distinto para cada conta, inclusive entre organizações', async () => {
    const auth = app.get(AuthenticationService)
    const firstSlug = `email-first-${Date.now()}`
    const secondSlug = `email-second-${Date.now()}`
    createdOrganizationSlugs.push(firstSlug, secondSlug)
    await auth.createOrganizationInvitation({
      name: 'Email First',
      slug: firstSlug,
      representativeEmail: 'first-representative@example.test',
    })
    const firstToken = new URL(
      sentEmails[0].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)
    const accept = async (token: string, email: string) =>
      fetch(new URL('/auth/invitations/accept', await app.getUrl()), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, name: 'First Admin', email }),
      })
    const firstAccount = await accept(firstToken, 'shared-admin@example.test')
    expect(firstAccount.status).toBe(202)

    await auth.createOrganizationInvitation({
      name: 'Email Second',
      slug: secondSlug,
      representativeEmail: 'second-representative@example.test',
    })
    const secondToken = new URL(
      sentEmails[2].text.match(/https:\/\/\S+/)![0],
    ).hash.slice('#token='.length)
    const duplicateAccount = await accept(
      secondToken,
      'shared-admin@example.test',
    )
    expect(duplicateAccount.status).toBe(409)
    expect(await duplicateAccount.json()).toMatchObject({
      code: 'EMAIL_ALREADY_IN_USE',
    })
  })
})

function totpCode(secret: string, epochMilliseconds: number): string {
  const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let accumulator = 0
  const bytes: number[] = []
  for (const character of secret) {
    accumulator = (accumulator << 5) | base32.indexOf(character)
    bits += 5
    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(epochMilliseconds / 30_000)))
  const digest = createHmac('sha1', Buffer.from(bytes))
    .update(counter)
    .digest()
  const offset = digest[digest.length - 1] & 15
  const binary =
    ((digest[offset] & 127) << 24) |
    ((digest[offset + 1] & 255) << 16) |
    ((digest[offset + 2] & 255) << 8) |
    (digest[offset + 3] & 255)
  return String(binary % 1_000_000).padStart(6, '0')
}

function signedGoogleIdToken(
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'],
  claims: Record<string, unknown>,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-google-key' }),
  ).toString('base64url')
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  signer.end()
  const signature = signer.sign(privateKey).toString('base64url')
  return `${header}.${payload}.${signature}`
}
