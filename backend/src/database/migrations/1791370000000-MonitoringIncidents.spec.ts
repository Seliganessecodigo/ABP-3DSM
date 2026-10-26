import { QueryRunner } from "typeorm";
import { MonitoringIncidents1791370000000 } from "./1791370000000-MonitoringIncidents";

describe("MonitoringIncidents1791370000000", () => {
  it("creates durable incident history and one-active-incident identity indexes", async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new MonitoringIncidents1791370000000().up(runner);

    expect(query).toHaveBeenCalledTimes(7);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE "monitoring_incidents"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("FK_monitoring_incidents_cycle"),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UQ_monitoring_incidents_active_global_identity"),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        "UQ_monitoring_incidents_active_application_identity",
      ),
    );

    query.mockClear();
    await new MonitoringIncidents1791370000000().down(runner);
    expect(query).toHaveBeenCalledTimes(7);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TABLE "monitoring_incidents"'),
    );
  });
});
