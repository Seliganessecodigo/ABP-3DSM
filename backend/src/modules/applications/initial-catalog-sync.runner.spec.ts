import { DiscoveryService } from "./discovery.service";
import { InitialCatalogSyncRunner } from "./initial-catalog-sync.runner";
import { MonitoringCyclesRepository } from "../../database/repositories/monitoring-cycles.repository";
import { MonitoringCycleStatus } from "../../database/entities/monitoring-cycle.entity";
import { IntegrationError } from "../../integrations/integration-error";
import { MonitoringCycleLock } from "./monitoring-cycle.lock";
import { MetricsAggregatorAdapter } from "../../integrations/metrics-aggregator.adapter";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";

function createDependencies(fetchServices = jest.fn().mockResolvedValue([])) {
  return {
    adapter: { fetchServices },
    incidents: {
      recordFailure: jest.fn().mockResolvedValue(true),
      recordSuccess: jest.fn().mockResolvedValue(true),
    },
  };
}

describe("sincronização inicial do catálogo", () => {
  it("pula a sincronização quando outro ciclo já possui a trava", async () => {
    const cycleLock = new MonitoringCycleLock();
    expect(cycleLock.acquire()).toBe(true);
    const cycles = { start: jest.fn(), finish: jest.fn() };
    const dependencies = createDependencies();
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      { discover: jest.fn() } as unknown as DiscoveryService,
      { observeAll: jest.fn() } as never,
      cycleLock,
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );

    await expect(runner.run()).resolves.toBe(0);
    expect(cycles.start).not.toHaveBeenCalled();
    expect(dependencies.adapter.fetchServices).not.toHaveBeenCalled();
  });

  it("libera a trava se não conseguir criar o ciclo", async () => {
    const failure = new Error("database unavailable");
    const cycleLock = new MonitoringCycleLock();
    const cycles = {
      start: jest.fn().mockRejectedValue(failure),
      finish: jest.fn(),
    };
    const dependencies = createDependencies();
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      { discover: jest.fn() } as unknown as DiscoveryService,
      { observeAll: jest.fn() } as never,
      cycleLock,
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );

    await expect(runner.run()).rejects.toBe(failure);
    expect(cycleLock.acquire()).toBe(true);
  });

  it("registra a descoberta e encerra o ciclo com as aplicações persistidas", async () => {
    const cycle = { id: "startup-cycle" };
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const discovery = { discover: jest.fn().mockResolvedValue(8) };
    const observations = {
      observeAll: jest.fn().mockResolvedValue({
        processedCount: 8,
        failedCount: 0,
        successfulOperationCount: 8,
      }),
    };
    const dependencies = createDependencies();
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
      observations as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );

    await expect(runner.run()).resolves.toBe(8);

    expect(cycles.start).toHaveBeenCalledWith({
      source: "startup-catalog-discovery",
    });
    expect(discovery.discover).toHaveBeenCalledWith(cycle.id, []);
    expect(observations.observeAll).toHaveBeenCalledWith(
      cycle.id,
      expect.any(AbortSignal),
    );
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.SUCCEEDED,
      discoveredCount: 8,
      processedCount: 8,
      failedCount: 0,
      persistedCount: 0,
      details: { source: "startup-catalog-discovery" },
    });
  });

  it("marca o ciclo como falho quando a origem não fornece um snapshot válido", async () => {
    const cycle = { id: "failed-startup-cycle" };
    const failure = new IntegrationError("INVALID_UPSTREAM_RESPONSE");
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const discovery = { discover: jest.fn().mockResolvedValue(0) };
    const observations = { observeAll: jest.fn() };
    const dependencies = createDependencies(
      jest.fn().mockRejectedValue(failure),
    );
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
      observations as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );

    await expect(runner.run()).rejects.toBe(failure);
    expect(dependencies.incidents.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "metrics-aggregator",
        applicationId: null,
        integration: "services",
      }),
      "INVALID_RESPONSE",
      cycle.id,
      expect.any(Date),
      1,
    );
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 1,
      persistedCount: 0,
      details: {
        source: "startup-catalog-discovery",
        errorCode: "INVALID_UPSTREAM_RESPONSE",
      },
    });
  });

  it("classifica um 404 do catálogo como rejeição da origem", async () => {
    const failure = new IntegrationError("UPSTREAM_UNAVAILABLE", 404);
    const cycles = {
      start: jest.fn().mockResolvedValue({ id: "catalog-not-found-cycle" }),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const dependencies = createDependencies(
      jest.fn().mockRejectedValue(failure),
    );
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      { discover: jest.fn() } as unknown as DiscoveryService,
      { observeAll: jest.fn() } as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );

    await expect(runner.run()).rejects.toBe(failure);
    expect(dependencies.incidents.recordFailure).toHaveBeenCalledWith(
      expect.objectContaining({ integration: "services" }),
      "UPSTREAM_REJECTED",
      "catalog-not-found-cycle",
      expect.any(Date),
      1,
    );
  });

  it("registra falhas inesperadas com código estável", async () => {
    const cycle = { id: "unexpected-startup-cycle" };
    const failure = new Error("database unavailable");
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const discovery = { discover: jest.fn().mockRejectedValue(failure) };
    const observations = { observeAll: jest.fn() };
    const dependencies = createDependencies();
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
      observations as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );

    await expect(runner.run()).rejects.toBe(failure);
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 1,
      persistedCount: 0,
      details: {
        source: "startup-catalog-discovery",
        errorCode: "UNEXPECTED_ERROR",
      },
    });
  });

  it("encerra o ciclo de inicialização no shutdown sem classificar cancelamento como origem", async () => {
    const cycle = { id: "cancelled-startup-cycle" };
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const discovery = { discover: jest.fn().mockResolvedValue(1) };
    const runnerRef: { current?: InitialCatalogSyncRunner } = {};
    const observations = {
      observeAll: jest.fn().mockImplementation(async () => {
        runnerRef.current?.onApplicationShutdown();
        return {
          processedCount: 1,
          failedCount: 0,
          successfulOperationCount: 0,
          cancelled: true,
        };
      }),
    };
    const dependencies = createDependencies();
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
      observations as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );
    runnerRef.current = runner;

    await expect(runner.run()).resolves.toBe(1);
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount: 1,
      processedCount: 1,
      failedCount: 0,
      persistedCount: 0,
      details: {
        source: "startup-catalog-discovery",
        errorCode: "CYCLE_CANCELLED",
      },
    });
  });

  it("encerra como cancelado quando a consulta do catálogo é abortada no shutdown", async () => {
    const cycle = { id: "cancelled-catalog-cycle" };
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const runnerRef: { current?: InitialCatalogSyncRunner } = {};
    const dependencies = createDependencies(
      jest.fn().mockImplementation(async () => {
        runnerRef.current?.onApplicationShutdown();
        throw new IntegrationError("REQUEST_CANCELLED");
      }),
    );
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      { discover: jest.fn() } as unknown as DiscoveryService,
      { observeAll: jest.fn() } as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );
    runnerRef.current = runner;

    await expect(runner.run()).resolves.toBe(0);
    expect(dependencies.incidents.recordFailure).not.toHaveBeenCalled();
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 0,
      persistedCount: 0,
      details: {
        source: "startup-catalog-discovery",
        errorCode: "CYCLE_CANCELLED",
      },
    });
  });

  it("encerra como cancelado se a descoberta for interrompida no shutdown", async () => {
    const cycle = { id: "cancelled-discovery-cycle" };
    const cycles = {
      start: jest.fn().mockResolvedValue(cycle),
      finish: jest.fn().mockResolvedValue(undefined),
    };
    const runnerRef: { current?: InitialCatalogSyncRunner } = {};
    const discovery = {
      discover: jest.fn().mockImplementation(async () => {
        runnerRef.current?.onApplicationShutdown();
        throw new IntegrationError("REQUEST_CANCELLED");
      }),
    };
    const dependencies = createDependencies();
    const runner = new InitialCatalogSyncRunner(
      cycles as unknown as MonitoringCyclesRepository,
      discovery as unknown as DiscoveryService,
      { observeAll: jest.fn() } as never,
      new MonitoringCycleLock(),
      dependencies.adapter as unknown as MetricsAggregatorAdapter,
      dependencies.incidents as unknown as MonitoringIncidentsService,
    );
    runnerRef.current = runner;

    await expect(runner.run()).resolves.toBe(0);
    expect(dependencies.incidents.recordFailure).not.toHaveBeenCalled();
    expect(cycles.finish).toHaveBeenCalledWith(cycle.id, {
      status: MonitoringCycleStatus.FAILED,
      discoveredCount: 0,
      processedCount: 0,
      failedCount: 0,
      persistedCount: 0,
      details: {
        source: "startup-catalog-discovery",
        errorCode: "CYCLE_CANCELLED",
      },
    });
  });
});
