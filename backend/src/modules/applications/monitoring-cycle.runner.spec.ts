import { ApplicationState } from "../../database/entities/application-state";
import { MonitoringCycleStatus } from "../../database/entities/monitoring-cycle.entity";
import { ApplicationStateReason } from "../../database/entities/application-state-reason";
import { IntegrationError } from "../../integrations/integration-error";
import { MetricsAggregatorAdapter } from "../../integrations/metrics-aggregator.adapter";
import { MonitoringCycleRunner } from "./monitoring-cycle.runner";
import { MonitoringCycleLock } from "./monitoring-cycle.lock";

describe("MonitoringCycleRunner", () => {
  const receivedAt = new Date("2026-10-14T12:01:00.000Z");
  const service = {
    id: "app-1",
    name: "App",
    location: {},
    metricsPath: "/metrics/app-1",
  };
  let runner: MonitoringCycleRunner;
  let dependencies: {
    adapter: { fetchServices: jest.Mock; fetchMetrics: jest.Mock };
    cycles: { start: jest.Mock; finish: jest.Mock };
    discovery: { discover: jest.Mock };
    metadata: { reconcile: jest.Mock };
    removal: { reconcile: jest.Mock };
    returns: { reconcile: jest.Mock };
    applications: { findForCollection: jest.Mock };
    collections: {
      findByApplicationAndIntervalStart: jest.Mock;
      append: jest.Mock;
    };
    statuses: { record: jest.Mock };
    incidents: { recordFailure: jest.Mock; recordSuccess: jest.Mock };
    carbonFactors: { capture: jest.Mock };
  };

  beforeEach(() => {
    dependencies = {
      adapter: {
        fetchServices: jest.fn().mockResolvedValue([service]),
        fetchMetrics: jest.fn().mockResolvedValue({
          collectionIntervalSeconds: 60,
          metrics: { cpuPercent: 0, memoryGb: 2, diskGb: 3, networkGb: 4 },
          receivedAt,
        }),
      },
      cycles: {
        start: jest.fn().mockResolvedValue({ id: "cycle-1" }),
        finish: jest.fn().mockResolvedValue({}),
      },
      discovery: { discover: jest.fn().mockResolvedValue(0) },
      metadata: { reconcile: jest.fn().mockResolvedValue(0) },
      removal: { reconcile: jest.fn().mockResolvedValue(0) },
      returns: { reconcile: jest.fn().mockResolvedValue(0) },
      applications: {
        findForCollection: jest.fn().mockResolvedValue([{ id: "app-1" }]),
      },
      collections: {
        findByApplicationAndIntervalStart: jest.fn().mockResolvedValue(null),
        append: jest.fn().mockResolvedValue({}),
      },
      statuses: { record: jest.fn().mockResolvedValue({}) },
      incidents: {
        recordFailure: jest.fn().mockResolvedValue(true),
        recordSuccess: jest.fn().mockResolvedValue(true),
      },
      carbonFactors: { capture: jest.fn().mockResolvedValue({}) },
    };
    runner = new MonitoringCycleRunner(
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.cycles as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[1],
      dependencies.discovery as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[2],
      dependencies.metadata as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[3],
      dependencies.removal as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[4],
      dependencies.returns as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[5],
      dependencies.applications as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[6],
      dependencies.collections as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[7],
      dependencies.statuses as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[8],
      2,
      dependencies.incidents as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[10],
      dependencies.carbonFactors as unknown as ConstructorParameters<
        typeof MonitoringCycleRunner
      >[11],
      new MonitoringCycleLock(),
    );
  });

  it("reuses one validated snapshot and persists the source-defined interval and units", async () => {
    await runner.run();
    expect(dependencies.adapter.fetchServices).toHaveBeenCalledTimes(1);
    expect(dependencies.discovery.discover).toHaveBeenCalledWith("cycle-1", [
      service,
    ]);
    expect(dependencies.metadata.reconcile).toHaveBeenCalledWith("cycle-1", [
      service,
    ]);
    expect(dependencies.removal.reconcile).toHaveBeenCalledWith("cycle-1", [
      service,
    ]);
    expect(dependencies.collections.append).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: "app-1",
        intervalStart: new Date("2026-10-14T12:00:00.000Z"),
        intervalEnd: receivedAt,
        collectedAt: receivedAt,
        state: ApplicationState.AVAILABLE,
        metrics: expect.objectContaining({
          cpuPercent: 0,
          collectionIntervalSeconds: 60,
        }),
        metricUnits: {
          cpuPercent: "%",
          memoryGb: "GB",
          diskGb: "GB",
          networkGb: "GB",
        },
      }),
    );
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({
        status: MonitoringCycleStatus.SUCCEEDED,
        processedCount: 1,
        persistedCount: 1,
        failedCount: 0,
      }),
    );
  });

  it("does not duplicate a collection with an existing application interval", async () => {
    dependencies.collections.findByApplicationAndIntervalStart.mockResolvedValue(
      { id: "existing" },
    );
    await runner.run();
    expect(dependencies.collections.append).not.toHaveBeenCalled();
    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({ result: "valid" }),
      "cycle-1",
    );
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({ persistedCount: 0 }),
    );
  });

  it("isolates a metric failure and marks the cycle partial without writing a zero", async () => {
    dependencies.adapter.fetchMetrics.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 500),
    );
    await runner.run();
    expect(dependencies.collections.append).not.toHaveBeenCalled();
    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      "app-1",
      {
        kind: "source_failure",
        reason: ApplicationStateReason.SOURCE_ERROR,
        observedAt: expect.any(Date),
      },
      "cycle-1",
    );
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({
        status: MonitoringCycleStatus.FAILED,
        processedCount: 1,
        failedCount: 1,
        persistedCount: 0,
      }),
    );
  });

  it("does not report a metric source incident when observation persistence fails", async () => {
    dependencies.collections.append.mockRejectedValue(
      new Error("database unavailable"),
    );

    await runner.run();

    expect(dependencies.statuses.record).not.toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({ kind: "source_failure" }),
      "cycle-1",
    );
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({ failedCount: 1, persistedCount: 0 }),
    );
  });

  it("treats metrics 404 as missing metrics and keeps the application identity", async () => {
    dependencies.adapter.fetchMetrics.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 404),
    );

    await runner.run();

    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({ kind: "metrics", result: "missing" }),
      "cycle-1",
    );
    expect(dependencies.incidents.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({ integration: "metrics" }),
      "MISSING_METRICS",
      "cycle-1",
      expect.any(Date),
      1,
    );
    expect(dependencies.removal.reconcile).toHaveBeenCalledWith("cycle-1", [
      service,
    ]);
  });

  it("marks timed-out metrics as stale with a timeout-specific reason", async () => {
    dependencies.adapter.fetchMetrics.mockRejectedValue(
      new IntegrationError("UPSTREAM_TIMEOUT"),
    );

    await runner.run();

    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({
        kind: "source_failure",
        reason: ApplicationStateReason.SOURCE_TIMEOUT,
      }),
      "cycle-1",
    );
  });

  it("persists valid metrics when carbon lookup fails and opens only the carbon incident", async () => {
    dependencies.applications.findForCollection.mockResolvedValue([
      { id: "app-1", regionCode: "br-sudeste" },
    ]);
    dependencies.carbonFactors.capture.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 503, 2),
    );

    await runner.run();

    expect(dependencies.collections.append).toHaveBeenCalled();
    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({
        kind: "metrics",
        carbonFactorAvailable: false,
      }),
      "cycle-1",
    );
    expect(dependencies.incidents.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "carbon-intensity",
        applicationId: "app-1",
        integration: "carbon-factor",
      }),
      "UPSTREAM_UNAVAILABLE",
      "cycle-1",
      expect.any(Date),
      2,
    );
    expect(dependencies.incidents.recordFailure).not.toHaveBeenCalledWith(
      expect.objectContaining({ integration: "metrics" }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({
        status: MonitoringCycleStatus.PARTIAL,
        processedCount: 1,
        failedCount: 1,
        persistedCount: 1,
      }),
    );
  });

  it("marks the cycle partial when one application fails and another succeeds", async () => {
    dependencies.adapter.fetchServices.mockResolvedValue([
      service,
      { ...service, id: "app-2" },
    ]);
    dependencies.applications.findForCollection.mockResolvedValue([
      { id: "app-1" },
      { id: "app-2" },
    ]);
    dependencies.adapter.fetchMetrics.mockImplementation(async (id: string) => {
      if (id === "app-2") {
        throw new IntegrationError("UPSTREAM_UNAVAILABLE", 500);
      }
      return {
        collectionIntervalSeconds: 60,
        metrics: { cpuPercent: 1, memoryGb: 1, diskGb: 1, networkGb: 1 },
        receivedAt,
      };
    });

    await runner.run();

    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({
        status: MonitoringCycleStatus.PARTIAL,
        processedCount: 2,
        failedCount: 1,
        persistedCount: 1,
      }),
    );
  });

  it("does not reconcile removal after the services snapshot fails", async () => {
    dependencies.adapter.fetchServices.mockRejectedValue(
      new IntegrationError("INVALID_UPSTREAM_RESPONSE"),
    );

    await expect(runner.run()).rejects.toBeInstanceOf(IntegrationError);

    expect(dependencies.removal.reconcile).not.toHaveBeenCalled();
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({ status: MonitoringCycleStatus.FAILED }),
    );
  });

  it("limits concurrent metrics requests", async () => {
    const apps = Array.from({ length: 5 }, (_, index) => ({
      id: `app-${index}`,
    }));
    dependencies.adapter.fetchServices.mockResolvedValue(
      apps.map(({ id }) => ({ ...service, id })),
    );
    dependencies.applications.findForCollection.mockResolvedValue(apps);
    let active = 0;
    let peak = 0;
    dependencies.adapter.fetchMetrics.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return {
        collectionIntervalSeconds: 60,
        metrics: { cpuPercent: 1, memoryGb: 1, diskGb: 1, networkGb: 1 },
        receivedAt,
      };
    });
    await runner.run();
    expect(peak).toBe(2);
  });

  it("skips overlapping cycles while the active cycle is still running", async () => {
    let release: ((services: (typeof service)[]) => void) | undefined;
    dependencies.adapter.fetchServices.mockImplementation(
      () => new Promise((resolve) => (release = resolve)),
    );

    const activeCycle = runner.run();
    await new Promise((resolve) => setImmediate(resolve));
    await runner.run();

    expect(dependencies.cycles.start).toHaveBeenCalledTimes(1);
    release?.([service]);
    await activeCycle;
  });

  it("records shutdown cancellation without opening a source incident", async () => {
    dependencies.adapter.fetchServices.mockImplementation(
      (_signal?: AbortSignal) =>
        new Promise((_resolve, reject) => {
          _signal?.addEventListener(
            "abort",
            () => reject(new IntegrationError("REQUEST_CANCELLED")),
            { once: true },
          );
        }),
    );

    const activeCycle = runner.run();
    await new Promise((resolve) => setImmediate(resolve));
    runner.onApplicationShutdown();
    await activeCycle;

    expect(dependencies.incidents.recordFailure).not.toHaveBeenCalled();
    expect(dependencies.cycles.finish).toHaveBeenCalledWith(
      "cycle-1",
      expect.objectContaining({
        status: MonitoringCycleStatus.FAILED,
        details: {
          source: "scheduled-monitoring",
          errorCode: "CYCLE_CANCELLED",
        },
      }),
    );
  });

  it("propagates cycle-finalization failure and releases the lock for a later run", async () => {
    dependencies.cycles.finish.mockRejectedValueOnce(
      new Error("cycle finalization failed"),
    );

    await expect(runner.run()).rejects.toThrow("cycle finalization failed");

    await expect(runner.run()).resolves.toBeUndefined();
    expect(dependencies.cycles.start).toHaveBeenCalledTimes(2);
  });

  it("marks only applications not checked since a skipped scheduler tick as delayed", async () => {
    const skippedAt = new Date("2026-10-16T12:00:00.000Z");
    dependencies.applications.findForCollection.mockResolvedValue([
      { id: "app-stale", lastCheckedAt: new Date("2026-10-16T11:59:00.000Z") },
      { id: "app-fresh", lastCheckedAt: new Date("2026-10-16T12:01:00.000Z") },
    ]);

    await runner.recordDelayedCycle(skippedAt);

    expect(dependencies.statuses.record).toHaveBeenCalledTimes(1);
    expect(dependencies.statuses.record).toHaveBeenCalledWith(
      "app-stale",
      {
        kind: "source_failure",
        reason: ApplicationStateReason.MONITORING_CYCLE_DELAYED,
        observedAt: skippedAt,
      },
      null,
    );
  });
});
