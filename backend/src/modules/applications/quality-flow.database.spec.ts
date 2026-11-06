import { randomBytes } from 'node:crypto'
import { createQualityFixture, QualityFixture } from '../../../test/quality-fixture'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AccessTokenService } from '../authentication/access-token.service'
import { MonitoringIncidentEntity, MonitoringIncidentStatus } from '../../database/entities/monitoring-incident.entity'

const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip

describeDatabase('RNF-06: real HTTP sources → application → PostgreSQL → public APIs', () => {
  let fixture: QualityFixture
  const from = new Date(Date.now() - 3600_000).toISOString()
  const to = new Date(Date.now() + 3600_000).toISOString()
  const period = new URLSearchParams({ from, to }).toString()
  async function get(path: string) {
    const response = await fetch(`${fixture.url}${path}`)
    expect(response.status).toBe(200)
    return response.json()
  }
  beforeEach(async () => { fixture = await createQualityFixture() }, 60_000)
  afterEach(async () => { await fixture?.close() }, 60_000)

  it('discovers, calculates and reconciles persisted evidence with dashboard, detail, series and preview', async () => {
    await fixture.cycle()
    const rows = await fixture.database.getRepository(CollectionEntity).find({ order: { applicationId: 'ASC' } })
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row.energyKwh).toBe('0.00084783')
      expect(row.carbonGrams).toBe('0.07206583')
      expect(row.carbonFactor).toBe('85.00000000')
      expect(row.calculationVersion).toBe('1')
      expect(row.calculationEvidence?.energy).toMatchObject({
        durationSeconds: 60, modelVersion: '1', reasons: [],
      })
      expect(row.calculationEvidence?.energy.averagePowerW).toBeCloseTo(50.87, 8)
      expect(row.intervalEnd.getTime() - row.intervalStart.getTime()).toBe(60_000)
      expect(row.carbonRegionId).not.toBeNull()
      expect(row.carbonRegionVersion).not.toBeNull()
    }
    expect(fixture.requests).toEqual(expect.arrayContaining([
      '/services', '/metrics/quality-api', '/metrics/quality-worker', '/regions/br-sudeste/carbon-intensity',
    ]))
    const summary = await get(`/analysis/summary?${period}`)
    expect(summary).toMatchObject({ status: 'available', period: { from, to },
      totals: { energy: { unit: 'kWh' }, emissions: { unit: 'gCO2e' } },
    })
    expect(summary.totals.energy.value).toBeCloseTo(Number(rows[0].energyKwh) * 2, 8)
    expect(summary.totals.emissions.value).toBeCloseTo(Number(rows[0].carbonGrams) * 2, 8)
    const detail = await get(`/applications/quality-api/analysis?${period}`)
    const series = await get(`/applications/quality-api/analysis/series?${period}&granularity=hour`)
    const contribution = summary.applications.find((item: { applicationId: string }) => item.applicationId === 'quality-api')
    expect(detail.energy).toEqual(contribution.energy)
    expect(detail.emissions).toEqual(contribution.emissions)
    expect(detail.coverage).toEqual(contribution.coverage)
    expect(series.totals).toEqual({ energy: detail.energy, emissions: detail.emissions })
    expect(series.coverage).toEqual(detail.coverage)
    const preview = await fetch(`${fixture.url}/applications/quality-api/analysis/recalculation-preview`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ from, to }),
    })
    expect(preview.status).toBe(200)
    expect(await fixture.database.getRepository(CollectionEntity).find({ order: { applicationId: 'ASC' } })).toEqual(rows)
    expect(await get(`/analysis/summary?${period}`)).toEqual(summary)
  })

  it('preserves identity/history for invalid snapshots and partial failures, then recovers through real adapters', async () => {
    await fixture.cycle()
    const originals = await fixture.database.getRepository(CollectionEntity).find()
    const identity = await fixture.database.getRepository(ApplicationEntity).findOneByOrFail({ id: 'quality-api' })
    fixture.sources.invalidSnapshot = true
    await expect(fixture.cycle()).rejects.toMatchObject({ code: 'INVALID_UPSTREAM_RESPONSE' })
    expect(await fixture.database.getRepository(CollectionEntity).count()).toBe(originals.length)
    fixture.sources.invalidSnapshot = false
    fixture.sources.failedMetrics.add('quality-api')
    await fixture.cycle()
    const partial = await fixture.database.getRepository(CollectionEntity).find({ order: { collectedAt: 'DESC' } })
    expect(partial).toHaveLength(originals.length + 1)
    expect(partial.filter((row) => row.applicationId === 'quality-api')).toHaveLength(1)
    expect(partial[0].applicationId).toBe('quality-worker')
    fixture.sources.failedMetrics.clear()
    fixture.sources.carbonUnavailable = true
    await fixture.cycle()
    const noFactor = await fixture.database.getRepository(CollectionEntity).find({ order: { collectedAt: 'DESC' }, take: 2 })
    for (const row of noFactor) {
      expect(Number(row.energyKwh)).toBeGreaterThan(0)
      expect(row.carbonGrams).toBeNull()
      expect(row.carbonFactor).toBeNull()
    }
    fixture.sources.carbonUnavailable = false
    for (let cycle = 0; cycle < 3; cycle++) await fixture.cycle()
    const recovered = await fixture.database.getRepository(ApplicationEntity).findOneByOrFail({ id: identity.id })
    expect(recovered.id).toBe(identity.id)
    expect(recovered.firstSeenAt).toEqual(identity.firstSeenAt)
    expect(recovered.state).toBe('AVAILABLE')
    expect(recovered.isStale).toBe(false)
    const incidents = await fixture.database.getRepository(MonitoringIncidentEntity).find()
    expect(incidents.length).toBeGreaterThan(0)
    expect(incidents.every((incident) => incident.status === MonitoringIncidentStatus.RESOLVED)).toBe(true)
    const collections = fixture.database.getRepository(CollectionEntity)
    for (const original of originals) expect(await collections.findOneByOrFail({ id: original.id })).toEqual(original)
    const latest = await collections.find({ order: { collectedAt: 'DESC' }, take: 2 })
    expect(latest.every((row) => Number(row.carbonGrams) > 0)).toBe(true)
    const summary = await get(`/analysis/summary?${period}`)
    expect(summary.totals.energy.value).toBeGreaterThan(0)
    expect(summary.totals.emissions.value).toBeGreaterThan(0)
  }, 60_000)

  async function token(role: UserRole, active = true) {
    const organizations = fixture.database.getRepository(OrganizationEntity)
    const organization = await organizations.save(organizations.create({ name: 'Quality', slug: randomBytes(8).toString('hex') }))
    const users = fixture.database.getRepository(UserEntity)
    const user = await users.save(users.create({ organizationId: organization.id, name: role,
      email: `${randomBytes(8).toString('hex')}@example.test`, role, isActive: active, emailVerifiedAt: new Date(),
    }))
    const sessions = fixture.database.getRepository(AuthSessionEntity)
    const session = await sessions.save(sessions.create({ userId: user.id, organizationId: organization.id,
      refreshTokenHash: randomBytes(32).toString('hex'), lastActivityAt: new Date(),
      absoluteExpiresAt: new Date(Date.now() + 3600_000), secondFactorVerifiedAt: new Date(),
    }))
    return fixture.app.get(AccessTokenService).sign(user.id, organization.id, session.id, role)
  }
  async function invite(accessToken?: string, email = 'invited@example.test') {
    return fetch(`${fixture.url}/auth/sso/invitations`, { method: 'POST',
      headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ email, name: 'Quality invite', role: UserRole.ANALYST }),
    })
  }
  async function invitations() { return fixture.database.query('SELECT * FROM sso_invitations ORDER BY id') }
  async function audits() { return fixture.database.query('SELECT * FROM audit_logs ORDER BY id') }

  it('allows Admin only, rejects anonymous/Analyst/Visitor/disabled accounts without mutations or secrets', async () => {
    const before = await invitations()
    const beforeAudit = await audits()
    const emails = fixture.emails.length
    expect((await invite()).status).toBe(401)
    for (const role of [UserRole.ANALYST, UserRole.VISITOR]) expect((await invite(await token(role))).status).toBe(403)
    expect((await invite(await token(UserRole.ADMIN, false))).status).toBe(401)
    expect(await invitations()).toEqual(before)
    expect(await audits()).toEqual(beforeAudit)
    expect(fixture.emails).toHaveLength(emails)
    const admin = await token(UserRole.ADMIN)
    expect((await invite(admin, 'invalid')).status).toBe(400)
    expect(await invitations()).toEqual(before)
    expect(await audits()).toEqual(beforeAudit)
    const response = await invite(admin)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body).toEqual({ expiresAt: expect.any(String) })
    const issuedAudits = await audits()
    expect(issuedAudits).toEqual(expect.arrayContaining([expect.objectContaining({ action: 'auth.sso.invitation.issued' })]))
    const rawToken = new URLSearchParams(new URL(fixture.emails.at(-1)!.text.split('\n').at(-1)!).hash.slice(1)).get('sso_invite')
    expect(rawToken).toBeTruthy()
    expect(JSON.stringify({ body, issuedAudits, invitations: await invitations() })).not.toContain(rawToken)
    await get(`/analysis/summary?${period}`)
  })

  it('rolls back invitation and revocation when audit persistence fails, sends no email, and recovers', async () => {
    const admin = await token(UserRole.ADMIN)
    expect((await invite(admin, 'rollback@example.test')).status).toBe(201)
    const before = await invitations()
    const beforeAudit = await audits()
    const emails = fixture.emails.length
    await fixture.database.query(`CREATE FUNCTION reject_invitation_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action = 'auth.sso.invitation.issued' THEN RAISE EXCEPTION 'quality forced audit failure'; END IF;
      RETURN NEW; END $$`)
    await fixture.database.query(`CREATE TRIGGER quality_audit_failure BEFORE INSERT ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION reject_invitation_audit()`)
    try {
      const response = await invite(admin, 'rollback@example.test')
      expect(response.status).toBe(500)
      expect(await response.text()).not.toContain('quality forced audit failure')
      expect(await invitations()).toEqual(before)
      expect(await audits()).toEqual(beforeAudit)
      expect(fixture.emails).toHaveLength(emails)
    } finally {
      await fixture.database.query('DROP TRIGGER quality_audit_failure ON audit_logs')
      await fixture.database.query('DROP FUNCTION reject_invitation_audit()')
    }
    expect((await invite(admin, 'rollback@example.test')).status).toBe(201)
  })
})
