import {
  MonitoringIncidentEntity,
  MonitoringIncidentStatus,
  MonitoringIntegration,
} from "../../database/entities/monitoring-incident.entity";
import { MonitoringIncidentsRepository } from "../../database/repositories/monitoring-incidents.repository";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";

describe("monitoring incident lifecycle", () => {
  it("tracks failures once per cycle and resolves after three consecutive valid cycles", async () => {
    const active: { current: MonitoringIncidentEntity | null } = {
      current: null,
    };
    const repository = {
      findActive: jest.fn().mockImplementation(async () => active.current),
      create: jest.fn().mockImplementation(async (incident) => {
        active.current = Object.assign(
          new MonitoringIncidentEntity(),
          incident,
          {
            id: "incident-1",
          },
        );
        return active.current;
      }),
      save: jest.fn().mockImplementation(async (incident) => {
        active.current = incident;
        return incident;
      }),
      list: jest.fn(),
    };
    const incidents = new MonitoringIncidentsService(
      repository as unknown as MonitoringIncidentsRepository,
    );
    const identity = {
      source: "metrics-aggregator",
      applicationId: "app-1",
      integration: MonitoringIntegration.METRICS,
    };

    await incidents.recordFailure(
      identity,
      "UPSTREAM_UNAVAILABLE",
      "cycle-1",
      new Date("2026-10-15T10:00:00Z"),
      3,
    );
    await incidents.recordFailure(
      identity,
      "TIMEOUT",
      "cycle-1",
      new Date("2026-10-15T10:00:01Z"),
      1,
    );
    await incidents.recordFailure(
      identity,
      "TIMEOUT",
      "cycle-2",
      new Date("2026-10-15T10:01:00Z"),
      2,
    );
    expect(active.current).toMatchObject({
      status: MonitoringIncidentStatus.OPEN,
      firstReason: "UPSTREAM_UNAVAILABLE",
      latestReason: "TIMEOUT",
      logicalFailureCount: 2,
      httpAttemptCount: 5,
      recoverySuccessCount: 0,
    });

    await incidents.recordSuccess(
      identity,
      "cycle-2",
      new Date("2026-10-15T10:01:30Z"),
    );
    expect(active.current?.recoverySuccessCount).toBe(0);
    await incidents.recordSuccess(
      identity,
      "cycle-3",
      new Date("2026-10-15T10:02:00Z"),
    );
    await incidents.recordFailure(
      identity,
      "TIMEOUT",
      "cycle-4",
      new Date("2026-10-15T10:03:00Z"),
      2,
    );
    expect(active.current?.recoverySuccessCount).toBe(0);
    await incidents.recordSuccess(
      identity,
      "cycle-5",
      new Date("2026-10-15T10:04:00Z"),
    );
    await incidents.recordSuccess(
      identity,
      "cycle-6",
      new Date("2026-10-15T10:05:00Z"),
    );
    expect(active.current?.status).toBe(MonitoringIncidentStatus.RECOVERING);
    await incidents.recordSuccess(
      identity,
      "cycle-7",
      new Date("2026-10-15T10:06:00Z"),
    );

    expect(active.current).toMatchObject({
      status: MonitoringIncidentStatus.RESOLVED,
      recoverySuccessCount: 3,
      logicalFailureCount: 3,
      httpAttemptCount: 7,
    });
  });

  it("returns only safe incident fields and validates page limits", async () => {
    const repository = {
      list: jest.fn().mockResolvedValue({
        items: [
          Object.assign(new MonitoringIncidentEntity(), {
            id: "incident-1",
            source: "metrics-aggregator",
            applicationId: "app-1",
            integration: MonitoringIntegration.METRICS,
            status: MonitoringIncidentStatus.OPEN,
            firstReason: "UPSTREAM_UNAVAILABLE",
            latestReason: "TIMEOUT",
            firstAttemptAt: new Date("2026-10-15T10:00:00Z"),
            latestAttemptAt: new Date("2026-10-15T10:01:00Z"),
            lastValidResponseAt: null,
            logicalFailureCount: 2,
            httpAttemptCount: 5,
            openedAt: new Date("2026-10-15T10:00:00Z"),
            resolvedAt: null,
            lastCycleId: "cycle-2",
            internalUrl: "https://internal.example/secret",
          }),
        ],
        total: 1,
      }),
      findActive: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const incidents = new MonitoringIncidentsService(
      repository as unknown as MonitoringIncidentsRepository,
    );

    await expect(
      incidents.list({ page: 1, limit: 20, source: "metrics-aggregator" }),
    ).resolves.toMatchObject({
      items: [
        {
          id: "incident-1",
          firstReason: "UPSTREAM_UNAVAILABLE",
          latestReason: "TIMEOUT",
          httpAttemptCount: 5,
          cycleId: "cycle-2",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(
      JSON.stringify(await incidents.list({ page: 1, limit: 20 })),
    ).not.toContain("internalUrl");
    await expect(incidents.list({ page: 1, limit: 101 })).rejects.toMatchObject(
      {
        status: 400,
      },
    );
  });
});
