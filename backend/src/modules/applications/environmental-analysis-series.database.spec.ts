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
const applicationId = `analysis-series-test-${randomUUID()}`
const methodology = {
  key: 'series-test-model',
  version: 'series-model-v1',
  parameters: {
    cpuWattsAt100Percent: 100000,
    memoryWattsPerGb: 0,
    diskWattsPerGb: 0,
    networkWattsPerGb: 0,
  },
}

async function insertCollection(
  database: DataSource,
  input: {
    applicationId?: string
    from: string
    to: string
    energy: number | null
    emissions: number | null
    methodologyVersion?: string
    factorVersion?: string | null
  },
): Promise<string> {
  const id = randomUUID()
  const collectedAt = input.to
  const energy = input.energy ?? 0
  const emissions = input.emissions ?? 0
  const factorSnapshot = input.factorVersion === null ? null : {
    id: `snapshot-${id}`,
    version: input.factorVersion ?? 'series-factor-v1',
    contractVersion: 'contract-v1',
    regionCode: 'br-sudeste',
    country: 'Brazil',
    region: 'Sudeste',
    city: null,
    intensity: 10,
    unit: 'gCO2e/kWh',
    queriedAt: collectedAt,
    source: 'persisted-factor-source',
    validFrom: null,
    validUntil: null,
  }
  const calculationEvidence = {
    version: 1,
    energy: {
      observationId: id,
      applicationId: input.applicationId ?? applicationId,
      averagePowerW: energy * 1000,
      energyKwh: input.energy,
      durationSeconds: 3600,
      modelKey: methodology.key,
      modelVersion: input.methodologyVersion ?? methodology.version,
      modelParameters: methodology.parameters,
      powerContributionsW: {
        cpuPercent: energy * 1000,
        memoryGb: 0,
        diskGb: 0,
        networkGb: 0,
      },
      reasons: [],
    },
    carbon: {
      energyKwh: input.energy,
      factorSnapshot,
      emissionsGramsCo2e: input.emissions,
      emissionsKilogramsCo2e: emissions / 1000,
      reasons: [],
    },
  }

  await database.query(
    `INSERT INTO collections (
      id, "applicationId", "intervalStart", "intervalEnd", "collectedAt",
      metrics, "metricUnits", state, "energyKwh", "carbonGrams", "carbonFactor",
      "calculationVersion", "carbonRegionVersion", coverage, "calculationEvidence"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      id,
      input.applicationId ?? applicationId,
      input.from,
      input.to,
      collectedAt,
      { cpuPercent: 16, memoryGb: 0, diskGb: 0, networkGb: 0 },
      { cpuPercent: '%', memoryGb: 'GB', diskGb: 'GB', networkGb: 'GB' },
      'AVAILABLE',
      input.energy,
      input.emissions,
      factorSnapshot?.intensity ?? null,
      input.methodologyVersion ?? methodology.version,
      factorSnapshot?.version ?? null,
      1,
      calculationEvidence,
    ],
  )
  return id
}

describeWithDatabase('GET /applications/:id/analysis/series com PostgreSQL', () => {
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
      [applicationId, 'Environmental series test', 'AVAILABLE'],
    )
    await insertCollection(database, {
      from: '2026-10-01T00:30:00.000Z',
      to: '2026-10-01T01:30:00.000Z',
      energy: 16,
      emissions: 160,
    })
    await insertCollection(database, {
      from: '2026-10-01T01:30:00.000Z',
      to: '2026-10-01T02:30:00.000Z',
      energy: 16,
      emissions: 160,
    })

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

  it('groups saved results into UTC hourly buckets and reconciles partial edges with the period total', async () => {
    const from = '2026-10-01T02:45:00+02:00'
    const to = '2026-10-01T04:15:00+02:00'
    const query = new URLSearchParams({ from, to, granularity: 'hour' })
    const baseUrl = await app.getUrl()
    const seriesResponse = await fetch(
      new URL(`/applications/${applicationId}/analysis/series?${query}`, baseUrl),
    )
    const series: unknown = await seriesResponse.json()
    const periodResponse = await fetch(
      new URL(`/applications/${applicationId}/analysis?${new URLSearchParams({ from, to })}`, baseUrl),
    )
    const period: unknown = await periodResponse.json()

    expect(seriesResponse.status).toBe(200)
    expect(series).toMatchObject({
      status: 'available',
      applicationId,
      period: {
        from: '2026-10-01T00:45:00.000Z',
        to: '2026-10-01T02:15:00.000Z',
      },
      granularity: 'hour',
      totals: {
        energy: { value: 24, unit: 'kWh' },
        emissions: { value: 240, unit: 'gCO2e' },
      },
      coverage: { energy: 1, emissions: 1 },
      points: [
        {
          bucketStart: '2026-10-01T00:00:00.000Z',
          bucketEnd: '2026-10-01T01:00:00.000Z',
          period: {
            from: '2026-10-01T00:45:00.000Z',
            to: '2026-10-01T01:00:00.000Z',
          },
          energy: { value: 4, unit: 'kWh' },
          emissions: { value: 40, unit: 'gCO2e' },
          coverage: { energy: 1, emissions: 1 },
        },
        {
          bucketStart: '2026-10-01T01:00:00.000Z',
          bucketEnd: '2026-10-01T02:00:00.000Z',
          period: {
            from: '2026-10-01T01:00:00.000Z',
            to: '2026-10-01T02:00:00.000Z',
          },
          energy: { value: 16, unit: 'kWh' },
          emissions: { value: 160, unit: 'gCO2e' },
          coverage: { energy: 1, emissions: 1 },
        },
        {
          bucketStart: '2026-10-01T02:00:00.000Z',
          bucketEnd: '2026-10-01T03:00:00.000Z',
          period: {
            from: '2026-10-01T02:00:00.000Z',
            to: '2026-10-01T02:15:00.000Z',
          },
          energy: { value: 4, unit: 'kWh' },
          emissions: { value: 40, unit: 'gCO2e' },
          coverage: { energy: 1, emissions: 1 },
        },
      ],
      events: [],
    })
    expect(periodResponse.status).toBe(200)
    expect(period).toMatchObject({
      status: 'available',
      energy: { value: 24, unit: 'kWh' },
      emissions: { value: 240, unit: 'gCO2e' },
      coverage: { energy: 1, emissions: 1 },
    })
  })

  it('rejects 10,001 hourly points and accepts the 10,000-point maximum', async () => {
    const baseUrl = await app.getUrl()
    const tooManyPoints = new URLSearchParams({
      from: '2026-10-01T00:00:00.000Z',
      to: '2027-11-21T17:00:00.000Z',
      granularity: 'hour',
    })
    const tooManyResponse = await fetch(
      new URL(`/applications/${applicationId}/analysis/series?${tooManyPoints}`, baseUrl),
      { signal: AbortSignal.timeout(5000) },
    )
    const tooManyBody: unknown = await tooManyResponse.json()
    expect(tooManyResponse.status).toBe(400)
    expect(tooManyBody).toMatchObject({ code: 'ANALYSIS_SERIES_POINT_LIMIT_EXCEEDED' })

    const maximumPoints = new URLSearchParams({
      from: '2020-01-01T00:00:00.000Z',
      to: '2021-02-20T16:00:00.000Z',
      granularity: 'hour',
    })
    const maximumResponse = await fetch(
      new URL(`/applications/${applicationId}/analysis/series?${maximumPoints}`, baseUrl),
      { signal: AbortSignal.timeout(5000) },
    )
    const maximumBody = (await maximumResponse.json()) as { points: unknown[] }
    expect(maximumResponse.status).toBe(200)
    expect(maximumBody.points).toHaveLength(10_000)
  })
  it('rejects an enormous hourly horizon without enumerating its buckets', async () => {
    const query = new URLSearchParams({
      from: '1970-01-01T00:00:00.000Z',
      to: '9999-01-01T00:00:00.000Z',
      granularity: 'hour',
    })
    const response = await fetch(
      new URL(`/applications/${applicationId}/analysis/series?${query}`, await app.getUrl()),
      { signal: AbortSignal.timeout(10000) },
    )
    const body: unknown = await response.json()

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ code: 'ANALYSIS_SERIES_POINT_LIMIT_EXCEEDED' })
  })

  it('uses UTC month and year boundaries for empty series crossing leap and year boundaries', async () => {
    const baseUrl = await app.getUrl()
    const getSeries = async (from: string, to: string, granularity: string) => {
      const query = new URLSearchParams({ from, to, granularity })
      const response = await fetch(new URL(`/applications/${applicationId}/analysis/series?${query}`, baseUrl))
      return { response, body: await response.json() as {
        status: string
        points: Array<{
          bucketStart: string
          bucketEnd: string
          period: { from: string; to: string }
          energy: { value: number | null }
          emissions: { value: number | null }
          coverage: { energy: number; emissions: number }
        }>
      } }
    }

    const monthly = await getSeries(
      '2024-02-29T23:30:00.000Z',
      '2024-03-01T00:30:00.000Z',
      'month',
    )
    expect(monthly.response.status).toBe(200)
    expect(monthly.body.status).toBe('empty')
    expect(monthly.body.points).toMatchObject([
      {
        bucketStart: '2024-02-01T00:00:00.000Z',
        bucketEnd: '2024-03-01T00:00:00.000Z',
        period: { from: '2024-02-29T23:30:00.000Z', to: '2024-03-01T00:00:00.000Z' },
        energy: { value: null },
        emissions: { value: null },
        coverage: { energy: 0, emissions: 0 },
      },
      {
        bucketStart: '2024-03-01T00:00:00.000Z',
        bucketEnd: '2024-04-01T00:00:00.000Z',
        period: { from: '2024-03-01T00:00:00.000Z', to: '2024-03-01T00:30:00.000Z' },
        energy: { value: null },
        emissions: { value: null },
        coverage: { energy: 0, emissions: 0 },
      },
    ])

    const yearly = await getSeries(
      '2023-12-31T23:30:00.000Z',
      '2024-01-01T00:30:00.000Z',
      'year',
    )
    expect(yearly.response.status).toBe(200)
    expect(yearly.body.status).toBe('empty')
    expect(yearly.body.points).toMatchObject([
      {
        bucketStart: '2023-01-01T00:00:00.000Z',
        bucketEnd: '2024-01-01T00:00:00.000Z',
        period: { from: '2023-12-31T23:30:00.000Z', to: '2024-01-01T00:00:00.000Z' },
      },
      {
        bucketStart: '2024-01-01T00:00:00.000Z',
        bucketEnd: '2025-01-01T00:00:00.000Z',
        period: { from: '2024-01-01T00:00:00.000Z', to: '2024-01-01T00:30:00.000Z' },
      },
    ])
  })

  it('preserves nanosecond half-open edges at an exact hourly boundary', async () => {
    const baseUrl = await app.getUrl()
    const getSeries = async (from: string, to: string) => {
      const query = new URLSearchParams({ from, to, granularity: 'hour' })
      const response = await fetch(new URL(`/applications/${applicationId}/analysis/series?${query}`, baseUrl))
      return { response, body: await response.json() as { points: Array<{
        bucketStart: string
        period: { from: string; to: string }
      }> } }
    }

    const beforeBoundary = await getSeries(
      '2030-01-01T00:59:59.999999999Z',
      '2030-01-01T01:00:00.000000000Z',
    )
    expect(beforeBoundary.response.status).toBe(200)
    expect(beforeBoundary.body.points).toMatchObject([{
      bucketStart: '2030-01-01T00:00:00.000Z',
      period: { from: '2030-01-01T00:59:59.999999999Z', to: '2030-01-01T01:00:00.000Z' },
    }])

    const afterBoundary = await getSeries(
      '2030-01-01T01:00:00.000000000Z',
      '2030-01-01T01:00:00.000000001Z',
    )
    expect(afterBoundary.response.status).toBe(200)
    expect(afterBoundary.body.points).toMatchObject([{
      bucketStart: '2030-01-01T01:00:00.000Z',
      period: { from: '2030-01-01T01:00:00.000Z', to: '2030-01-01T01:00:00.000000001Z' },
    }])
  })

  it('documenta parâmetros aceitos e responses no OpenAPI', async () => {
    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    type OpenApiSchema = {
      $ref?: string
      properties?: Record<string, OpenApiSchema>
      type?: string
      items?: OpenApiSchema
      oneOf?: OpenApiSchema[]
      allOf?: OpenApiSchema[]
      enum?: string[]
    }
    const document = (await response.json()) as {
      components: { schemas: Record<string, OpenApiSchema> }
      paths: Record<string, Record<string, {
        parameters: Array<{ name: string; schema: OpenApiSchema }>
        responses: Record<string, unknown>
      }>>
    }

    expect(response.status).toBe(200)
    const seriesOperation = document.paths['/applications/{id}/analysis/series'].get
    expect(seriesOperation.parameters.map(({ name }) => name)).toEqual(expect.arrayContaining(['from', 'to', 'granularity']))
    expect(seriesOperation.parameters.find(({ name }) => name === 'granularity')?.schema.enum).toEqual([
      'hour', 'day', 'month', 'year',
    ])
    expect(seriesOperation.responses).toHaveProperty('200')
    expect(seriesOperation.responses).toHaveProperty('400')
    expect(seriesOperation.responses).toHaveProperty('404')

    const contributionsOperation = document.paths['/applications/{id}/analysis/series/contributions'].get
    expect(contributionsOperation.parameters.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['from', 'to', 'granularity', 'bucketStart', 'page', 'pageSize']),
    )
    expect(contributionsOperation.parameters.find(({ name }) => name === 'pageSize')?.schema.enum).toEqual([
      '5', '10', '15', '20', 'all',
    ])
    expect(contributionsOperation.responses).toHaveProperty('200')
    expect(contributionsOperation.responses).toHaveProperty('400')
    expect(contributionsOperation.responses).toHaveProperty('404')

    const schemas = document.components.schemas
    const propertyNames = (schema: OpenApiSchema): string[] => {
      const referencedName = schema.$ref?.split('/').at(-1)
      const resolved = referencedName ? schemas[referencedName] : schema
      const names = new Set(Object.keys(resolved?.properties ?? {}))
      for (const nested of [...(resolved?.allOf ?? []), ...(resolved?.oneOf ?? [])]) {
        for (const name of propertyNames(nested)) names.add(name)
      }
      return [...names]
    }
    const contributionProperties = schemas.EnvironmentalAnalysisSeriesContributionDto.properties!
    expect(propertyNames(contributionProperties.methodology!)).toEqual(expect.arrayContaining([
      'key', 'version', 'parameters',
    ]))
    expect(propertyNames(contributionProperties.factorSnapshot!)).toEqual(expect.arrayContaining([
      'id', 'version', 'contractVersion', 'regionCode', 'country', 'region', 'city',
      'intensity', 'unit', 'queriedAt', 'source', 'validFrom', 'validUntil',
    ]))

    const exclusionProperties = schemas.EnvironmentalAnalysisSeriesExclusionDto.properties!
    for (const name of ['energyReasons', 'emissionsReasons']) {
      const itemSchema = exclusionProperties[name]!.items!
      expect(propertyNames(itemSchema)).toEqual(expect.arrayContaining(['code', 'metric']))
    }

    const eventDetails = schemas.EnvironmentalAnalysisSeriesEventDetailsDto.properties!
    for (const name of ['before', 'after']) {
      const variantProperties = eventDetails[name]!.oneOf!.flatMap(propertyNames)
      expect(variantProperties).toEqual(expect.arrayContaining([
        'state', 'reason', 'isStale', 'isCalculable', 'regionCode', 'key', 'version', 'id',
      ]))
    }
  })

  it('retorna 503 em vez de transformar uma falha de consulta em série vazia', async () => {
    await database.query('ALTER TABLE collections RENAME TO collections_series_qa_disabled')
    try {
      const seriesQuery = new URLSearchParams({
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-01T01:00:00.000Z',
        granularity: 'hour',
      })
      const contributionsQuery = new URLSearchParams({
        ...Object.fromEntries(seriesQuery),
        bucketStart: '2026-10-01T00:00:00.000Z',
      })
      const baseUrl = await app.getUrl()
      const seriesResponse = await fetch(
        new URL(`/applications/${applicationId}/analysis/series?${seriesQuery}`, baseUrl),
      )
      const contributionsResponse = await fetch(
        new URL(`/applications/${applicationId}/analysis/series/contributions?${contributionsQuery}`, baseUrl),
      )
      expect(seriesResponse.status).toBe(503)
      expect(await seriesResponse.json()).toMatchObject({ code: 'APPLICATION_ANALYSIS_UNAVAILABLE' })
      expect(contributionsResponse.status).toBe(503)
      expect(await contributionsResponse.json()).toMatchObject({ code: 'APPLICATION_ANALYSIS_UNAVAILABLE' })
    } finally {
      await database.query('ALTER TABLE collections_series_qa_disabled RENAME TO collections')
    }
  })

  it('publica os parâmetros e responses das rotas de série e contribuições no OpenAPI', async () => {
    const response = await fetch(new URL('/openapi.json', await app.getUrl()))
    const document = (await response.json()) as {
      paths: Record<string, Record<string, {
        parameters: Array<{ name: string; required?: boolean; schema: { enum?: string[]; type?: string } }>
        responses: Record<string, unknown>
      }>>
    }

    expect(response.status).toBe(200)
    const seriesOperation = document.paths['/applications/{id}/analysis/series'].get
    expect(seriesOperation.parameters.map(({ name }) => name)).toEqual(expect.arrayContaining(['from', 'to', 'granularity']))
    expect(seriesOperation.parameters.find(({ name }) => name === 'granularity')?.schema.enum).toEqual([
      'hour', 'day', 'month', 'year',
    ])
    expect(seriesOperation.responses).toHaveProperty('200')
    expect(seriesOperation.responses).toHaveProperty('400')
    expect(seriesOperation.responses).toHaveProperty('404')

    const contributionsOperation = document.paths['/applications/{id}/analysis/series/contributions'].get
    expect(contributionsOperation.parameters.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['from', 'to', 'granularity', 'bucketStart', 'page', 'pageSize']),
    )
    expect(contributionsOperation.parameters.find(({ name }) => name === 'pageSize')?.schema.enum).toEqual([
      '5', '10', '15', '20', 'all',
    ])
    expect(contributionsOperation.responses).toHaveProperty('200')
    expect(contributionsOperation.responses).toHaveProperty('400')
    expect(contributionsOperation.responses).toHaveProperty('404')
  })

  it('returns operational events and version changes against the persisted predecessor outside the requested window', async () => {
    const eventsApplicationId = `analysis-series-events-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [eventsApplicationId, 'Environmental series events test', 'AVAILABLE'],
    )
    await insertCollection(database, {
      applicationId: eventsApplicationId,
      from: '2026-09-30T23:00:00.000Z',
      to: '2026-10-01T00:00:00.000Z',
      energy: 2,
      emissions: 20,
      methodologyVersion: 'methodology-v1',
      factorVersion: 'factor-v1',
    })
    await insertCollection(database, {
      applicationId: eventsApplicationId,
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-01T01:00:00.000Z',
      energy: 4,
      emissions: 40,
      methodologyVersion: 'methodology-v2',
      factorVersion: 'factor-v2',
    })
    await insertCollection(database, {
      applicationId: eventsApplicationId,
      from: '2026-10-01T01:00:00.000Z',
      to: '2026-10-01T02:00:00.000Z',
      energy: 4,
      emissions: null,
      methodologyVersion: 'methodology-v2',
      factorVersion: null,
    })
    await database.query(
      `INSERT INTO application_events ("applicationId", kind, "occurredAt", actor, details)
       VALUES ($1, $2, $3, $4, $5), ($1, $6, $7, $4, $8), ($1, $9, $10, $4, $11),
              ($1, $12, $13, $4, $14), ($1, $15, $16, $4, $17)`,
      [
        eventsApplicationId,
        'status_changed',
        '2026-10-01T00:10:00.000Z',
        'system',
        { before: { state: 'AVAILABLE' }, after: { state: 'UNAVAILABLE' } },
        'removed',
        '2026-10-01T00:20:00.000Z',
        { before: { state: 'AVAILABLE' }, after: { state: 'REMOVED' } },
        'returned',
        '2026-10-01T00:30:00.000Z',
        { before: 'REMOVED', after: 'UNAVAILABLE' },
        'registration_changed',
        '2026-10-01T00:40:00.000Z',
        {
          before: { name: 'Old name', location: { regionCode: 'br-norte', country: 'Brazil', region: 'North', city: 'Manaus' } },
          after: { name: 'New name', location: { regionCode: 'br-sudeste', country: 'Brazil', region: 'Southeast', city: 'São Paulo' } },
        },
        'registration_changed',
        '2026-10-01T00:50:00.000Z',
        {
          before: { name: 'Old name', location: { regionCode: 'br-sudeste', country: 'Brazil', region: 'Southeast', city: 'São Paulo' } },
          after: { name: 'New name', location: { regionCode: 'br-sudeste', country: 'Brazil', region: 'Southeast', city: 'São Paulo' } },
        },
      ],
    )

    try {
      const query = new URLSearchParams({
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-01T03:00:00.000Z',
        granularity: 'hour',
      })
      const response = await fetch(
        new URL(`/applications/${eventsApplicationId}/analysis/series?${query}`, await app.getUrl()),
      )
      const body = (await response.json()) as {
        events: Array<{ id: string; at: string; type: string; details: { before?: unknown; after?: unknown } }>
      }

      expect(response.status).toBe(200)
      expect(body.events.map(({ type }) => type).sort()).toEqual([
        'factor_version_changed',
        'methodology_changed',
        'region_changed',
        'removed',
        'returned',
        'status_changed',
      ])
      expect(body.events).toEqual(expect.arrayContaining([
        expect.objectContaining({
          at: '2026-10-01T00:10:00.000000Z',
          type: 'status_changed',
          details: { before: { state: 'AVAILABLE' }, after: { state: 'UNAVAILABLE' } },
        }),
        expect.objectContaining({
          at: '2026-10-01T00:40:00.000000Z',
          type: 'region_changed',
          details: {
            before: expect.objectContaining({ regionCode: 'br-norte' }),
            after: expect.objectContaining({ regionCode: 'br-sudeste' }),
          },
        }),
        expect.objectContaining({ at: '2026-10-01T01:00:00.000000Z', type: 'methodology_changed' }),
        expect.objectContaining({ at: '2026-10-01T01:00:00.000000Z', type: 'factor_version_changed' }),
      ]))
      expect(body.events.every((event) => event.id.length > 0 && event.details.before !== undefined && event.details.after !== undefined)).toBe(true)
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [eventsApplicationId])
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [eventsApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [eventsApplicationId])
    }
  })

  it('paginates a bucket stably without changing full-bucket totals and supports every approved page size', async () => {
    const contributionsApplicationId = `analysis-series-contributions-${randomUUID()}`
    const collectionIds: string[] = []
    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [contributionsApplicationId, 'Environmental series contributions test', 'AVAILABLE'],
    )
    for (let index = 0; index < 12; index += 1) {
      const intervalStart = new Date(Date.UTC(2026, 9, 1, 0, index * 5))
      const intervalEnd = new Date(intervalStart.getTime() + 5 * 60_000)
      collectionIds.push(await insertCollection(database, {
        applicationId: contributionsApplicationId,
        from: intervalStart.toISOString(),
        to: intervalEnd.toISOString(),
        energy: index + 1,
        emissions: (index + 1) * 10,
      }))
    }

    try {
      const baseQuery = {
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-01T01:00:00.000Z',
        granularity: 'hour',
        bucketStart: '2026-10-01T00:00:00.000Z',
      }
      const fetchPage = async (pageSize?: string, page?: number) => {
        const query = new URLSearchParams(baseQuery)
        if (pageSize !== undefined) query.set('pageSize', pageSize)
        if (page !== undefined) query.set('page', String(page))
        const response = await fetch(
          new URL(`/applications/${contributionsApplicationId}/analysis/series/contributions?${query}`, await app.getUrl()),
        )
        return { response, body: await response.json() as {
          totals: { energy: { value: number }; emissions: { value: number } }
          coverage: { energy: number; emissions: number }
          pagination: { page: number; pageSize: number | 'all'; totalItems: number; totalPages: number | null; hasNextPage: boolean }
          contributions: Array<{
            collectionId: string
            countedInterval: { from: string; to: string }
            energy: { value: number; originalValue: number }
            emissions: { value: number; originalValue: number }
            durationRatio: number
          }>
        } }
      }

      const firstDefault = await fetchPage()
      const repeatedDefault = await fetchPage()
      const lastDefault = await fetchPage(undefined, 2)
      const beyondEnd = await fetchPage('5', 4)
      expect(firstDefault.response.status).toBe(200)
      expect(firstDefault.body.pagination).toEqual({
        page: 1,
        pageSize: 10,
        totalItems: 12,
        totalPages: 2,
        hasNextPage: true,
      })
      expect(lastDefault.body.pagination).toEqual({
        page: 2,
        pageSize: 10,
        totalItems: 12,
        totalPages: 2,
        hasNextPage: false,
      })
      expect(firstDefault.body.contributions.map(({ collectionId }) => collectionId)).toEqual(collectionIds.slice(0, 10))
      expect(repeatedDefault.body.contributions.map(({ collectionId }) => collectionId)).toEqual(collectionIds.slice(0, 10))
      expect(lastDefault.body.contributions.map(({ collectionId }) => collectionId)).toEqual(collectionIds.slice(10))
      expect(beyondEnd.body.contributions).toEqual([])
      expect(beyondEnd.body.pagination).toEqual({
        page: 4,
        pageSize: 5,
        totalItems: 12,
        totalPages: 3,
        hasNextPage: false,
      })

      for (const [pageSize, expectedItems, expectedPages] of [
        ['5', 5, 3],
        ['10', 10, 2],
        ['15', 12, 1],
        ['20', 12, 1],
      ] as const) {
        const page = await fetchPage(pageSize)
        expect(page.response.status).toBe(200)
        expect(page.body.pagination).toMatchObject({ pageSize: Number(pageSize), totalItems: 12, totalPages: expectedPages })
        expect(page.body.contributions).toHaveLength(expectedItems)
        expect(page.body.totals).toEqual(firstDefault.body.totals)
        expect(page.body.coverage).toEqual(firstDefault.body.coverage)
      }

      const all = await fetchPage('all')
      expect(all.response.status).toBe(200)
      expect(all.body.pagination).toEqual({ page: 1, pageSize: 'all', totalItems: 12, totalPages: 1, hasNextPage: false })
      expect(all.body.contributions).toHaveLength(12)
      expect(all.body.contributions.map(({ collectionId }) => collectionId)).toEqual(collectionIds)
      expect(all.body.contributions.map(({ countedInterval }) => countedInterval.from)).toEqual(
        [...all.body.contributions.map(({ countedInterval }) => countedInterval.from)].sort(),
      )
      expect(all.body.contributions.reduce((total, contribution) => total + contribution.energy.value, 0)).toBe(78)
      expect(all.body.contributions.reduce((total, contribution) => total + contribution.emissions.value, 0)).toBe(780)
      expect(all.body.contributions.every((contribution) =>
        contribution.energy.originalValue === contribution.energy.value &&
        contribution.emissions.originalValue === contribution.emissions.value &&
        contribution.durationRatio === 1,
      )).toBe(true)
      expect(all.body.totals).toMatchObject({ energy: { value: 78 }, emissions: { value: 780 } })
      expect(all.body.coverage).toEqual({ energy: 1, emissions: 1 })
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [contributionsApplicationId])
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [contributionsApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [contributionsApplicationId])
    }
  })

  it('reconcilia rateio original, lacunas e medida ausente nas contribuições do recorte parcial', async () => {
    const partialApplicationId = `analysis-series-partial-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [partialApplicationId, 'Environmental series partial contributions test', 'AVAILABLE'],
    )
    const firstCollectionId = await insertCollection(database, {
      applicationId: partialApplicationId,
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-01T00:10:00.000Z',
      energy: 12,
      emissions: 120,
    })
    const missingEnergyCollectionId = await insertCollection(database, {
      applicationId: partialApplicationId,
      from: '2026-10-01T00:15:00.000Z',
      to: '2026-10-01T00:20:00.000Z',
      energy: null,
      emissions: 50,
    })

    try {
      const query = new URLSearchParams({
        from: '2026-10-01T00:05:00.000Z',
        to: '2026-10-01T00:25:00.000Z',
        granularity: 'hour',
        bucketStart: '2026-10-01T00:00:00.000Z',
        pageSize: 'all',
      })
      const response = await fetch(
        new URL(`/applications/${partialApplicationId}/analysis/series/contributions?${query}`, await app.getUrl()),
      )
      const body = (await response.json()) as {
        bucket: { start: string; end: string; period: { from: string; to: string } }
        totals: { energy: { value: number | null }; emissions: { value: number | null } }
        coverage: { energy: number; emissions: number }
        contributions: Array<{
          collectionId: string
          originalInterval: { from: string; to: string }
          countedInterval: { from: string; to: string }
          energy: { originalValue: number | null; value: number | null; reasons: Array<{ code: string }> }
          emissions: { originalValue: number | null; value: number | null }
          durationRatio: number
          methodology: { version: string } | null
          factorSnapshot: { version: string } | null
        }>
        exclusions: Array<{
          collectionId: string | null
          interval: { from: string; to: string }
          energyReasons: Array<{ code: string; metric?: string }>
          emissionsReasons: Array<{ code: string; metric?: string }>
        }>
      }

      expect(response.status).toBe(200)
      expect(body.bucket).toEqual({
        start: '2026-10-01T00:00:00.000Z',
        end: '2026-10-01T01:00:00.000Z',
        period: { from: '2026-10-01T00:05:00.000Z', to: '2026-10-01T00:25:00.000Z' },
      })
      expect(body.totals).toMatchObject({ energy: { value: 6 }, emissions: { value: 110 } })
      expect(body.coverage).toEqual({ energy: 0.25, emissions: 0.5 })
      expect(body.contributions).toMatchObject([
        {
          collectionId: firstCollectionId,
          originalInterval: { from: '2026-10-01T00:00:00.000Z', to: '2026-10-01T00:10:00.000Z' },
          countedInterval: { from: '2026-10-01T00:05:00.000Z', to: '2026-10-01T00:10:00.000Z' },
          energy: { originalValue: 12, value: 6, reasons: [] },
          emissions: { originalValue: 120, value: 60, reasons: [] },
          durationRatio: 0.5,
          methodology: { version: methodology.version },
          factorSnapshot: { version: 'series-factor-v1' },
        },
        {
          collectionId: missingEnergyCollectionId,
          originalInterval: { from: '2026-10-01T00:15:00.000Z', to: '2026-10-01T00:20:00.000Z' },
          countedInterval: { from: '2026-10-01T00:15:00.000Z', to: '2026-10-01T00:20:00.000Z' },
          energy: { originalValue: null, value: null, reasons: [{ code: 'ENVIRONMENTAL_RESULT_NOT_PERSISTED' }] },
          emissions: { originalValue: 50, value: 50, reasons: [] },
          durationRatio: 1,
        },
      ])
      expect(body.exclusions.map(({ collectionId, interval }) => ({ collectionId, interval }))).toEqual([
        {
          collectionId: null,
          interval: { from: '2026-10-01T00:10:00.000Z', to: '2026-10-01T00:15:00.000Z' },
        },
        {
          collectionId: missingEnergyCollectionId,
          interval: { from: '2026-10-01T00:15:00.000Z', to: '2026-10-01T00:20:00.000Z' },
        },
        {
          collectionId: null,
          interval: { from: '2026-10-01T00:20:00.000Z', to: '2026-10-01T00:25:00.000Z' },
        },
      ])
      expect(body.exclusions[0].energyReasons).toEqual([{ code: 'NO_OBSERVATION' }])
      expect(body.exclusions[1].energyReasons).toEqual([
        { code: 'ENVIRONMENTAL_RESULT_NOT_PERSISTED', metric: 'energy' },
      ])
      expect(body.exclusions[1].emissionsReasons).toEqual([])
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [partialApplicationId])
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [partialApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [partialApplicationId])
    }
  })

  it('rejeita contexto inválido e distingue aplicação inexistente de aplicação vazia', async () => {
    const baseUrl = await app.getUrl()
    const seriesQuery = new URLSearchParams({
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-01T01:00:00.000Z',
      granularity: 'hour',
    })
    const contributionQuery = new URLSearchParams({
      ...Object.fromEntries(seriesQuery),
      bucketStart: '2026-10-01T00:00:00.000Z',
    })
    const get = async (path: string, query: URLSearchParams) => {
      const response = await fetch(new URL(`${path}?${query}`, baseUrl))
      return { response, body: await response.json() as Record<string, unknown> }
    }

    const invalidSeriesQueries = [
      new URLSearchParams({ ...Object.fromEntries(seriesQuery), from: '2026-10-01T00:00:00' }),
      new URLSearchParams({ ...Object.fromEntries(seriesQuery), granularity: 'minute' }),
    ]
    for (const query of invalidSeriesQueries) {
      const { response } = await get(`/applications/${applicationId}/analysis/series`, query)
      expect(response.status).toBe(400)
    }

    const invalidContributionQueries = [
      new URLSearchParams({ ...Object.fromEntries(contributionQuery), bucketStart: '2026-10-01T00:30:00.000Z' }),
      new URLSearchParams({ ...Object.fromEntries(contributionQuery), page: '0' }),
      new URLSearchParams({ ...Object.fromEntries(contributionQuery), page: '-1' }),
      new URLSearchParams({ ...Object.fromEntries(contributionQuery), pageSize: '6' }),
      new URLSearchParams({ ...Object.fromEntries(contributionQuery), pageSize: 'all', page: '2' }),
    ]
    for (const query of invalidContributionQueries) {
      const { response } = await get(`/applications/${applicationId}/analysis/series/contributions`, query)
      expect(response.status).toBe(400)
    }

    const missingApplicationId = `analysis-series-missing-${randomUUID()}`
    const missingSeries = await get(`/applications/${missingApplicationId}/analysis/series`, seriesQuery)
    const missingContributions = await get(`/applications/${missingApplicationId}/analysis/series/contributions`, contributionQuery)
    expect(missingSeries.response.status).toBe(404)
    expect(missingSeries.body).toMatchObject({ code: 'APPLICATION_NOT_FOUND' })
    expect(missingContributions.response.status).toBe(404)
    expect(missingContributions.body).toMatchObject({ code: 'APPLICATION_NOT_FOUND' })

    const emptyApplicationId = `analysis-series-empty-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [emptyApplicationId, 'Environmental series empty test', 'AVAILABLE'],
    )
    await database.query(
      `INSERT INTO application_events ("applicationId", kind, "occurredAt", actor, details)
       VALUES ($1, 'status_changed', '2026-10-01T00:30:00.000Z', 'system', $2)`,
      [emptyApplicationId, { before: { state: 'AVAILABLE' }, after: { state: 'UNAVAILABLE' } }],
    )
    try {
      const emptySeries = await get(`/applications/${emptyApplicationId}/analysis/series`, seriesQuery)
      const emptyContributions = await get(
        `/applications/${emptyApplicationId}/analysis/series/contributions`,
        contributionQuery,
      )
      expect(emptySeries.response.status).toBe(200)
      expect(emptySeries.body).toMatchObject({
        status: 'empty',
        points: [{ energy: { value: null }, emissions: { value: null }, coverage: { energy: 0, emissions: 0 } }],
        events: [{ type: 'status_changed', at: '2026-10-01T00:30:00.000000Z' }],
      })
      expect(emptyContributions.response.status).toBe(200)
      expect(emptyContributions.body).toMatchObject({
        pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1, hasNextPage: false },
        contributions: [],
        coverage: { energy: 0, emissions: 0 },
      })
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [emptyApplicationId])
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [emptyApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [emptyApplicationId])
    }
  })

  it('preserves snapshots for a collection with no calculated results in paginated contributions', async () => {
    const uncalculatedApplicationId = `analysis-series-uncalculated-${randomUUID()}`
    await database.query(
      `INSERT INTO applications (id, name, state) VALUES ($1, $2, $3)`,
      [uncalculatedApplicationId, 'Environmental series uncalculated contribution test', 'AVAILABLE'],
    )
    const collectionId = await insertCollection(database, {
      applicationId: uncalculatedApplicationId,
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-01T01:00:00.000Z',
      energy: null,
      emissions: null,
      methodologyVersion: 'historic-model-v7',
      factorVersion: 'historic-factor-v4',
    })

    try {
      const query = new URLSearchParams({
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-01T01:00:00.000Z',
        granularity: 'hour',
        bucketStart: '2026-10-01T00:00:00.000Z',
        pageSize: '5',
      })
      const response = await fetch(
        new URL(`/applications/${uncalculatedApplicationId}/analysis/series/contributions?${query}`, await app.getUrl()),
      )
      const body = (await response.json()) as {
        pagination: { totalItems: number }
        contributions: Array<{
          collectionId: string
          energy: { originalValue: number | null; value: number | null; reasons: Array<{ code: string; metric?: string }> }
          emissions: { originalValue: number | null; value: number | null; reasons: Array<{ code: string; metric?: string }> }
          methodology: { version: string } | null
          factorSnapshot: { id: string; version: string } | null
        }>
        exclusions: Array<{ collectionId: string | null }>
      }

      expect(response.status).toBe(200)
      expect(body.pagination.totalItems).toBe(1)
      expect(body.contributions).toHaveLength(1)
      expect(body.contributions[0]).toMatchObject({
        collectionId,
        energy: {
          originalValue: null,
          value: null,
          reasons: [{ code: 'ENVIRONMENTAL_RESULT_NOT_PERSISTED', metric: 'energy' }],
        },
        emissions: {
          originalValue: null,
          value: null,
          reasons: [{ code: 'ENVIRONMENTAL_RESULT_NOT_PERSISTED', metric: 'emissions' }],
        },
        methodology: { version: 'historic-model-v7' },
        factorSnapshot: { id: expect.any(String), version: 'historic-factor-v4' },
      })
      expect(body.exclusions.map(({ collectionId: excludedId }) => excludedId)).toEqual([collectionId])
    } finally {
      await database.query('DELETE FROM application_events WHERE "applicationId" = $1', [uncalculatedApplicationId])
      await database.query('DELETE FROM collections WHERE "applicationId" = $1', [uncalculatedApplicationId])
      await database.query('DELETE FROM applications WHERE id = $1', [uncalculatedApplicationId])
    }
  })
})
