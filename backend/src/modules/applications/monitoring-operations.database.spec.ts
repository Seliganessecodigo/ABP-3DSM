import { randomBytes, randomUUID } from 'node:crypto'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { MonitoringCycleEntity, MonitoringCycleStatus } from '../../database/entities/monitoring-cycle.entity'
import { MonitoringSettingsEntity } from '../../database/entities/monitoring-settings.entity'
import { MonitoringControlVersionEntity } from '../../database/entities/monitoring-control-version.entity'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { MetricsAggregatorAdapter } from '../../integrations/metrics-aggregator.adapter'
import { VersionMonitoringControl1793600000000 } from '../../database/migrations/1793600000000-VersionMonitoringControl'
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

  async function control(token: string, paused: boolean, reason = 'Alteração aprovada') {
    return fetch(`${fixture.url}/monitoring/control`, {
      method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ paused, reason }),
    })
  }

  it('migrates the existing paused state and timestamp without assigning versions to old cycles', async () => {
    const queryRunner = fixture.database.createQueryRunner()
    const migration = new VersionMonitoringControl1793600000000()
    try {
      await migration.down(queryRunner)
      await queryRunner.query(`UPDATE monitoring_settings SET paused = true, "updatedAt" = '2026-11-01T12:00:00Z' WHERE id = 'global'`)
      const cycle = await fixture.database.getRepository(MonitoringCycleEntity).save({ startedAt: new Date('2026-11-01T10:00:00Z'), details: { source: 'legacy' } })
      await migration.up(queryRunner)
      const version = await fixture.database.getRepository(MonitoringControlVersionEntity).findOneByOrFail({ actorType: 'system' })
      expect(version).toMatchObject({ paused: true, previousVersion: null, actor: 'migration.monitoring-control', createdAt: new Date('2026-11-01T12:00:00Z') })
      expect(await fixture.database.getRepository(MonitoringSettingsEntity).findOneByOrFail({ id: 'global' })).toMatchObject({ paused: true, configurationVersion: version.id })
      expect((await fixture.database.getRepository(MonitoringCycleEntity).findOneByOrFail({ id: cycle.id })).details).toEqual({ source: 'legacy' })
    } finally {
      await queryRunner.release()
    }
  })

  it('serializes concurrent requests into one immutable revision and keeps idempotent requests on that revision', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    const versions = fixture.database.getRepository(MonitoringControlVersionEntity)
    const baseline = await versions.findOneByOrFail({ actorType: 'system' })
    const responses = await Promise.all([control(admin.token, true), control(admin.token, true)])
    expect(responses.map(response => response.status)).toEqual([200, 200])
    const bodies = await Promise.all(responses.map(response => response.json()))
    expect(bodies.map(body => body.changed).sort()).toEqual([false, true])
    expect(bodies[0].configurationVersion).toBe(bodies[1].configurationVersion)
    const version = await versions.findOneByOrFail({ id: bodies[0].configurationVersion })
    expect(version).toMatchObject({ paused: true, previousVersion: baseline.id, actorType: 'user', actor: admin.user.id, reason: 'Alteração aprovada' })
    expect(await versions.count()).toBe(2)
    const audit = await fixture.database.getRepository(AuditLogEntity).findOneByOrFail({ actorUserId: admin.user.id })
    expect(audit).toMatchObject({ before: { paused: false, configurationVersion: baseline.id }, after: { paused: true, configurationVersion: version.id }, outcome: 'success' })
    await expect(versions.update(version.id, { paused: false })).rejects.toThrow('immutable')
    await expect(versions.delete(version.id)).rejects.toThrow('immutable')
    expect(await versions.findOneByOrFail({ id: baseline.id })).toEqual(baseline)
  })

  it('rolls back the revision and current state if success audit fails, then records failure without snapshots', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    const settings = fixture.database.getRepository(MonitoringSettingsEntity)
    const before = await settings.findOneByOrFail({ id: 'global' })
    jest.spyOn(fixture.app.get(AuditWriter), 'record').mockRejectedValueOnce(new Error('simulated audit failure'))
    const response = await control(admin.token, true)
    expect(response.status).toBe(500)
    expect(await response.text()).not.toContain('simulated audit failure')
    expect(await settings.findOneByOrFail({ id: 'global' })).toEqual(before)
    expect(await fixture.database.getRepository(MonitoringControlVersionEntity).count()).toBe(1)
    const audit = await fixture.database.getRepository(AuditLogEntity).findOneByOrFail({ actorUserId: admin.user.id })
    expect(audit).toMatchObject({ outcome: 'failed', before: null, after: null })
  })

  it('rejects unauthorized and invalid changes without creating a revision', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    for (const role of [UserRole.ANALYST, UserRole.VISITOR]) {
      const user = await createPrincipal(role, admin.organization.id)
      expect((await control(user.token, true)).status).toBe(403)
    }
    expect((await control('invalid', true)).status).toBe(401)
    expect((await control(admin.token, true, ' ')).status).toBe(400)
    expect((await control(admin.token, true, 'x'.repeat(513))).status).toBe(400)
    expect(await fixture.database.getRepository(MonitoringControlVersionEntity).count()).toBe(1)
  })

  it('preserves an in-flight cycle version and original observations across pause and resume', async () => {
    const admin = await createPrincipal(UserRole.ADMIN)
    const settings = fixture.database.getRepository(MonitoringSettingsEntity)
    const original = await settings.findOneByOrFail({ id: 'global' })
    const adapter = fixture.app.get(MetricsAggregatorAdapter)
    const fetchServices = adapter.fetchServices.bind(adapter)
    jest.spyOn(adapter, 'fetchServices').mockImplementationOnce(async signal => {
      expect((await control(admin.token, true)).status).toBe(200)
      return fetchServices(signal)
    })
    await fixture.cycle()
    const cycles = fixture.database.getRepository(MonitoringCycleEntity)
    const first = await cycles.findOneByOrFail({})
    expect(first.details).toMatchObject({ configurationVersion: original.configurationVersion })
    const observations = await fixture.database.getRepository(CollectionEntity).find({ order: { id: 'ASC' } })
    expect(observations.length).toBeGreaterThan(0)
    await fixture.cycle()
    expect(await cycles.count()).toBe(1)
    const resume = await control(admin.token, false)
    const resumed = await resume.json()
    expect(resume.status).toBe(200)
    await fixture.cycle()
    const latest = await fetch(`${fixture.url}/monitoring/health`, { headers: { authorization: `Bearer ${admin.token}` } })
    expect(await latest.json()).toMatchObject({ configurationVersion: resumed.configurationVersion, latestCycle: { configurationVersion: resumed.configurationVersion } })
    expect(await cycles.findOneByOrFail({ id: first.id })).toEqual(first)
    for (const observation of observations) {
      expect(await fixture.database.getRepository(CollectionEntity).findOneByOrFail({ id: observation.id })).toEqual(observation)
    }
  })

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
    for (const action of ['auth.login.succeeded', 'auth.login.password.succeeded', 'auth.login.totp.succeeded', 'auth.sso.login.succeeded', 'auth.session.refreshed', 'auth.session.revoked', 'auth.totp.setup.started', 'auth.totp.replacement.started', 'account.list', 'account.status.unchanged', 'auth.login.future-provider.succeeded']) {
      await audit.record({ actor: { type: 'user', userId: admin.user.id }, action, entityType: 'user', entityId: admin.user.id, outcome: 'success', reason: 'Ação de segurança' })
    }
    const unfiltered = await fetch(`${fixture.url}/monitoring/audit?pageSize=5`, {
      headers: { authorization: `Bearer ${admin.token}` },
    })
    expect(unfiltered.status).toBe(200)
    const changes = await unfiltered.json()
    expect(changes.pagination).toMatchObject({ totalItems: 7, totalPages: 2, hasNextPage: true })
    expect(changes.items).toHaveLength(5)
    expect(changes.items.every((item: { action: string }) => item.action === 'account.role.changed')).toBe(true)

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
