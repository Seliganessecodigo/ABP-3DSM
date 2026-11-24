import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createQualityFixture, type QualityFixture } from '../../../test/quality-fixture'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { ApplicationEventEntity } from '../../database/entities/application-event.entity'
import { MonitoringIncidentEntity } from '../../database/entities/monitoring-incident.entity'
import { RemovalService } from './removal.service'

const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip
const evidence: Record<string, unknown>[] = []
const location = { region_code: 'br-sudeste', country: 'Brazil', region: 'Sudeste', city: null, latitude: -23.55, longitude: -46.63 }
const service = (id: string, name = id, changedLocation = location) => ({ id, name, location: changedLocation, metrics_path: `/metrics/${id}` })

describeDatabase('CT-014/015: descoberta e remoção com HTTP e PostgreSQL reais', () => {
  let fixture: QualityFixture
  beforeEach(async () => { fixture = await createQualityFixture() }, 60_000)
  afterEach(async () => { await fixture?.close() }, 60_000)
  afterAll(() => {
    const directory = resolve(__dirname, '../../../../.github/evidencias/qa-descoberta-remocao')
    mkdirSync(directory, { recursive: true })
    writeFileSync(resolve(directory, 'observado.json'), JSON.stringify({ executedAt: new Date().toISOString(), evidence }, null, 2))
  })
  async function get(path: string) {
    const response = await fetch(`${fixture.url}${path}`)
    const body = await response.json()
    expect(response.status).toBe(200)
    return body
  }
  async function events(id: string, kind?: string) {
    return fixture.database.getRepository(ApplicationEventEntity).find({ where: { applicationId: id, ...(kind ? { kind } : {}) }, order: { occurredAt: 'ASC' } })
  }
  async function collections(id: string) {
    return fixture.database.getRepository(CollectionEntity).find({ where: { applicationId: id }, order: { collectedAt: 'ASC' } })
  }
  function snapshot(items: ReturnType<typeof service>[]) { fixture.sources.responses.set('/services', { status: 200, body: items }) }

  it('CT-014 S1–S4: descobre, mantém identidade e preserva evidências após mudar nome/localização', async () => {
    snapshot([])
    await fixture.cycle()
    const id = 'qa-nova-nao-uuid'
    expect(await get('/applications')).toEqual([])
    snapshot([service(id)])
    await fixture.cycle()
    const initial = await get(`/applications/${id}`)
    const originalCollections = await collections(id)
    expect(initial).toMatchObject({ id, name: id, location: { regionCode: 'br-sudeste', city: null } })
    expect(await events(id, 'discovered')).toHaveLength(1)
    expect(originalCollections).toHaveLength(1)
    await fixture.cycle()
    expect(await fixture.database.getRepository(ApplicationEntity).count({ where: { id } })).toBe(1)
    expect(await events(id, 'discovered')).toHaveLength(1)
    snapshot([service(id, 'Nome alterado')])
    await fixture.cycle()
    const renamed = await get(`/applications/${id}`)
    expect(renamed).toMatchObject({ id, name: 'Nome alterado', location: { regionCode: 'br-sudeste' } })
    const nameEvents = await events(id, 'registration_changed')
    expect(nameEvents).toHaveLength(1)
    const newLocation = { ...location, region_code: 'br-norte', region: 'Norte', latitude: -3.1, longitude: -60 }
    snapshot([service(id, 'Nome alterado', newLocation)])
    fixture.sources.responses.set('/regions/br-norte/carbon-intensity', { status: 200, body: { ...newLocation, carbon_intensity_gco2e_per_kwh: 85, renewable_share_percent: 83 } })
    await fixture.cycle()
    const moved = await get(`/applications/${id}`)
    expect(moved).toMatchObject({ id, name: 'Nome alterado', location: { regionCode: 'br-norte', city: null } })
    const saved = await collections(id)
    expect(saved[0]).toEqual(originalCollections[0])
    expect(saved[0].calculationEvidence?.carbon.factorSnapshot?.regionCode).toBe('br-sudeste')
    expect(saved.at(-1)?.calculationEvidence?.carbon.factorSnapshot?.regionCode).toBe('br-norte')
    expect(await events(id, 'registration_changed')).toHaveLength(2)
    const catalog = await get('/applications')
    expect(catalog).toEqual([moved])
    const oldEvidence = await get(`/applications/${id}/collections/${saved[0].id}`)
    expect(oldEvidence).toMatchObject({ id: saved[0].id, applicationId: id })
    evidence.push({ case: 'CT-014', scenarios: 'S1–S4 e consultas API de S5', initial, renamed, moved, events: await events(id), originalEvidence: oldEvidence, collectionIds: saved.map(row => row.id), sourceRequests: fixture.requests })
  }, 60_000)

  it('CT-015 S1–S5: confirma ausência com 404, preserva histórico e não duplica remoção', async () => {
    const a = service('qa-a'), b = service('qa-b')
    snapshot([a, b])
    await fixture.cycle()
    const before = await collections(a.id)
    snapshot([b])
    fixture.sources.responses.set(`/services/${a.id}`, { status: 200, body: a })
    await fixture.cycle()
    const retained = await get(`/applications/${a.id}`)
    expect(retained.state).not.toBe('REMOVED')
    expect(await events(a.id, 'removed')).toHaveLength(0)
    expect((await collections(a.id)).length).toBeGreaterThan(before.length)
    fixture.sources.responses.set(`/services/${a.id}`, { status: 404, body: { error: 'not found' } })
    await fixture.cycle()
    const removed = await get(`/applications/${a.id}`)
    expect(removed).toMatchObject({ id: a.id, state: 'REMOVED', reason: 'REMOVAL_CONFIRMED' })
    expect(removed.removedAt).toBeTruthy()
    const removedEvents = await events(a.id, 'removed')
    expect(removedEvents).toHaveLength(1)
    expect(removedEvents[0].details).toMatchObject({ confirmation: 'service-detail-404' })
    expect((await collections(a.id))[0]).toEqual(before[0])
    const historical = await get(`/applications/${a.id}/collections/${before[0].id}`)
    expect(historical).toMatchObject({ id: before[0].id })
    const savedAfterRemoval = await collections(a.id)
    await fixture.cycle()
    expect(await events(a.id, 'removed')).toHaveLength(1)
    expect(await collections(a.id)).toEqual(savedAfterRemoval)
    const future = new URLSearchParams({ from: new Date(Date.now() + 3600000).toISOString(), to: new Date(Date.now() + 7200000).toISOString() })
    const empty = await get(`/applications/${a.id}/analysis?${future}`)
    expect(empty.energy.value).toBeNull()
    expect(empty.emissions.value).toBeNull()
    const requestStart = fixture.requests.length
    await fixture.cycle()
    expect(fixture.requests.slice(requestStart)).not.toContain(`/services/${b.id}`)
    snapshot([])
    fixture.sources.responses.set(`/services/${b.id}`, { status: 404, body: { error: 'not found' } })
    await fixture.cycle()
    expect((await get(`/applications/${b.id}`)).state).toBe('REMOVED')
    expect(await events(b.id, 'removed')).toHaveLength(1)
    evidence.push({ case: 'CT-015', scenarios: 'S1–S5', retained, removed, removalEvents: removedEvents, emptyAfterRemoval: empty, preservedCollectionId: before[0].id, sourceRequests: fixture.requests })
  }, 60_000)

  it.each([
    { name: '500', status: 500, body: { error: 'upstream error' } },
    { name: 'payload inválido', status: 200, body: { id: 'qa-a' } },
    { name: 'timeout', status: 200, body: service('qa-a'), delayMs: 31000 },
  ])('CT-015 variação $name: falha individual não remove e continua coletando', async variant => {
    const a = service('qa-a')
    snapshot([a])
    await fixture.cycle()
    const count = (await collections(a.id)).length
    snapshot([])
    fixture.sources.responses.set('/services/qa-a', variant)
    await fixture.cycle()
    const current = await get(`/applications/${a.id}`)
    expect(current.state).not.toBe('REMOVED')
    expect(await events(a.id, 'removed')).toHaveLength(0)
    expect((await collections(a.id)).length).toBeGreaterThan(count)
    const incidents = await fixture.database.getRepository(MonitoringIncidentEntity).find()
    expect(incidents.length).toBeGreaterThan(0)
    evidence.push({ case: 'CT-015', variant: variant.name, current, incidents, collectionCount: (await collections(a.id)).length, sourceRequests: fixture.requests })
  }, 120_000)

  it('CT-015 cancelamento: confirmação parcial não grava nenhuma remoção', async () => {
    snapshot([service('qa-a'), service('qa-b')])
    await fixture.cycle()
    fixture.sources.responses.set('/services/qa-a', { status: 404, body: { error: 'not found' } })
    fixture.sources.responses.set('/services/qa-b', { status: 404, body: { error: 'not found' }, delayMs: 500 })
    const [cycle] = await fixture.database.query<{ id: string }[]>('SELECT id FROM monitoring_cycles ORDER BY "startedAt" DESC LIMIT 1')
    const controller = new AbortController()
    const result = fixture.app.get(RemovalService).reconcile(cycle.id, [], controller.signal)
    while (!fixture.requests.includes('/services/qa-b')) await new Promise(resolve => setTimeout(resolve, 10))
    controller.abort()
    await expect(result).rejects.toMatchObject({ code: 'REQUEST_CANCELLED' })
    expect(await events('qa-a', 'removed')).toHaveLength(0)
    expect(await events('qa-b', 'removed')).toHaveLength(0)
    const current = await get('/applications')
    expect(current.every((item: { state: string }) => item.state !== 'REMOVED')).toBe(true)
    evidence.push({ case: 'CT-015', variant: 'cancelamento após primeira confirmação', current, sourceRequests: fixture.requests })
  }, 60_000)
})
