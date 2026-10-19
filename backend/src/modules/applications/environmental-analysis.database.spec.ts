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

  it('returns an explicit empty result when the application has no observations in the interval', async () => {
    const emptyApplicationId = `analysis-empty-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [emptyApplicationId, 'Environmental analysis empty test', 'AVAILABLE'],
    )

    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${emptyApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'empty',
        applicationId: emptyApplicationId,
        period: { from: fromUtc, to: toUtc },
        energy: { value: null, unit: 'kWh', reasons: [] },
        emissions: { value: null, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 0, emissions: 0 },
        contributions: [],
        exclusions: [],
      })
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [emptyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [emptyApplicationId])
    }
  })

  it('keeps a one-nanosecond overlap at the half-open period end', async () => {
    const preciseApplicationId = `analysis-precision-${randomUUID()}`
    const intervalStart = '2026-10-01T03:05:00.000000000Z'
    const intervalEnd = '2026-10-01T03:05:00.000001000Z'
    const queryEnd = '2026-10-01T03:05:00.000000001Z'
    const preciseEnergy = 0.001
    const preciseEmissions = 0.085
    const preciseFactorSnapshot = {
      id: 'snapshot-precision',
      version: 'precision-factor-v1',
      contractVersion: 'contract-v1',
      regionCode: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      intensity: 85,
      unit: 'gCO2e/kWh',
      queriedAt: intervalEnd,
      source: 'persisted-factor-source',
      validFrom: null,
      validUntil: null,
    }
    const preciseModelParameters = {
      cpuWattsAt100Percent: 100,
      memoryWattsPerGb: 0.375,
      diskWattsPerGb: 0.01,
      networkWattsPerGb: 0.02,
    }
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [preciseApplicationId, 'Environmental analysis precision test', 'AVAILABLE'],
    )
    const [preciseCollection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        preciseApplicationId,
        intervalStart,
        intervalEnd,
        intervalEnd,
        {},
        {},
        'AVAILABLE',
        preciseEnergy,
        preciseEmissions,
        85,
        'precision-model-v1',
        'precision-factor-v1',
        1,
        {
          version: 1,
          energy: {
            observationId: 'precision-observation',
            applicationId: preciseApplicationId,
            averagePowerW: 60,
            energyKwh: preciseEnergy,
            durationSeconds: 0.000001,
            modelKey: 'precision-model',
            modelVersion: 'precision-model-v1',
            modelParameters: preciseModelParameters,
            powerContributionsW: {
              cpuPercent: 60,
              memoryGb: 0,
              diskGb: 0,
              networkGb: 0,
            },
            reasons: [],
          },
          carbon: {
            energyKwh: preciseEnergy,
            factorSnapshot: preciseFactorSnapshot,
            emissionsGramsCo2e: preciseEmissions,
            emissionsKilogramsCo2e: preciseEmissions / 1000,
            reasons: [],
          },
        },
      ],
    )

    try {
      const query = new URLSearchParams({ from: intervalStart, to: queryEnd })
      const response = await fetch(
        new URL(`/applications/${preciseApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        period: { from: '2026-10-01T03:05:00.000Z', to: queryEnd },
        coverage: { energy: 1, emissions: 1 },
        contributions: [
          expect.objectContaining({
            collectionId: preciseCollection.id,
            originalInterval: {
              from: '2026-10-01T03:05:00.000Z',
              to: '2026-10-01T03:05:00.000001Z',
            },
            countedInterval: {
              from: '2026-10-01T03:05:00.000Z',
              to: queryEnd,
            },
          }),
        ],
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [preciseApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [preciseApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [preciseApplicationId])
    }
  })

  it('gives an explicit reason for legacy collections without saved calculation evidence', async () => {
    const legacyApplicationId = `analysis-legacy-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [legacyApplicationId, 'Environmental analysis legacy test', 'AVAILABLE'],
    )
    await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      [
        legacyApplicationId,
        fromUtc,
        toUtc,
        toUtc,
        { cpuPercent: 1 },
        { cpuPercent: '%' },
        'AVAILABLE',
      ],
    )

    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${legacyApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        applicationId: legacyApplicationId,
        energy: {
          value: null,
          unit: 'kWh',
          reasons: [expect.objectContaining({ code: expect.stringMatching(/\S+/) })],
        },
        emissions: {
          value: null,
          unit: 'gCO2e',
          reasons: [expect.objectContaining({ code: expect.stringMatching(/\S+/) })],
        },
        coverage: { energy: 0, emissions: 0 },
        contributions: [],
        exclusions: [
          {
            collectionId: expect.any(String),
            energyReasons: [expect.objectContaining({ code: expect.stringMatching(/\S+/) })],
            emissionsReasons: [expect.objectContaining({ code: expect.stringMatching(/\S+/) })],
          },
        ],
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [legacyApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [legacyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [legacyApplicationId])
    }
  })

  it('keeps uncovered time as a gap and reports coverage over the requested period', async () => {
    const gapApplicationId = `analysis-gap-${randomUUID()}`
    const gapFrom = '2026-10-01T03:00:00.000Z'
    const coveredTo = '2026-10-01T03:01:00.000Z'
    const gapTo = '2026-10-01T03:03:00.000Z'
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [gapApplicationId, 'Environmental analysis gap test', 'AVAILABLE'],
    )
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        gapApplicationId,
        gapFrom,
        coveredTo,
        coveredTo,
        { cpuPercent: 1 },
        { cpuPercent: '%' },
        'AVAILABLE',
        6,
        60,
        10,
        methodology.version,
        factorSnapshot.version,
        1,
        {
          version: 1,
          energy: {
            observationId: 'gap-observation',
            applicationId: gapApplicationId,
            averagePowerW: 6000,
            energyKwh: 6,
            durationSeconds: 60,
            modelKey: methodology.key,
            modelVersion: methodology.version,
            modelParameters: methodology.parameters,
            powerContributionsW: { cpuPercent: 6000 },
            reasons: [],
          },
          carbon: {
            energyKwh: 6,
            factorSnapshot: { ...factorSnapshot, intensity: 10, queriedAt: coveredTo },
            emissionsGramsCo2e: 60,
            emissionsKilogramsCo2e: 0.06,
            reasons: [],
          },
        },
      ],
    )

    try {
      const query = new URLSearchParams({ from: gapFrom, to: gapTo })
      const response = await fetch(
        new URL(`/applications/${gapApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        energy: { value: 6, unit: 'kWh', reasons: [{ code: 'NO_OBSERVATION' }] },
        emissions: { value: 60, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] },
        coverage: { energy: 1 / 3, emissions: 1 / 3 },
        contributions: [expect.objectContaining({ collectionId: collection.id })],
        exclusions: [
          expect.objectContaining({
            collectionId: null,
            interval: { from: coveredTo, to: gapTo },
            energyReasons: [{ code: 'NO_OBSERVATION' }],
            emissionsReasons: [{ code: 'NO_OBSERVATION' }],
          }),
        ],
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [gapApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [gapApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [gapApplicationId])
    }
  })

  it('preserves valid energy when carbon emissions have no persisted result', async () => {
    const energyOnlyApplicationId = `analysis-energy-only-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [energyOnlyApplicationId, 'Environmental analysis energy-only test', 'AVAILABLE'],
    )
    const [collection] = await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL, $9, NULL, $10, $11)
      RETURNING id`,
      [
        energyOnlyApplicationId,
        fromUtc,
        toUtc,
        toUtc,
        { cpuPercent: 1 },
        { cpuPercent: '%' },
        'AVAILABLE',
        5,
        methodology.version,
        1,
        {
          version: 1,
          energy: {
            observationId: 'energy-only-observation',
            applicationId: energyOnlyApplicationId,
            averagePowerW: 300,
            energyKwh: 5,
            durationSeconds: 60,
            modelKey: methodology.key,
            modelVersion: methodology.version,
            modelParameters: methodology.parameters,
            powerContributionsW: { cpuPercent: 300 },
            reasons: [],
          },
          carbon: {
            energyKwh: 5,
            factorSnapshot: null,
            emissionsGramsCo2e: null,
            emissionsKilogramsCo2e: null,
            reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
          },
        },
      ],
    )

    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${energyOnlyApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        energy: { value: 5, unit: 'kWh', reasons: [] },
        emissions: {
          value: null,
          unit: 'gCO2e',
          reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
        },
        coverage: { energy: 1, emissions: 0 },
        contributions: [
          expect.objectContaining({
            collectionId: collection.id,
            energy: { value: 5, unit: 'kWh', reasons: [] },
            emissions: {
              value: null,
              unit: 'gCO2e',
              reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
            },
            factorSnapshot: null,
          }),
        ],
        exclusions: [
          expect.objectContaining({
            collectionId: collection.id,
            energyReasons: [],
            emissionsReasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
          }),
        ],
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [energyOnlyApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [energyOnlyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [energyOnlyApplicationId])
    }
  })

  it('preserves zero saved energy and emissions as available measurements', async () => {
    const zeroApplicationId = `analysis-zero-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state)
       VALUES ($1, $2, $3)`,
      [zeroApplicationId, 'Environmental analysis zero test', 'AVAILABLE'],
    )
    await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9, $10, $11, $12)`,
      [
        zeroApplicationId,
        fromUtc,
        toUtc,
        toUtc,
        { cpuPercent: 0 },
        { cpuPercent: '%' },
        'AVAILABLE',
        factorSnapshot.intensity,
        methodology.version,
        factorSnapshot.version,
        1,
        {
          version: 1,
          energy: {
            observationId: 'zero-observation',
            applicationId: zeroApplicationId,
            averagePowerW: 0,
            energyKwh: 0,
            durationSeconds: 60,
            modelKey: methodology.key,
            modelVersion: methodology.version,
            modelParameters: methodology.parameters,
            powerContributionsW: { cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 },
            reasons: [],
          },
          carbon: {
            energyKwh: 0,
            factorSnapshot,
            emissionsGramsCo2e: 0,
            emissionsKilogramsCo2e: 0,
            reasons: [],
          },
        },
      ],
    )

    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${zeroApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        energy: { value: 0, unit: 'kWh', reasons: [] },
        emissions: { value: 0, unit: 'gCO2e', reasons: [] },
        coverage: { energy: 1, emissions: 1 },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [zeroApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [zeroApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [zeroApplicationId])
    }
  })
  it('returns a structured bad request for an invalid half-open period', async () => {
    const query = new URLSearchParams({
      from: '2026-10-01T02:00:00.000Z',
      to: '2026-10-01T01:00:00.000Z',
    })
    const response = await fetch(
      new URL(`/applications/${applicationId}/analysis?${query}`, await app.getUrl()),
    )
    const body: unknown = await response.json()

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ code: 'INVALID_ANALYSIS_PERIOD' })
  })
  it('returns not found for an application with no saved history', async () => {
    const query = new URLSearchParams({ from: fromUtc, to: toUtc })
    const missingId = `missing-${randomUUID()}`
    const response = await fetch(
      new URL(`/applications/${missingId}/analysis?${query}`, await app.getUrl()),
    )
    const body: unknown = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({ code: 'APPLICATION_NOT_FOUND' })
  })
  it('publishes the analysis response contract and error statuses in OpenAPI', async () => {
    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    const document = (await response.json()) as {
      paths: Record<string, {
        get: {
          parameters: Array<{ name: string; in: string; required?: boolean; schema?: { type?: string; format?: string } }>
          responses: Record<string, unknown>
        }
      }>
      components: {
        schemas: Record<string, {
          properties: Record<string, { type?: string; nullable?: boolean }>
          required?: string[]
        }>
      }
    }
    const operation = document.paths['/applications/{id}/analysis'].get
    const measureSchema = document.components.schemas.EnvironmentalAnalysisMeasureDto

    expect(response.status).toBe(200)
    expect(operation.parameters).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'id', in: 'path', required: true }),
      expect.objectContaining({
        name: 'from',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'date-time' },
      }),
      expect.objectContaining({
        name: 'to',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'date-time' },
      }),
    ]))
    expect(operation.responses).toMatchObject({
      '200': {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/EnvironmentalAnalysisDto' },
          },
        },
      },
      '400': {},
      '404': {},
      '503': {},
    })
    expect(measureSchema.properties).toMatchObject({
      value: { type: 'number', nullable: true },
      unit: { type: 'string' },
      reasons: { type: 'array' },
    })
    expect(measureSchema.required).toEqual(expect.arrayContaining(['value', 'unit', 'reasons']))
  })
  it('returns a generic service-unavailable response when persisted analysis cannot be read', async () => {
    const unavailableTable = `collections_qa_${randomUUID().replaceAll('-', '')}`
    await database.query(`ALTER TABLE collections RENAME TO "${unavailableTable}"`)

    try {
      const query = new URLSearchParams({ from: fromUtc, to: toUtc })
      const response = await fetch(
        new URL(`/applications/${applicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(503)
      expect(body).toMatchObject({ code: 'APPLICATION_ANALYSIS_UNAVAILABLE' })
      expect(JSON.stringify(body)).not.toContain(unavailableTable)
    } finally {
      await database.query(`ALTER TABLE "${unavailableTable}" RENAME TO collections`)
    }
  })
  it('retains accessible saved analysis for an application marked removed', async () => {
    await database.query(
      `UPDATE applications SET state = 'REMOVED', "removedAt" = NOW() WHERE id = $1`,
      [applicationId],
    )

    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${applicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        applicationId,
        energy: { value: energyKwh, unit: 'kWh' },
        emissions: { value: emissionsGrams, unit: 'gCO2e' },
      })
    } finally {
      await database.query(
        `UPDATE applications SET state = 'AVAILABLE', "removedAt" = NULL WHERE id = $1`,
        [applicationId],
      )
    }
  })
})
