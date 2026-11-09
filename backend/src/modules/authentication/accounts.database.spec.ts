import { randomBytes, randomUUID } from 'node:crypto'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { QueryFailedError } from 'typeorm'
import { createQualityFixture, QualityFixture } from '../../../test/quality-fixture'
import { UserAccountStatus, UserEntity, UserRole } from '../../database/entities/user.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuthTokenEntity, AuthTokenKind } from '../../database/entities/auth-token.entity'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AccessTokenService } from './access-token.service'
import { PasswordHasher } from './password-hasher.service'
import { AccountsService } from './accounts.service'
import { parseAccountsQuery } from './accounts.dto'

const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip

describeDatabase('US-20 #158: account administration with real JWT and isolated PostgreSQL', () => {
  let fixture: QualityFixture
  let organization: OrganizationEntity
  let admin: UserEntity
  let target: UserEntity
  let token: string
  const previousPepper = process.env.AUTH_PASSWORD_PEPPER
  const previousPepperKeys = process.env.AUTH_PASSWORD_PEPPER_KEYS
  const previousPepperVersion = process.env.AUTH_PASSWORD_PEPPER_VERSION

  beforeAll(async () => {
    process.env.AUTH_PASSWORD_PEPPER = 'local_only_account_test_pepper_with_at_least_32_bytes'
    delete process.env.AUTH_PASSWORD_PEPPER_KEYS
    delete process.env.AUTH_PASSWORD_PEPPER_VERSION
    fixture = await createQualityFixture()
  }, 60_000)
  beforeEach(async () => {
    organization = await fixture.database.getRepository(OrganizationEntity).save({ name: 'Accounts', slug: `accounts-${randomUUID()}` })
    admin = await user({ name: 'Admin', role: UserRole.ADMIN })
    target = await user({ name: 'Ana São José' })
    token = await session(admin)
  })
  afterEach(() => { jest.restoreAllMocks() })
  afterAll(async () => {
    await fixture?.close()
    if (previousPepper === undefined) delete process.env.AUTH_PASSWORD_PEPPER; else process.env.AUTH_PASSWORD_PEPPER = previousPepper
    if (previousPepperKeys === undefined) delete process.env.AUTH_PASSWORD_PEPPER_KEYS; else process.env.AUTH_PASSWORD_PEPPER_KEYS = previousPepperKeys
    if (previousPepperVersion === undefined) delete process.env.AUTH_PASSWORD_PEPPER_VERSION; else process.env.AUTH_PASSWORD_PEPPER_VERSION = previousPepperVersion
  }, 60_000)

  function user(overrides: Partial<UserEntity> = {}) {
    return fixture.database.getRepository(UserEntity).save({ organizationId: organization.id, name: 'Account', email: `${randomUUID()}@example.test`,
      role: UserRole.ANALYST, status: UserAccountStatus.ACTIVE, emailVerifiedAt: new Date(), ...overrides })
  }
  async function session(account: UserEntity, verified = true) {
    const row = await fixture.database.getRepository(AuthSessionEntity).save({ userId: account.id, organizationId: account.organizationId,
      refreshTokenHash: randomBytes(32).toString('hex'), lastActivityAt: new Date(), absoluteExpiresAt: new Date(Date.now() + 3_600_000),
      secondFactorVerifiedAt: verified ? new Date() : null })
    return fixture.app.get(AccessTokenService).sign(account.id, account.organizationId, row.id, account.role)
  }
  function request(path = '', method = 'GET', body?: unknown, access: string | null = token) {
    return fetch(`${fixture.url}/auth/users${path}`, { method,
      headers: { 'content-type': 'application/json', ...(access ? { authorization: `Bearer ${access}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  }
  function createBody() { return { name: 'Nova Conta', email: `${randomUUID()}@example.test`, role: 'ANALYST', reason: 'Entrada na equipe' } }
  function roleBody(role = 'VISITOR', expectedRole = 'ANALYST') { return { role, expectedRole, reason: 'Mudança de responsabilidades' } }
  function audit(entityId: string) { return fixture.database.getRepository(AuditLogEntity).find({ where: { entityId }, order: { createdAt: 'ASC' } }) }

  it('publishes all routes and list parameters in OpenAPI without credential fields', () => {
    const doc = SwaggerModule.createDocument(fixture.app, new DocumentBuilder().addBearerAuth().build())
    expect(doc.paths['/auth/users'].get?.security).toEqual([{ bearer: [] }])
    expect(doc.paths['/auth/users'].post).toBeDefined()
    expect(doc.paths['/auth/users/{userId}/role'].patch).toBeDefined()
    expect(doc.paths['/auth/users'].get?.parameters).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'pageSize' }), expect.objectContaining({ name: 'lastAccessAtFrom' })]))
    expect(JSON.stringify(doc.components!.schemas!.AccountResponseDto)).not.toMatch(/password|secret|token|credential|hash/i)
  })

  it('denies missing/invalid JWT, pending TOTP and non-Admin roles on every route without mutation', async () => {
    const before = await fixture.database.getRepository(UserEntity).countBy({ organizationId: organization.id })
    const analyst = await session(target)
    const visitor = await session(await user({ role: UserRole.VISITOR }))
    const pending = await session(admin, false)
    for (const [access, expected] of [[null, 401], ['invalid', 401], [pending, 401], [analyst, 403], [visitor, 403]] as const) {
      expect((await request('', 'GET', undefined, access)).status).toBe(expected)
      expect((await request('', 'POST', createBody(), access)).status).toBe(expected)
      expect((await request(`/${target.id}/role`, 'PATCH', roleBody(), access)).status).toBe(expected)
    }
    expect(await fixture.database.getRepository(UserEntity).countBy({ organizationId: organization.id })).toBe(before + 1)
    expect((await fixture.database.getRepository(UserEntity).findOneByOrFail({ id: target.id })).role).toBe(UserRole.ANALYST)
    expect(await fixture.database.getRepository(AuditLogEntity).countBy({ actorUserId: target.id, outcome: 'denied' })).toBe(3)
  })

  it.each([UserAccountStatus.BLOCKED, UserAccountStatus.DEACTIVATED])('refuses %s Admin without listing or mutations', async status => {
    await fixture.database.getRepository(UserEntity).update(admin.id, { status })
    expect((await request()).status).toBe(401)
    expect((await request('', 'POST', createBody())).status).toBe(401)
    expect((await request(`/${target.id}/role`, 'PATCH', roleBody())).status).toBe(401)
  })

  it('creates a pending account, audits without secrets and reuses email confirmation/password hashing', async () => {
    const input = createBody()
    const result = await request('', 'POST', { ...input, email: input.email.toUpperCase() })
    expect(result.status).toBe(201)
    const created = await result.json() as { id: string; email: string; emailVerifiedAt: null }
    expect(created).toMatchObject({ email: input.email, emailVerifiedAt: null, role: 'ANALYST', status: 'ACTIVE' })
    const stored = await fixture.database.getRepository(UserEntity).findOneByOrFail({ id: created.id })
    expect(stored.passwordHash).toBeNull()
    expect(JSON.stringify(created)).not.toMatch(/password|secret|token|credential|hash/i)
    const events = await audit(created.id)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ actorUserId: admin.id, actorLabel: admin.name, outcome: 'success', action: 'account.created', reason: input.reason,
      before: null, after: { name: input.name, role: 'ANALYST', status: 'ACTIVE' } })
    const password = 'test-only-password-158'
    const login = () => fetch(`${fixture.url}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: input.email, password }) })
    expect((await login()).status).toBe(401)
    await fetch(`${fixture.url}/auth/email/confirmation/resend`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organization: organization.slug, email: input.email }) })
    const confirmation = await fixture.database.getRepository(AuthTokenEntity).findOneByOrFail({ userId: created.id, kind: AuthTokenKind.EMAIL_CONFIRMATION })
    const message = fixture.emails.at(-1)!.text
    const raw = /[#?&]token=([^\s&]+)/.exec(message)![1]
    expect(confirmation.tokenHash).not.toBe(raw)
    const confirmed = await fetch(`${fixture.url}/auth/email/confirm`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: decodeURIComponent(raw), password }) })
    expect(confirmed.status).toBe(200)
    const activated = await fixture.database.getRepository(UserEntity).findOneByOrFail({ id: created.id })
    expect(activated.passwordHash).not.toBe(password)
    expect(await fixture.app.get(PasswordHasher).verify(activated.passwordHash!, password)).toBe(true)
    expect((await login()).status).toBe(200)
    expect(JSON.stringify(await audit(created.id))).not.toContain(password)
  })

  it('maps case-insensitive duplicate email to generic conflict, including another organization and simultaneous creates', async () => {
    const input = { ...createBody(), email: target.email.toUpperCase() }
    expect((await request('', 'POST', input)).status).toBe(409)
    const other = await fixture.database.getRepository(OrganizationEntity).save({ name: 'Other', slug: `other-${randomUUID()}` })
    const foreign = await user({ organizationId: other.id })
    const denied = await request('', 'POST', { ...input, email: foreign.email })
    expect(denied.status).toBe(409)
    expect(JSON.stringify(await denied.json())).not.toContain(other.id)
    const concurrent = createBody()
    const results = await Promise.all([request('', 'POST', concurrent), request('', 'POST', concurrent)])
    expect(results.map(response => response.status).sort()).toEqual([201, 409])
    expect(await fixture.database.getRepository(UserEntity).countBy({ email: concurrent.email })).toBe(1)
  })

  it('validates body, UUID, enums and forbidden fields before database writes', async () => {
    for (const body of [{ ...createBody(), password: 'secret' }, { ...createBody(), role: 'ROOT' }, { ...createBody(), organizationId: randomUUID() }, null]) {
      expect((await request('', 'POST', body)).status).toBe(400)
    }
    expect((await request('/invalid/role', 'PATCH', roleBody())).status).toBe(400)
    expect((await request(`/${target.id}/role`, 'PATCH', { ...roleBody(), expectedRole: null })).status).toBe(400)
    expect((await request('?sortBy=passwordHash')).status).toBe(400)
    expect((await request('?role=ADMIN&role=VISITOR')).status).toBe(400)
  })

  it('filters all visible columns before pagination and never lists another organization or secret values', async () => {
    const other = await fixture.database.getRepository(OrganizationEntity).save({ name: 'Foreign', slug: `foreign-${randomUUID()}` })
    const foreign = await user({ organizationId: other.id, name: 'Ana São José' })
    await fixture.database.getRepository(UserEntity).update(target.id, { passwordHash: 'hidden-hash-marker', totpSecretCiphertext: 'hidden-secret-marker' })
    const result = await (await request('?search=sao&name=ANA&role=ANALYST&status=ACTIVE&pageSize=5')).json()
    expect(result.items.map((item: { id: string }) => item.id)).toEqual([target.id])
    expect(result.pagination.totalItems).toBe(1)
    expect(JSON.stringify(result)).not.toMatch(/hidden|password|totp|secret|token/i)
    expect((await (await request(`?id=${foreign.id}`)).json()).items).toEqual([])
    for (const search of [target.email, target.id, 'ANALYST', 'ACTIVE', new Date().toISOString().slice(0, 10)]) {
      const body = await (await request(`?search=${encodeURIComponent(search)}&id=${target.id}`)).json()
      expect(body.pagination.totalItems).toBe(1)
    }
    expect((await (await request('?search=hidden-hash-marker')).json()).items).toEqual([])
    expect((await (await request('?name=%25')).json()).items).toEqual([])
    expect((await (await request(`?email=${target.email.slice(0, 8)}`)).json()).items).toHaveLength(1)
  })

  it('combines date bounds and explicit absence filters with equivalent UTC offsets', async () => {
    await fixture.database.getRepository(UserEntity).update(target.id, { lastAccessAt: new Date('2026-01-02T12:00:00Z'), emailVerifiedAt: null })
    const query = new URLSearchParams({ lastAccessAtFrom: '2026-01-02T09:00:00-03:00', lastAccessAtTo: '2026-01-02T12:00:00Z', emailVerified: 'false', hasLastAccess: 'true' })
    expect((await (await request(`?${query}`)).json()).items.map((item: { id: string }) => item.id)).toEqual([target.id])
    expect((await (await request('?hasLastAccess=false&emailVerified=true')).json()).items.map((item: { id: string }) => item.id)).toEqual([admin.id])
    expect((await (await request('?emailVerified=true&createdAtFrom=2099-01-01T00:00:00Z')).json()).items).toEqual([])
  })

  it('supports every page size, defaults to ten and returns all filtered rows without truncation', async () => {
    for (let index = 0; index < 23; index++) await user({ name: `List ${String(index).padStart(2, '0')}` })
    const initial = await (await request('?name=List')).json()
    expect(initial.items).toHaveLength(10)
    expect(initial.pagination).toMatchObject({ page: 1, pageSize: 10, totalItems: 23, totalPages: 3, hasNextPage: true })
    for (const size of [5, 10, 15, 20]) {
      const body = await (await request(`?name=List&pageSize=${size}`)).json()
      expect(body.items).toHaveLength(size)
      const last = await (await request(`?name=List&pageSize=${size}&page=999`)).json()
      expect(last.pagination.page).toBe(Math.ceil(23 / size))
      expect(last.items.length).toBe(23 % size)
      expect(last.pagination.hasNextPage).toBe(false)
    }
    const all = await (await request('?name=List&pageSize=all&page=999')).json()
    expect(all.items).toHaveLength(23)
    expect(all.pagination).toMatchObject({ page: 1, pageSize: 'all', totalPages: 1 })
    const empty = await (await request('?name=does-not-exist&page=8')).json()
    expect(empty).toEqual({ items: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0, hasNextPage: false } })
  })

  it('sorts every exposed column in both directions, keeps nulls last and breaks ties by identity', async () => {
    await fixture.database.getRepository(UserEntity).update(target.id, { lastAccessAt: new Date('2026-01-01T00:00:00Z') })
    const tie = await user({ name: target.name })
    for (const sortBy of ['id', 'name', 'email', 'role', 'status', 'emailVerifiedAt', 'lastAccessAt', 'createdAt', 'updatedAt']) {
      for (const sortDirection of ['asc', 'desc']) {
        expect((await request(`?sortBy=${sortBy}&sortDirection=${sortDirection}`)).status).toBe(200)
      }
    }
    for (const direction of ['asc', 'desc']) {
      const body = await (await request(`?sortBy=lastAccessAt&sortDirection=${direction}`)).json()
      expect(body.items[0].id).toBe(target.id)
      expect(body.items.slice(1).every((item: { lastAccessAt: null }) => item.lastAccessAt === null)).toBe(true)
    }
    const result = await (await request('?name=Ana&sortBy=name')).json()
    expect(result.items.map((item: { id: string }) => item.id)).toEqual([target.id, tie.id].sort())
  })

  it('changes a role atomically, invalidates stale sessions and TOTP credentials, and audits before/after', async () => {
    const oldToken = await session(target)
    await fixture.database.getRepository(AuthTokenEntity).save({ userId: target.id, organizationId: organization.id, email: target.email,
      tokenHash: randomBytes(32).toString('hex'), kind: AuthTokenKind.TOTP_LOGIN_CHALLENGE, expiresAt: new Date(Date.now() + 600_000) })
    const changed = await request(`/${target.id}/role`, 'PATCH', roleBody('ADMIN'))
    expect(changed.status).toBe(200)
    expect(await changed.json()).toMatchObject({ id: target.id, role: 'ADMIN' })
    expect((await fetch(`${fixture.url}/auth/me`, { headers: { authorization: `Bearer ${oldToken}` } })).status).toBe(401)
    expect((await fixture.database.getRepository(AuthTokenEntity).findOneByOrFail({ userId: target.id })).revokedAt).not.toBeNull()
    expect((await audit(target.id))[0]).toMatchObject({ action: 'account.role.changed', before: { role: 'ANALYST' }, after: { role: 'ADMIN' }, actorUserId: admin.id, outcome: 'success' })
    expect((await request('', 'GET', undefined, await session(target, false))).status).toBe(401)
    expect((await request('', 'GET', undefined, await session(target))).status).toBe(200)
  })

  it('rejects stale role, unknown target and cross-organization changes without exposing the foreign account', async () => {
    expect((await request(`/${target.id}/role`, 'PATCH', roleBody('ADMIN', 'VISITOR'))).status).toBe(409)
    expect((await request(`/${randomUUID()}/role`, 'PATCH', roleBody())).status).toBe(404)
    const foreign = await user({ organizationId: (await fixture.database.getRepository(OrganizationEntity).save({ name: 'Other', slug: `other-${randomUUID()}` })).id })
    expect((await request(`/${foreign.id}/role`, 'PATCH', roleBody())).status).toBe(404)
    expect((await fixture.database.getRepository(UserEntity).findOneByOrFail({ id: foreign.id })).role).toBe(UserRole.ANALYST)
  })

  it('treats an already reached role as idempotent without revoking sessions', async () => {
    const access = await session(target)
    expect((await request(`/${target.id}/role`, 'PATCH', roleBody('ANALYST', 'ADMIN'))).status).toBe(200)
    expect((await fetch(`${fixture.url}/auth/me`, { headers: { authorization: `Bearer ${access}` } })).status).toBe(200)
  })

  it('prevents last-Admin removal and self-demotion, while allowing another Admin to be demoted', async () => {
    expect((await request(`/${admin.id}/role`, 'PATCH', roleBody('VISITOR', 'ADMIN'))).status).toBe(409)
    const second = await user({ role: UserRole.ADMIN })
    expect((await request(`/${admin.id}/role`, 'PATCH', roleBody('ANALYST', 'ADMIN'))).status).toBe(403)
    expect((await request(`/${second.id}/role`, 'PATCH', roleBody('ANALYST', 'ADMIN'))).status).toBe(200)
  })

  it('does not count an unconfirmed Admin as a replacement for the last Admin with access', async () => {
    const pending = await (await request('', 'POST', { ...createBody(), role: 'ADMIN' })).json() as { id: string }
    expect((await request(`/${admin.id}/role`, 'PATCH', roleBody('ANALYST', 'ADMIN'))).status).toBe(409)
    const changeStatus = (id: string) => fetch(`${fixture.url}/auth/users/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'BLOCKED', expectedStatus: 'ACTIVE', reason: 'Suspensão administrativa' }) })
    expect((await changeStatus(admin.id)).status).toBe(409)
    expect((await changeStatus(pending.id)).status).toBe(200)
    expect((await request(`/${pending.id}/role`, 'PATCH', roleBody('VISITOR', 'ADMIN'))).status).toBe(200)
  })

  it('serializes simultaneous role edits and prevents mutually demoting the last administrators', async () => {
    const edits = await Promise.all([request(`/${target.id}/role`, 'PATCH', roleBody('ADMIN')), request(`/${target.id}/role`, 'PATCH', roleBody('VISITOR'))])
    expect(edits.map(response => response.status).sort()).toEqual([200, 409])
    const second = await user({ role: UserRole.ADMIN })
    const secondToken = await session(second)
    const results = await Promise.all([request(`/${second.id}/role`, 'PATCH', roleBody('ANALYST', 'ADMIN')), request(`/${admin.id}/role`, 'PATCH', roleBody('ANALYST', 'ADMIN'), secondToken)])
    expect(results.filter(response => response.status === 200)).toHaveLength(1)
    expect(await fixture.database.getRepository(UserEntity).countBy({ organizationId: organization.id, role: UserRole.ADMIN, status: UserAccountStatus.ACTIVE })).toBeGreaterThanOrEqual(1)
  })

  it.each([
    new Error('simulated audit outage'),
    new QueryFailedError('INSERT audit_logs', [], Object.assign(new Error('audit constraint'), { code: '23505', constraint: 'PK_audit_logs' })),
  ])('rolls creation back if success audit fails and does not mistake unrelated constraints for duplicate email (%s)', async failure => {
    const writer = fixture.app.get(AuditWriter)
    const original = writer.record.bind(writer)
    jest.spyOn(writer, 'record').mockImplementation((event, manager) => event.action === 'account.created' && event.outcome === 'success'
      ? Promise.reject(failure) : original(event, manager))
    const input = createBody()
    expect((await request('', 'POST', input)).status).toBe(500)
    expect(await fixture.database.getRepository(UserEntity).countBy({ email: input.email })).toBe(0)
    expect(await fixture.database.getRepository(AuditLogEntity).findOneBy({ actorUserId: admin.id, action: 'account.created', outcome: 'failed' })).not.toBeNull()
  })

  it('rolls role and revocation back when audit fails; preserves historical authorship', async () => {
    const access = await session(target)
    const writer = fixture.app.get(AuditWriter)
    const original = writer.record.bind(writer)
    jest.spyOn(writer, 'record').mockImplementation((event, manager) => event.action === 'account.role.changed' && event.outcome === 'success'
      ? Promise.reject(new Error('simulated audit outage')) : original(event, manager))
    expect((await request(`/${target.id}/role`, 'PATCH', roleBody())).status).toBe(500)
    expect((await fixture.database.getRepository(UserEntity).findOneByOrFail({ id: target.id })).role).toBe(UserRole.ANALYST)
    expect((await fetch(`${fixture.url}/auth/me`, { headers: { authorization: `Bearer ${access}` } })).status).toBe(200)
    const events = await audit(target.id)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ outcome: 'failed', before: null, after: null, actorUserId: admin.id, actorLabel: admin.name })
  })

  it('rechecks the persisted actor even if a previous principal still says Admin', async () => {
    const principal = { userId: admin.id, organizationId: organization.id, role: UserRole.ADMIN, email: admin.email, name: admin.name, sessionId: randomUUID() }
    await fixture.database.getRepository(UserEntity).update(admin.id, { role: UserRole.VISITOR })
    await expect(fixture.app.get(AccountsService).list(principal, parseAccountsQuery({}))).rejects.toMatchObject({ status: 403 })
    await expect(fixture.app.get(AccountsService).list({ ...principal, organizationId: randomUUID() }, parseAccountsQuery({}))).rejects.toMatchObject({ status: 403 })
  })
})
