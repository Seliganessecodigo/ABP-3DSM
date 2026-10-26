import { Test } from "@nestjs/testing";
import { MonitoringIncidentsController } from "./monitoring-incidents.controller";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { configureOpenApi } from "../../openapi";

describe("monitoring incidents API", () => {
  it("returns filtered, paginated incident history through a public GET route", async () => {
    const incidents = {
      items: [{ id: "incident-1", status: "OPEN" }],
      total: 1,
      page: 2,
      limit: 10,
    };
    const service = { list: jest.fn().mockResolvedValue(incidents) };
    const moduleRef = await Test.createTestingModule({
      controllers: [MonitoringIncidentsController],
      providers: [{ provide: MonitoringIncidentsService, useValue: service }],
    }).compile();
    const app = moduleRef.createNestApplication();
    configureOpenApi(app);
    await app.listen(0, "127.0.0.1");

    try {
      const response = await fetch(
        new URL(
          "/monitoring/incidents?applicationId=app-1&source=metrics-aggregator&integration=metrics&status=OPEN&page=2&limit=10",
          await app.getUrl(),
        ),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(incidents);
      expect(service.list).toHaveBeenCalledWith({
        applicationId: "app-1",
        source: "metrics-aggregator",
        integration: "metrics",
        status: "OPEN",
        page: 2,
        limit: 10,
      });
      const openApiResponse = await fetch(
        new URL("/openapi.json", await app.getUrl()),
      );
      const document = (await openApiResponse.json()) as {
        paths: Record<
          string,
          { get?: { parameters?: Array<{ name: string }> } }
        >;
      };
      expect(document.paths["/monitoring/incidents"].get?.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "applicationId" }),
          expect.objectContaining({ name: "source" }),
          expect.objectContaining({ name: "integration" }),
          expect.objectContaining({ name: "status" }),
          expect.objectContaining({ name: "page" }),
          expect.objectContaining({ name: "limit" }),
        ]),
      );
    } finally {
      await app.close();
    }
  });
});
