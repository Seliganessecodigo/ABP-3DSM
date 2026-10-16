import { Repository } from "typeorm";
import { MonitoringIncidentEntity } from "../entities/monitoring-incident.entity";
import { MonitoringIncidentsRepository } from "./monitoring-incidents.repository";

describe("MonitoringIncidentsRepository", () => {
  it("finds an active incident for global and application identities", async () => {
    const findOne = jest.fn().mockResolvedValue({ id: "incident-1" });
    const repository = new MonitoringIncidentsRepository({
      findOne,
      manager: {},
    } as unknown as Repository<MonitoringIncidentEntity>);

    await expect(
      repository.findActive("metrics-aggregator", null, "services"),
    ).resolves.toMatchObject({ id: "incident-1" });
    await expect(
      repository.findActive("metrics-aggregator", "app-1", "metrics"),
    ).resolves.toMatchObject({ id: "incident-1" });
    expect(findOne).toHaveBeenCalledTimes(2);
  });

  it("persists created and updated incidents through the repository boundary", async () => {
    const entity = { id: "incident-1" };
    const save = jest.fn().mockResolvedValue(entity);
    const create = jest.fn().mockReturnValue(entity);
    const repository = new MonitoringIncidentsRepository({
      create,
      save,
      manager: {},
    } as unknown as Repository<MonitoringIncidentEntity>);

    await expect(
      repository.create({ source: "metrics-aggregator" }),
    ).resolves.toBe(entity);
    await expect(
      repository.save(entity as MonitoringIncidentEntity),
    ).resolves.toBe(entity);
    expect(create).toHaveBeenCalledWith({ source: "metrics-aggregator" });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("applies filters, newest-first ordering, and offset pagination", async () => {
    const query = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[{ id: "incident-1" }], 21]),
    };
    const repository = new MonitoringIncidentsRepository({
      createQueryBuilder: jest.fn().mockReturnValue(query),
      manager: {},
    } as unknown as Repository<MonitoringIncidentEntity>);

    await expect(
      repository.list({
        applicationId: "app-1",
        source: "metrics-aggregator",
        integration: "metrics",
        status: "RECOVERING",
        page: 3,
        limit: 10,
      }),
    ).resolves.toEqual({
      items: [{ id: "incident-1" }],
      total: 21,
      page: 3,
      limit: 10,
    });
    expect(query.andWhere).toHaveBeenCalledTimes(4);
    expect(query.orderBy).toHaveBeenCalledWith("incident.openedAt", "DESC");
    expect(query.addOrderBy).toHaveBeenCalledWith("incident.id", "DESC");
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.take).toHaveBeenCalledWith(10);
  });
});
