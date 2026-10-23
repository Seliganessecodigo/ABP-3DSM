import { randomUUID } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../../app.module'
import { CarbonIntensityAdapter } from '../../integrations/carbon-intensity.adapter'
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

interface SummaryObservationFixture {
  readonly id?: string
  readonly applicationId: string
  readonly intervalStart: string
  readonly intervalEnd: string
  readonly collectedAt: string
  readonly energy: number
  readonly emissions: number | null
  readonly methodology: { readonly key: string; readonly version: string; readonly parameters: Readonly<Record<string, number>> }
  readonly factorSnapshot: {
    readonly id: string
    readonly version: string
    readonly contractVersion: string
    readonly regionCode: string
    readonly country: string
    readonly region: string
    readonly city: string | null
    readonly intensity: number
    readonly unit: string
    readonly queriedAt: string
    readonly source: string
    readonly validFrom: string | null
    readonly validUntil: string | null
  } | null
  readonly emissionsReasons?: readonly { readonly code: string }[]
}

async function insertSummaryObservation(database: DataSource, input: SummaryObservationFixture): Promise<void> {
  const id = input.id ?? randomUUID()
  await database.query(
    `INSERT INTO collections (
      id, "applicationId", "intervalStart", "intervalEnd", "collectedAt",
      metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
      "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      id,
      input.applicationId,
      input.intervalStart,
      input.intervalEnd,
      input.collectedAt,
      { cpuPercent: 1 },
      { cpuPercent: '%' },
      'AVAILABLE',
      input.energy,
      input.emissions,
      input.factorSnapshot?.intensity ?? null,
      input.methodology.version,
      input.factorSnapshot?.version ?? null,
      1,
      {
        version: 1,
        energy: {
          observationId: id,
          applicationId: input.applicationId,
          averagePowerW: input.energy * 1000,
          energyKwh: input.energy,
          durationSeconds: 60,
          modelKey: input.methodology.key,
          modelVersion: input.methodology.version,
          modelParameters: input.methodology.parameters,
          powerContributionsW: { cpuPercent: input.energy * 1000 },
          reasons: [],
        },
        carbon: {
          energyKwh: input.energy,
          factorSnapshot: input.factorSnapshot,
          emissionsGramsCo2e: input.emissions,
          emissionsKilogramsCo2e: input.emissions === null ? null : input.emissions / 1000,
          reasons: input.emissionsReasons ?? [],
        },
      },
    ],
  )
}

async function postPreview(
  app: INestApplication,
  id: string,
  requestFrom = from,
  requestTo = to,
): Promise<Response> {
  return fetch(
    new URL(`/applications/${id}/analysis/recalculation-preview`, await app.getUrl()),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ from: requestFrom, to: requestTo }),
    },
  )
}

describeWithDatabase('GET /applications/:id/analysis com PostgreSQL', () => {
  let database: DataSource
  let app: INestApplication
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
    await database.query(
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

  it('returns original and recalculated totals while preserving the saved analysis', async () => {
    const query = new URLSearchParams({ from, to })
    const analysisUrl = new URL(
      `/applications/${applicationId}/analysis?${query}`,
      await app.getUrl(),
    )
    const beforeResponse = await fetch(analysisUrl)
    const originalBefore = await beforeResponse.json()
    const factorRequest = jest
      .spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
      .mockResolvedValue({
        regionCode: 'br-sudeste',
        country: 'Brazil',
        region: 'Sudeste',
        city: null,
        intensity: 150,
        unit: 'gCO2e/kWh',
        renewableSharePercent: 40,
        queriedAt: new Date('2026-10-22T03:01:00Z'),
      })
    try {
      const response = await postPreview(app, applicationId)
      const body = (await response.json()) as {
        status: string
        original: { energy: { value: number }; emissions: { value: number } }
        preview: { energy: { value: number }; emissions: { value: number } }
        warnings: unknown[]
      }
      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        original: {
          energy: { value: energyKwh },
          emissions: { value: emissionsGrams },
        },
        preview: { energy: { value: 0.000031 } },
        warnings: [],
      })
      expect(body.preview.emissions.value).toBeCloseTo(0.00465, 12)
      expect(factorRequest).toHaveBeenCalledWith(factorSnapshot.regionCode)
      expect((await fetch(analysisUrl)).status).toBe(200)
      expect(await (await fetch(analysisUrl)).json()).toEqual(originalBefore)
    } finally {
      factorRequest.mockRestore()
    }
  })

  it('rejects periods longer than 30 days before requesting factors', async () => {
    const factorRequest = jest.spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
    try {
      const response = await postPreview(
        app,
        applicationId,
        '2026-10-01T00:00:00Z',
        '2026-11-01T00:00:00Z',
      )
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED',
      })
      expect(factorRequest).not.toHaveBeenCalled()
    } finally {
      factorRequest.mockRestore()
    }
  })

  it('rejects more than 10,000 observations without truncating the preview', async () => {
    const largeApplicationId = `preview-limit-${randomUUID()}`
    await database.query(
      'INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)',
      [largeApplicationId, 'Preview observation limit', 'AVAILABLE'],
    )
    await insertSummaryObservation(database, {
      applicationId: largeApplicationId,
      intervalStart: fromUtc,
      intervalEnd: toUtc,
      collectedAt: toUtc,
      energy: 0.000031,
      emissions: emissionsGrams,
      methodology,
      factorSnapshot,
    })
    await database.query(
      `INSERT INTO collections (
         "applicationId", "intervalStart", "intervalEnd", "collectedAt", metrics,
         "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
         "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
       )
       SELECT "applicationId", "intervalStart" + generated.sequence * interval '1 microsecond',
         "intervalEnd" + generated.sequence * interval '1 microsecond',
         "collectedAt" + generated.sequence * interval '1 microsecond', metrics,
         "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
         "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
       FROM collections source
       CROSS JOIN generate_series(1, 10000) AS generated(sequence)
       WHERE source."applicationId" = $1 AND source.id = (
         SELECT id FROM collections WHERE "applicationId" = $1 ORDER BY "intervalStart" LIMIT 1
       )`,
      [largeApplicationId],
    )
    const factorRequest = jest.spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
    try {
      const response = await postPreview(app, largeApplicationId)
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED',
      })
      expect(factorRequest).not.toHaveBeenCalled()
    } finally {
      factorRequest.mockRestore()
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [largeApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [largeApplicationId])
    }
  })

  it('keeps a partial result and hides upstream error details when a factor lookup fails', async () => {
    const factorRequest = jest
      .spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
      .mockRejectedValue(new Error('sensitive upstream detail'))
    try {
      const response = await postPreview(app, applicationId)
      const body = (await response.json()) as {
        status: string
        preview: {
          energy: { value: number | null }
          emissions: { value: number | null; reasons: { code: string }[] }
        }
        warnings: { code: string; regionCode: string | null }[]
      }
      expect(response.status).toBe(200)
      expect(body.status).toBe('partial')
      expect(body.preview.energy.value).toBeCloseTo(0.000031, 12)
      expect(body.preview.emissions.value).toBeNull()
      expect(body.preview.emissions.reasons).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'CARBON_FACTOR_UNAVAILABLE' })]),
      )
      expect(body.warnings).toEqual([
        { code: 'CARBON_FACTOR_UNAVAILABLE', regionCode: factorSnapshot.regionCode },
      ])
      expect(JSON.stringify(body)).not.toContain('sensitive upstream detail')
      expect(factorRequest).toHaveBeenCalledTimes(1)
    } finally {
      factorRequest.mockRestore()
    }
  })

  it('returns an empty result and skips external calls when there are no observations', async () => {
    const emptyApplicationId = `preview-empty-${randomUUID()}`
    await database.query(
      'INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)',
      [emptyApplicationId, 'Empty preview', 'AVAILABLE'],
    )
    const factorRequest = jest.spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
    try {
      const response = await postPreview(app, emptyApplicationId)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ status: 'empty', warnings: [] })
      expect(factorRequest).not.toHaveBeenCalled()
    } finally {
      factorRequest.mockRestore()
      await database.query('DELETE FROM applications WHERE id = $1', [emptyApplicationId])
    }
  })

  it('returns 404 for an unknown application', async () => {
    const response = await postPreview(app, `missing-${randomUUID()}`)
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'APPLICATION_NOT_FOUND' })
  })

  it('resolves the location history at collection time when the original snapshot has no region', async () => {
    const historicalApplicationId = `preview-region-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state, "regionCode", country, region, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [historicalApplicationId, 'Historical region', 'AVAILABLE', 'br-norte', 'Brazil', 'Norte', 0, 0],
    )
    await insertSummaryObservation(database, {
      applicationId: historicalApplicationId,
      intervalStart: fromUtc,
      intervalEnd: toUtc,
      collectedAt: toUtc,
      energy: 0.000031,
      emissions: null,
      methodology,
      factorSnapshot: null,
    })
    await database.query(
      `INSERT INTO application_events ("applicationId", kind, actor, "occurredAt", details)
       VALUES ($1, 'registration_changed', 'test', $2, $3)`,
      [historicalApplicationId, '2026-10-01T03:02:00Z', {
        before: { location: { regionCode: 'br-sudeste' } },
        after: { location: { regionCode: 'br-norte' } },
      }],
    )
    const factorRequest = jest
      .spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
      .mockResolvedValue({
        regionCode: 'br-sudeste', country: 'Brazil', region: 'Sudeste', city: null,
        intensity: 100, unit: 'gCO2e/kWh', renewableSharePercent: 40,
        queriedAt: new Date('2026-10-22T03:01:00Z'),
      })
    try {
      const response = await postPreview(app, historicalApplicationId)
      expect(response.status).toBe(200)
      expect(factorRequest).toHaveBeenCalledWith('br-sudeste')
    } finally {
      factorRequest.mockRestore()
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [historicalApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [historicalApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [historicalApplicationId])
    }
  })

  it('marks missing historical region as partial without calling the factor service', async () => {
    const noRegionApplicationId = `preview-no-region-${randomUUID()}`
    await database.query(
      'INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)',
      [noRegionApplicationId, 'Missing region', 'AVAILABLE'],
    )
    await insertSummaryObservation(database, {
      applicationId: noRegionApplicationId,
      intervalStart: fromUtc,
      intervalEnd: toUtc,
      collectedAt: toUtc,
      energy: 0.000031,
      emissions: null,
      methodology,
      factorSnapshot: null,
    })
    const factorRequest = jest.spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
    try {
      const response = await postPreview(app, noRegionApplicationId)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        status: 'partial',
        warnings: [{ code: 'HISTORICAL_REGION_UNAVAILABLE', regionCode: null }],
      })
      expect(factorRequest).not.toHaveBeenCalled()
    } finally {
      factorRequest.mockRestore()
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [noRegionApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [noRegionApplicationId])
    }
  })

  it('limits concurrent factor lookups across distinct regions', async () => {
    const concurrencyApplicationId = `preview-concurrency-${randomUUID()}`
    await database.query(
      'INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)',
      [concurrencyApplicationId, 'Preview concurrency test', 'AVAILABLE'],
    )
    for (let index = 0; index < 6; index++) {
      const start = new Date(Date.parse(fromUtc) + index * 5_000)
      const end = new Date(start.getTime() + 5_000)
      await insertSummaryObservation(database, {
        applicationId: concurrencyApplicationId,
        intervalStart: start.toISOString(), intervalEnd: end.toISOString(), collectedAt: end.toISOString(),
        energy: 0.000031, emissions: null, methodology,
        factorSnapshot: { ...factorSnapshot, id: `snapshot-${index}`, version: `factor-${index}`, regionCode: `br-region-${index}` },
      })
    }
    let active = 0
    let maximum = 0
    const factorRequest = jest.spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity').mockImplementation(async (regionCode) => {
      active++
      maximum = Math.max(maximum, active)
      await new Promise((resolve) => setTimeout(resolve, 10))
      active--
      return {
        regionCode, country: 'Brazil', region: 'Test region', city: null,
        intensity: 100, unit: 'gCO2e/kWh', renewableSharePercent: 40,
        queriedAt: new Date('2026-10-22T03:01:00Z'),
      }
    })
    try {
      const response = await postPreview(app, concurrencyApplicationId)
      expect(response.status).toBe(200)
      expect(factorRequest).toHaveBeenCalledTimes(6)
      expect(maximum).toBeLessThanOrEqual(5)
    } finally {
      factorRequest.mockRestore()
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [concurrencyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [concurrencyApplicationId])
    }
  })

  it('deduplicates factor lookups for multiple observations in the same region', async () => {
    const dedupeApplicationId = `preview-dedupe-${randomUUID()}`
    await database.query(
      'INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)',
      [dedupeApplicationId, 'Preview factor deduplication', 'AVAILABLE'],
    )
    for (let index = 0; index < 2; index++) {
      const start = new Date(Date.parse(fromUtc) + index * 20_000)
      const end = new Date(start.getTime() + 10_000)
      await insertSummaryObservation(database, {
        applicationId: dedupeApplicationId,
        intervalStart: start.toISOString(), intervalEnd: end.toISOString(), collectedAt: end.toISOString(),
        energy: 0.000031, emissions: emissionsGrams, methodology, factorSnapshot,
      })
    }
    const factorRequest = jest
      .spyOn(CarbonIntensityAdapter.prototype, 'fetchIntensity')
      .mockResolvedValue({
        regionCode: factorSnapshot.regionCode, country: 'Brazil', region: 'Sudeste', city: null,
        intensity: 100, unit: 'gCO2e/kWh', renewableSharePercent: 40,
        queriedAt: new Date('2026-10-22T03:01:00Z'),
      })
    try {
      const response = await postPreview(app, dedupeApplicationId)
      expect(response.status).toBe(200)
      expect(factorRequest).toHaveBeenCalledTimes(1)
    } finally {
      factorRequest.mockRestore()
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [dedupeApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [dedupeApplicationId])
    }
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
      provenance: {
        methodologies: [methodology],
        factors: [{
          contractVersion: factorSnapshot.contractVersion,
          regionCode: factorSnapshot.regionCode,
          country: factorSnapshot.country,
          region: factorSnapshot.region,
          city: factorSnapshot.city,
          intensity: factorSnapshot.intensity,
          unit: factorSnapshot.unit,
          version: factorSnapshot.version,
          source: factorSnapshot.source,
          validFrom: factorSnapshot.validFrom,
          validUntil: factorSnapshot.validUntil,
          queriedAt: { from: toUtc, to: toUtc },
        }],
        reasons: [],
      },
    })
    expect(body).not.toHaveProperty('contributions')
    expect(body).not.toHaveProperty('exclusions')
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
        provenance: { methodologies: [], factors: [], reasons: [] },
      })
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [emptyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [emptyApplicationId])
    }
  })

  it('deduplicates identical effective methodology and factor provenance while merging GreenER query times', async () => {
    const summaryApplicationId = `analysis-summary-dedupe-${randomUUID()}`
    const summaryFrom = '2026-10-01T03:00:00.000Z'
    const middle = '2026-10-01T03:01:00.000Z'
    const summaryTo = '2026-10-01T03:02:00.000Z'
    const firstQueriedAt = '2026-10-01T03:00:30.000Z'
    const secondQueriedAt = '2026-10-01T03:01:30.000Z'
    const methodParameters = {
      cpuWattsAt100Percent: 100,
      memoryWattsPerGb: 0.375,
      diskWattsPerGb: 0.01,
      networkWattsPerGb: 0.02,
    }
    const reversedMethodParameters = {
      networkWattsPerGb: 0.02,
      diskWattsPerGb: 0.01,
      memoryWattsPerGb: 0.375,
      cpuWattsAt100Percent: 100,
    }
    const firstMethodology = { key: 'same-energy-model', version: 'v7', parameters: methodParameters }
    const secondMethodology = { key: 'same-energy-model', version: 'v7', parameters: reversedMethodParameters }
    const firstSnapshot = { ...factorSnapshot, id: 'factor-snapshot-first', queriedAt: firstQueriedAt }
    const secondSnapshot = { ...factorSnapshot, id: 'factor-snapshot-second', queriedAt: secondQueriedAt }

    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [summaryApplicationId, 'Environmental analysis summary dedupe test', 'AVAILABLE'],
    )

    await insertSummaryObservation(database, {
      applicationId: summaryApplicationId,
      intervalStart: summaryFrom,
      intervalEnd: middle,
      collectedAt: middle,
      energy: 2,
      emissions: 10,
      methodology: firstMethodology,
      factorSnapshot: firstSnapshot,
    })
    await insertSummaryObservation(database, {
      applicationId: summaryApplicationId,
      intervalStart: middle,
      intervalEnd: summaryTo,
      collectedAt: summaryTo,
      energy: 3,
      emissions: 15,
      methodology: secondMethodology,
      factorSnapshot: secondSnapshot,
    })
    try {
      const query = new URLSearchParams({ from: summaryFrom, to: summaryTo })
      const response = await fetch(
        new URL(`/applications/${summaryApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        energy: { value: 5, unit: 'kWh' },
        emissions: { value: 25, unit: 'gCO2e' },
        coverage: { energy: 1, emissions: 1 },
        provenance: {
          methodologies: [firstMethodology],
          factors: [{
            contractVersion: factorSnapshot.contractVersion,
            regionCode: factorSnapshot.regionCode,
            country: factorSnapshot.country,
            region: factorSnapshot.region,
            city: factorSnapshot.city,
            intensity: factorSnapshot.intensity,
            unit: factorSnapshot.unit,
            version: factorSnapshot.version,
            source: factorSnapshot.source,
            validFrom: factorSnapshot.validFrom,
            validUntil: factorSnapshot.validUntil,
            queriedAt: { from: firstQueriedAt, to: secondQueriedAt },
          }],
          reasons: [],
        },
      })
      expect(body).not.toHaveProperty('contributions')
      expect(body).not.toHaveProperty('exclusions')
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [summaryApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [summaryApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [summaryApplicationId])
    }
  })

  it('keeps distinct factor attributes and energy models even when their versions match', async () => {
    const distinctApplicationId = `analysis-summary-distinct-${randomUUID()}`
    const summaryFrom = '2026-10-01T03:00:00.000Z'
    const middle = '2026-10-01T03:01:00.000Z'
    const summaryTo = '2026-10-01T03:02:00.000Z'
    const firstMethodology = {
      key: 'energy-model-original',
      version: 'shared-v1',
      parameters: { cpuWattsAt100Percent: 100 },
    }
    const secondMethodology = {
      key: 'energy-model-revised',
      version: 'shared-v1',
      parameters: { cpuWattsAt100Percent: 200 },
    }
    const firstSnapshot = { ...factorSnapshot, id: 'same-version-snapshot-a', queriedAt: middle }
    const secondSnapshot = {
      ...factorSnapshot,
      id: 'same-version-snapshot-b',
      regionCode: 'br-sul',
      region: 'Sul',
      city: 'Porto Alegre',
      intensity: 95,
      source: 'different-carbon-service',
      validFrom: summaryFrom,
      validUntil: '2026-12-01T00:00:00.000Z',
      queriedAt: summaryTo,
    }

    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [distinctApplicationId, 'Environmental analysis distinct provenance test', 'AVAILABLE'],
    )
    await insertSummaryObservation(database, {
      applicationId: distinctApplicationId,
      intervalStart: summaryFrom,
      intervalEnd: middle,
      collectedAt: middle,
      energy: 2,
      emissions: 10,
      methodology: firstMethodology,
      factorSnapshot: firstSnapshot,
    })
    await insertSummaryObservation(database, {
      applicationId: distinctApplicationId,
      intervalStart: middle,
      intervalEnd: summaryTo,
      collectedAt: summaryTo,
      energy: 3,
      emissions: 15,
      methodology: secondMethodology,
      factorSnapshot: secondSnapshot,
    })
    try {
      const query = new URLSearchParams({ from: summaryFrom, to: summaryTo })
      const response = await fetch(
        new URL(`/applications/${distinctApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        provenance: {
          methodologies: [firstMethodology, secondMethodology],
          factors: [
            {
              contractVersion: firstSnapshot.contractVersion,
              regionCode: firstSnapshot.regionCode,
              country: firstSnapshot.country,
              region: firstSnapshot.region,
              city: firstSnapshot.city,
              intensity: firstSnapshot.intensity,
              unit: firstSnapshot.unit,
              version: firstSnapshot.version,
              source: firstSnapshot.source,
              validFrom: firstSnapshot.validFrom,
              validUntil: firstSnapshot.validUntil,
              queriedAt: { from: middle, to: middle },
            },
            {
              contractVersion: secondSnapshot.contractVersion,
              regionCode: secondSnapshot.regionCode,
              country: secondSnapshot.country,
              region: secondSnapshot.region,
              city: secondSnapshot.city,
              intensity: secondSnapshot.intensity,
              unit: secondSnapshot.unit,
              version: secondSnapshot.version,
              source: secondSnapshot.source,
              validFrom: secondSnapshot.validFrom,
              validUntil: secondSnapshot.validUntil,
              queriedAt: { from: summaryTo, to: summaryTo },
            },
          ],
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [distinctApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [distinctApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [distinctApplicationId])
    }
  })

  it('includes provenance only from the winning segments with a valid measurement', async () => {
    const winnerApplicationId = `analysis-summary-winner-${randomUUID()}`
    const olderId = randomUUID()
    const winnerId = randomUUID()
    const olderStart = '2026-10-01T02:59:00.000Z'
    const losingSnapshot = { ...factorSnapshot, id: 'losing-snapshot', source: 'superseded-carbon-source' }
    const winningMethodology = {
      key: 'winning-energy-model',
      version: 'winning-v1',
      parameters: { cpuWattsAt100Percent: 4 },
    }
    const losingMethodology = {
      key: 'superseded-energy-model',
      version: 'old-v1',
      parameters: { cpuWattsAt100Percent: 99 },
    }

    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [winnerApplicationId, 'Environmental analysis winner provenance test', 'AVAILABLE'],
    )
    await insertSummaryObservation(database, {
      id: olderId,
      applicationId: winnerApplicationId,
      intervalStart: olderStart,
      intervalEnd: toUtc,
      collectedAt: fromUtc,
      energy: 99,
      emissions: 999,
      methodology: losingMethodology,
      factorSnapshot: losingSnapshot,
    })
    await insertSummaryObservation(database, {
      id: winnerId,
      applicationId: winnerApplicationId,
      intervalStart: fromUtc,
      intervalEnd: toUtc,
      collectedAt: toUtc,
      energy: 4,
      emissions: null,
      methodology: winningMethodology,
      factorSnapshot: null,
      emissionsReasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
    })
    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${winnerApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        energy: { value: 4, unit: 'kWh' },
        emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] },
        provenance: {
          methodologies: [winningMethodology],
          factors: [],
          reasons: [],
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [winnerApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [winnerApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [winnerApplicationId])
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
    await database.query(
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
        provenance: {
          methodologies: [{
            key: 'precision-model',
            version: 'precision-model-v1',
            parameters: preciseModelParameters,
          }],
          factors: [{
            contractVersion: preciseFactorSnapshot.contractVersion,
            regionCode: preciseFactorSnapshot.regionCode,
            country: preciseFactorSnapshot.country,
            region: preciseFactorSnapshot.region,
            city: preciseFactorSnapshot.city,
            intensity: preciseFactorSnapshot.intensity,
            unit: preciseFactorSnapshot.unit,
            version: preciseFactorSnapshot.version,
            source: preciseFactorSnapshot.source,
            validFrom: preciseFactorSnapshot.validFrom,
            validUntil: preciseFactorSnapshot.validUntil,
            queriedAt: {
              from: '2026-10-01T03:05:00.000001Z',
              to: '2026-10-01T03:05:00.000001Z',
            },
          }],
          reasons: [],
        },
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
        provenance: { methodologies: [], factors: [], reasons: [] },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [legacyApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [legacyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [legacyApplicationId])
    }
  })

  it('preserves legacy scalar values while reporting their missing provenance', async () => {
    const legacyValueApplicationId = `analysis-legacy-values-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [legacyValueApplicationId, 'Environmental analysis legacy values test', 'AVAILABLE'],
    )
    await database.query(
      `INSERT INTO collections (
        "applicationId", "intervalStart", "intervalEnd", "collectedAt",
        metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
        "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULL)`,
      [
        legacyValueApplicationId,
        fromUtc,
        toUtc,
        toUtc,
        { cpuPercent: 1 },
        { cpuPercent: '%' },
        'AVAILABLE',
        3,
        30,
        10,
        'legacy-model-v1',
        'legacy-factor-v1',
        1,
      ],
    )

    try {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        new URL(`/applications/${legacyValueApplicationId}/analysis?${query}`, await app.getUrl()),
      )
      const body: unknown = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        status: 'available',
        energy: { value: 3, unit: 'kWh' },
        emissions: { value: 30, unit: 'gCO2e' },
        coverage: { energy: 1, emissions: 1 },
        provenance: {
          methodologies: [],
          factors: [],
          reasons: [
            { code: 'METHODOLOGY_METADATA_UNAVAILABLE', metric: 'energy' },
            { code: 'FACTOR_METADATA_UNAVAILABLE', metric: 'emissions' },
          ],
        },
      })
    } finally {
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [legacyValueApplicationId])
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [legacyValueApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [legacyValueApplicationId])
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
    await database.query(
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
        provenance: {
          methodologies: [methodology],
          factors: [{
            contractVersion: factorSnapshot.contractVersion,
            regionCode: factorSnapshot.regionCode,
            country: factorSnapshot.country,
            region: factorSnapshot.region,
            city: factorSnapshot.city,
            intensity: 10,
            unit: factorSnapshot.unit,
            version: factorSnapshot.version,
            source: factorSnapshot.source,
            validFrom: factorSnapshot.validFrom,
            validUntil: factorSnapshot.validUntil,
            queriedAt: { from: coveredTo, to: coveredTo },
          }],
          reasons: [],
        },
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
    await database.query(
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
        provenance: { methodologies: [methodology], factors: [], reasons: [] },
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
        provenance: {
          methodologies: [methodology],
          factors: [{
            contractVersion: factorSnapshot.contractVersion,
            regionCode: factorSnapshot.regionCode,
            country: factorSnapshot.country,
            region: factorSnapshot.region,
            city: factorSnapshot.city,
            intensity: factorSnapshot.intensity,
            unit: factorSnapshot.unit,
            version: factorSnapshot.version,
            source: factorSnapshot.source,
            validFrom: factorSnapshot.validFrom,
            validUntil: factorSnapshot.validUntil,
            queriedAt: { from: toUtc, to: toUtc },
          }],
          reasons: [],
        },
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
    const responseSchema = document.components.schemas.EnvironmentalAnalysisDto
    const provenanceSchema = document.components.schemas.EnvironmentalAnalysisProvenanceDto
    const factorSchema = document.components.schemas.EnvironmentalAnalysisFactorProvenanceDto
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
    expect(responseSchema.properties.provenance).toMatchObject({ $ref: '#/components/schemas/EnvironmentalAnalysisProvenanceDto' })
    expect(responseSchema.properties).not.toHaveProperty('contributions')
    expect(responseSchema.properties).not.toHaveProperty('exclusions')
    expect(provenanceSchema.properties).toMatchObject({
      methodologies: { type: 'array' },
      factors: { type: 'array' },
      reasons: { type: 'array' },
    })
    expect(factorSchema.properties.queriedAt).toMatchObject({ $ref: '#/components/schemas/EnvironmentalAnalysisQueryRangeDto' })
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
