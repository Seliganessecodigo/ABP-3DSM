import { DataSource } from "typeorm";
import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationEventEntity } from "../../database/entities/application-event.entity";
import { CollectionEntity } from "../../database/entities/collection.entity";
import { MonitoringCycleEntity } from "../../database/entities/monitoring-cycle.entity";
import { CarbonRegionEntity } from "../../database/entities/carbon-region.entity";
import { CalculationConfigEntity } from "../../database/entities/calculation-config.entity";
import { RecalculationEntity } from "../../database/entities/recalculation.entity";
import { AuditLogEntity } from "../../database/entities/audit-log.entity";
import { MonitoringIncidentEntity } from "../../database/entities/monitoring-incident.entity";
import { UserEntity } from "../../database/entities/user.entity";
import { OrganizationEntity } from "../../database/entities/organization.entity";
import { InitialSchema1791240000000 } from "../../database/migrations/1791240000000-InitialSchema";
import { CompleteMonitoringPersistence1791250000000 } from "../../database/migrations/1791250000000-CompleteMonitoringPersistence";
import { AddApplicationLocation1791260000000 } from "../../database/migrations/1791260000000-AddApplicationLocation";
import { CarbonFactorSnapshots1791340000000 } from "../../database/migrations/1791340000000-CarbonFactorSnapshots";
import { DiscoverApplications1791350000000 } from "../../database/migrations/1791350000000-DiscoverApplications";
import { ApplicationOperationalStatus1791360000000 } from "../../database/migrations/1791360000000-ApplicationOperationalStatus";
import { MonitoringIncidents1791370000000 } from "../../database/migrations/1791370000000-MonitoringIncidents";
import { CollectionCalculationEvidence1791380000000 } from "../../database/migrations/1791380000000-CollectionCalculationEvidence";
import { ApplicationState } from "../../database/entities/application-state";
import { ApplicationStateReason } from "../../database/entities/application-state-reason";
import { ApplicationEventsRepository } from "../../database/repositories/application-events.repository";
import { CollectionsRepository } from "../../database/repositories/collections.repository";
import { MonitoringCyclesRepository } from "../../database/repositories/monitoring-cycles.repository";
import { IntegrationError } from "../../integrations/integration-error";
import {
  MetricsAggregatorAdapter,
  ServiceSummary,
} from "../../integrations/metrics-aggregator.adapter";
import { ApplicationsRepository } from "./applications.repository";
import { DiscoveryService } from "./discovery.service";
import { MetadataSyncService } from "./metadata-sync.service";
import { MonitoringCycleRunner } from "./monitoring-cycle.runner";
import { RemovalService } from "./removal.service";
import { ReturnService } from "./return.service";
import { StatusClassificationService } from "./status-classification.service";
import { MonitoringIncidentsRepository } from "../../database/repositories/monitoring-incidents.repository";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { CarbonFactorService } from "../../integrations/carbon-factor.service";
import { CarbonRegionsRepository } from "../../database/repositories/carbon-regions.repository";
import { CarbonIntensityAdapter } from "../../integrations/carbon-intensity.adapter";
import { MonitoringCycleLock } from "./monitoring-cycle.lock";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = testDatabaseUrl ? describe : describe.skip;
const receivedAt = new Date("2026-10-14T12:01:00.000Z");
const service = (id: string): ServiceSummary => ({
  id: `cycle-test-${id}`,
  name: `Application ${id}`,
  location: {
    regionCode: "br-sudeste",
    country: "Brazil",
    region: "Sudeste",
    city: null,
    latitude: -23.5,
    longitude: -46.6,
  },
  metricsPath: `/metrics/${id}`,
});

describeDatabase("monitoring cycle with isolated PostgreSQL", () => {
  let database: DataSource;
  let runner: MonitoringCycleRunner;
  let collectionStore: CollectionsRepository;
  let carbonIntensity: { fetchIntensity: jest.Mock };
  let upstream: {
    fetchServices: jest.Mock<Promise<ServiceSummary[]>, []>;
    fetchMetrics: jest.Mock;
  };

  beforeAll(async () => {
    database = new DataSource({
      type: "postgres",
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
        OrganizationEntity,
        MonitoringIncidentEntity,
      ],
      migrations: [
        InitialSchema1791240000000,
        CompleteMonitoringPersistence1791250000000,
        AddApplicationLocation1791260000000,
        CarbonFactorSnapshots1791340000000,
        DiscoverApplications1791350000000,
        ApplicationOperationalStatus1791360000000,
        MonitoringIncidents1791370000000,
        CollectionCalculationEvidence1791380000000,
      ],
      synchronize: false,
    });
    await database.initialize();
    await database.runMigrations();

    const applications = new ApplicationsRepository(
      database.getRepository(ApplicationEntity),
    );
    const events = new ApplicationEventsRepository(
      database.getRepository(ApplicationEventEntity),
    );
    const cycles = new MonitoringCyclesRepository(
      database.getRepository(MonitoringCycleEntity),
    );
    collectionStore = new CollectionsRepository(
      database.getRepository(CollectionEntity),
    );
    carbonIntensity = {
      fetchIntensity: jest.fn().mockResolvedValue({
        regionCode: "br-sudeste",
        country: "Brazil",
        region: "Sudeste",
        city: null,
        intensity: 85,
        unit: "gCO2e/kWh",
        renewableSharePercent: 80,
        queriedAt: receivedAt,
      }),
    };
    upstream = {
      fetchServices: jest.fn(),
      fetchMetrics: jest.fn(),
    };
    const adapter = upstream as unknown as MetricsAggregatorAdapter;
    runner = new MonitoringCycleRunner(
      adapter,
      cycles,
      new DiscoveryService(adapter, database, applications, events),
      new MetadataSyncService(adapter, database, applications, events),
      new RemovalService(adapter, database, applications, events),
      new ReturnService(adapter, database, applications, events),
      applications,
      collectionStore,
      new StatusClassificationService(applications, events, database),
      2,
      new MonitoringIncidentsService(
        new MonitoringIncidentsRepository(
          database.getRepository(MonitoringIncidentEntity),
        ),
      ),
      new CarbonFactorService(
        carbonIntensity as unknown as CarbonIntensityAdapter,
        new CarbonRegionsRepository(database.getRepository(CarbonRegionEntity)),
      ),
      new MonitoringCycleLock(),
    );
  });

  beforeEach(async () => {
    await database.query("DELETE FROM collections");
    await database.query("DELETE FROM application_events");
    await database.query("DELETE FROM applications");
    await database.query("DELETE FROM monitoring_incidents");
    await database.query("DELETE FROM monitoring_cycles");
    await database.query(
      `DELETE FROM carbon_regions WHERE code = 'br-sudeste'`,
    );
    upstream.fetchServices.mockReset();
    upstream.fetchMetrics.mockReset();
    upstream.fetchServices.mockResolvedValue([service("a")]);
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 0, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt,
    });
    carbonIntensity.fetchIntensity.mockResolvedValue({
      regionCode: "br-sudeste",
      country: "Brazil",
      region: "Sudeste",
      city: null,
      intensity: 85,
      unit: "gCO2e/kWh",
      renewableSharePercent: 80,
      queriedAt: receivedAt,
    });
  });

  afterAll(async () => {
    if (database?.isInitialized) await database.destroy();
  });

  it("persists an observation idempotently and links its status event to the cycle", async () => {
    await runner.run();
    await runner.run();

    const collections = await database.getRepository(CollectionEntity).find();
    expect(collections).toHaveLength(1);
    expect(collections[0]).toMatchObject({
      applicationId: "cycle-test-a",
      intervalStart: new Date("2026-10-14T12:00:00.000Z"),
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
        cpuPercent: "%",
        memoryGb: "GB",
        diskGb: "GB",
        networkGb: "GB",
      },
    });
    const cycles = await database.getRepository(MonitoringCycleEntity).find({
      order: { startedAt: "ASC" },
    });
    expect(cycles).toHaveLength(2);
    expect(cycles.map(({ persistedCount }) => persistedCount)).toEqual([1, 0]);
    const statusEvents = await database
      .getRepository(ApplicationEventEntity)
      .find({
        where: { applicationId: "cycle-test-a", kind: "status_changed" },
      });
    expect(statusEvents).toHaveLength(1);
    expect(statusEvents[0].cycleId).toBe(cycles[0].id);
    expect(carbonIntensity.fetchIntensity).toHaveBeenCalledTimes(1);
  });

  it("persists energy, emissions, coverage and the captured factor reference for a valid collection", async () => {
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1 },
      receivedAt,
    });
    await runner.run();

    const [collection] = await database.getRepository(CollectionEntity).find();
    const [factor] = await database
      .getRepository(CarbonRegionEntity)
      .findBy({ code: "br-sudeste" });

    expect(collection).toMatchObject({
      applicationId: "cycle-test-a",
      intervalStart: new Date("2026-10-14T12:00:00.000Z"),
      intervalEnd: receivedAt,
      collectedAt: receivedAt,
      calculationVersion: "1",
      carbonRegionId: factor.id,
      carbonRegionVersion: factor.version,
      metrics: {
        cpuPercent: 50,
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
        collectionIntervalSeconds: 60,
      },
      metricUnits: {
        cpuPercent: "%",
        memoryGb: "GB",
        diskGb: "GB",
        networkGb: "GB",
      },
      calculationEvidence: {
        version: 1,
        energy: {
          observationId: collection.id,
          applicationId: "cycle-test-a",
          modelKey: "simplified-energy",
          modelVersion: "1",
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
          factorSnapshot: {
            id: factor.id,
            version: factor.version,
            contractVersion: "0.1.0",
            regionCode: "br-sudeste",
            country: "Brazil",
            region: "Sudeste",
            city: null,
            intensity: 85,
            unit: "gCO2e/kWh",
            queriedAt: receivedAt.toISOString(),
            source: null,
            validFrom: null,
            validUntil: null,
          },
          reasons: [],
        },
      },
    });
    expect(collection.calculationEvidence?.energy.averagePowerW).toBeCloseTo(
      50.87,
    );
    expect(collection.calculationEvidence?.energy.energyKwh).toBeCloseTo(
      0.0008478333333333333,
    );
    expect(
      collection.calculationEvidence?.carbon.emissionsGramsCo2e,
    ).toBeCloseTo(0.07206583333333333);
    expect(collection.energyKwh).toBe("0.00084783");
    expect(collection.carbonGrams).toBe("0.07206583");
    expect(collection.carbonFactor).toBe("85.00000000");
    expect(collection.coverage).toBe("1.0000");
  });

  it("does not finalize environmental evidence when shutdown cancels factor capture", async () => {
    let markCaptureStarted!: () => void;
    const captureStarted = new Promise<void>((resolve) => {
      markCaptureStarted = resolve;
    });
    carbonIntensity.fetchIntensity.mockImplementation(
      (_regionCode: string, signal?: AbortSignal) => {
        markCaptureStarted();
        return new Promise((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => reject(new IntegrationError("REQUEST_CANCELLED")),
            { once: true },
          );
        });
      },
    );

    const activeCycle = runner.run();
    await captureStarted;
    runner.onApplicationShutdown();
    await activeCycle;

    expect(await database.getRepository(CollectionEntity).find()).toHaveLength(
      0,
    );
    const [cycle] = await database.getRepository(MonitoringCycleEntity).find();
    expect(cycle).toMatchObject({
      status: "FAILED",
      details: {
        errorCode: "CYCLE_CANCELLED",
      },
    });
  });

  it("persists calculable energy without substituting zero emissions when the factor is unavailable", async () => {
    carbonIntensity.fetchIntensity.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 503),
    );
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1 },
      receivedAt,
    });

    await runner.run();

    const [collection] = await database.getRepository(CollectionEntity).find();
    expect(collection.energyKwh).toBe("0.00084783");
    expect(collection.carbonGrams).toBeNull();
    expect(collection.carbonFactor).toBeNull();
    expect(collection.coverage).toBe("1.0000");
    expect(collection.calculationEvidence?.carbon.reasons).toContainEqual({
      code: "CARBON_FACTOR_UNAVAILABLE",
    });
  });

  it("keeps a valid zero-energy result distinct from unavailable energy", async () => {
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 },
      receivedAt,
    });

    await runner.run();

    const [collection] = await database.getRepository(CollectionEntity).find();
    expect(collection.energyKwh).toBe("0.00000000");
    expect(collection.carbonGrams).toBe("0.00000000");
    expect(collection.coverage).toBe("1.0000");
    expect(collection.calculationEvidence?.energy.reasons).toEqual([]);
  });

  it("persists invalid metrics as unavailable while retaining calculation reasons", async () => {
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 50, memoryGb: 2, diskGb: 10 },
      receivedAt,
    });

    await runner.run();

    const [collection] = await database.getRepository(CollectionEntity).find();
    expect(collection.energyKwh).toBeNull();
    expect(collection.carbonGrams).toBeNull();
    expect(collection.coverage).toBe("0.0000");
    expect(collection.calculationEvidence?.energy.reasons).toContainEqual({
      code: "METRIC_MISSING",
      metric: "networkGb",
    });
  });

  it("accepts an equivalent bundle after PostgreSQL JSONB round-trip and rejects a divergent retry", async () => {
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1 },
      receivedAt,
    });
    await runner.run();

    const [before] = await database.getRepository(CollectionEntity).find();
    const bundle = {
      energyKwh: before.energyKwh,
      carbonGrams: before.carbonGrams,
      carbonFactor: before.carbonFactor,
      calculationVersion: before.calculationVersion,
      carbonRegionVersion: before.carbonRegionVersion,
      carbonRegionId: before.carbonRegionId,
      calculationConfigVersion: before.calculationConfigVersion,
      calculationConfigId: before.calculationConfigId,
      coverage: before.coverage,
      calculationEvidence: before.calculationEvidence!,
    };
    const pending = await collectionStore.append({
      applicationId: before.applicationId,
      intervalStart: new Date("2026-10-14T12:02:00.000Z"),
      intervalEnd: new Date("2026-10-14T12:03:00.000Z"),
      collectedAt: new Date("2026-10-14T12:03:00.000Z"),
      metrics: { cpuPercent: 1 },
      metricUnits: { cpuPercent: "%" },
      state: ApplicationState.AVAILABLE,
      reason: null,
    });
    await expect(
      collectionStore.persistEnvironmentalBundle(pending.id, {
        ...bundle,
        calculationEvidence: null as unknown as typeof bundle.calculationEvidence,
      }),
    ).rejects.toThrow("INVALID_ENVIRONMENTAL_BUNDLE");
    const unchangedPending = await database
      .getRepository(CollectionEntity)
      .findOneByOrFail({ id: pending.id });
    expect(unchangedPending).toMatchObject({
      energyKwh: null,
      carbonGrams: null,
      calculationEvidence: null,
    });
    await database.query(`
      CREATE FUNCTION fail_environmental_bundle_rewrite() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'equivalent retry must not write'; END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_environmental_bundle_rewrite
      BEFORE UPDATE ON collections
      FOR EACH ROW WHEN (OLD."applicationId" = 'cycle-test-a')
      EXECUTE FUNCTION fail_environmental_bundle_rewrite()
    `);

    try {
      await collectionStore.persistEnvironmentalBundle(before.id, {
        ...bundle,
        calculationEvidence: reverseJsonObjectKeys(bundle.calculationEvidence),
      });

      await expect(
        collectionStore.persistEnvironmentalBundle(before.id, {
          ...bundle,
          carbonGrams: "999.00000000",
        }),
      ).rejects.toThrow("ENVIRONMENTAL_BUNDLE_CONFLICT");
    } finally {
      await database.query(
        "DROP TRIGGER IF EXISTS fail_environmental_bundle_rewrite ON collections",
      );
      await database.query(
        "DROP FUNCTION IF EXISTS fail_environmental_bundle_rewrite()",
      );
    }
    const after = await database
      .getRepository(CollectionEntity)
      .findOneByOrFail({ id: before.id });
    expect(after.energyKwh).toBe(before.energyKwh);
    expect(after.carbonGrams).toBe(before.carbonGrams);
    expect(after.calculationEvidence).toEqual(before.calculationEvidence);
  });

  it("leaves the operational collection unchanged when atomic bundle persistence fails", async () => {
    await runner.run();
    const application = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-a" });
    const collection = await collectionStore.append({
      applicationId: application.id,
      intervalStart: new Date("2026-10-14T12:02:00.000Z"),
      intervalEnd: new Date("2026-10-14T12:03:00.000Z"),
      collectedAt: new Date("2026-10-14T12:03:00.000Z"),
      metrics: { cpuPercent: 50 },
      metricUnits: { cpuPercent: "%" },
      state: ApplicationState.AVAILABLE,
      reason: null,
    });
    await database.query(`
      CREATE FUNCTION fail_environmental_bundle_write() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'forced bundle persistence failure'; END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_environmental_bundle_write
      BEFORE UPDATE ON collections
      FOR EACH ROW WHEN (NEW."calculationEvidence" IS NOT NULL)
      EXECUTE FUNCTION fail_environmental_bundle_write()
    `);

    try {
      await expect(
        collectionStore.persistEnvironmentalBundle(collection.id, {
          energyKwh: "1.00000000",
          carbonGrams: "2.00000000",
          carbonFactor: "2.00000000",
          calculationVersion: "1",
          carbonRegionVersion: null,
          carbonRegionId: null,
          calculationConfigVersion: null,
          calculationConfigId: null,
          coverage: "1.0000",
          calculationEvidence: {
            version: 1,
            energy: {
              observationId: collection.id,
              applicationId: collection.applicationId,
              averagePowerW: 60,
              energyKwh: 1,
              durationSeconds: 60,
              modelKey: "test",
              modelVersion: "1",
              modelParameters: {
                cpuWattsAt100Percent: 100,
                memoryWattsPerGb: 0.375,
                diskWattsPerGb: 0.01,
                networkWattsPerGb: 0.02,
              },
              powerContributionsW: {
                cpuPercent: 60,
                memoryGb: 0,
                diskGb: 0,
                networkGb: 0,
              },
              reasons: [],
            },
            carbon: {
              energyKwh: 1,
              factorSnapshot: null,
              emissionsGramsCo2e: null,
              emissionsKilogramsCo2e: null,
              reasons: [{ code: "CARBON_FACTOR_UNAVAILABLE" }],
            },
          },
        }),
      ).rejects.toThrow();
    } finally {
      await database.query(
        "DROP TRIGGER IF EXISTS fail_environmental_bundle_write ON collections",
      );
      await database.query(
        "DROP FUNCTION IF EXISTS fail_environmental_bundle_write()",
      );
    }

    const unchanged = await database
      .getRepository(CollectionEntity)
      .findOneByOrFail({ id: collection.id });
    expect(unchanged).toMatchObject({
      metrics: { cpuPercent: 50 },
      energyKwh: null,
      carbonGrams: null,
      carbonFactor: null,
      calculationVersion: null,
      carbonRegionId: null,
      carbonRegionVersion: null,
      calculationConfigId: null,
      calculationConfigVersion: null,
      coverage: null,
      calculationEvidence: null,
    });
  });

  it("retains an operational observation when environmental finalization fails and finalizes it on retry", async () => {
    await database.query(`
      CREATE FUNCTION fail_runner_environmental_bundle() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'forced environmental finalization failure'; END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_runner_environmental_bundle
      BEFORE UPDATE ON collections
      FOR EACH ROW WHEN (NEW."calculationEvidence" IS NOT NULL)
      EXECUTE FUNCTION fail_runner_environmental_bundle()
    `);

    try {
      await runner.run();
    } finally {
      await database.query(
        "DROP TRIGGER IF EXISTS fail_runner_environmental_bundle ON collections",
      );
      await database.query(
        "DROP FUNCTION IF EXISTS fail_runner_environmental_bundle()",
      );
    }

    const [operationalCollection] = await database
      .getRepository(CollectionEntity)
      .find();
    expect(operationalCollection).toMatchObject({
      applicationId: "cycle-test-a",
      metrics: {
        cpuPercent: 0,
        memoryGb: 2,
        diskGb: 3,
        networkGb: 4,
        collectionIntervalSeconds: 60,
      },
      energyKwh: null,
      carbonGrams: null,
      carbonFactor: null,
      carbonRegionId: null,
      carbonRegionVersion: null,
      calculationConfigId: null,
      calculationConfigVersion: null,
      coverage: null,
      calculationEvidence: null,
    });
    const [failedCycle] = await database
      .getRepository(MonitoringCycleEntity)
      .find();
    expect(failedCycle).toMatchObject({ status: "PARTIAL", failedCount: 1 });

    await runner.run();

    const finalized = await database
      .getRepository(CollectionEntity)
      .findOneByOrFail({ id: operationalCollection.id });
    expect(finalized.energyKwh).toBe("0.00001433");
    expect(finalized.calculationEvidence?.version).toBe(1);
    expect(
      await database
        .getRepository(CollectionEntity)
        .findBy({ applicationId: "cycle-test-a" }),
    ).toHaveLength(1);
  });

  it("records a partial cycle and preserves a valid collection when one service fails", async () => {
    upstream.fetchServices.mockResolvedValue([service("a"), service("b")]);
    upstream.fetchMetrics.mockImplementation(async (id: string) => {
      if (id === "cycle-test-b") {
        throw new IntegrationError("UPSTREAM_UNAVAILABLE", 500);
      }
      return {
        collectionIntervalSeconds: 60,
        metrics: { cpuPercent: 5, memoryGb: 1, diskGb: 1, networkGb: 1 },
        receivedAt,
      };
    });

    await runner.run();

    const [cycle] = await database.getRepository(MonitoringCycleEntity).find();
    expect(cycle).toMatchObject({
      status: "PARTIAL",
      processedCount: 2,
      failedCount: 1,
      persistedCount: 1,
      details: {
        failures: [
          { applicationId: "cycle-test-b", errorCode: "UPSTREAM_UNAVAILABLE" },
        ],
      },
    });
    const failedApplication = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-b" });
    expect(failedApplication).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      stateReason: ApplicationStateReason.SOURCE_ERROR,
      isStale: true,
    });
    expect(
      await database.getRepository(CollectionEntity).find({
        where: { applicationId: "cycle-test-b" },
      }),
    ).toHaveLength(0);
    expect(
      await database.getRepository(MonitoringIncidentEntity).find({
        where: { applicationId: "cycle-test-b" },
      }),
    ).toMatchObject([
      {
        source: "metrics-aggregator",
        integration: "metrics",
        status: "OPEN",
        firstReason: "UPSTREAM_UNAVAILABLE",
        latestReason: "UPSTREAM_UNAVAILABLE",
        logicalFailureCount: 1,
        httpAttemptCount: 1,
      },
    ]);
  });

  it("keeps the original observation timestamp and marks it stale after metrics disappear", async () => {
    await runner.run();
    upstream.fetchMetrics.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 404),
    );

    await runner.run();

    const application = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-a" });
    expect(application).toMatchObject({
      state: ApplicationState.NO_METRICS,
      stateReason: ApplicationStateReason.METRICS_MISSING,
      isStale: true,
      lastObservationAt: receivedAt,
    });
    expect(application.lastCheckedAt?.getTime()).toBeGreaterThan(
      receivedAt.getTime(),
    );
    expect(
      await database
        .getRepository(CollectionEntity)
        .findBy({ applicationId: "cycle-test-a" }),
    ).toHaveLength(1);
  });

  it("surfaces a skipped scheduler tick without creating an upstream incident or cycle", async () => {
    await runner.run();
    const delayedAt = new Date(receivedAt.getTime() + 60_000);

    await runner.recordDelayedCycle(delayedAt);

    const application = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-a" });
    expect(application).toMatchObject({
      state: ApplicationState.UNAVAILABLE,
      stateReason: ApplicationStateReason.MONITORING_CYCLE_DELAYED,
      isStale: true,
      lastObservationAt: receivedAt,
      lastCheckedAt: delayedAt,
    });
    expect(
      await database.getRepository(MonitoringCycleEntity).find(),
    ).toHaveLength(1);
    expect(
      await database.getRepository(MonitoringIncidentEntity).find(),
    ).toHaveLength(0);
  });

  it("resolves one metrics incident after three valid observations in distinct cycles", async () => {
    upstream.fetchMetrics.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 503, 3),
    );
    await runner.run();
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 4, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt,
    });

    await runner.run();
    let incident = await database
      .getRepository(MonitoringIncidentEntity)
      .findOneByOrFail({ applicationId: "cycle-test-a" });
    expect(incident).toMatchObject({
      status: "RECOVERING",
      recoverySuccessCount: 1,
      logicalFailureCount: 1,
      httpAttemptCount: 3,
    });

    await runner.run();
    await runner.run();
    incident = await database
      .getRepository(MonitoringIncidentEntity)
      .findOneByOrFail({ applicationId: "cycle-test-a" });
    expect(incident).toMatchObject({
      status: "RESOLVED",
      recoverySuccessCount: 3,
      logicalFailureCount: 1,
      httpAttemptCount: 3,
    });
    expect(incident.resolvedAt).toBeInstanceOf(Date);
  });

  it("recovers after a database write failure without storing zero or losing the next observation", async () => {
    await database.query(`
      CREATE FUNCTION fail_cycle_test_collection_write() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'forced test database failure'; END;
      $$ LANGUAGE plpgsql
    `);
    await database.query(`
      CREATE TRIGGER fail_cycle_test_collection_write
      BEFORE INSERT ON collections
      FOR EACH ROW WHEN (NEW."applicationId" = 'cycle-test-a')
      EXECUTE FUNCTION fail_cycle_test_collection_write()
    `);

    try {
      await runner.run();

      const [failedCycle] = await database
        .getRepository(MonitoringCycleEntity)
        .find();
      expect(failedCycle).toMatchObject({
        // Carbon factor persisted successfully, so the cycle is partial even
        // though its required metric observation failed to persist.
        status: "PARTIAL",
        processedCount: 1,
        failedCount: 1,
        persistedCount: 0,
      });
      expect(
        await database
          .getRepository(CarbonRegionEntity)
          .findBy({ code: "br-sudeste" }),
      ).toHaveLength(1);
      const unchangedApplication = await database
        .getRepository(ApplicationEntity)
        .findOneByOrFail({ id: "cycle-test-a" });
      expect(unchangedApplication).toMatchObject({
        state: ApplicationState.AVAILABLE,
        isStale: false,
        lastObservationAt: null,
      });
      expect(
        await database.getRepository(CollectionEntity).find(),
      ).toHaveLength(0);
    } finally {
      await database.query(
        "DROP TRIGGER IF EXISTS fail_cycle_test_collection_write ON collections",
      );
      await database.query(
        "DROP FUNCTION IF EXISTS fail_cycle_test_collection_write()",
      );
    }

    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 7, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt: new Date(receivedAt.getTime() + 60_000),
    });
    await runner.run();

    const recoveredApplication = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-a" });
    expect(recoveredApplication).toMatchObject({
      state: ApplicationState.AVAILABLE,
      isStale: false,
      lastObservationAt: new Date(receivedAt.getTime() + 60_000),
    });
    expect(await database.getRepository(CollectionEntity).find()).toHaveLength(
      1,
    );
    const cycles = await database.getRepository(MonitoringCycleEntity).find({
      order: { startedAt: "ASC" },
    });
    expect(cycles.map(({ status }) => status)).toEqual([
      "PARTIAL",
      "SUCCEEDED",
    ]);
  });

  it("discovers, removes, and returns an application through successive cycles", async () => {
    await runner.run();
    upstream.fetchServices.mockResolvedValue([]);
    await runner.run();
    const removed = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-a" });
    expect(removed.state).toBe(ApplicationState.REMOVED);

    upstream.fetchServices.mockResolvedValue([service("a")]);
    upstream.fetchMetrics.mockResolvedValue({
      collectionIntervalSeconds: 60,
      metrics: { cpuPercent: 3, memoryGb: 2, diskGb: 3, networkGb: 4 },
      receivedAt: new Date(receivedAt.getTime() + 60_000),
    });
    await runner.run();

    const returned = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-a" });
    expect(returned).toMatchObject({
      state: ApplicationState.AVAILABLE,
      removedAt: null,
      isStale: false,
    });
    expect(
      (
        await database
          .getRepository(ApplicationEventEntity)
          .find({ where: { applicationId: "cycle-test-a" } })
      )
        .map(({ kind }) => kind)
        .sort(),
    ).toEqual([
      "discovered",
      "removed",
      "returned",
      "status_changed",
      "status_changed",
    ]);
    expect(
      await database.getRepository(CollectionEntity).find({
        where: { applicationId: "cycle-test-a" },
      }),
    ).toHaveLength(2);
  });

  it("does not confirm removal if the services snapshot is invalid", async () => {
    const [known] = await database.query(
      'INSERT INTO applications (id, name, state, "firstSeenAt", "lastCheckedAt", "isStale", "isCalculable") VALUES ($1, $2, $3, now(), now(), false, false) RETURNING id',
      ["cycle-test-existing", "Known application", ApplicationState.AVAILABLE],
    );
    expect(known.id).toBe("cycle-test-existing");
    upstream.fetchServices.mockRejectedValue(
      new IntegrationError("INVALID_UPSTREAM_RESPONSE"),
    );

    await expect(runner.run()).rejects.toBeInstanceOf(IntegrationError);

    const application = await database
      .getRepository(ApplicationEntity)
      .findOneByOrFail({ id: "cycle-test-existing" });
    expect(application.state).toBe(ApplicationState.AVAILABLE);
    const [cycle] = await database.getRepository(MonitoringCycleEntity).find();
    expect(cycle).toMatchObject({ status: "FAILED", failedCount: 1 });
  });
});

function reverseJsonObjectKeys<T>(value: T): T {
  if (Array.isArray(value))
    return value.map((item) => reverseJsonObjectKeys(item)) as T;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, nested]) => [key, reverseJsonObjectKeys(nested)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}
