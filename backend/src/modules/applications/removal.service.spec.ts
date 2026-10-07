import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../../database/migrations/1791350000000-DiscoverApplications'
import { DiscoveryService } from './discovery.service'
import { ApplicationsRepository } from './applications.repository'
import { RemovalService } from './removal.service'
import { ReturnService } from './return.service'

const databaseUrl = process.env.TEST_DATABASE_URL
const describeDatabase = databaseUrl ? describe : describe.skip

describeDatabase('remoção confirmada por snapshot válido', () => {
  let database: DataSource
  let app: INestApplication
  let origin: Server
  let status = 200
  let payload: unknown
  const previousDatabaseUrl = process.env.DATABASE_URL
  const previousOriginUrl = process.env.METRICS_AGGREGATOR_URL
  const prefix = 'removal-test-'

  const service = (id: string) => ({
    id: `${prefix}${id}`,
    name: `Service ${id}`,
    metrics_path: `/metrics/${prefix}${id}`,
    location: {
      region_code: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      latitude: -23.5,
      longitude: -46.6,
    },
  })

  beforeAll(async () => {
    origin = createServer((request, response) => {
      if (request.url !== '/services') return void response.writeHead(404).end()
      response
        .writeHead(status, { 'content-type': 'application/json' })
        .end(JSON.stringify(payload))
    })
    await new Promise<void>((resolve) => origin.listen(0, '127.0.0.1', resolve))
    process.env.METRICS_AGGREGATOR_URL = `http://127.0.0.1:${(origin.address() as AddressInfo).port}`
    process.env.DATABASE_URL = databaseUrl
    database = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      migrations: [
        InitialSchema1791240000000,
        CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000,
        CarbonFactorSnapshots1791340000000,
        DiscoverApplications1791350000000,
      ],
    })
    await database.initialize()
    await database.runMigrations()
    app = await NestFactory.create(AppModule, { logger: false })
    await app.listen(0, '127.0.0.1')
  })

  afterAll(async () => {
    await app?.close()
    if (database?.isInitialized) await database.destroy()
    if (origin)
      await new Promise<void>((resolve) => origin.close(() => resolve()))
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
    if (previousOriginUrl === undefined)
      delete process.env.METRICS_AGGREGATOR_URL
    else process.env.METRICS_AGGREGATOR_URL = previousOriginUrl
  })

  beforeEach(async () => {
    status = 200
    payload = [service('a'), service('b')]
    await database.query(
      'DELETE FROM collections WHERE "applicationId" LIKE $1',
      [`${prefix}%`],
    )
    await database.query(
      'DELETE FROM application_events WHERE "applicationId" LIKE $1',
      [`${prefix}%`],
    )
    await database.query('DELETE FROM applications WHERE id LIKE $1', [
      `${prefix}%`,
    ])
    await app.get(DiscoveryService).discover(await cycleId())
  })

  afterEach(async () => {
    await database.query(
      'DELETE FROM collections WHERE "applicationId" LIKE $1',
      [`${prefix}%`],
    )
    await database.query(
      'DELETE FROM application_events WHERE "applicationId" LIKE $1',
      [`${prefix}%`],
    )
    await database.query('DELETE FROM applications WHERE id LIKE $1', [
      `${prefix}%`,
    ])
  })

  async function cycleId(): Promise<string> {
    const [cycle] = (await database.query(
      'INSERT INTO monitoring_cycles ("startedAt") VALUES (now()) RETURNING id',
    )) as [{ id: string }]
    return cycle.id
  }

  it('confirma no primeiro snapshot completo e preserva cadastro, eventos e coletas', async () => {
    const initialCollectionId = randomUUID()
    await database.query(
      `INSERT INTO collections (id, "applicationId", "intervalStart", "intervalEnd", "collectedAt", metrics, "metricUnits", state)
      VALUES ($1, $2, now() - interval '1 hour', now(), now(), $3, $4, 'AVAILABLE')`,
      [
        initialCollectionId,
        `${prefix}a`,
        JSON.stringify({ cpuPercent: 50 }),
        JSON.stringify({ cpuPercent: '%' }),
      ],
    )
    payload = [service('b')]
    const id = await cycleId()
    const before = new Date()
    expect(await app.get(RemovalService).reconcile(id)).toBeGreaterThanOrEqual(
      1,
    )
    expect(await app.get(RemovalService).reconcile(id)).toBe(0)
    const [application] = (await database.query(
      'SELECT state, "removedAt" FROM applications WHERE id = $1',
      [`${prefix}a`],
    )) as [{ state: string; removedAt: Date }]
    expect(application.state).toBe('REMOVED')
    expect(application.removedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    )
    const [present] = (await database.query(
      'SELECT state FROM applications WHERE id = $1',
      [`${prefix}b`],
    )) as [{ state: string }]
    expect(present.state).toBe('AVAILABLE')
    expect(
      (await app.get(ApplicationsRepository).findForCollection()).map(
        (item) => item.id,
      ),
    ).not.toContain(`${prefix}a`)
    const events = (await database.query(
      'SELECT * FROM application_events WHERE "applicationId" = $1 ORDER BY "occurredAt"',
      [`${prefix}a`],
    )) as Array<Record<string, unknown>>
    expect(events.map((event) => event.kind)).toEqual(['discovered', 'removed'])
    expect(events[1]).toMatchObject({
      cycleId: id,
      actor: 'system',
      details: {
        source: 'metrics-aggregator',
        observedAt: application.removedAt.toISOString(),
        confirmedAt: application.removedAt.toISOString(),
      },
    })
    const [collection] = (await database.query(
      'SELECT id FROM collections WHERE id = $1',
      [initialCollectionId],
    )) as [{ id: string }]
    expect(collection.id).toBe(initialCollectionId)
    const response = await fetch(
      new URL(`/applications/${prefix}a`, await app.getUrl()),
    )
    expect(((await response.json()) as { state: string }).state).toBe('REMOVED')
  })

  it('não remove em erro HTTP nem snapshot incompleto', async () => {
    payload = [{ ...service('b'), location: { region_code: 'br-sudeste' } }]
    await expect(
      app.get(RemovalService).reconcile(await cycleId()),
    ).rejects.toMatchObject({ code: 'INVALID_UPSTREAM_RESPONSE' })
    status = 500
    await expect(
      app.get(RemovalService).reconcile(await cycleId()),
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' })
    const rows = (await database.query(
      'SELECT state FROM applications WHERE id LIKE $1',
      [`${prefix}%`],
    )) as Array<{ state: string }>
    expect(rows.every((row) => row.state === 'AVAILABLE')).toBe(true)
  })

  it('desfaz estado e evento quando a confirmação não pode ser associada ao ciclo', async () => {
    payload = [service('b')]
    await expect(
      app.get(RemovalService).reconcile(randomUUID()),
    ).rejects.toThrow()
    const [row] = (await database.query(
      'SELECT state FROM applications WHERE id = $1',
      [`${prefix}a`],
    )) as [{ state: string }]
    expect(row.state).toBe('AVAILABLE')
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM application_events WHERE "applicationId" = $1',
      [`${prefix}a`],
    )) as [{ count: number }]
    expect(count).toBe(1)
  })

  it('retoma a mesma identidade sem preencher a lacuna de coletas', async () => {
    const [before] = (await database.query(
      'SELECT "firstSeenAt" FROM applications WHERE id = $1',
      [`${prefix}a`],
    )) as [{ firstSeenAt: Date }]
    payload = [service('b')]
    await app.get(RemovalService).reconcile(await cycleId())
    payload = [service('a'), service('b')]
    const id = await cycleId()
    expect(await app.get(ReturnService).reconcile(id)).toBe(1)
    expect(await app.get(ReturnService).reconcile(id)).toBe(0)

    const [application] = (await database.query(
      'SELECT id, state, "removedAt", "firstSeenAt" FROM applications WHERE id = $1',
      [`${prefix}a`],
    )) as [
      { id: string; state: string; removedAt: Date | null; firstSeenAt: Date },
    ]
    expect(application).toMatchObject({ id: `${prefix}a`, removedAt: null })
    expect(application.state).toBe('UNAVAILABLE')
    expect(application.firstSeenAt).toEqual(before.firstSeenAt)
    const events = (await database.query(
      'SELECT kind, "cycleId", actor, "occurredAt", details FROM application_events WHERE "applicationId" = $1 ORDER BY "occurredAt"',
      [`${prefix}a`],
    )) as Array<{
      kind: string
      cycleId: string
      actor: string
      occurredAt: Date
      details: Record<string, unknown>
    }>
    expect(events.map((event) => event.kind)).toEqual([
      'discovered',
      'removed',
      'returned',
    ])
    expect(events[2]).toMatchObject({
      cycleId: id,
      actor: 'system',
      details: { source: 'metrics-aggregator' },
    })
    expect(events[2].occurredAt).toBeInstanceOf(Date)
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM collections WHERE "applicationId" = $1',
      [`${prefix}a`],
    )) as [{ count: number }]
    expect(count).toBe(0)
    expect(
      (await app.get(ApplicationsRepository).findForCollection()).map(
        (item) => item.id,
      ),
    ).toContain(`${prefix}a`)
  })

  it('não retorna em snapshot inválido ou falha da origem', async () => {
    payload = [service('b')]
    await app.get(RemovalService).reconcile(await cycleId())
    payload = [
      service('a'),
      { ...service('b'), location: { region_code: 'br-sudeste' } },
    ]
    await expect(
      app.get(ReturnService).reconcile(await cycleId()),
    ).rejects.toMatchObject({ code: 'INVALID_UPSTREAM_RESPONSE' })
    status = 500
    await expect(
      app.get(ReturnService).reconcile(await cycleId()),
    ).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' })
    const [application] = (await database.query(
      'SELECT state FROM applications WHERE id = $1',
      [`${prefix}a`],
    )) as [{ state: string }]
    expect(application.state).toBe('REMOVED')
  })

  it('desfaz o retorno se o evento não puder ser vinculado ao ciclo', async () => {
    payload = [service('b')]
    await app.get(RemovalService).reconcile(await cycleId())
    payload = [service('a'), service('b')]
    await expect(
      app.get(ReturnService).reconcile(randomUUID()),
    ).rejects.toThrow()
    const [application] = (await database.query(
      'SELECT state, "removedAt" FROM applications WHERE id = $1',
      [`${prefix}a`],
    )) as [{ state: string; removedAt: Date }]
    expect(application.state).toBe('REMOVED')
    expect(application.removedAt).toBeInstanceOf(Date)
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM application_events WHERE "applicationId" = $1 AND kind = $2',
      [`${prefix}a`, 'returned'],
    )) as [{ count: number }]
    expect(count).toBe(0)
  })
})
