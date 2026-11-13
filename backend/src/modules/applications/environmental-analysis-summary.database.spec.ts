import type { EnvironmentalAnalysisSummaryDto } from './environmental-analysis-summary.dto'
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
  interval: { readonly from: string; readonly to: string } = { from, to },
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
      interval.from,
      interval.to,
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

  it('returns a public series with the same scope, totals and missing intervals', async () => {
    const ids = [`scope-one-${randomUUID()}`, `scope-two-${randomUUID()}`, `scope-invalid-${randomUUID()}`]
    await insertApplication(database, ids[0], 'AVAILABLE')
    await insertApplication(database, ids[1], 'AVAILABLE')
    await insertApplication(database, ids[2], 'AVAILABLE')
    await insertObservation(database, ids[0], to, 1, 85, factorSnapshot)
    await insertObservation(database, ids[1], to, 2, null, null, [{ code: 'CARBON_FACTOR_UNAVAILABLE' }])
    await insertObservation(database, ids[2], to, Number.NaN, null, null)
    await database.query(`UPDATE collections SET "calculationEvidence" = jsonb_set("calculationEvidence", '{energy,reasons}', '[{"code":"METRIC_MISSING","metric":"cpuPercent"}]'::jsonb) WHERE "applicationId" = $1`, [ids[2]])
    try {
      const query = new URLSearchParams({ from, to: '2026-10-01T05:00:00.000Z', granularity: 'hour' })
      ids.forEach((id) => query.append('applicationIds', id))
      const response = await fetch(new URL(`/analysis/summary?${query}`, await app.getUrl()))
      expect(response.status).toBe(200)
      const body = await response.json() as EnvironmentalAnalysisSummaryDto
      expect(body.series?.points).toHaveLength(2)
      expect(body.series?.points[0]).toMatchObject({ energy: { value: 3 }, emissions: { value: 85 } })
      expect(body.series?.points[1]).toMatchObject({ energy: { value: null }, emissions: { value: null } })
      expect(body.series?.points.reduce((sum, point) => sum + (point.energy.value ?? 0), 0)).toBe(body.totals.energy.value)
      query.set('includeProvenance', 'false')
      const compactResponse = await fetch(new URL(`/analysis/summary?${query}`, await app.getUrl()))
      const compact = await compactResponse.json() as EnvironmentalAnalysisSummaryDto
      const { provenance: fullProvenance, ...readings } = body
      expect(fullProvenance.factors).toHaveLength(1)
      expect(compact).toEqual({ ...readings, provenanceIncluded: false, provenance: { methodologies: [], factors: [], reasons: [] } })
      query.set('includeProvenance', 'invalid')
      expect((await fetch(new URL(`/analysis/summary?${query}`, await app.getUrl()))).status).toBe(400)
      query.delete('includeProvenance')
      query.set('states', 'REMOVED')
      const empty = await fetch(new URL(`/analysis/summary?${query}`, await app.getUrl()))
      expect(await empty.json()).toMatchObject({ status: 'empty', series: { points: [{ energy: { value: null } }, { energy: { value: null } }] } })
      query.set('granularity', 'minute')
      const invalid = await fetch(new URL(`/analysis/summary?${query}`, await app.getUrl()))
      expect(invalid.status).toBe(400)
      query.set('granularity', 'hour')
      query.set('to', '2030-10-01T05:00:00.000Z')
      expect((await fetch(new URL(`/analysis/summary?${query}`, await app.getUrl()))).status).toBe(400)
    } finally {
      await removeApplications(database, ids)
    }
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

  it('serves a public ranking from persisted data with ties, missing observations and presentation filters', async () => {
    const ids = [
      `ranking-a-${randomUUID()}`,
      `ranking-b-${randomUUID()}`,
      `ranking-c-${randomUUID()}`,
      `ranking-historical-${randomUUID()}`,
    ]
    const paginationIds = Array.from({ length: 6 }, (_, index) => `ranking-page-${index}-${randomUUID()}`)
    await insertApplication(database, ids[0], 'AVAILABLE', 'br-sudeste')
    await insertApplication(database, ids[1], 'AVAILABLE', 'br-sudeste')
    await insertApplication(database, ids[2], 'NO_METRICS', 'br-sudeste')
    await insertApplication(database, ids[3], 'AVAILABLE', 'br-norte')
    await database.query('UPDATE applications SET name = $2 WHERE id = $1', [ids[0], 'Aplicação Árvore'])
    await database.query('UPDATE applications SET "stateReason" = $2 WHERE id = $1', [ids[2], 'NO_OBSERVATION'])
    await database.query('UPDATE applications SET city = $2 WHERE id = $1', [ids[3], 'Manaus'])
    await insertObservation(database, ids[0], to, 4, 40, factorSnapshot)
    await insertObservation(database, ids[1], to, 4, 20, factorSnapshot)
    await database.query(
      `INSERT INTO application_events ("applicationId", kind, "occurredAt", actor, details)
       VALUES ($1, 'registration_changed', $2, 'system', $3)`,
      [
        ids[3],
        '2026-10-01T03:02:00.000Z',
        {
          before: { location: { regionCode: 'br-sudeste' } },
          after: { location: { regionCode: 'br-norte' } },
        },
      ],
    )
    await insertObservation(
      database,
      ids[3],
      to,
      2,
      15,
      factorSnapshot,
      [],
      { from: '2026-10-01T03:00:30.000Z', to },
    )
    try {
      const query = new URLSearchParams({
        from,
        to,
        metric: 'energy',
        direction: 'desc',
        pageSize: 'all',
      })
      ids.slice(0, 3).forEach((id) => query.append('applicationIds', id))
      const response = await fetch(new URL(`/analysis/ranking?${query}`, await app.getUrl()))
      expect(response.status).toBe(200)
      const body = await response.json() as {
        readonly status: string
        readonly scope: { readonly applicationCount: number; readonly rankedCount: number; readonly unrankedCount: number; readonly energy: { value: number | null } }
        readonly pagination: { readonly page: number; readonly pageSize: number | string; readonly totalItems: number }
        readonly items: readonly {
          applicationId: string
          rankability: string
          position: number | null
          participation: number | null
          energy: { value: number | null }
          stateReason: string | null
        }[]
      }
      expect(body).toMatchObject({
        status: 'available',
        scope: { applicationCount: 3, rankedCount: 2, unrankedCount: 1, energy: { value: 8 } },
        pagination: { page: 1, pageSize: 'all', totalItems: 3 },
      })
      expect(body.items.slice(0, 2)).toEqual([
        expect.objectContaining({ rankability: 'ranked', position: 1, participation: 0.5, energy: expect.objectContaining({ value: 4 }) }),
        expect.objectContaining({ rankability: 'ranked', position: 1, participation: 0.5, energy: expect.objectContaining({ value: 4 }) }),
      ])
      expect(body.items[2]).toMatchObject({
        applicationId: ids[2], rankability: 'unranked', position: null, participation: null,
        energy: { value: null, reasons: [{ code: 'NO_OBSERVATION' }] },
      })
      expect(body.scope).toMatchObject({
        emissions: { value: 60 },
        coverage: { energy: 2 / 3, emissions: 2 / 3 },
      })

      query.delete('applicationIds')
      ids.forEach((id) => query.append('applicationIds', id))
      query.set('search', 'arvore')
      query.set('pageSize', '5')
      const searched = await fetch(new URL(`/analysis/ranking?${query}`, await app.getUrl()))
      expect(searched.status).toBe(200)
      expect(await searched.json()).toMatchObject({
        scope: { applicationCount: 4, energy: { value: 10 } },
        presentation: { rankedCount: 1, unrankedCount: 0 },
        pagination: { totalItems: 1 },
        items: [expect.objectContaining({ applicationId: ids[0], position: 1 })],
      })
      query.set('search', 'historical')
      const rankingGap = await fetch(new URL(`/analysis/ranking?${query}`, await app.getUrl()))
      expect(rankingGap.status).toBe(200)
      expect(await rankingGap.json()).toMatchObject({
        scope: { applicationCount: 4, energy: { value: 10 } },
        pagination: { totalItems: 1 },
        items: [expect.objectContaining({ applicationId: ids[3], position: 3, participation: 0.2 })],
      })

      query.delete('search')
      query.set('regionCodes', 'br-sudeste')
      query.delete('applicationIds')
      query.append('applicationIds', ids[3])
      const historical = await fetch(new URL(`/analysis/ranking?${query}`, await app.getUrl()))
      expect(historical.status).toBe(200)
      expect(await historical.json()).toMatchObject({
        scope: { applicationCount: 1, energy: { value: 2 }, coverage: { energy: 0.5, emissions: 0.5 } },
        items: [expect.objectContaining({ applicationId: ids[3], location: expect.objectContaining({ regionCode: 'br-norte' }) })],
      })

      const rankedIds = [ids[0], ids[1], ids[3]]
      const broadQuery = new URLSearchParams({ from, to, metric: 'energy', direction: 'desc' })
      ids.forEach((id) => broadQuery.append('applicationIds', id))
      const sortedIds = async (sortBy: string, sortDirection: 'asc' | 'desc') => {
        broadQuery.set('sortBy', sortBy)
        broadQuery.set('sortDirection', sortDirection)
        const response = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
        expect(response.status).toBe(200)
        const result = await response.json() as { readonly items: readonly { readonly applicationId: string }[] }
        return result.items.map(({ applicationId }) => applicationId)
      }
      const sortExpectations: readonly [string, 'asc' | 'desc', readonly string[]][] = [
        ['applicationId', 'asc', [ids[0], ids[1], ids[3], ids[2]]],
        ['name', 'asc', [ids[0], ids[1], ids[3], ids[2]]],
        ['state', 'asc', [ids[0], ids[1], ids[3], ids[2]]],
        ['stateReason', 'desc', [ids[0], ids[1], ids[3], ids[2]]],
        ['regionCode', 'asc', [ids[3], ids[0], ids[1], ids[2]]],
        ['country', 'desc', [ids[0], ids[1], ids[3], ids[2]]],
        ['region', 'asc', [ids[3], ids[0], ids[1], ids[2]]],
        ['city', 'desc', [ids[3], ids[0], ids[1], ids[2]]],
        ['energy', 'asc', [ids[3], ids[0], ids[1], ids[2]]],
        ['emissions', 'asc', [ids[3], ids[1], ids[0], ids[2]]],
        ['energyCoverage', 'asc', [ids[3], ids[0], ids[1], ids[2]]],
        ['emissionsCoverage', 'desc', [ids[0], ids[1], ids[3], ids[2]]],
        ['rankability', 'desc', [ids[0], ids[1], ids[3], ids[2]]],
        ['position', 'desc', [ids[3], ids[0], ids[1], ids[2]]],
        ['participation', 'asc', [ids[3], ids[0], ids[1], ids[2]]],
      ]
      for (const [sortBy, sortDirection, expected] of sortExpectations) {
        await expect(sortedIds(sortBy, sortDirection)).resolves.toEqual(expected)
      }
      broadQuery.delete('sortBy')
      broadQuery.delete('sortDirection')

      broadQuery.set('metric', 'emissions')
      broadQuery.set('direction', 'desc')
      broadQuery.delete('applicationIds')
      for (const id of rankedIds) broadQuery.append('applicationIds', id)
      const emissionsRankingResponse = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
      expect(emissionsRankingResponse.status).toBe(200)
      const emissionsRanking = await emissionsRankingResponse.json() as {
        readonly items: readonly {
          readonly applicationId: string
          readonly position: number | null
          readonly participation: number | null
          readonly energy: { readonly value: number | null }
          readonly emissions: { readonly value: number | null }
        }[]
      }
      expect(emissionsRanking.items).toEqual([
        expect.objectContaining({ applicationId: ids[0], position: 1, participation: 40 / 75, energy: expect.objectContaining({ value: 4 }), emissions: expect.objectContaining({ value: 40 }) }),
        expect.objectContaining({ applicationId: ids[1], position: 2, participation: 20 / 75, energy: expect.objectContaining({ value: 4 }), emissions: expect.objectContaining({ value: 20 }) }),
        expect.objectContaining({ applicationId: ids[3], position: 3, participation: 15 / 75, energy: expect.objectContaining({ value: 2 }), emissions: expect.objectContaining({ value: 15 }) }),
      ])
      broadQuery.delete('applicationIds')
      ids.forEach((id) => broadQuery.append('applicationIds', id))
      broadQuery.set('metric', 'energy')
      broadQuery.set('direction', 'desc')

      const filterExpectations: readonly [string, string, readonly string[]][] = [
        ['filterApplicationId', 'ranking-a', [ids[0]]],
        ['filterName', 'arvore', [ids[0]]],
        ['filterState', 'AVAILABLE', [ids[0], ids[1], ids[3]]],
        ['filterStateReason', 'NO_OBSERVATION', [ids[2]]],
        ['filterEnergyReason', 'NO_OBSERVATION', [ids[3], ids[2]]],
        ['filterEmissionsReason', 'NO_OBSERVATION', [ids[3], ids[2]]],
        ['filterRegionCode', 'br-sudeste', [ids[0], ids[1], ids[2]]],
        ['filterCountry', 'brazil', [ids[0], ids[1], ids[3], ids[2]]],
        ['filterRegion', 'norte', [ids[3]]],
        ['filterCity', 'manaus', [ids[3]]],
        ['filterRankability', 'unranked', [ids[2]]],
      ]
      for (const [name, value, expectedIds] of filterExpectations) {
        broadQuery.set(name, value)
        const response = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
        expect(response.status).toBe(200)
        const result = await response.json() as {
          readonly items: readonly { readonly applicationId: string }[]
          readonly pagination: { readonly totalItems: number }
        }
        expect(result.items.map(({ applicationId }) => applicationId)).toEqual(expectedIds)
        expect(result.pagination.totalItems).toBe(expectedIds.length)
        broadQuery.delete(name)
      }
      broadQuery.set('filterState', 'AVAILABLE')
      broadQuery.set('filterRegion', 'sudeste')
      broadQuery.set('energyMin', '4')
      const combinedFilters = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
      expect(combinedFilters.status).toBe(200)
      const combinedBody = await combinedFilters.json() as { readonly items: readonly { readonly applicationId: string }[] }
      expect(combinedBody.items.map(({ applicationId }) => applicationId)).toEqual([ids[0], ids[1]])
      broadQuery.delete('filterState')
      broadQuery.delete('filterRegion')
      broadQuery.delete('energyMin')
      const numericCases: readonly [string, string, string, readonly string[]][] = [
        ['energy', '0', '4', rankedIds],
        ['emissions', '0', '40', rankedIds],
        ['energyCoverage', '0', '1', [ids[0], ids[1], ids[3], ids[2]]],
        ['emissionsCoverage', '0', '1', [ids[0], ids[1], ids[3], ids[2]]],
        ['position', '1', '4', rankedIds],
        ['participation', '0', '1', rankedIds],
      ]
      for (const [field, min, max, expectedIds] of numericCases) {
        broadQuery.set(`${field}Min`, min)
        broadQuery.set(`${field}Max`, max)
        const bounded = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
        expect(bounded.status).toBe(200)
        const boundedBody = await bounded.json() as { readonly items: readonly { readonly applicationId: string }[] }
        expect(boundedBody.items.map(({ applicationId }) => applicationId)).toEqual(expectedIds)
        broadQuery.delete(`${field}Min`)
        broadQuery.delete(`${field}Max`)
        broadQuery.set(`${field}Missing`, 'true')
        const missing = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
        expect(missing.status).toBe(200)
        const missingBody = await missing.json() as { readonly items: readonly { readonly applicationId: string }[] }
        expect(missingBody.items.map(({ applicationId }) => applicationId)).toEqual(
          field.endsWith('Coverage') ? [] : [ids[2]],
        )
        broadQuery.set(`${field}Missing`, 'false')
        const present = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
        expect(present.status).toBe(200)
        const presentBody = await present.json() as { readonly items: readonly { readonly applicationId: string }[] }
        expect(presentBody.items.map(({ applicationId }) => applicationId)).toEqual(
          field.endsWith('Coverage') ? [ids[0], ids[1], ids[3], ids[2]] : rankedIds,
        )
        broadQuery.delete(`${field}Missing`)
      }

      broadQuery.set('pageSize', '5')
      broadQuery.set('page', '99')
      expect(await (await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))).json()).toMatchObject({ pagination: { page: 1, totalItems: 4 } })
      broadQuery.set('filterName', 'sem-resultados')
      expect(await (await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))).json()).toMatchObject({ pagination: { page: 1, totalItems: 0, totalPages: 0 } })
      broadQuery.delete('filterName')
      broadQuery.set('metric', 'emissions')
      broadQuery.set('applicationIds', ids[2])
      const emptyMetric = await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))
      expect(await emptyMetric.json()).toMatchObject({
        status: 'empty',
        scope: {
          applicationCount: 1,
          rankedCount: 0,
          unrankedCount: 1,
          emissions: { value: null },
          coverage: { emissions: 0 },
        },
        items: [expect.objectContaining({ rankability: 'unranked' })],
      })
      broadQuery.delete('applicationIds')
      ids.forEach((id) => broadQuery.append('applicationIds', id))
      broadQuery.delete('page')
      broadQuery.delete('pageSize')
      for (const pageSize of ['5', '10', '15', '20', 'all']) {
        broadQuery.set('pageSize', pageSize)
        expect((await fetch(new URL(`/analysis/ranking?${broadQuery}`, await app.getUrl()))).status).toBe(200)
      }
      broadQuery.delete('pageSize')

      query.delete('regionCodes')
      query.set('pageSize', 'all')
      query.set('page', '2')
      const invalidAllPage = await fetch(new URL(`/analysis/ranking?${query}`, await app.getUrl()))
      expect(invalidAllPage.status).toBe(400)
      query.set('page', '1')
      query.set('metric', 'unknown')
      const invalidMetric = await fetch(new URL(`/analysis/ranking?${query}`, await app.getUrl()))
      expect(invalidMetric.status).toBe(400)

      const invalidQueries = [
        { from: 'not-a-timestamp' },
        { states: 'ONLINE' },
        { regionCodes: '' },
        { sortBy: 'unsupported', sortDirection: 'asc' },
        { sortBy: 'name' },
        { sortDirection: 'asc' },
        { sortBy: 'name', sortDirection: 'sideways' },
        { filterState: 'ONLINE' },
        { filterStateReason: 'UNKNOWN_REASON' },
        { filterRankability: 'missing' },
        { energyMin: '-1' },
        { energyCoverageMax: '1.1' },
        { positionMin: '1.5' },
        { energyMin: '2', energyMax: '1' },
        { energyMissing: 'maybe' },
        { energyMissing: 'true', energyMin: '0' },
        { page: '0' },
        { pageSize: '7' },
      ]
      for (const invalid of invalidQueries) {
        const invalidQuery = new URLSearchParams({ from, to, metric: 'energy', direction: 'desc' })
        Object.entries(invalid).forEach(([key, value]) => invalidQuery.set(key, value))
        expect((await fetch(new URL(`/analysis/ranking?${invalidQuery}`, await app.getUrl()))).status).toBe(400)
      }
      const repeatedSearch = new URLSearchParams({ from, to, metric: 'energy', direction: 'desc' })
      repeatedSearch.append('search', 'one')
      repeatedSearch.append('search', 'two')
      expect((await fetch(new URL(`/analysis/ranking?${repeatedSearch}`, await app.getUrl()))).status).toBe(400)
      const missingMetric = new URLSearchParams({ from, to, direction: 'desc' })
      expect((await fetch(new URL(`/analysis/ranking?${missingMetric}`, await app.getUrl()))).status).toBe(400)

      const openapiResponse = await fetch(new URL('/openapi.json', await app.getUrl()))
      const openapi = await openapiResponse.json() as {
        paths: Record<string, { get: { parameters: Array<{ name: string; required?: boolean }> } }>
      }
      expect(openapi.paths['/analysis/ranking'].get.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'metric', required: true }),
          expect.objectContaining({ name: 'direction', required: true }),
          expect.objectContaining({ name: 'pageSize' }),
          expect.objectContaining({ name: 'search' }),
        ]),
      )

      for (const id of paginationIds) await insertApplication(database, id, 'NO_METRICS')
      const paginationQuery = new URLSearchParams({ from, to, metric: 'energy', direction: 'desc', pageSize: '5', page: '2' })
      for (const id of paginationIds) paginationQuery.append('applicationIds', id)
      const secondPage = await fetch(new URL(`/analysis/ranking?${paginationQuery}`, await app.getUrl()))
      expect(secondPage.status).toBe(200)
      expect(await secondPage.json()).toMatchObject({
        pagination: { page: 2, pageSize: 5, totalItems: 6, totalPages: 2 },
        presentation: { rankedCount: 0, unrankedCount: 6 },
        items: [expect.objectContaining({ applicationId: paginationIds[5], rankability: 'unranked' })],
      })
      paginationQuery.set('page', '99')
      const lastPage = await fetch(new URL(`/analysis/ranking?${paginationQuery}`, await app.getUrl()))
      expect(lastPage.status).toBe(200)
      expect(await lastPage.json()).toMatchObject({
        pagination: { page: 2, totalItems: 6, totalPages: 2 },
        items: [expect.objectContaining({ applicationId: paginationIds[5] })],
      })
    } finally {
      await removeApplications(database, [...ids, ...paginationIds])
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
      const rankingQuery = new URLSearchParams({ from, to, metric: 'energy', direction: 'desc', applicationIds: id })
      const rankingResponse = await fetch(
        new URL(`/analysis/ranking?${rankingQuery}`, await app.getUrl()),
      )
      expect(rankingResponse.status).toBe(503)
      expect(await rankingResponse.json()).toMatchObject({
        code: 'ANALYSIS_RANKING_UNAVAILABLE',
      })
    } finally {
      await database.query(`ALTER TABLE "${renamed}" RENAME TO collections`)
      await removeApplications(database, [id])
    }
  })
})
