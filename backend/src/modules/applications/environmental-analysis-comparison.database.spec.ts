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
const middle = '2026-10-01T03:00:30.000Z'
const to = '2026-10-01T03:01:00.000Z'

async function insertApplication(
  database: DataSource,
  id: string,
  location: {
    readonly regionCode: string
    readonly country: string
    readonly region: string
    readonly city: string | null
    readonly latitude: number
    readonly longitude: number
  },
): Promise<void> {
  await database.query(
    `INSERT INTO applications (
      id, name, state, "firstSeenAt", "regionCode", country, region, city, latitude, longitude
    ) VALUES ($1, $1, 'AVAILABLE', $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      from,
      location.regionCode,
      location.country,
      location.region,
      location.city,
      location.latitude,
      location.longitude,
    ],
  )
}

async function insertObservation(
  database: DataSource,
  applicationId: string,
  collectedAt: string,
  intervalStart: string,
  intervalEnd: string,
  metrics: Record<string, unknown>,
  metricUnits: Record<string, string>,
  energyKwh: number,
  carbonGrams: number | null,
): Promise<void> {
  await database.query(
    `INSERT INTO collections (
      "applicationId", "intervalStart", "intervalEnd", "collectedAt", metrics,
      "metricUnits", state, "energyKwh", "carbonGrams", coverage, "calculationEvidence"
    ) VALUES ($1, $2, $3, $4, $5, $6, 'AVAILABLE', $7, $8, 1, $9)`,
    [
      applicationId,
      intervalStart,
      intervalEnd,
      collectedAt,
      metrics,
      metricUnits,
      energyKwh,
      carbonGrams,
      {
        version: 1,
        energy: {
          modelKey: 'simplified-energy',
          modelVersion: '1',
          modelParameters: {},
          reasons: [],
        },
        carbon: {
          factorSnapshot: null,
          reasons:
            carbonGrams === null ? [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] : [],
        },
      },
    ],
  )
}

async function removeApplications(
  database: DataSource,
  ids: readonly string[],
): Promise<void> {
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

async function changeLocation(
  database: DataSource,
  applicationId: string,
): Promise<void> {
  await database.query(
    `UPDATE applications
       SET "regionCode" = 'br-norte', country = 'Brazil', region = 'Norte',
           city = 'Manaus', latitude = -3.1, longitude = -60
     WHERE id = $1`,
    [applicationId],
  )
  await database.query(
    `INSERT INTO application_events (
      "applicationId", kind, "occurredAt", actor, details
    ) VALUES ($1, 'registration_changed', $2, 'system', $3)`,
    [
      applicationId,
      middle,
      {
        before: {
          location: {
            regionCode: 'br-sudeste',
            country: 'Brazil',
            region: 'Sudeste',
            city: null,
            latitude: -23.5,
            longitude: -46.6,
          },
        },
        after: {
          location: {
            regionCode: 'br-norte',
            country: 'Brazil',
            region: 'Norte',
            city: 'Manaus',
            latitude: -3.1,
            longitude: -60,
          },
        },
      },
    ],
  )
}

describeWithDatabase('GET /analysis/comparison com PostgreSQL', () => {
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

  it('compares persisted measures against the explicit reference', async () => {
    const ids = [`comparison-a-${randomUUID()}`, `comparison-b-${randomUUID()}`]
    await insertApplication(database, ids[0], {
      regionCode: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      latitude: -23.5,
      longitude: -46.6,
    })
    await insertApplication(database, ids[1], {
      regionCode: 'br-sudeste',
      country: 'Brazil',
      region: 'Sudeste',
      city: null,
      latitude: -23.5,
      longitude: -46.6,
    })
    await changeLocation(database, ids[1])
    await insertObservation(
      database,
      ids[0],
      '2026-10-01T03:00:10.000Z',
      from,
      middle,
      { cpuPercent: 10, memoryGb: 1 },
      { cpuPercent: '%', memoryGb: 'GB' },
      1,
      0,
    )
    await insertObservation(
      database,
      ids[0],
      '2026-10-01T03:00:20.000Z',
      middle,
      to,
      { cpuPercent: null, memoryGb: 2 },
      { cpuPercent: '%', memoryGb: 'GB' },
      1,
      null,
    )
    await insertObservation(
      database,
      ids[1],
      '2026-10-01T03:00:20.000Z',
      from,
      to,
      { cpuPercent: 20, memoryGb: 4 },
      { cpuPercent: 'percent', memoryGb: 'GB' },
      4,
      20,
    )
    const query = new URLSearchParams({
      from: '2026-10-01T00:00:00-03:00',
      to: '2026-10-01T00:01:00-03:00',
      referenceApplicationId: ids[1],
    })
    ids.forEach((id) => query.append('applicationIds', id))

    try {
      const response = await fetch(
        new URL(`/analysis/comparison?${query}`, await app.getUrl()),
      )
      expect(response.status).toBe(200)
      const body = (await response.json()) as {
        readonly referenceApplicationId: string
        readonly status: string
        readonly period: { readonly from: string; readonly to: string }
        readonly applications: readonly Record<string, unknown>[]
      }
      expect(body.referenceApplicationId).toBe(ids[1])
      expect(body.status).toBe('partial')
      expect(body.period).toEqual({ from, to })
      expect(body.applications).toHaveLength(2)
      expect(body.applications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            applicationId: ids[0],
            energy: expect.objectContaining({ value: 2, unit: 'kWh' }),
            emissions: expect.objectContaining({ value: 0, unit: 'gCO2e' }),
            differences: {
              energy: {
                absolute: -2,
                unit: 'kWh',
                percentage: -50,
                reason: null,
              },
              emissions: {
                absolute: -20,
                unit: 'gCO2e',
                percentage: -100,
                reason: null,
              },
              metrics: expect.any(Object),
              coverage: {
                energyPercentagePoints: 0,
                emissionsPercentagePoints: -50,
              },
            },
            metrics: expect.objectContaining({
              cpu: expect.objectContaining({
                value: 10,
                unit: '%',
                collectedAt: '2026-10-01T03:00:10.000000Z',
              }),
              memory: expect.objectContaining({
                value: 2,
                unit: 'GB',
                collectedAt: '2026-10-01T03:00:20.000000Z',
              }),
            }),
          }),
          expect.objectContaining({
            applicationId: ids[1],
            energy: expect.objectContaining({ value: 4, unit: 'kWh' }),
            emissions: expect.objectContaining({ value: 20, unit: 'gCO2e' }),
            locations: [
              {
                from,
                to: middle,
                location: {
                  regionCode: 'br-sudeste',
                  country: 'Brazil',
                  region: 'Sudeste',
                  city: null,
                  latitude: -23.5,
                  longitude: -46.6,
                },
                reasons: [],
              },
              {
                from: middle,
                to,
                location: {
                  regionCode: 'br-norte',
                  country: 'Brazil',
                  region: 'Norte',
                  city: 'Manaus',
                  latitude: -3.1,
                  longitude: -60,
                },
                reasons: [],
              },
            ],
          }),
        ]),
      )
      expect(
        body.applications.find(
          (application) => application.applicationId === ids[0],
        ),
      ).toMatchObject({
        differences: {
          metrics: {
            cpu: {
              absolute: null,
              percentage: null,
              reason: 'INCOMPATIBLE_UNIT',
            },
          },
        },
      })
      expect(
        body.applications.find(
          (application) => application.applicationId === ids[0],
        ),
      ).toMatchObject({
        locations: [
          {
            from,
            to,
            location: {
              regionCode: 'br-sudeste',
              country: 'Brazil',
              region: 'Sudeste',
              city: null,
            },
          },
        ],
      })
      const reference = body.applications.find(
        (application) => application.applicationId === ids[1],
      ) as Record<string, unknown>
      expect(reference).toMatchObject({
        differences: {
          energy: { absolute: 0, percentage: 0 },
          emissions: { absolute: 0, percentage: 0 },
        },
      })
    } finally {
      await removeApplications(database, ids)
    }
  })

  it('does not calculate a percentage against a zero reference', async () => {
    const ids = [
      `comparison-zero-${randomUUID()}`,
      `comparison-value-${randomUUID()}`,
    ]
    for (const id of ids) {
      await insertApplication(database, id, {
        regionCode: 'br-sudeste',
        country: 'Brazil',
        region: 'Sudeste',
        city: null,
        latitude: -23.5,
        longitude: -46.6,
      })
    }
    await insertObservation(
      database,
      ids[0],
      '2026-10-01T03:00:20.000Z',
      from,
      to,
      { cpuPercent: 0 },
      { cpuPercent: '%' },
      0,
      0,
    )
    await insertObservation(
      database,
      ids[1],
      '2026-10-01T03:00:20.000Z',
      from,
      to,
      { cpuPercent: 10 },
      { cpuPercent: '%' },
      2,
      20,
    )
    const query = new URLSearchParams({
      from,
      to,
      referenceApplicationId: ids[0],
    })
    ids.forEach((id) => query.append('applicationIds', id))

    try {
      const response = await fetch(
        new URL(`/analysis/comparison?${query}`, await app.getUrl()),
      )
      const body = (await response.json()) as {
        readonly applications: readonly Record<string, unknown>[]
      }
      expect(response.status).toBe(200)
      expect(body.applications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            applicationId: ids[1],
            differences: expect.objectContaining({
              energy: {
                absolute: 2,
                unit: 'kWh',
                percentage: null,
                reason: 'ZERO_REFERENCE',
              },
              emissions: {
                absolute: 20,
                unit: 'gCO2e',
                percentage: null,
                reason: 'ZERO_REFERENCE',
              },
              metrics: expect.objectContaining({
                cpu: {
                  absolute: 10,
                  unit: '%',
                  percentage: null,
                  reason: 'ZERO_REFERENCE',
                },
              }),
            }),
          }),
        ]),
      )
    } finally {
      await removeApplications(database, ids)
    }
  })

  it('rejects duplicate selections, references outside selection, and invalid periods', async () => {
    const duplicate = new URLSearchParams({
      from,
      to,
      referenceApplicationId: 'application-a',
      applicationIds: 'application-a',
    })
    duplicate.append('applicationIds', 'application-a')
    const duplicateResponse = await fetch(
      new URL(`/analysis/comparison?${duplicate}`, await app.getUrl()),
    )
    expect(duplicateResponse.status).toBe(400)
    expect(await duplicateResponse.json()).toMatchObject({
      code: 'INVALID_ANALYSIS_APPLICATION_SELECTION',
    })

    const invalidReference = new URLSearchParams({
      from,
      to,
      referenceApplicationId: 'not-selected',
      applicationIds: 'application-a',
    })
    invalidReference.append('applicationIds', 'application-b')
    const referenceResponse = await fetch(
      new URL(`/analysis/comparison?${invalidReference}`, await app.getUrl()),
    )
    expect(referenceResponse.status).toBe(400)
    expect(await referenceResponse.json()).toMatchObject({
      code: 'INVALID_ANALYSIS_REFERENCE_APPLICATION',
    })

    const invalidPeriod = new URLSearchParams({
      from,
      to: from,
      referenceApplicationId: 'application-a',
      applicationIds: 'application-a',
    })
    invalidPeriod.append('applicationIds', 'application-b')
    const periodResponse = await fetch(
      new URL(`/analysis/comparison?${invalidPeriod}`, await app.getUrl()),
    )
    expect(periodResponse.status).toBe(400)
    expect(await periodResponse.json()).toMatchObject({
      code: 'INVALID_ANALYSIS_PERIOD',
    })

    const missingTimezone = new URLSearchParams({
      from: '2026-10-01T03:00:00',
      to: '2026-10-01T03:01:00',
      referenceApplicationId: 'application-a',
      applicationIds: 'application-a',
    })
    missingTimezone.append('applicationIds', 'application-b')
    const timezoneResponse = await fetch(
      new URL(`/analysis/comparison?${missingTimezone}`, await app.getUrl()),
    )
    expect(timezoneResponse.status).toBe(400)

    const tooFew = new URLSearchParams({
      from,
      to,
      referenceApplicationId: 'application-a',
      applicationIds: 'application-a',
    })
    expect(
      (
        await fetch(
          new URL(`/analysis/comparison?${tooFew}`, await app.getUrl()),
        )
      ).status,
    ).toBe(400)

    const tooMany = new URLSearchParams({
      from,
      to,
      referenceApplicationId: 'application-a',
    })
    for (let index = 0; index < 6; index++) {
      tooMany.append('applicationIds', `application-${index}`)
    }
    expect(
      (
        await fetch(
          new URL(`/analysis/comparison?${tooMany}`, await app.getUrl()),
        )
      ).status,
    ).toBe(400)

    const missingApplications = new URLSearchParams({
      from,
      to,
      referenceApplicationId: 'missing-a',
      applicationIds: 'missing-a',
    })
    missingApplications.append('applicationIds', 'missing-b')
    const missingResponse = await fetch(
      new URL(
        `/analysis/comparison?${missingApplications}`,
        await app.getUrl(),
      ),
    )
    expect(missingResponse.status).toBe(404)
    expect(await missingResponse.json()).toMatchObject({
      code: 'APPLICATION_NOT_FOUND',
    })
  })

  it('returns an empty comparison without replacing absent values with zero', async () => {
    const ids = [
      `comparison-empty-a-${randomUUID()}`,
      `comparison-empty-b-${randomUUID()}`,
    ]
    for (const id of ids) {
      await insertApplication(database, id, {
        regionCode: 'br-sudeste',
        country: 'Brazil',
        region: 'Sudeste',
        city: null,
        latitude: -23.5,
        longitude: -46.6,
      })
    }
    const query = new URLSearchParams({
      from,
      to,
      referenceApplicationId: ids[0],
    })
    ids.forEach((id) => query.append('applicationIds', id))

    try {
      const response = await fetch(
        new URL(`/analysis/comparison?${query}`, await app.getUrl()),
      )
      const body = (await response.json()) as {
        readonly status: string
        readonly applications: readonly Record<string, unknown>[]
      }
      expect(response.status).toBe(200)
      expect(body.status).toBe('empty')
      expect(body.applications).toHaveLength(2)
      expect(body.applications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            energy: expect.objectContaining({ value: null }),
            emissions: expect.objectContaining({ value: null }),
            metrics: expect.objectContaining({
              cpu: expect.objectContaining({
                value: null,
                status: 'missing',
              }),
            }),
          }),
        ]),
      )
    } finally {
      await removeApplications(database, ids)
    }
  })

  it('marks a comparison complete when all values and coverage are available', async () => {
    const ids = Array.from(
      { length: 5 },
      () => `comparison-complete-${randomUUID()}`,
    )
    for (const id of ids) {
      await insertApplication(database, id, {
        regionCode: 'br-sudeste',
        country: 'Brazil',
        region: 'Sudeste',
        city: null,
        latitude: -23.5,
        longitude: -46.6,
      })
      await insertObservation(
        database,
        id,
        '2026-10-01T03:00:20.000Z',
        from,
        to,
        { cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 },
        {
          cpuPercent: '%',
          memoryGb: 'GB',
          diskGb: 'GB',
          networkGb: 'GB',
        },
        0,
        0,
      )
    }
    const query = new URLSearchParams({
      from,
      to,
      referenceApplicationId: ids[0],
    })
    ids.forEach((id) => query.append('applicationIds', id))

    try {
      const response = await fetch(
        new URL(`/analysis/comparison?${query}`, await app.getUrl()),
      )
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        status: 'complete',
        applications: expect.arrayContaining([
          expect.objectContaining({
            energy: expect.objectContaining({ value: 0 }),
            emissions: expect.objectContaining({ value: 0 }),
            coverage: { energy: 1, emissions: 1 },
            metrics: {
              cpu: expect.objectContaining({ value: 0, status: 'available' }),
              memory: expect.objectContaining({
                value: 0,
                status: 'available',
              }),
              disk: expect.objectContaining({ value: 0, status: 'available' }),
              network: expect.objectContaining({
                value: 0,
                status: 'available',
              }),
            },
          }),
        ]),
      })
    } finally {
      await removeApplications(database, ids)
    }
  })

  it('returns a structured 503 when comparison data cannot be read', async () => {
    const ids = [
      `comparison-unavailable-a-${randomUUID()}`,
      `comparison-unavailable-b-${randomUUID()}`,
    ]
    for (const id of ids) {
      await insertApplication(database, id, {
        regionCode: 'br-sudeste',
        country: 'Brazil',
        region: 'Sudeste',
        city: null,
        latitude: -23.5,
        longitude: -46.6,
      })
    }
    const renamed = `comparison_collections_${randomUUID().replaceAll('-', '')}`
    await database.query(`ALTER TABLE collections RENAME TO "${renamed}"`)
    const query = new URLSearchParams({
      from,
      to,
      referenceApplicationId: ids[0],
    })
    ids.forEach((id) => query.append('applicationIds', id))

    try {
      const response = await fetch(
        new URL(`/analysis/comparison?${query}`, await app.getUrl()),
      )
      expect(response.status).toBe(503)
      expect(await response.json()).toMatchObject({
        code: 'ANALYSIS_COMPARISON_UNAVAILABLE',
      })
    } finally {
      await database.query(`ALTER TABLE "${renamed}" RENAME TO collections`)
      await removeApplications(database, ids)
    }
  })
})
