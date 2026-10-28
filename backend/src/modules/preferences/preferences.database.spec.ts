import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { randomUUID } from 'node:crypto'
import { PreferencesModule } from './preferences.module'
import { UserEntity, UserRole } from '../../database/entities/user.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { UserPreferenceEntity } from '../../database/entities/user-preference.entity'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { AccessTokenService } from '../authentication/access-token.service'

const databaseUrl = process.env.TEST_DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip
const energy = { threshold: 8, alertsEnabled: true, scope: 'application', referencePeriod: 'month', unit: 'kWh' }

describeDatabase('preferências por HTTP, JWT real e PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
  let origin: string
  let organization: OrganizationEntity
  let user: UserEntity
  let token: string
  const previousUrl = process.env.DATABASE_URL
  const previousSecret = process.env.AUTH_JWT_SECRET
  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.AUTH_JWT_SECRET = 'test-only-preferences-jwt-secret-32-characters'
    const { default: source } = await import('../../database/data-source')
    database = source
    await database.initialize()
    await database.runMigrations()
    const module = await Test.createTestingModule({ imports: [TypeOrmModule.forRoot(database.options), PreferencesModule] }).compile()
    app = module.createNestApplication()
    await app.listen(0, '127.0.0.1')
    origin = await app.getUrl()
  }, 60000)
  beforeEach(async () => {
    organization = await database.getRepository(OrganizationEntity).save({ name: 'Preferences test', slug: `preferences-${randomUUID()}` })
    user = await database.getRepository(UserEntity).save({ organizationId: organization.id, email: `${randomUUID()}@example.test`, name: 'Ana', role: UserRole.ANALYST, emailVerifiedAt: new Date(), isActive: true })
    token = await session(user)
  })
  afterEach(async () => {
    const users = await database.getRepository(UserEntity).findBy({ organizationId: organization.id })
    for (const account of users) await database.getRepository(UserEntity).delete(account.id)
    await database.getRepository(OrganizationEntity).delete(organization.id)
  })
  afterAll(async () => {
    await app?.close()
    if (database?.isInitialized) await database.destroy()
    if (previousUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousUrl
    if (previousSecret === undefined) delete process.env.AUTH_JWT_SECRET; else process.env.AUTH_JWT_SECRET = previousSecret
  })
  async function session(account: UserEntity) {
    const sessions = database.getRepository(AuthSessionEntity)
    const row = await sessions.save({ userId: account.id, organizationId: account.organizationId, refreshTokenHash: randomUUID().replaceAll('-', '').repeat(2), lastActivityAt: new Date(), absoluteExpiresAt: new Date(Date.now() + 3600000), secondFactorVerifiedAt: new Date() })
    return new AccessTokenService({ now: () => new Date() }).sign(account.id, account.organizationId, row.id, account.role)
  }
  function request(path = '', access = token, body?: unknown) {
    return fetch(`${origin}/me/preferences${path}`, { method: body === undefined ? 'GET' : 'PUT', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  }
  it('exige JWT e rejeita token inválido', async () => {
    expect((await fetch(`${origin}/me/preferences`)).status).toBe(401)
    expect((await request('', 'invalid')).status).toBe(401)
    expect((await request('/energy', 'invalid', { expectedRevision: 0, value: energy })).status).toBe(401)
  })
  it.each([UserRole.ADMIN, UserRole.ANALYST, UserRole.VISITOR])('permite ao %s salvar apenas suas preferências', async (role) => {
    user.role = role
    await database.getRepository(UserEntity).save(user)
    token = await session(user)
    expect(await (await request()).json()).toEqual({ energy: null, emissions: null, coverage: null, analysis: null })
    const response = await request('/energy', token, { expectedRevision: 0, value: energy })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ revision: 1, value: energy })
    const other = await database.getRepository(UserEntity).save({ organizationId: organization.id, email: `${randomUUID()}@example.test`, name: 'Other', role, isActive: true, emailVerifiedAt: new Date() })
    expect(await (await request('', await session(other))).json()).toEqual({ energy: null, emissions: null, coverage: null, analysis: null })
    expect((await request('/energy', token, { expectedRevision: 1, value: energy, userId: other.id })).status).toBe(400)
  })
  it('salva por aba, preserva auditoria antes/depois e recusa gravação concorrente', async () => {
    await request('/energy', token, { expectedRevision: 0, value: energy })
    await request('/coverage', token, { expectedRevision: 0, value: { thresholdPercent: 85, alertsEnabled: true } })
    const responses = await Promise.all([8.5, 9].map((threshold) => request('/energy', token, { expectedRevision: 1, value: { ...energy, threshold } })))
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    const result = await (await request()).json() as { energy: { revision: number }; coverage: { value: unknown } }
    expect(result.energy.revision).toBe(2)
    expect(result.coverage.value).toEqual({ thresholdPercent: 85, alertsEnabled: true })
    const audit = await database.getRepository(AuditLogEntity).find({ where: { entityId: `${user.id}:energy` }, order: { createdAt: 'ASC' } })
    expect(audit).toHaveLength(2)
    expect(audit[0].before).toBeNull()
    expect(audit[1].before).toEqual({ revision: 1, value: energy })
    expect(audit[1].after).toMatchObject({ revision: 2 })
  })
  it('recusa usuário inativo e não altera dados existentes', async () => {
    await request('/energy', token, { expectedRevision: 0, value: energy })
    await database.getRepository(UserEntity).update(user.id, { isActive: false })
    expect((await request('/energy', token, { expectedRevision: 1, value: { ...energy, threshold: 1 } })).status).toBe(401)
    expect((await database.getRepository(UserPreferenceEntity).findOneByOrFail({ userId: user.id, tab: 'energy' })).revision).toBe(1)
  })
})
