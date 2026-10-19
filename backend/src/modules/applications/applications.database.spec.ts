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
import { CollectionCalculationEvidence1791380000000 } from '../../database/migrations/1791380000000-CollectionCalculationEvidence'
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
        CollectionCalculationEvidence1791380000000,
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

  it('explica pelo ID o resultado ambiental persistido sem recalculá-lo', async () => {
    const intervalStart = new Date('2026-10-07T09:59:00.000Z')
    const intervalEnd = new Date('2026-10-07T10:00:00.000Z')
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams",
        "carbonFactor", "calculationVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        'catalog-test-app',
        intervalStart,
        intervalEnd,
        intervalEnd,
        {
          cpuPercent: 1,
          memoryGb: 0.1,
          diskGb: 0.2,
          networkGb: 0.3,
          collectionIntervalSeconds: 60,
        },
        { cpuPercent: '%', memoryGb: 'GB', diskGb: 'GB', networkGb: 'GB' },
        'AVAILABLE',
        '0.00084783',
        '0.07206583',
        '85.00000000',
        '1',
        '1.0000',
        {
          version: 1,
          energy: {
            observationId: 'stored-observation',
            applicationId: 'catalog-test-app',
            averagePowerW: 50.87,
            energyKwh: 0.0008478333333333333,
            durationSeconds: 60,
            modelKey: 'simplified-energy',
            modelVersion: '1',
            modelParameters: {
              cpuWattsAt100Percent: 100,
              memoryWattsPerGb: 0.375,
              diskWattsPerGb: 0.01,
              networkWattsPerGb: 0.02,
            },
            powerContributionsW: {
              cpuPercent: 50,
              memoryGb: 0.75,
              diskGb: 0.1,
              networkGb: 0.02,
            },
            reasons: [],
          },
          carbon: {
            energyKwh: 0.0008478333333333333,
            factorSnapshot: {
              id: 'stored-factor-id',
              version: 'stored-factor-version',
              contractVersion: 'v1',
              regionCode: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
              intensity: 85,
              unit: 'gCO2e/kWh',
              queriedAt: '2026-10-07T10:00:00.000Z',
              source: null,
              validFrom: null,
              validUntil: null,
            },
            emissionsGramsCo2e: Number('0.07206583333333333'),
            emissionsKilogramsCo2e: Number('0.00007206583333333333'),
            reasons: [],
          },
        },
      ],
    )

    try {
      const response = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        id: collection.id,
        environmental: {
          status: 'present',
          absenceReason: null,
          energy: {
            valueKwh: 0.00084783,
            calculatedValueKwh: 0.0008478333333333333,
            coverage: 1,
            durationSeconds: 60,
            averagePowerW: 50.87,
            model: {
              key: 'simplified-energy',
              version: '1',
              configId: null,
              configVersion: null,
              parameters: {
                cpuWattsAt100Percent: 100,
                memoryWattsPerGb: 0.375,
                diskWattsPerGb: 0.01,
                networkWattsPerGb: 0.02,
              },
              formula: {
                status: 'available',
                expression: expect.any(String),
                inputUnits: expect.any(Object),
                outputUnit: 'kWh',
              },
              powerContributionsW: {
                cpuPercent: 50,
                memoryGb: 0.75,
                diskGb: 0.1,
                networkGb: 0.02,
              },
              reasons: [],
            },
          },
          carbon: {
            valueGramsCo2e: 0.07206583,
            calculatedValueGramsCo2e: Number('0.07206583333333333'),
            factor: 85,
            formula: {
              expression: expect.any(String),
              energyUnit: 'kWh',
              factorUnit: 'gCO2e/kWh',
              gramsUnit: 'gCO2e',
              kilogramsUnit: 'kgCO2e',
            },
            factorSnapshot: {
              id: 'stored-factor-id',
              version: 'stored-factor-version',
              contractVersion: 'v1',
              regionCode: 'br-sudeste',
              intensity: 85,
              unit: 'gCO2e/kWh',
              queriedAt: '2026-10-07T10:00:00.000Z',
              source: null,
              validFrom: null,
              validUntil: null,
            },
            reasons: [],
          },
        },
      })
      expect(
        (
          body as {
            environmental: {
              carbon: { calculatedValueKilogramsCo2e: number }
            }
          }
        ).environmental.carbon.calculatedValueKilogramsCo2e,
      ).toBeCloseTo(Number('0.00007206583333333333'), 16)

      const latestResponse = await fetch(
        new URL(
          '/applications/catalog-test-app/collections/latest',
          await app.getUrl(),
        ),
      )
      expect(latestResponse.status).toBe(200)
      expect(await latestResponse.json()).toMatchObject({
        id: collection.id,
        environmental: {
          energy: { valueKwh: 0.00084783 },
          carbon: { valueGramsCo2e: 0.07206583 },
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE id = $1', [
        collection.id,
      ])
    }
  })

  it('preserva valores e parâmetros quando a versão do modelo é desconhecida', async () => {
    const intervalStart = new Date('2026-10-07T09:58:00.000Z')
    const intervalEnd = new Date('2026-10-07T09:59:00.000Z')
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams",
        "carbonFactor", "calculationVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        'catalog-test-app',
        intervalStart,
        intervalEnd,
        intervalEnd,
        { cpuPercent: 10 },
        { cpuPercent: '%' },
        'AVAILABLE',
        '0.00090000',
        null,
        null,
        'future-energy/9',
        '0.5000',
        {
          version: 1,
          energy: {
            observationId: 'unknown-model-observation',
            applicationId: 'catalog-test-app',
            averagePowerW: 54,
            energyKwh: 0.0009,
            durationSeconds: 60,
            modelKey: 'future-energy',
            modelVersion: '9',
            modelParameters: { newCoefficient: 17 },
            powerContributionsW: { cpuPercent: 54 },
            reasons: [{ code: 'METRIC_MISSING', metric: 'cpuPercent' }],
          },
          carbon: {
            energyKwh: 0.0009,
            factorSnapshot: null,
            emissionsGramsCo2e: null,
            emissionsKilogramsCo2e: null,
            reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
          },
        },
      ],
    )

    try {
      const response = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        id: collection.id,
        environmental: {
          status: 'present',
          energy: {
            valueKwh: 0.0009,
            calculatedValueKwh: 0.0009,
            coverage: 0.5,
            model: {
              key: 'future-energy',
              version: '9',
              parameters: { newCoefficient: 17 },
              formula: {
                status: 'unavailable',
                expression: null,
                inputUnits: null,
                outputUnit: null,
                reason: 'FORMULA_UNAVAILABLE',
              },
              reasons: [{ code: 'METRIC_MISSING', metric: 'cpuPercent' }],
            },
          },
          carbon: {
            valueGramsCo2e: null,
            calculatedValueGramsCo2e: null,
            calculatedValueKilogramsCo2e: null,
            factor: null,
            factorSnapshot: null,
            reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
          },
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE id = $1', [
        collection.id,
      ])
    }
  })

  it('mantém método e snapshot próprios por coleta em leituras por ID e latest', async () => {
    const rows: Array<{ id: string }> = []
    const captures = [
      {
        offset: 1,
        energyKwh: '0.00080000',
        grams: '0.06800000',
        factor: '85.00000000',
        parameter: 100,
        factorVersion: 'factor-v1',
        factorIntensity: 85,
        emissions: 0.068,
      },
      {
        offset: 2,
        energyKwh: '0.00160000',
        grams: '0.06400000',
        factor: '40.00000000',
        parameter: 200,
        factorVersion: 'factor-v2',
        factorIntensity: 40,
        emissions: 0.064,
      },
    ] as const

    try {
      for (const capture of captures) {
        const intervalEnd = new Date(
          Date.parse('2026-10-07T10:00:00.000Z') + capture.offset * 60_000,
        )
        const intervalStart = new Date(intervalEnd.getTime() - 60_000)
        const [row] = await database.query(
          `INSERT INTO collections (
            "applicationId", "intervalStart", "intervalEnd", "collectedAt",
            metrics, "metricUnits", state, "energyKwh", "carbonGrams",
            "carbonFactor", "calculationVersion", coverage, "calculationEvidence"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id`,
          [
            'catalog-test-app',
            intervalStart,
            intervalEnd,
            intervalEnd,
            {},
            {},
            'AVAILABLE',
            capture.energyKwh,
            capture.grams,
            capture.factor,
            '1',
            '1.0000',
            {
              version: 1,
              energy: {
                observationId: `capture-${capture.offset}`,
                applicationId: 'catalog-test-app',
                averagePowerW: capture.offset * 48,
                energyKwh: capture.offset * 0.0008,
                durationSeconds: 60,
                modelKey: 'simplified-energy',
                modelVersion: '1',
                modelParameters: {
                  cpuWattsAt100Percent: capture.parameter,
                  memoryWattsPerGb: 0.375,
                  diskWattsPerGb: 0.01,
                  networkWattsPerGb: 0.02,
                },
                powerContributionsW: {
                  cpuPercent: capture.offset * 48,
                  memoryGb: 0,
                  diskGb: 0,
                  networkGb: 0,
                },
                reasons: [],
              },
              carbon: {
                energyKwh: capture.offset * 0.0008,
                factorSnapshot: {
                  id: `factor-${capture.offset}`,
                  version: capture.factorVersion,
                  contractVersion: 'v1',
                  regionCode: 'br-sudeste',
                  country: 'Brazil',
                  region: 'Sudeste',
                  city: null,
                  intensity: capture.factorIntensity,
                  unit: 'gCO2e/kWh',
                  queriedAt: intervalEnd.toISOString(),
                  source: null,
                  validFrom: null,
                  validUntil: null,
                },
                emissionsGramsCo2e: capture.emissions,
                emissionsKilogramsCo2e: capture.emissions / 1000,
                reasons: [],
              },
            },
          ],
        )
        rows.push(row)
      }

      const historicalResponse = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${rows[0].id}`,
          await app.getUrl(),
        ),
      )
      expect(historicalResponse.status).toBe(200)
      expect(await historicalResponse.json()).toMatchObject({
        id: rows[0].id,
        environmental: {
          energy: {
            valueKwh: 0.0008,
            model: {
              key: 'simplified-energy',
              version: '1',
              parameters: { cpuWattsAt100Percent: 100 },
            },
          },
          carbon: {
            valueGramsCo2e: 0.068,
            factor: 85,
            factorSnapshot: { version: 'factor-v1', intensity: 85 },
          },
        },
      })

      const latestResponse = await fetch(
        new URL(
          '/applications/catalog-test-app/collections/latest',
          await app.getUrl(),
        ),
      )
      expect(latestResponse.status).toBe(200)
      expect(await latestResponse.json()).toMatchObject({
        id: rows[1].id,
        environmental: {
          energy: {
            valueKwh: 0.0016,
            model: {
              key: 'simplified-energy',
              version: '1',
              parameters: { cpuWattsAt100Percent: 200 },
            },
          },
          carbon: {
            valueGramsCo2e: 0.064,
            factor: 40,
            factorSnapshot: { version: 'factor-v2', intensity: 40 },
          },
        },
      })
    } finally {
      for (const row of rows) {
        await database.query('DELETE FROM collections WHERE id = $1', [row.id])
      }
    }
  })

  it('preserva razão métrica e snapshot quando bundle presente tem energia indisponível', async () => {
    const intervalEnd = new Date('2026-10-07T11:30:00.000Z')
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams",
        "carbonFactor", "calculationVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        'catalog-test-app',
        new Date(intervalEnd.getTime() - 60_000),
        intervalEnd,
        intervalEnd,
        { memoryGb: 0.2 },
        { memoryGb: 'GB' },
        'AVAILABLE',
        null,
        null,
        '75.00000000',
        '1',
        '0.7500',
        {
          version: 1,
          energy: {
            observationId: 'partial-energy-observation',
            applicationId: 'catalog-test-app',
            averagePowerW: null,
            energyKwh: null,
            durationSeconds: 60,
            modelKey: 'simplified-energy',
            modelVersion: '1',
            modelParameters: {
              cpuWattsAt100Percent: 100,
              memoryWattsPerGb: 0.375,
              diskWattsPerGb: 0.01,
              networkWattsPerGb: 0.02,
            },
            powerContributionsW: {
              cpuPercent: null,
              memoryGb: 0.075,
              diskGb: 0,
              networkGb: 0,
            },
            reasons: [{ code: 'METRIC_MISSING', metric: 'cpuPercent' }],
          },
          carbon: {
            energyKwh: null,
            factorSnapshot: {
              id: 'partial-factor-id',
              version: 'partial-factor-v1',
              contractVersion: 'v1',
              regionCode: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
              intensity: 75,
              unit: 'gCO2e/kWh',
              queriedAt: intervalEnd.toISOString(),
              source: null,
              validFrom: null,
              validUntil: null,
            },
            emissionsGramsCo2e: null,
            emissionsKilogramsCo2e: null,
            reasons: [{ code: 'ENERGY_UNAVAILABLE' }],
          },
        },
      ],
    )

    try {
      const response = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: collection.id,
        environmental: {
          status: 'present',
          energy: {
            valueKwh: null,
            calculatedValueKwh: null,
            coverage: 0.75,
            averagePowerW: null,
            model: {
              powerContributionsW: { cpuPercent: null, memoryGb: 0.075 },
              reasons: [{ code: 'METRIC_MISSING', metric: 'cpuPercent' }],
            },
          },
          carbon: {
            valueGramsCo2e: null,
            calculatedValueGramsCo2e: null,
            calculatedValueKilogramsCo2e: null,
            factor: 75,
            factorSnapshot: {
              id: 'partial-factor-id',
              version: 'partial-factor-v1',
              queriedAt: intervalEnd.toISOString(),
              source: null,
              validFrom: null,
              validUntil: null,
            },
            reasons: [{ code: 'ENERGY_UNAVAILABLE' }],
          },
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE id = $1', [
        collection.id,
      ])
    }
  })

  it('retorna coleta sem bundle com motivo genérico de ausência ambiental', async () => {
    const intervalEnd = new Date('2026-10-07T12:00:00.000Z')
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        'catalog-test-app',
        new Date(intervalEnd.getTime() - 60_000),
        intervalEnd,
        intervalEnd,
        { cpuPercent: 0 },
        { cpuPercent: '%' },
        'AVAILABLE',
      ],
    )

    try {
      const response = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: collection.id,
        environmental: {
          status: 'absent',
          absenceReason: 'ENVIRONMENTAL_EVIDENCE_UNAVAILABLE',
          energy: null,
          carbon: null,
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE id = $1', [
        collection.id,
      ])
    }
  })

  it('preserva energia, intensidade e emissão iguais a zero como valores válidos', async () => {
    const intervalEnd = new Date('2026-10-07T13:00:00.000Z')
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams",
        "carbonFactor", "calculationVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        'catalog-test-app',
        new Date(intervalEnd.getTime() - 60_000),
        intervalEnd,
        intervalEnd,
        {},
        {},
        'AVAILABLE',
        '0.00000000',
        '0.00000000',
        '0.00000000',
        '1',
        '1.0000',
        {
          version: 1,
          energy: {
            observationId: 'zero-energy-observation',
            applicationId: 'catalog-test-app',
            averagePowerW: 0,
            energyKwh: 0,
            durationSeconds: 60,
            modelKey: 'simplified-energy',
            modelVersion: '1',
            modelParameters: {
              cpuWattsAt100Percent: 0,
              memoryWattsPerGb: 0,
              diskWattsPerGb: 0,
              networkWattsPerGb: 0,
            },
            powerContributionsW: {
              cpuPercent: 0,
              memoryGb: 0,
              diskGb: 0,
              networkGb: 0,
            },
            reasons: [],
          },
          carbon: {
            energyKwh: 0,
            factorSnapshot: {
              id: 'zero-factor',
              version: 'zero-factor-version',
              contractVersion: 'v1',
              regionCode: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
              intensity: 0,
              unit: 'gCO2e/kWh',
              queriedAt: intervalEnd.toISOString(),
              source: null,
              validFrom: null,
              validUntil: null,
            },
            emissionsGramsCo2e: 0,
            emissionsKilogramsCo2e: 0,
            reasons: [],
          },
        },
      ],
    )

    try {
      const response = await fetch(
        new URL(
          `/applications/catalog-test-app/collections/${collection.id}`,
          await app.getUrl(),
        ),
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: collection.id,
        environmental: {
          status: 'present',
          energy: {
            valueKwh: 0,
            calculatedValueKwh: 0,
            coverage: 1,
            averagePowerW: 0,
            model: {
              powerContributionsW: {
                cpuPercent: 0,
                memoryGb: 0,
                diskGb: 0,
                networkGb: 0,
              },
              reasons: [],
            },
          },
          carbon: {
            valueGramsCo2e: 0,
            calculatedValueGramsCo2e: 0,
            calculatedValueKilogramsCo2e: 0,
            factor: 0,
            factorSnapshot: { intensity: 0 },
            reasons: [],
          },
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE id = $1', [
        collection.id,
      ])
    }
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

  it('documenta a metodologia ambiental com campos explícitos no OpenAPI', async () => {
    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    type Schema = {
      type?: string
      nullable?: boolean
      properties?: Record<string, Schema>
      items?: Schema
      $ref?: string
      allOf?: Schema[]
    }
    const document = (await response.json()) as {
      components: {
        schemas: Record<string, { properties: Record<string, Schema> }>
      }
    }

    expect(response.status).toBe(200)
    const schemas = document.components.schemas
    expect(schemas.EnvironmentalFormulaDto.properties.inputUnits).toMatchObject({
      type: 'object',
      nullable: true,
      properties: {
        cpuPercent: { type: 'string' },
        durationSeconds: { type: 'string' },
      },
    })
    expect(schemas.EnvironmentalModelDto.properties.reasons).toMatchObject({
      type: 'array',
      items: { $ref: '#/components/schemas/EnergyCalculationReasonDto' },
    })
    expect(schemas.EnvironmentalModelDto.properties.parameters).toMatchObject({
      type: 'object',
      additionalProperties: { type: 'number' },
      properties: {
        cpuWattsAt100Percent: { type: 'number' },
        memoryWattsPerGb: { type: 'number' },
        diskWattsPerGb: { type: 'number' },
        networkWattsPerGb: { type: 'number' },
      },
    })
    expect(schemas.EnergyCalculationReasonDto.properties).toMatchObject({
      code: {
        type: 'string',
        enum: [
          'INVALID_OBSERVATION_ID',
          'INVALID_APPLICATION_ID',
          'INVALID_TIMESTAMP',
          'INVALID_INTERVAL',
          'INVALID_MODEL',
          'METRIC_MISSING',
          'METRIC_INVALID',
          'METRIC_OUT_OF_RANGE',
          'NON_FINITE_RESULT',
        ],
      },
      metric: { type: 'string', enum: ['cpuPercent', 'memoryGb', 'diskGb', 'networkGb'] },
    })
    expect(schemas.CarbonEmissionReasonDto.properties.code).toMatchObject({
      type: 'string',
      enum: [
        'ENERGY_UNAVAILABLE',
        'INVALID_ENERGY',
        'CARBON_FACTOR_UNAVAILABLE',
        'INVALID_FACTOR',
        'INVALID_SNAPSHOT',
        'UNSUPPORTED_UNIT',
        'NON_FINITE_RESULT',
      ],
    })
    expect(
      schemas.EnvironmentalPowerContributionsDto.properties,
    ).toMatchObject({
      cpuPercent: { type: 'number', nullable: true },
      memoryGb: { type: 'number', nullable: true },
      diskGb: { type: 'number', nullable: true },
      networkGb: { type: 'number', nullable: true },
    })
    expect(
      schemas.EnvironmentalCarbonDto.properties.factorSnapshot,
    ).toMatchObject({
      nullable: true,
      allOf: [{ $ref: '#/components/schemas/CarbonFactorSnapshotDto' }],
    })
    expect(
      schemas.CarbonFactorSnapshotDto.properties,
    ).toMatchObject({
      id: { type: 'string', nullable: true },
      queriedAt: { type: 'string', nullable: true },
      source: { type: 'string', nullable: true },
      validUntil: { type: 'string', nullable: true },
    })
  })
})
