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
const from = '2026-10-01T03:00:00.000Z'
const to = '2026-10-01T03:01:00.000Z'
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
const factorSnapshot = {
  id: 'summary-factor-snapshot',
  version: 'factor-v1',
  contractVersion: 'contract-v1',
  regionCode: 'br-sudeste',
  country: 'Brazil',
  region: 'Sudeste',
  city: null,
  intensity: 85,
  unit: 'gCO2e/kWh',
  queriedAt: to,
  source: 'persisted-factor-source',
  validFrom: '2026-10-01T00:00:00.000Z',
  validUntil: '2026-11-01T00:00:00.000Z',
}

async function insertApplication(
  database: DataSource,
  id: string,
  state: 'AVAILABLE' | 'UNAVAILABLE' | 'NO_METRICS' | 'REMOVED',
  regionCode: string | null = null,
): Promise<void> {
  if (regionCode === null) {
    await database.query(
      'INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)',
      [id, id, state],
    )
    return
  }
  const region = regionCode === 'br-norte' ? 'Norte' : 'Sudeste'
  await database.query(
    `INSERT INTO applications (id, name, state, "regionCode", country, region, latitude, longitude)
     VALUES ($1, $2, $3, $4, 'Brazil', $5, 1, 1)`,
    [id, id, state, regionCode, region],
  )
}

async function insertObservation(
  database: DataSource,
  applicationId: string,
  collectedAt: string,
  energy: number,
  emissions: number | null,
  factor: typeof factorSnapshot | null,
  emissionsReasons: readonly { readonly code: string }[] = [],
): Promise<void> {
  const id = randomUUID()
  await database.query(
    `INSERT INTO collections (
      id, "applicationId", "intervalStart", "intervalEnd", "collectedAt",
      metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
      "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'AVAILABLE', $8, $9, $10, $11, $12, 1, $13)`,
    [
      id,
      applicationId,
      from,
      to,
      collectedAt,
      { cpuPercent: 1 },
      { cpuPercent: '%' },
      energy,
      emissions,
      factor?.intensity ?? null,
      methodology.version,
      factor?.version ?? null,
      {
        version: 1,
        energy: {
          modelKey: methodology.key,
          modelVersion: methodology.version,
          modelParameters: methodology.parameters,
          reasons: [],
        },
        carbon: {
          factorSnapshot: factor,
          reasons: emissionsReasons,
        },
      },
    ],
  )
}

async function removeApplications(
  database: DataSource,
  ids: readonly string[],
) {
  await database.query(
    'DELETE FROM collections WHERE "applicationId" = ANY($1::text[])',
    [ids],
  )
  await database.query(
    'DELETE FROM application_events WHERE "applicationId" = ANY($1::text[])',
    [ids],
  )
  await database.query('DELETE FROM applications WHERE id = ANY($1::text[])', [
    ids,
  ])
}

describeWithDatabase('GET /analysis/summary com PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
  const previousDatabaseUrl = process.env.DATABASE_URL

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL must point to an isolated PostgreSQL database',
      )
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
    app = await NestFactory.create(AppModule, { logger: false })
    configureOpenApi(app)
    await app.listen(0, '127.0.0.1')
  }, 120_000)

  afterAll(async () => {
    await app?.close()
    if (database?.isInitialized) await database.destroy()
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
  })

  it('returns empty totals and zero coverage while counting the current application state', async () => {
    const id = `summary-empty-${randomUUID()}`
    await insertApplication(database, id, 'NO_METRICS')
    try {
      const query = new URLSearchParams({ from, to, applicationIds: id })
      const response = await fetch(
        new URL(`/analysis/summary?${query}`, await app.getUrl()),
      )
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        status: 'empty',
        period: { from, to },
        totals: {
          energy: { value: null, unit: 'kWh' },
          emissions: { value: null, unit: 'gCO2e' },
        },
        coverage: { energy: 0, emissions: 0 },
        states: { AVAILABLE: 0, UNAVAILABLE: 0, NO_METRICS: 1, REMOVED: 0 },
        applications: [],
      })
    } finally {
      await removeApplications(database, [id])
    }
  })

  it('aggregates filters and uses each collection historical region, including removed history and valid zero', async () => {
    const historicalId = `summary-history-${randomUUID()}`
    const currentId = `summary-current-${randomUUID()}`
    const removedId = `summary-removed-${randomUUID()}`
    const ids = [historicalId, currentId, removedId]
    await insertApplication(database, historicalId, 'AVAILABLE', 'br-norte')
    await insertApplication(database, currentId, 'UNAVAILABLE', 'br-sudeste')
    await insertApplication(database, removedId, 'REMOVED', 'br-sudeste')
    await database.query(
      `INSERT INTO application_events ("applicationId", kind, "occurredAt", actor, details)
       VALUES ($1, 'registration_changed', $2, 'system', $3)`,
      [
        historicalId,
        '2026-10-01T03:00:30.000Z',
        {
          before: { location: { regionCode: 'br-sudeste' } },
          after: { location: { regionCode: 'br-norte' } },
        },
      ],
    )
    await insertObservation(
      database,
      historicalId,
      '2026-10-01T03:00:10.000Z',
      2,
      null,
      null,
      [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
    )
    await insertObservation(
      database,
      currentId,
      '2026-10-01T03:00:20.000Z',
      1,
      85,
      {
        ...factorSnapshot,
        queriedAt: '2026-10-01T03:00:20.000Z',
      },
    )
    await insertObservation(
      database,
      removedId,
      '2026-10-01T03:00:30.000Z',
      0,
      0,
      {
        ...factorSnapshot,
        queriedAt: '2026-10-01T03:00:30.000Z',
      },
    )

    try {
      const query = new URLSearchParams({ from, to, regionCodes: 'br-sudeste' })
      for (const state of ['AVAILABLE', 'UNAVAILABLE', 'REMOVED'])
        query.append('states', state)
      for (const id of ids) query.append('applicationIds', id)
      const response = await fetch(
        new URL(`/analysis/summary?${query}`, await app.getUrl()),
      )
      const body = (await response.json()) as {
        readonly applications: readonly Record<string, unknown>[]
        readonly [key: string]: unknown
      }
      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        period: { from, to },
        dataAsOf: '2026-10-01T03:00:30.000Z',
        totals: {
          energy: { value: 3, unit: 'kWh' },
          emissions: { value: 85, unit: 'gCO2e' },
        },
        coverage: { energy: 1, emissions: 2 / 3 },
        states: { AVAILABLE: 1, UNAVAILABLE: 1, NO_METRICS: 0, REMOVED: 1 },
        provenance: {
          methodologies: [methodology],
          factors: [
            expect.objectContaining({
              queriedAt: {
                from: '2026-10-01T03:00:20.000Z',
                to: '2026-10-01T03:00:30.000Z',
              },
            }),
          ],
        },
      })
      expect(body.applications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            applicationId: historicalId,
            energy: expect.objectContaining({ value: 2 }),
            emissions: expect.objectContaining({
              value: null,
              reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
            }),
          }),
          expect.objectContaining({
            applicationId: currentId,
            energy: expect.objectContaining({ value: 1 }),
            emissions: expect.objectContaining({ value: 85 }),
          }),
          expect.objectContaining({
            applicationId: removedId,
            energy: expect.objectContaining({ value: 0 }),
            emissions: expect.objectContaining({ value: 0 }),
          }),
        ]),
      )
    } finally {
      await removeApplications(database, ids)
    }
  })

  it('distinguishes invalid filters and periods from valid filters with no matches', async () => {
    const invalidState = new URLSearchParams({ from, to, states: 'ONLINE' })
    const invalidStateResponse = await fetch(
      new URL(`/analysis/summary?${invalidState}`, await app.getUrl()),
    )
    expect(invalidStateResponse.status).toBe(400)
    expect(await invalidStateResponse.json()).toMatchObject({
      code: 'INVALID_ANALYSIS_STATE_FILTER',
    })

    const invalidRegion = new URLSearchParams({ from, to, regionCodes: '' })
    const invalidRegionResponse = await fetch(
      new URL(`/analysis/summary?${invalidRegion}`, await app.getUrl()),
    )
    expect(invalidRegionResponse.status).toBe(400)
    expect(await invalidRegionResponse.json()).toMatchObject({
      code: 'INVALID_ANALYSIS_REGION_FILTER',
    })

    const invalidPeriod = new URLSearchParams({ from, to: from })
    const invalidPeriodResponse = await fetch(
      new URL(`/analysis/summary?${invalidPeriod}`, await app.getUrl()),
    )
    expect(invalidPeriodResponse.status).toBe(400)
    expect(await invalidPeriodResponse.json()).toMatchObject({
      code: 'INVALID_ANALYSIS_PERIOD',
    })

    const noMatches = new URLSearchParams({
      from,
      to,
      applicationIds: `missing-${randomUUID()}`,
    })
    const emptyResponse = await fetch(
      new URL(`/analysis/summary?${noMatches}`, await app.getUrl()),
    )
    expect(emptyResponse.status).toBe(200)
    expect(await emptyResponse.json()).toMatchObject({
      status: 'empty',
      coverage: { energy: 0, emissions: 0 },
      states: { AVAILABLE: 0, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 },
    })
  })

  it('documents query filters, response shape, and fixed state categories in OpenAPI', async () => {
    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    const document = (await response.json()) as {
      paths: Record<
        string,
        {
          get: {
            parameters: Array<{ name: string; in: string; required?: boolean }>
            responses: Record<string, unknown>
          }
        }
      >
      components: {
        schemas: Record<
          string,
          {
            properties: Record<
              string,
              { type?: string; $ref?: string; minimum?: number }
            >
          }
        >
      }
    }
    const operation = document.paths['/analysis/summary'].get
    expect(operation.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'from', in: 'query', required: true }),
        expect.objectContaining({ name: 'to', in: 'query', required: true }),
        expect.objectContaining({
          name: 'states',
          in: 'query',
          required: false,
        }),
        expect.objectContaining({
          name: 'regionCodes',
          in: 'query',
          required: false,
        }),
        expect.objectContaining({
          name: 'applicationIds',
          in: 'query',
          required: false,
        }),
      ]),
    )
    expect(operation.responses).toMatchObject({
      '200': {},
      '400': {},
      '503': {},
    })
    expect(
      document.components.schemas.EnvironmentalAnalysisSummaryStatesDto
        .properties,
    ).toEqual(
      expect.objectContaining({
        AVAILABLE: { type: 'number', minimum: 0 },
        UNAVAILABLE: { type: 'number', minimum: 0 },
        NO_METRICS: { type: 'number', minimum: 0 },
        REMOVED: { type: 'number', minimum: 0 },
      }),
    )
  })

  it('returns a structured 503 when aggregate persistence cannot be read', async () => {
    const renamed = `summary_collections_${randomUUID().replaceAll('-', '')}`
    const id = `summary-unavailable-${randomUUID()}`
    await insertApplication(database, id, 'AVAILABLE')
    await database.query(`ALTER TABLE collections RENAME TO "${renamed}"`)
    try {
      const query = new URLSearchParams({ from, to, applicationIds: id })
      const response = await fetch(
        new URL(`/analysis/summary?${query}`, await app.getUrl()),
      )
      expect(response.status).toBe(503)
      expect(await response.json()).toMatchObject({
        code: 'ANALYSIS_SUMMARY_UNAVAILABLE',
      })
    } finally {
      await database.query(`ALTER TABLE "${renamed}" RENAME TO collections`)
      await removeApplications(database, [id])
    }
  })
})
