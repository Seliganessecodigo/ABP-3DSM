import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../../database/migrations/1791350000000-DiscoverApplications'
import { ApplicationOperationalStatus1791360000000 } from '../../database/migrations/1791360000000-ApplicationOperationalStatus'
import { configureOpenApi } from '../../openapi'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { StatusClassificationService } from './status-classification.service'
import { CollectionsRepository } from '../../database/repositories/collections.repository'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip

describeWithDatabase('catálogo com PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
  const previousDatabaseUrl = process.env.DATABASE_URL

  beforeAll(async () => {
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
        ApplicationOperationalStatus1791360000000,
      ],
    })
    await database.initialize()
    await database.runMigrations()
    await database.query(
      `INSERT INTO applications (
        id, name, "regionCode", country, region, city, latitude, longitude, state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'catalog-test-app',
        'Catalog Test App',
        'br-sudeste',
        'Brazil',
        'Sudeste',
        null,
        -23.5505,
        -46.6333,
        'AVAILABLE',
      ],
    )
    app = await NestFactory.create(AppModule, { logger: false })
    configureOpenApi(app)
    await app.listen(0, '127.0.0.1')
  })

  it('gera UUIDs com a função nativa do PostgreSQL', async () => {
    const generatedUuidDefaults = await database.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_schema = 'public'
         AND data_type = 'uuid'
         AND column_default IS NOT NULL`,
    )

    expect(generatedUuidDefaults.length).toBeGreaterThan(0)
    expect(
      generatedUuidDefaults.every(
        ({ column_default }: { column_default: string }) =>
          column_default.includes('gen_random_uuid()'),
      ),
    ).toBe(true)

    const [cycle] = await database.query(
      `INSERT INTO monitoring_cycles ("startedAt") VALUES (now()) RETURNING id`,
    )

    expect(cycle.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )

    await database.query('DELETE FROM monitoring_cycles WHERE id = $1', [
      cycle.id,
    ])
  })

  afterAll(async () => {
    await app?.close()
    if (database?.isInitialized) {
      await database.query(
        'DELETE FROM application_events WHERE "applicationId" = $1',
        ['catalog-test-app'],
      )
      await database.query('DELETE FROM applications WHERE id = $1', [
        'catalog-test-app',
      ])
      await database.destroy()
    }
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl
    }
  })

  it('lê a localização persistida pelo contrato HTTP', async () => {
    const response = await fetch(new URL('/applications', await app.getUrl()))
    const body = (await response.json()) as Array<Record<string, unknown>>

    expect(response.status).toBe(200)
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'catalog-test-app',
          location: {
            regionCode: 'br-sudeste',
            country: 'Brazil',
            region: 'Sudeste',
            city: null,
            latitude: -23.5505,
            longitude: -46.6333,
          },
        }),
      ]),
    )
  })

  it('consulta por ID a aplicação persistida', async () => {
    const response = await fetch(
      new URL('/applications/catalog-test-app', await app.getUrl()),
    )
    const body: unknown = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      id: 'catalog-test-app',
      location: { regionCode: 'br-sudeste', city: null },
    })
  })

  it('consulta a última observação válida pela API da aplicação', async () => {
    const collectedAt = new Date('2026-10-07T10:00:00.000Z')
    const intervalStart = new Date('2026-10-07T09:59:30.000Z')
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'catalog-test-app',
        intervalStart,
        collectedAt,
        collectedAt,
        {
          cpuPercent: 0,
          memoryGb: 1.5,
          diskGb: 2,
          networkGb: 3,
          collectionIntervalSeconds: 30,
        },
        { cpuPercent: '%', memoryGb: 'GB', diskGb: 'GB', networkGb: 'GB' },
        'AVAILABLE',
      ],
    )

    try {
      await database.query(
        `INSERT INTO applications (id, name, state)
         VALUES ($1, $2, $3)`,
        ['catalog-other-app', 'Other Catalog App', 'AVAILABLE'],
      )
      const classifier = app.get(StatusClassificationService)
      await classifier.record('catalog-test-app', {
        kind: 'metrics',
        result: 'valid',
        observedAt: collectedAt,
        carbonFactorAvailable: false,
      })
      await classifier.record('catalog-test-app', {
        kind: 'source_failure',
        reason: ApplicationStateReason.SOURCE_TIMEOUT,
        observedAt: new Date(collectedAt.getTime() + 1_000),
      })

      const response = await fetch(
        new URL(
          '/applications/catalog-test-app/collections/latest',
          await app.getUrl(),
        ),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        id: collection.id,
        applicationId: 'catalog-test-app',
        intervalStart: intervalStart.toISOString(),
        intervalEnd: collectedAt.toISOString(),
        collectedAt: collectedAt.toISOString(),
        collectionIntervalSeconds: 30,
        isStale: true,
        state: 'UNAVAILABLE',
        reason: 'SOURCE_TIMEOUT',
        metrics: {
          cpu: { value: 0, unit: '%', status: 'available' },
          memory: { value: 1.5, unit: 'GB', status: 'available' },
          disk: { value: 2, unit: 'GB', status: 'available' },
          network: { value: 3, unit: 'GB', status: 'available' },
        },
      })

      const byId = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )
      expect(byId.status).toBe(200)
      expect(await byId.json()).toMatchObject({ id: collection.id })

      const outsideApplication = await fetch(
        new URL(
          `/applications/catalog-other-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )
      expect(outsideApplication.status).toBe(404)
      expect(await outsideApplication.json()).toMatchObject({
        code: 'COLLECTION_NOT_FOUND',
      })
    } finally {
      await database.query('DELETE FROM collections WHERE id = $1', [
        collection.id,
      ])
      await database.query('DELETE FROM applications WHERE id = $1', [
        'catalog-other-app',
      ])
    }

    const noEvidence = await fetch(
      new URL(
        '/applications/catalog-test-app/collections/latest',
        await app.getUrl(),
      ),
    )
    expect(noEvidence.status).toBe(404)
    expect(await noEvidence.json()).toMatchObject({
      code: 'COLLECTION_NOT_FOUND',
    })

    const missingApplication = await fetch(
      new URL(
        '/applications/catalog-missing-app/collections/latest',
        await app.getUrl(),
      ),
    )
    expect(missingApplication.status).toBe(404)
    expect(await missingApplication.json()).toMatchObject({
      code: 'APPLICATION_NOT_FOUND',
    })

    const missingCollection = await fetch(
      new URL(
        '/applications/catalog-test-app/collections/00000000-0000-0000-0000-000000000000',
        await app.getUrl(),
      ),
    )
    expect(missingCollection.status).toBe(404)
    expect(await missingCollection.json()).toMatchObject({
      code: 'COLLECTION_NOT_FOUND',
    })
  })

  it('retorna erro estável quando o armazenamento das evidências falha', async () => {
    const collections = app.get(CollectionsRepository)
    const findLatest = jest
      .spyOn(collections, 'findLatestByApplication')
      .mockRejectedValue(new Error('database unavailable'))

    try {
      const response = await fetch(
        new URL(
          '/applications/catalog-test-app/collections/latest',
          await app.getUrl(),
        ),
      )

      expect(response.status).toBe(503)
      expect(await response.json()).toMatchObject({
        code: 'APPLICATION_EVIDENCE_UNAVAILABLE',
      })
    } finally {
      findLatest.mockRestore()
    }
  })

  it('preserva a última observação stale e atualiza o estado na recuperação', async () => {
    const classifier = app.get(StatusClassificationService)
    const validAt = new Date('2026-10-07T10:00:00.000Z')
    const failedAt = new Date('2026-10-07T10:01:00.000Z')
    const recoveredAt = new Date('2026-10-07T10:02:00.000Z')

    await classifier.record('catalog-test-app', {
      kind: 'metrics',
      result: 'valid',
      observedAt: validAt,
      carbonFactorAvailable: true,
    })
    await classifier.record('catalog-test-app', {
      kind: 'source_failure',
      reason: ApplicationStateReason.SOURCE_TIMEOUT,
      observedAt: failedAt,
    })

    let response = await fetch(
      new URL('/applications/catalog-test-app', await app.getUrl()),
    )
    expect(await response.json()).toMatchObject({
      state: 'UNAVAILABLE',
      reason: 'SOURCE_TIMEOUT',
      isStale: true,
      isCalculable: false,
      lastCheckedAt: failedAt.toISOString(),
      lastObservationAt: validAt.toISOString(),
    })

    await classifier.record('catalog-test-app', {
      kind: 'metrics',
      result: 'valid',
      observedAt: recoveredAt,
      carbonFactorAvailable: true,
    })
    response = await fetch(
      new URL('/applications/catalog-test-app', await app.getUrl()),
    )
    expect(await response.json()).toMatchObject({
      state: 'AVAILABLE',
      reason: ApplicationStateReason.METRICS_VALID,
      isStale: false,
      isCalculable: true,
      lastObservationAt: recoveredAt.toISOString(),
    })
  })

  it('preserva uma região longa sem aplicar limite ausente do contrato externo', async () => {
    const longRegion = 'Região '.repeat(25)
    await database.query(
      `INSERT INTO applications (
        id, name, "regionCode", country, region, city, latitude, longitude, state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        'catalog-long-region',
        'Long Region App',
        'br-sudeste',
        'Brazil',
        longRegion,
        null,
        -23.5505,
        -46.6333,
        'AVAILABLE',
      ],
    )

    try {
      const response = await fetch(
        new URL('/applications/catalog-long-region', await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({ location: { region: longRegion } })
    } finally {
      await database.query('DELETE FROM applications WHERE id = $1', [
        'catalog-long-region',
      ])
    }
  })

  it('publica o contrato versionado da lista no OpenAPI', async () => {
    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    const document: unknown = await response.json()

    expect(response.status).toBe(200)
    expect(document).toMatchObject({
      info: { version: '1.0.0' },
      paths: {
        '/applications': { get: { responses: { '200': expect.anything() } } },
        '/applications/{id}': {
          get: {
            parameters: expect.arrayContaining([
              expect.objectContaining({
                name: 'id',
                in: 'path',
                schema: { type: 'string', minLength: 1 },
              }),
            ]),
            responses: { '200': expect.anything(), '404': expect.anything() },
          },
        },
        '/applications/{id}/collections/latest': {
          get: {
            responses: {
              '200': expect.anything(),
              '404': expect.anything(),
              '503': expect.anything(),
            },
          },
        },
        '/applications/{id}/collections/{collectionId}': {
          get: {
            responses: {
              '200': expect.anything(),
              '404': expect.anything(),
              '503': expect.anything(),
            },
          },
        },
      },
      components: {
        schemas: {
          ApplicationLocationDto: { properties: { city: { nullable: true } } },
          ApplicationDto: {
            properties: {
              reason: {
                type: 'string',
                enum: Object.values(ApplicationStateReason),
              },
              lastObservationAt: { nullable: true },
              isStale: { type: 'boolean' },
              isCalculable: { type: 'boolean' },
            },
          },
          CollectionEvidenceDto: {
            properties: {
              collectionIntervalSeconds: expect.anything(),
              collectedAt: expect.anything(),
              isStale: expect.anything(),
            },
          },
        },
      },
    })
  })
})
