import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../../database/migrations/1791350000000-DiscoverApplications'
import { configureOpenApi } from '../../openapi'

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

  afterAll(async () => {
    await app?.close()
    if (database?.isInitialized) {
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
      },
      components: {
        schemas: {
          ApplicationLocationDto: { properties: { city: { nullable: true } } },
        },
      },
    })
  })
})
