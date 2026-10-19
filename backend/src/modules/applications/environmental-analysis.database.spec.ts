import { randomUUID } from 'node:crypto'
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

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip
const applicationId = `analysis-test-${randomUUID()}`
const from = '2026-10-01T00:00:00-03:00'
const to = '2026-10-01T00:01:00-03:00'
const fromUtc = '2026-10-01T03:00:00.000Z'
const toUtc = '2026-10-01T03:01:00.000Z'
const energyKwh = 0.00000123
const emissionsGrams = 0.00010455
const factorSnapshot = {
  id: 'snapshot-analysis-test',
  version: 'factor-v1',
  contractVersion: 'contract-v1',
  regionCode: 'br-sudeste',
  country: 'Brazil',
  region: 'Sudeste',
  city: null,
  intensity: 85,
  unit: 'gCO2e/kWh',
  queriedAt: '2026-10-01T03:01:00.000Z',
  source: 'persisted-factor-source',
  validFrom: '2026-10-01T00:00:00.000Z',
  validUntil: '2026-11-01T00:00:00.000Z',
}
const methodology = {
  key: 'persisted-energy-model',
  version: 'model-v3',
  parameters: {
    cpuWattsAt100Percent: 100,
    memoryWattsPerGb: 0.375,
    diskWattsPerGb: 0.01,
    networkWattsPerGb: 0.02,
  },
}

describeWithDatabase('GET /applications/:id/analysis com PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
  let collectionId: string
  const previousDatabaseUrl = process.env.DATABASE_URL

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL must point to an isolated PostgreSQL database')
    }

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
      synchronize: false,
    })
    await database.initialize()
    await database.runMigrations()
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [applicationId, 'Environmental analysis test', 'AVAILABLE'],
    )
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        applicationId,
        new Date(fromUtc),
        new Date(toUtc),
        new Date(toUtc),
        { cpuPercent: 1, memoryGb: 2, diskGb: 3, networkGb: 4 },
        { cpuPercent: '%', memoryGb: 'GB', diskGb: 'GB', networkGb: 'GB' },
        'AVAILABLE',
        energyKwh,
        emissionsGrams,
        factorSnapshot.intensity,
        methodology.version,
        factorSnapshot.version,
        1,
        {
          version: 1,
          energy: {
            observationId: 'persisted-observation',
            applicationId,
            averagePowerW: 0.0738,
            energyKwh,
            durationSeconds: 60,
            modelKey: methodology.key,
            modelVersion: methodology.version,
            modelParameters: methodology.parameters,
            powerContributionsW: {
              cpuPercent: 0.01,
              memoryGb: 0.05625,
              diskGb: 0.0075,
              networkGb: 0.00005,
            },
            reasons: [],
          },
          carbon: {
            energyKwh,
            factorSnapshot,
            emissionsGramsCo2e: emissionsGrams,
            emissionsKilogramsCo2e: emissionsGrams / 1000,
            reasons: [],
          },
        },
      ],
    )
    collectionId = collection.id

    app = await NestFactory.create(AppModule, { logger: false })
    configureOpenApi(app)
    await app.listen(0, '127.0.0.1')
  })

  afterAll(async () => {
    await app?.close()
    if (database?.isInitialized) {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [applicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [applicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [applicationId])
      await database.destroy()
    }
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
  })

  it('returns saved measures, coverage, and original provenance for the requested UTC interval', async () => {
    const query = new URLSearchParams({ from, to })
    const response = await fetch(
      new URL(`/applications/${applicationId}/analysis?${query}`, await app.getUrl()),
    )
    const body: unknown = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: 'available',
      applicationId,
      period: { from: fromUtc, to: toUtc },
      energy: { value: energyKwh, unit: 'kWh', reasons: [] },
      emissions: { value: emissionsGrams, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 1, emissions: 1 },
      contributions: [
        {
          collectionId,
          originalInterval: { from: fromUtc, to: toUtc },
          countedInterval: { from: fromUtc, to: toUtc },
          collectedAt: toUtc,
          energy: { value: energyKwh, unit: 'kWh', reasons: [] },
          emissions: { value: emissionsGrams, unit: 'gCO2e', reasons: [] },
          methodology,
          factorSnapshot,
        },
      ],
      exclusions: [],
    })
  })
})
