import { DataSource } from "typeorm";
import { ApplicationState } from "../../database/entities/application-state";
import { ApplicationEventsRepository } from "../../database/repositories/application-events.repository";
import { IntegrationError } from "../../integrations/integration-error";
import { MetricsAggregatorAdapter } from "../../integrations/metrics-aggregator.adapter";
import { ApplicationsRepository } from "./applications.repository";
import { RemovalService } from "./removal.service";

describe("confirmação individual antes da remoção", () => {
  function setup() {
    const application = {
      id: "billing-api",
      state: ApplicationState.AVAILABLE,
    };
    const adapter = {
      fetchServices: jest.fn().mockResolvedValue([]),
      fetchService: jest.fn().mockResolvedValue({ id: application.id }),
    };
    const repository = {
      findForCollection: jest.fn().mockResolvedValue([application]),
      findMissingForUpdate: jest
        .fn()
        .mockImplementation(async (_manager, currentIds: string[]) =>
          currentIds.includes(application.id) ? [] : [application],
        ),
      markRemoved: jest
        .fn()
        .mockImplementation(async (_manager, id: string) => {
          if (id === application.id)
            application.state = ApplicationState.REMOVED;
        }),
    };
    const events = { appendInTransaction: jest.fn() };
    const database = {
      transaction: jest
        .fn()
        .mockImplementation(async (operation) => operation({})),
    };
    const service = new RemovalService(
      adapter as unknown as MetricsAggregatorAdapter,
      database as unknown as DataSource,
      repository as unknown as ApplicationsRepository,
      events as unknown as ApplicationEventsRepository,
    );
    return { service, adapter, repository, events, database, application };
  }

  it("mantém o serviço omitido da lista quando a consulta individual ainda o encontra", async () => {
    const { service, application, repository, events } = setup();
    const result = await service.reconcile("cycle-1", []);
    expect(result.retainedServices).toEqual([{ id: "billing-api" }]);
    expect(application.state).toBe(ApplicationState.AVAILABLE);
    expect(repository.markRemoved).not.toHaveBeenCalled();
    expect(events.appendInTransaction).not.toHaveBeenCalled();
  });

  it.each([
    new IntegrationError("UPSTREAM_UNAVAILABLE", 500),
    new IntegrationError("UPSTREAM_TIMEOUT"),
    new IntegrationError("INVALID_UPSTREAM_RESPONSE"),
  ])(
    "não confirma remoção se a consulta individual falhar: %s",
    async (error) => {
      const { service, adapter, repository } = setup();
      adapter.fetchService.mockRejectedValue(error);
      await expect(service.reconcile("cycle-1", [])).resolves.toEqual({
        removedCount: 0,
        retainedServices: [],
        failures: [{ applicationId: "billing-api", error }],
      });
      expect(repository.markRemoved).not.toHaveBeenCalled();
    },
  );

  it("confirma remoção com ausência na lista e 404 individual, consultando antes da transação", async () => {
    const { service, adapter, repository, events, database } = setup();
    adapter.fetchService.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 404),
    );
    await expect(service.reconcile("cycle-1", [])).resolves.toEqual({
      removedCount: 1,
      retainedServices: [],
      failures: [],
    });
    expect(adapter.fetchService.mock.invocationCallOrder[0]).toBeLessThan(
      database.transaction.mock.invocationCallOrder[0],
    );
    expect(repository.markRemoved).toHaveBeenCalledWith(
      expect.anything(),
      "billing-api",
      expect.any(Date),
    );
    expect(events.appendInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        applicationId: "billing-api",
        kind: "removed",
        details: expect.objectContaining({
          confirmation: "service-detail-404",
        }),
      }),
    );
  });

  it("não consulta individualmente serviços presentes na lista válida", async () => {
    const { service, adapter, repository } = setup();
    await service.reconcile("cycle-1", [{ id: "billing-api" }] as Awaited<
      ReturnType<MetricsAggregatorAdapter["fetchServices"]>
    >);
    expect(adapter.fetchService).not.toHaveBeenCalled();
    expect(repository.markRemoved).not.toHaveBeenCalled();
  });

  it("não transforma cancelamento em remoção nem abre uma transação", async () => {
    const { service, adapter, database } = setup();
    adapter.fetchService.mockRejectedValue(
      new IntegrationError("REQUEST_CANCELLED"),
    );
    await expect(service.reconcile("cycle-1", [])).rejects.toMatchObject({
      code: "REQUEST_CANCELLED",
    });
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it("consulta a lista quando não recebe snapshot e rejeita uma falha sem confirmar ausências", async () => {
    const { service, adapter, repository } = setup();
    adapter.fetchServices.mockRejectedValue(
      new IntegrationError("INVALID_UPSTREAM_RESPONSE"),
    );
    await expect(service.reconcile("cycle-1")).rejects.toMatchObject({
      code: "INVALID_UPSTREAM_RESPONSE",
    });
    expect(repository.markRemoved).not.toHaveBeenCalled();
  });

  it("preserva uma aplicação sem confirmação enquanto remove outra confirmada", async () => {
    const { service, adapter, repository, application } = setup();
    const candidates = [
      application,
      { id: "retired-api", state: ApplicationState.AVAILABLE },
    ];
    repository.findForCollection.mockResolvedValue(candidates);
    repository.findMissingForUpdate.mockResolvedValue(candidates);
    const error = new IntegrationError("UPSTREAM_UNAVAILABLE", 500);
    adapter.fetchService.mockImplementation(async (id) => {
      throw id === "billing-api"
        ? error
        : new IntegrationError("UPSTREAM_UNAVAILABLE", 404);
    });
    await expect(service.reconcile("cycle-1", [])).resolves.toEqual({
      removedCount: 1,
      retainedServices: [],
      failures: [{ applicationId: "billing-api", error }],
    });
    expect(repository.markRemoved).toHaveBeenCalledTimes(1);
    expect(repository.markRemoved).toHaveBeenCalledWith(
      expect.anything(),
      "retired-api",
      expect.any(Date),
    );
    expect(application.state).toBe(ApplicationState.AVAILABLE);
  });

  it("revalida os candidatos sob lock e não duplica uma remoção já persistida", async () => {
    const { service, adapter, repository, events } = setup();
    adapter.fetchService.mockRejectedValue(
      new IntegrationError("UPSTREAM_UNAVAILABLE", 404),
    );
    repository.findMissingForUpdate.mockResolvedValue([]);
    await expect(service.reconcile("cycle-1", [])).resolves.toEqual({
      removedCount: 0,
      retainedServices: [],
      failures: [],
    });
    expect(events.appendInTransaction).not.toHaveBeenCalled();
  });

  it("não grava remoções se o ciclo for cancelado depois da confirmação", async () => {
    const { service, adapter, database } = setup();
    const controller = new AbortController();
    adapter.fetchService.mockImplementation(async () => {
      controller.abort();
      throw new IntegrationError("UPSTREAM_UNAVAILABLE", 404);
    });
    await expect(
      service.reconcile("cycle-1", [], controller.signal),
    ).rejects.toMatchObject({ code: "REQUEST_CANCELLED" });
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
