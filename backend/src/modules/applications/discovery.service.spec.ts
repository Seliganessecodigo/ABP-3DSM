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
import { MetadataSyncService } from './metadata-sync.service'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeDatabase = testDatabaseUrl ? describe : describe.skip

describeDatabase('descoberta de aplicações com HTTP e PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
  let origin: Server
  let status = 200
  let payload: unknown
  const previousDatabaseUrl = process.env.DATABASE_URL
  const previousOriginUrl = process.env.METRICS_AGGREGATOR_URL
  const prefix = 'discovery-test-'

  const servicePayload = () => [
    {
      id: `${prefix}api`,
      name: 'API de teste',
      metrics_path: `/metrics/${prefix}api`,
      location: {
        region_code: 'br-sudeste',
        country: 'Brazil',
        region: 'Sudeste',
        city: null,
        latitude: -23.5,
        longitude: -46.6,
      },
    },
  ]

  beforeAll(async () => {
    origin = createServer((request, response) => {
      if (request.url !== '/services') return void response.writeHead(404).end()
      response
        .writeHead(status, { 'content-type': 'application/json' })
        .end(JSON.stringify(payload))
    })
    await new Promise<void>((resolve) => origin.listen(0, '127.0.0.1', resolve))
    process.env.METRICS_AGGREGATOR_URL = `http://127.0.0.1:${(origin.address() as AddressInfo).port}`
    process.env.DATABASE_URL = testDatabaseUrl
    database = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
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
    payload = servicePayload()
    await database.query(
      'DELETE FROM application_events WHERE "applicationId" LIKE $1',
      [`${prefix}%`],
    )
    await database.query('DELETE FROM applications WHERE id LIKE $1', [
      `${prefix}%`,
    ])
  })

  afterEach(async () => {
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

  it('cadastra uma vez, expõe no catálogo e registra descoberta rastreável', async () => {
    const id = await cycleId()
    const service = app.get(DiscoveryService)
    expect(await service.discover(id)).toBe(1)
    expect(await service.discover(id)).toBe(0)
    const response = await fetch(new URL('/applications', await app.getUrl()))
    expect(response.status).toBe(200)
    const catalog = (await response.json()) as Array<Record<string, unknown>>
    expect(catalog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `${prefix}api`,
          name: 'API de teste',
          location: {
            regionCode: 'br-sudeste',
            country: 'Brazil',
            region: 'Sudeste',
            city: null,
            latitude: -23.5,
            longitude: -46.6,
          },
        }),
      ]),
    )
    const events = (await database.query(
      'SELECT * FROM application_events WHERE "applicationId" = $1',
      [`${prefix}api`],
    )) as Array<Record<string, unknown>>
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      kind: 'discovered',
      actor: 'system',
      cycleId: id,
    })
    expect(events[0].occurredAt).toBeInstanceOf(Date)
    const [stored] = (await database.query(
      'SELECT "metricsPath" FROM applications WHERE id = $1',
      [`${prefix}api`],
    )) as [{ metricsPath: string }]
    expect(stored.metricsPath).toBe(`/metrics/${prefix}api`)
  })

  it('não escreve após payload inválido ou erro HTTP', async () => {
    const id = await cycleId()
    payload = [
      ...servicePayload(),
      {
        ...servicePayload()[0],
        id: `${prefix}broken`,
        location: { region_code: 'br-sudeste' },
      },
    ]
    await expect(app.get(DiscoveryService).discover(id)).rejects.toMatchObject({
      code: 'INVALID_UPSTREAM_RESPONSE',
    })
    status = 500
    await expect(app.get(DiscoveryService).discover(id)).rejects.toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
    })
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM applications WHERE id LIKE $1',
      [`${prefix}%`],
    )) as [{ count: number }]
    expect(count).toBe(0)
  })

  it('não grava aplicação sem evento se a transação falhar', async () => {
    await expect(
      app.get(DiscoveryService).discover(randomUUID()),
    ).rejects.toThrow()
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM applications WHERE id LIKE $1',
      [`${prefix}%`],
    )) as [{ count: number }]
    expect(count).toBe(0)
  })

  it('duas descobertas simultâneas da mesma identidade gravam um único evento', async () => {
    const id = await cycleId()
    const results = await Promise.all([
      app.get(DiscoveryService).discover(id),
      app.get(DiscoveryService).discover(id),
    ])
    expect(results.sort()).toEqual([0, 1])
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM application_events WHERE "applicationId" = $1',
      [`${prefix}api`],
    )) as [{ count: number }]
    expect(count).toBe(1)
  })

  it('persiste identificador e nome sem truncar campos sem limite no OpenAPI', async () => {
    const longId = `${prefix}${'x'.repeat(140)}`
    const longName = 'Aplicação '.repeat(35)
    payload = [{ ...servicePayload()[0], id: longId, name: longName }]
    expect(await app.get(DiscoveryService).discover(await cycleId())).toBe(1)
    const [stored] = (await database.query(
      'SELECT id, name FROM applications WHERE id = $1',
      [longId],
    )) as [{ id: string; name: string }]
    expect(stored).toEqual({ id: longId, name: longName })
    const response = await fetch(
      new URL(`/applications/${longId}`, await app.getUrl()),
    )
    expect(response.status).toBe(200)
  })

  it('registra uma mudança conjunta de nome e localização uma única vez', async () => {
    await app.get(DiscoveryService).discover(await cycleId())
    payload = [
      {
        ...servicePayload()[0],
        name: 'API renomeada',
        location: {
          ...servicePayload()[0].location,
          city: 'Campinas',
          latitude: -22.9,
        },
      },
    ]
    const id = await cycleId()
    expect(await app.get(MetadataSyncService).reconcile(id)).toBe(1)
    expect(await app.get(MetadataSyncService).reconcile(id)).toBe(0)

    const [application] = (await database.query(
      'SELECT name, city, latitude FROM applications WHERE id = $1',
      [`${prefix}api`],
    )) as [{ name: string; city: string; latitude: number }]
    expect(application).toMatchObject({
      name: 'API renomeada',
      city: 'Campinas',
      latitude: -22.9,
    })
    const events = (await database.query(
      'SELECT kind, "cycleId", actor, details FROM application_events WHERE "applicationId" = $1 ORDER BY "occurredAt"',
      [`${prefix}api`],
    )) as Array<Record<string, unknown>>
    expect(events.map((event) => event.kind)).toEqual([
      'discovered',
      'registration_changed',
    ])
    expect(events[1]).toMatchObject({
      cycleId: id,
      actor: 'system',
      details: {
        before: {
          name: 'API de teste',
          location: { city: null, latitude: -23.5 },
        },
        after: {
          name: 'API renomeada',
          location: { city: 'Campinas', latitude: -22.9 },
        },
      },
    })
  })

  it('não altera cadastro após snapshot parcialmente inválido', async () => {
    await app.get(DiscoveryService).discover(await cycleId())
    payload = [
      { ...servicePayload()[0], name: 'Nome não confirmado' },
      {
        ...servicePayload()[0],
        id: `${prefix}broken`,
        location: { region_code: 'br-sudeste' },
      },
    ]
    await expect(
      app.get(MetadataSyncService).reconcile(await cycleId()),
    ).rejects.toMatchObject({ code: 'INVALID_UPSTREAM_RESPONSE' })
    const [application] = (await database.query(
      'SELECT name FROM applications WHERE id = $1',
      [`${prefix}api`],
    )) as [{ name: string }]
    expect(application.name).toBe('API de teste')
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM application_events WHERE "applicationId" = $1',
      [`${prefix}api`],
    )) as [{ count: number }]
    expect(count).toBe(1)
  })

  it.each([
    { name: 'Nome novo', location: servicePayload()[0].location },
    {
      name: 'API de teste',
      location: { ...servicePayload()[0].location, city: 'Campinas' },
    },
  ])('registra mudança isolada de nome ou localização', async (changed) => {
    await app.get(DiscoveryService).discover(await cycleId())
    payload = [{ ...servicePayload()[0], ...changed }]
    expect(await app.get(MetadataSyncService).reconcile(await cycleId())).toBe(
      1,
    )
    const [{ count }] = (await database.query(
      'SELECT count(*)::int AS count FROM application_events WHERE "applicationId" = $1 AND kind = $2',
      [`${prefix}api`, 'registration_changed'],
    )) as [{ count: number }]
    expect(count).toBe(1)
  })

  it('desfaz mudança de cadastro se o evento não puder ser vinculado ao ciclo', async () => {
    await app.get(DiscoveryService).discover(await cycleId())
    payload = [{ ...servicePayload()[0], name: 'Nome não persistido' }]
    await expect(
      app.get(MetadataSyncService).reconcile(randomUUID()),
    ).rejects.toThrow()
    const [application] = (await database.query(
      'SELECT name FROM applications WHERE id = $1',
      [`${prefix}api`],
    )) as [{ name: string }]
    expect(application.name).toBe('API de teste')
  })
})
