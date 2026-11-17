import { randomBytes, randomUUID } from 'node:crypto'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { MonitoringCycleEntity, MonitoringCycleStatus } from '../../database/entities/monitoring-cycle.entity'
import { MonitoringSettingsEntity } from '../../database/entities/monitoring-settings.entity'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserAccountStatus, UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AccessTokenService } from '../authentication/access-token.service'
import { QualityFixture, createQualityFixture } from '../../../test/quality-fixture'

const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip

describeDatabase('monitoring operations through protected HTTP and PostgreSQL', () => {
  let fixture: QualityFixture

  beforeEach(async () => { fixture = await createQualityFixture() }, 60_000)
  afterEach(async () => { await fixture?.close() }, 60_000)

  async function createPrincipal(role: UserRole, organizationId?: string) {
    const organizations = fixture.database.getRepository(OrganizationEntity)
    const organization = organizationId
      ? await organizations.findOneByOrFail({ id: organizationId })
      : await organizations.save(organizations.create({ name: 'GreenER', slug: randomUUID() }))
    const users = fixture.database.getRepository(UserEntity)
    const user = await users.save(users.create({
      organizationId: organization.id,
      name: role === UserRole.ADMIN ? 'Admin Árvore' : 'Analyst',
      email: `${randomUUID()}@example.test`,
      emailVerifiedAt: new Date(),
      role,
      status: UserAccountStatus.ACTIVE,
    }))
    const session = await fixture.database.getRepository(AuthSessionEntity).save(
      fixture.database.getRepository(AuthSessionEntity).create({
        userId: user.id,
        organizationId: organization.id,
        refreshTokenHash: randomBytes(32).toString('hex'),
        lastActivityAt: new Date(),
        absoluteExpiresAt: new Date(Date.now() + 60_000),
        secondFactorVerifiedAt: role === UserRole.ADMIN ? new Date() : null,
      }),
    )
    return {
      user,
      organization,
      token: fixture.app.get(AccessTokenService).sign(user.id, organization.id, session.id, role),
    }
  }

  it('returns persisted operational state and protects it to Admin', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    const analyst = await createPrincipal(UserRole.ANALYST, admin.organization.id)
    const cycles = fixture.database.getRepository(MonitoringCycleEntity)
    await cycles.save(cycles.create({
      status: MonitoringCycleStatus.PARTIAL,
      startedAt: new Date('2026-11-17T12:00:00Z'),
      finishedAt: new Date('2026-11-17T12:00:12Z'),
      durationMs: '12000',
      discoveredCount: 4,
      processedCount: 3,
      failedCount: 1,
      persistedCount: 2,
      details: null,
    }))
    await fixture.database.getRepository(ApplicationEntity).save(
      fixture.database.getRepository(ApplicationEntity).create({
        id: 'stale-service', name: 'Stale service', isStale: true,
        stateReason: ApplicationStateReason.MONITORING_CYCLE_DELAYED,
        lastObservationAt: new Date('2026-11-17T11:59:00Z'),
      }),
    )

    const unauthenticated = await fetch(`${fixture.url}/monitoring/health`)
    const forbidden = await fetch(`${fixture.url}/monitoring/health`, { headers: { authorization: `Bearer ${analyst.token}` } })
    const response = await fetch(`${fixture.url}/monitoring/health`, { headers: { authorization: `Bearer ${admin.token}` } })
    const responseBody = await response.text()

    expect(unauthenticated.status).toBe(401)
    expect(forbidden.status).toBe(403)
    expect(response.status).toBe(200)
    expect(JSON.parse(responseBody)).toMatchObject({
      state: 'ACTIVE', paused: false, schedulerRunning: true, intervalSeconds: 60,
      latestCycle: { status: 'PARTIAL', durationMs: 12000, discoveredCount: 4, processedCount: 3, failedCount: 1, persistedCount: 2 },
      knownApplications: 1, staleApplications: 1, delayedApplications: 1,
      sources: expect.arrayContaining([expect.objectContaining({ integration: 'metrics', status: 'UNKNOWN' })]),
    })
  })

  it('pauses and resumes future cycles with an atomic organization-audited change', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    const setPaused = (paused: boolean) => fetch(`${fixture.url}/monitoring/control`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${admin.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ paused, reason: paused ? 'Manutenção aprovada' : 'Manutenção concluída' }),
    })

    const pause = await setPaused(true)
    expect(pause.status).toBe(200)
    expect(await pause.json()).toMatchObject({ paused: true, changed: true })
    expect(await fixture.database.getRepository(MonitoringSettingsEntity).findOneByOrFail({ id: 'global' })).toMatchObject({ paused: true })
    const health = await fetch(`${fixture.url}/monitoring/health`, { headers: { authorization: `Bearer ${admin.token}` } })
    expect(await health.json()).toMatchObject({ state: 'PAUSED', paused: true })

    const repeat = await setPaused(true)
    expect(repeat.status).toBe(200)
    expect(await repeat.json()).toMatchObject({ paused: true, changed: false })

    const resume = await setPaused(false)
    expect(resume.status).toBe(200)
    expect(await resume.json()).toMatchObject({ paused: false, changed: true })
    expect(await fixture.database.getRepository(AuditLogEntity).countBy({ actorUserId: admin.user.id })).toBe(2)
  })

  it('searches authorized audit rows without accents and excludes other organizations and system actors', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    const other = await createPrincipal(UserRole.ADMIN)
    const audit = fixture.app.get(AuditWriter)
    const add = (actor: { type: 'user'; userId: string } | { type: 'system'; componentId: string }, entityId: string) => audit.record({
      actor, action: 'account.role.changed', entityType: 'user', entityId,
      outcome: 'success', before: { role: 'ANALYST' }, after: { role: 'ADMIN' },
      allowedSnapshotFields: ['role'], reason: 'Ação de segurança',
    })
    await add({ type: 'user', userId: admin.user.id }, 'same-org')
    for (let index = 0; index < 6; index++) await add({ type: 'user', userId: admin.user.id }, `same-org-${index}`)
    await add({ type: 'user', userId: other.user.id }, 'other-org')
    await add({ type: 'system', componentId: 'scheduler' }, 'global')

    const response = await fetch(`${fixture.url}/monitoring/audit?search=acao%20de%20seguranca&pageSize=all`, {
      headers: { authorization: `Bearer ${admin.token}` },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ actor: admin.user.id, actorType: 'user', reason: 'Ação de segurança' })]),
      pagination: { page: 1, pageSize: 'all', totalItems: 7, totalPages: 1, hasNextPage: false },
    })

    const page = await fetch(`${fixture.url}/monitoring/audit?before=ANALYST&after=ADMIN&action=account.role.changed&outcome=success&pageSize=5`, {
      headers: { authorization: `Bearer ${admin.token}` },
    })
    expect(await page.json()).toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ entityType: 'user' })]),
      pagination: { page: 1, pageSize: 5, totalItems: 7, totalPages: 2, hasNextPage: true },
    })

    const invalid = await fetch(`${fixture.url}/monitoring/audit?pageSize=6`, {
      headers: { authorization: `Bearer ${admin.token}` },
    })
    expect(invalid.status).toBe(400)
  })
})
