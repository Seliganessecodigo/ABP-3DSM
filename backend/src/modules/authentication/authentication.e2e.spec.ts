import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../../database/migrations/1791350000000-DiscoverApplications'
import { ApplicationOperationalStatus1791360000000 } from '../../database/migrations/1791360000000-ApplicationOperationalStatus'
import { AuthenticationAndOrganizations1791370000000 } from '../../database/migrations/1791370000000-AuthenticationAndOrganizations'
import { EMAIL_DELIVERY, EmailDelivery } from './email-delivery'
import { AuthenticationService } from './authentication.service'
import { AUTH_CLOCK, AuthClock } from './clock'
import { PasswordHasher } from './password-hasher.service'

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

  beforeAll(async () => {
    if (!testDatabaseUrl)
      throw new Error('TEST_DATABASE_URL é obrigatório para este teste')
    for (const key of [
      'DATABASE_URL',
      'AUTH_JWT_SECRET',
      'AUTH_PASSWORD_PEPPER',
      'APP_BASE_URL',
    ]) {
      previousEnvironment.set(key, process.env[key])
    }
    process.env.DATABASE_URL = testDatabaseUrl
    process.env.AUTH_JWT_SECRET = 'test-only-jwt-signing-secret-with-32-bytes'
    process.env.AUTH_PASSWORD_PEPPER =
      'test-only-password-pepper-with-at-least-32-bytes'
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
      .compile()
    app = testingModule.createNestApplication({ logger: false })
    await app.listen(0, '127.0.0.1')

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
  })

  async function login(
    email = 'analyst@example.test',
    password = 'testing password phrase',
    organization = currentSlug,
  ) {
    const response = await fetch(new URL('/auth/login', await app.getUrl()), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ organization, email, password }),
    })
    return {
      response,
      body: (await response.json()) as Record<string, unknown>,
    }
  }

  let currentSlug = ''
  let otherOrganizationSlug = ''
  beforeAll(async () => {
    const [record] = await database.query(
      'SELECT slug FROM organizations WHERE id = $1',
      [organizationId],
    )
    currentSlug = record.slug as string
    const [otherOrganization] = await database.query(
      'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, slug',
      ['Other Authentication Test', `other-auth-test-${Date.now()}`],
    )
    otherOrganizationId = otherOrganization.id as string
    otherOrganizationSlug = otherOrganization.slug as string
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

  it('responde da mesma forma para senha, e-mail ou organização inválidos', async () => {
    const wrongPassword = await login('analyst@example.test', 'wrong password')
    const unknownEmail = await login('missing@example.test')
    const unknownOrganization = await login(
      'analyst@example.test',
      'testing password phrase',
      'missing-org',
    )
    expect(wrongPassword.response.status).toBe(401)
    expect(unknownEmail.response.status).toBe(401)
    expect(unknownOrganization.response.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.body).toEqual(unknownOrganization.body)
  })

  it('não autentica uma conta usando o identificador de outra organização', async () => {
    const { response, body } = await login(
      'analyst@example.test',
      'testing password phrase',
      otherOrganizationSlug,
    )
    expect(response.status).toBe(401)
    expect(body).toMatchObject({ code: 'INVALID_CREDENTIALS' })
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

  it('convida um representante, confirma o e-mail distinto do Admin e habilita o primeiro login', async () => {
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
          organization: slug,
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
          organization: slug,
          email: 'admin@example.test',
          password: '12345678',
        }),
      },
    )
    expect(afterConfirmation.status).toBe(200)

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
