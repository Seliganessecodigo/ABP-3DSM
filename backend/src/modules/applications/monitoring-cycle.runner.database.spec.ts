import { DataSource } from 'typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationEventEntity } from '../../database/entities/application-event.entity'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { MonitoringCycleEntity } from '../../database/entities/monitoring-cycle.entity'
import { CarbonRegionEntity } from '../../database/entities/carbon-region.entity'
import { CalculationConfigEntity } from '../../database/entities/calculation-config.entity'
import { RecalculationEntity } from '../../database/entities/recalculation.entity'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { InitialSchema1791240000000 } from '../../database/migrations/1791240000000-InitialSchema'
import { CompleteMonitoringPersistence1791250000000 } from '../../database/migrations/1791250000000-CompleteMonitoringPersistence'
import { AddApplicationLocation1791260000000 } from '../../database/migrations/1791260000000-AddApplicationLocation'
import { CarbonFactorSnapshots1791340000000 } from '../../database/migrations/1791340000000-CarbonFactorSnapshots'
import { DiscoverApplications1791350000000 } from '../../database/migrations/1791350000000-DiscoverApplications'
import { ApplicationOperationalStatus1791360000000 } from '../../database/migrations/1791360000000-ApplicationOperationalStatus'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { MonitoringCyclesRepository } from '../../database/repositories/monitoring-cycles.repository'
import { IntegrationError } from '../../integrations/integration-error'
import {
  MetricsAggregatorAdapter,
  ServiceSummary,
} from '../../integrations/metrics-aggregator.adapter'
import { ApplicationsRepository } from './applications.repository'
import { DiscoveryService } from './discovery.service'
import { MetadataSyncService } from './metadata-sync.service'
import { MonitoringCycleRunner } from './monitoring-cycle.runner'
import { RemovalService } from './removal.service'
import { ReturnService } from './return.service'
import { StatusClassificationService } from './status-classification.service'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeDatabase = testDatabaseUrl ? describe : describe.skip
const receivedAt = new Date('2026-10-14T12:01:00.000Z')
const service = (id: string): ServiceSummary => ({
  id: `cycle-test-${id}`,
  name: `Application ${id}`,
  location: {
    regionCode: 'br-sudeste',
    country: 'Brazil',
    region: 'Sudeste',
    city: null,
    latitude: -23.5,
    longitude: -46.6,
  },
  metricsPath: `/metrics/${id}`,
})

describeDatabase('monitoring cycle with isolated PostgreSQL', () => {
  let database: DataSource
  let runner: MonitoringCycleRunner
  let upstream: {
    fetchServices: jest.Mock<Promise<ServiceSummary[]>, []>
    fetchMetrics: jest.Mock
  }

  beforeAll(async () => {
    database = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      entities: [
        ApplicationEntity,
        ApplicationEventEntity,
        CollectionEntity,
        MonitoringCycleEntity,
        CarbonRegionEntity,
        CalculationConfigEntity,
        RecalculationEntity,
        AuditLogEntity,
        UserEntity,
      ],
      migrations: [
        InitialSchema1791240000000,
        CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000,
        CarbonFactorSnapshots1791340000000,
        DiscoverApplications1791350000000,
        ApplicationOperationalStatus1791360000000,
      ],
      synchronize: false,
    })
    await database.initialize()
    await database.runMigrations()

    const applications = new ApplicationsRepository(
      database.getRepository(ApplicationEntity),
    )
    const events = new ApplicationEventsRepository(
      database.getRepository(ApplicationEventEntity),
    )
    const cycles = new MonitoringCyclesRepository(
      database.getRepository(MonitoringCycleEntity),
    )
    const collections = new CollectionsRepository(
      database.getRepository(CollectionEntity),
    )
    upstream = {
      fetchServices: jest.fn(),
      fetchMetrics: jest.fn(),
    }
    const adapter = upstream as unknown as MetricsAggregatorAdapter
    runner = new MonitoringCycleRunner(
      adapter,
      cycles,
      new DiscoveryService(adapter, database, applications, events),
      new MetadataSyncService(adapter, database, applications, events),
      new RemovalService(adapter, database, applications, events),
      new ReturnService(adapter, database, applications, events),
      applications,
      collections,
      new StatusClassificationService(applications, events, database),
      2,
    )
  })

  beforeEach(async () => {
    await database.query('DELETE FROM collections')
    await database.query('DELETE FROM application_events')
    await database.query('DELETE FROM applications')
    await database.query('DELETE FROM monitoring_cycles')
    upstream.fetchServices.mockReset()
    upstream.fetchMetrics.mockReset()
    upstream.fetchServices.mockResolvedValue([service('a')])
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 0, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt,
    })
  })

  afterAll(async () => {
    if (database?.isInitialized) await database.destroy()
  })

  it('persists an observation idempotently and links its status event to the cycle', async () => {
    await runner.run()
    await runner.run()

    const collections = await database.getRepository(CollectionEntity).find()
    expect(collections).toHaveLength(1)
    expect(collections[0]).toMatchObject({
      applicationId: 'cycle-test-a',
      intervalStart: new Date('2026-10-14T12:00:00.000Z'),
      intervalEnd: receivedAt,
      collectedAt: receivedAt,
      metrics: {
        cpuPercent: 0,
        memoryGb: 2,
        diskGb: 3,
        networkGb: 4,
        collectionIntervalSeconds: 60,
      },
      metricUnits: {
        cpuPercent: '%',
        memoryGb: 'GB',
        diskGb: 'GB',
        networkGb: 'GB',
      },
    })
    const cycles = await database.getRepository(MonitoringCycleEntity).find({
      order: { startedAt: 'ASC' },
    })
    expect(cycles).toHaveLength(2)
    expect(cycles.map(({ persistedCount }) => persistedCount)).toEqual([1, 0])
    const statusEvents = await database
      .getRepository(ApplicationEventEntity)
      .find({
        where: { applicationId: 'cycle-test-a', kind: 'status_changed' },
      })
    expect(statusEvents).toHaveLength(1)
    expect(statusEvents[0].cycleId).toBe(cycles[0].id)
  })

  it('records a partial cycle and preserves a valid collection when one service fails', async () => {
    upstream.fetchServices.mockResolvedValue([service('a'), service('b')])
    upstream.fetchMetrics.mockImplementation(async (id: string) => {
      if (id === 'cycle-test-b') {
        throw new IntegrationError('UPSTREAM_UNAVAILABLE', 500)
      }
      return {
        collectionIntervalSeconds: 60,
        metrics: { cpuPercent: 5, memoryGb: 1, diskGb: 1, networkGb: 1 },
        receivedAt,
      }
    })

    await runner.run()

    const [cycle] = await database.getRepository(MonitoringCycleEntity).find()
    expect(cycle).toMatchObject({
      status: 'PARTIAL',
      processedCount: 2,
      failedCount: 1,
      persistedCount: 1,
      details: {
        failures: [
          { applicationId: 'cycle-test-b', errorCode: 'UPSTREAM_UNAVAILABLE' },
        ],
      },
    })
    const failedApplication = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: 'cycle-test-b' })
    expect(failedApplication).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      stateReason: ApplicationStateReason.SOURCE_ERROR,
      isStale: true,
    })
    expect(
      await database.getRepository(CollectionEntity).find({
        where: { applicationId: 'cycle-test-b' },
      }),
    ).toHaveLength(0)
  })

  it('recovers after a database write failure without storing zero or losing the next observation', async () => {
    await database.query(`
      CREATE FUNCTION fail_cycle_test_collection_write() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'forced test database failure'; END;
      $$ LANGUAGE plpgsql
    `)
    await database.query(`
      CREATE TRIGGER fail_cycle_test_collection_write
      BEFORE INSERT ON collections
      FOR EACH ROW WHEN (NEW."applicationId" = 'cycle-test-a')
      EXECUTE FUNCTION fail_cycle_test_collection_write()
    `)

    try {
      await runner.run()

      const [failedCycle] = await database
        .getRepository(MonitoringCycleEntity)
        .find()
      expect(failedCycle).toMatchObject({
        status: 'FAILED',
        processedCount: 1,
        failedCount: 1,
        persistedCount: 0,
      })
      const staleApplication = await database
        .getRepository(ApplicationEntity)
        .findOneByOrFail({ id: 'cycle-test-a' })
      expect(staleApplication).toMatchObject({
        state: ApplicationState.UNAVAILABLE,
        stateReason: ApplicationStateReason.SOURCE_ERROR,
        isStale: true,
        lastObservationAt: null,
      })
      expect(
        await database.getRepository(CollectionEntity).find(),
      ).toHaveLength(0)
    } finally {
      await database.query(
        'DROP TRIGGER IF EXISTS fail_cycle_test_collection_write ON collections',
      )
      await database.query(
        'DROP FUNCTION IF EXISTS fail_cycle_test_collection_write()',
      )
    }

    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 7, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt: new Date(receivedAt.getTime() + 60_000),
    })
    await runner.run()

    const recoveredApplication = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: 'cycle-test-a' })
    expect(recoveredApplication).toMatchObject({
      state: ApplicationState.AVAILABLE,
      isStale: false,
      lastObservationAt: new Date(receivedAt.getTime() + 60_000),
    })
    expect(await database.getRepository(CollectionEntity).find()).toHaveLength(
      1,
    )
    const cycles = await database.getRepository(MonitoringCycleEntity).find({
      order: { startedAt: 'ASC' },
    })
    expect(cycles.map(({ status }) => status)).toEqual(['FAILED', 'SUCCEEDED'])
  })

  it('discovers, removes, and returns an application through successive cycles', async () => {
    await runner.run()
    upstream.fetchServices.mockResolvedValue([])
    await runner.run()
    const removed = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: 'cycle-test-a' })
    expect(removed.state).toBe(ApplicationState.REMOVED)

    upstream.fetchServices.mockResolvedValue([service('a')])
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 3, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt: new Date(receivedAt.getTime() + 60_000),
    })
    await runner.run()

    const returned = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: 'cycle-test-a' })
    expect(returned).toMatchObject({
      state: ApplicationState.AVAILABLE,
      removedAt: null,
      isStale: false,
    })
    expect(
      (
        await database
          .getRepository(ApplicationEventEntity)
          .find({ where: { applicationId: 'cycle-test-a' } })
      ).map(({ kind }) => kind).sort(),
    ).toEqual([
      'discovered',
      'removed',
      'returned',
      'status_changed',
      'status_changed',
    ])
    expect(
      await database.getRepository(CollectionEntity).find({
        where: { applicationId: 'cycle-test-a' },
      }),
    ).toHaveLength(2)
  })

  it('does not confirm removal if the services snapshot is invalid', async () => {
    const [known] = await database.query(
      'INSERT INTO applications (id, name, state, "firstSeenAt", "lastCheckedAt", "isStale", "isCalculable") VALUES ($1, $2, $3, now(), now(), false, false) RETURNING id',
      ['cycle-test-existing', 'Known application', ApplicationState.AVAILABLE],
    )
    expect(known.id).toBe('cycle-test-existing')
    upstream.fetchServices.mockRejectedValue(
      new IntegrationError('INVALID_UPSTREAM_RESPONSE'),
    )

    await expect(runner.run()).rejects.toBeInstanceOf(IntegrationError)

    const application = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: 'cycle-test-existing' })
    expect(application.state).toBe(ApplicationState.AVAILABLE)
    const [cycle] = await database.getRepository(MonitoringCycleEntity).find()
    expect(cycle).toMatchObject({ status: 'FAILED', failedCount: 1 })
  })
})
