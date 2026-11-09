import { randomUUID } from 'node:crypto'
import { createQualityFixture, type QualityFixture } from '../../../test/quality-fixture'
import { type ServiceSummary } from '../../integrations/metrics-aggregator.adapter'
import { DiscoveryService } from './discovery.service'

const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip

describeDatabase('batch discovery with PostgreSQL', () => {
  let fixture: QualityFixture
  let logQuery: jest.SpyInstance
  let snapshot: ServiceSummary[]
  let cycleId: string

  beforeAll(async () => {
    fixture = await createQualityFixture()
    logQuery = jest.spyOn(fixture.database.logger, 'logQuery')
  })

  afterAll(async () => {
    logQuery?.mockRestore()
    await fixture?.close()
  })

  beforeEach(async () => {
    const prefix = randomUUID()
    snapshot = Array.from({ length: 1_001 }, (_, index) => ({
      id: `${prefix}-${index.toString().padStart(4, '0')}`,
      name: `Service ${index}`,
      metricsPath: `/metrics/${index}`,
      location: {
        regionCode: 'br-sudeste', country: 'Brazil', region: 'Sudeste',
        city: null, latitude: -23.5, longitude: -46.6,
      },
    }))
    const [cycle] = await fixture.database.query<{ id: string }[]>(
      'INSERT INTO monitoring_cycles ("startedAt") VALUES (now()) RETURNING id',
    )
    cycleId = cycle.id
    logQuery.mockClear()
  })

  function insertsInto(table: string): string[] {
    return logQuery.mock.calls
      .map(([query]) => query as string)
      .filter((query) => query.startsWith(`INSERT INTO "${table}"`))
  }

  async function counts() {
    const ids = snapshot.map(({ id }) => id)
    const [counts] = await fixture.database.query<{
      applications: number; events: number
    }[]>(
      `SELECT
        (SELECT count(*)::int FROM applications WHERE id = ANY($1::text[])) AS applications,
        (SELECT count(*)::int FROM application_events
          WHERE "applicationId" = ANY($1::text[]) AND kind = 'discovered') AS events`,
      [ids],
    )
    return counts
  }

  it('inserts over one batch and makes a stable catalog cost two inserts with no new events', async () => {
    const discovery = fixture.app.get(DiscoveryService)
    await expect(discovery.discover(cycleId, snapshot)).resolves.toBe(1_001)
    expect(insertsInto('applications')).toHaveLength(2)
    expect(insertsInto('application_events')).toHaveLength(2)
    await expect(counts()).resolves.toEqual({ applications: 1_001, events: 1_001 })
    logQuery.mockClear()

    await expect(discovery.discover(cycleId, snapshot)).resolves.toBe(0)
    expect(insertsInto('applications')).toHaveLength(2)
    expect(insertsInto('application_events')).toHaveLength(0)
    await expect(counts()).resolves.toEqual({ applications: 1_001, events: 1_001 })
  })

  it('preserves the first duplicate and the metadata of an existing identity', async () => {
    const first = snapshot[0]
    snapshot = [first, { ...first, name: 'Duplicate name' }]
    const discovery = fixture.app.get(DiscoveryService)
    await expect(discovery.discover(cycleId, snapshot)).resolves.toBe(1)
    await expect(discovery.discover(cycleId, [{ ...first, name: 'Later name' }])).resolves.toBe(0)
    const [application] = await fixture.database.query<{ name: string }[]>(
      'SELECT name FROM applications WHERE id = $1', [first.id],
    )
    expect(application.name).toBe(first.name)
    await expect(counts()).resolves.toEqual({ applications: 1, events: 1 })
  })

  it('handles concurrent snapshots in opposite order without duplicate events or deadlock', async () => {
    const prefix = randomUUID()
    snapshot[0] = { ...snapshot[0], id: `${prefix}-\u00e9` }
    snapshot[1] = { ...snapshot[1], id: `${prefix}-e\u0301` }
    const discovery = fixture.app.get(DiscoveryService)
    const results = await Promise.all([
      discovery.discover(cycleId, snapshot),
      discovery.discover(cycleId, [...snapshot].reverse()),
    ])
    expect(results.sort((left, right) => left - right)).toEqual([0, 1_001])
    await expect(counts()).resolves.toEqual({ applications: 1_001, events: 1_001 })
  })

  it('rolls back all application batches when an event cannot reference its cycle', async () => {
    await expect(fixture.app.get(DiscoveryService).discover(randomUUID(), snapshot)).rejects.toThrow()
    expect(insertsInto('applications')).toHaveLength(2)
    await expect(counts()).resolves.toEqual({ applications: 0, events: 0 })
  })

  it('does not insert anything for an empty validated snapshot', async () => {
    await expect(fixture.app.get(DiscoveryService).discover(cycleId, [])).resolves.toBe(0)
    expect(insertsInto('applications')).toHaveLength(0)
    expect(insertsInto('application_events')).toHaveLength(0)
  })
})
