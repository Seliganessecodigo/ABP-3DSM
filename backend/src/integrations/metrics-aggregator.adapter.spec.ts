import { createServer, Server } from "node:http";
import { AddressInfo } from "node:net";
import { MetricsAggregatorAdapter } from "./metrics-aggregator.adapter";

describe("Agregador de Métricas", () => {
  let server: Server;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      server = undefined as unknown as Server;
    }
    jest.restoreAllMocks();
  });

  it("aceita o snapshot completo com cidade nula e normaliza os campos documentados", async () => {
    server = createServer((request, response) => {
      if (request.url !== "/services") {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify([
          {
            id: "billing-api",
            name: "Billing API",
            location: {
              region_code: "br-sudeste",
              country: "Brazil",
              region: "Sudeste",
              city: null,
              latitude: -23.5505,
              longitude: -46.6333,
            },
            metrics_path: "/metrics/billing-api",
          },
        ]),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    const adapter = new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`);

    await expect(adapter.fetchServices()).resolves.toEqual([
      {
        id: "billing-api",
        name: "Billing API",
        location: {
          regionCode: "br-sudeste",
          country: "Brazil",
          region: "Sudeste",
          city: null,
          latitude: -23.5505,
          longitude: -46.6333,
        },
        metricsPath: "/metrics/billing-api",
      },
    ]);
  });

  it("rejeita o snapshot inteiro quando um item não contém localização obrigatória", async () => {
    server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify([
          {
            id: "billing-api",
            name: "Billing API",
            metrics_path: "/metrics/billing-api",
            location: {
              region_code: "br-sudeste",
              country: "Brazil",
              region: "Sudeste",
              latitude: -23.5505,
              longitude: -46.6333,
            },
          },
          {
            id: "broken-api",
            name: "Broken API",
            metrics_path: "/metrics/broken-api",
            location: {
              region_code: "br-sudeste",
              region: "Sudeste",
              latitude: -23.5505,
              longitude: -46.6333,
            },
          },
        ]),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    const adapter = new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`);

    await expect(adapter.fetchServices()).rejects.toMatchObject({
      code: "INVALID_UPSTREAM_RESPONSE",
    });
  });

  it("classifica falha HTTP da lista como indisponibilidade da origem", async () => {
    server = createServer((_request, response) => {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(
        JSON.stringify({ error: "unavailable", message: "private detail" }),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    const adapter = new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`);

    await expect(adapter.fetchServices()).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      status: 500,
    });
  });

  it("repete uma resposta temporária e retorna quando a origem se recupera", async () => {
    let attempts = 0;
    server = createServer((_request, response) => {
      attempts++;
      if (attempts === 1) {
        response.writeHead(503).end();
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end("[]");
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    await expect(
      new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`).fetchServices(),
    ).resolves.toEqual([]);
    expect(attempts).toBe(2);
  });

  it("respeita Retry-After em 429 e limita falhas contínuas a três tentativas", async () => {
    let attempts = 0;
    server = createServer((_request, response) => {
      attempts++;
      if (attempts === 1) {
        response.writeHead(429, { "retry-after": "0" }).end();
        return;
      }
      response.writeHead(503).end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    await expect(
      new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`).fetchServices(),
    ).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      status: 503,
      httpAttempts: 3,
    });
    expect(attempts).toBe(3);
  });

  it("does not retry a permanent 4xx response", async () => {
    let attempts = 0;
    server = createServer((_request, response) => {
      attempts++;
      response.writeHead(400).end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    await expect(
      new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`).fetchServices(),
    ).rejects.toMatchObject({ status: 400, httpAttempts: 1 });
    expect(attempts).toBe(1);
  });

  it("retries a temporary network failure within the logical call", async () => {
    const request = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("connection reset"))
      .mockResolvedValueOnce(
        new Response("[]", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    try {
      await expect(
        new MetricsAggregatorAdapter("https://metrics.example").fetchServices(),
      ).resolves.toEqual([]);
      expect(request).toHaveBeenCalledTimes(2);
    } finally {
      request.mockRestore();
    }
  });

  it("cancels retry waiting without issuing another request", async () => {
    const request = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("busy", { status: 503 }));
    const controller = new AbortController();
    const result = new MetricsAggregatorAdapter(
      "https://metrics.example",
    ).fetchServices(controller.signal);
    setTimeout(() => controller.abort(), 5);

    await expect(result).rejects.toMatchObject({ code: "REQUEST_CANCELLED" });
    expect(request).toHaveBeenCalledTimes(1);
    request.mockRestore();
  });

  it("does not block cancellation while discarding an error response body", async () => {
    const controller = new AbortController();
    const request = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers(),
      body: { cancel: () => new Promise<void>(() => {}) },
    } as unknown as Response);

    const result = new MetricsAggregatorAdapter(
      "https://metrics.example",
    ).fetchServices(controller.signal);
    setTimeout(() => controller.abort(), 5);

    await expect(result).rejects.toMatchObject({ code: "REQUEST_CANCELLED" });
    expect(request).toHaveBeenCalledTimes(1);
    request.mockRestore();
  });

  it("retries a timed-out attempt while staying inside the total call deadline", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
    let attempts = 0;
    const request = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation((_input, init) => {
        attempts++;
        if (attempts === 2)
          return Promise.resolve(
            new Response("[]", {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          );
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            {
              once: true,
            },
          );
        });
      });

    try {
      const result = new MetricsAggregatorAdapter(
        "https://metrics.example",
      ).fetchServices();
      await jest.advanceTimersByTimeAsync(10_200);
      await expect(result).resolves.toEqual([]);
      expect(attempts).toBe(2);
    } finally {
      request.mockRestore();
      jest.restoreAllMocks();
      jest.useRealTimers();
    }
  });

  it("retries when the response body exceeds the per-attempt timeout", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
    let attempts = 0;
    const request = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation((_input, init) => {
        attempts++;
        if (attempts === 2)
          return Promise.resolve({
            ok: true,
            json: async () => [],
          } as Response);
        return Promise.resolve({
          ok: true,
          json: () =>
            new Promise((_resolve, reject) => {
              init?.signal?.addEventListener(
                "abort",
                () => reject(new Error("body timeout")),
                { once: true },
              );
            }),
        } as Response);
      });

    try {
      const result = new MetricsAggregatorAdapter(
        "https://metrics.example",
      ).fetchServices();
      await jest.advanceTimersByTimeAsync(10_200);
      await expect(result).resolves.toEqual([]);
      expect(attempts).toBe(2);
    } finally {
      request.mockRestore();
      jest.restoreAllMocks();
      jest.useRealTimers();
    }
  });

  it("rejeita JSON inválido sem produzir um snapshot parcial", async () => {
    server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end('[{"id":"broken"}');
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;

    const adapter = new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`);

    await expect(adapter.fetchServices()).rejects.toMatchObject({
      code: "INVALID_UPSTREAM_RESPONSE",
    });
  });
  it("lê métricas documentadas e registra apenas o horário de recebimento do GreenER", async () => {
    server = createServer((request, response) => {
      expect(request.url).toBe("/metrics/billing-api");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          collection_interval_seconds: 27,
          metrics: {
            cpu_percent: 62.67,
            memory_gb: 3.17,
            disk_gb: 19.26,
            network_gb: 0.45,
          },
        }),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;
    const before = new Date();
    const result = await new MetricsAggregatorAdapter(
      `http://127.0.0.1:${port}`,
    ).fetchMetrics("billing-api");
    expect(result).toMatchObject({
      collectionIntervalSeconds: 27,
      metrics: {
        cpuPercent: 62.67,
        memoryGb: 3.17,
        diskGb: 19.26,
        networkGb: 0.45,
      },
    });
    expect(result.receivedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(result.receivedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it.each([404, 500])(
    "classifica HTTP %i em métricas sem inferir remoção",
    async (status) => {
      server = createServer((_request, response) =>
        response.writeHead(status).end(),
      );
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      const { port } = server.address() as AddressInfo;
      await expect(
        new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`).fetchMetrics(
          "billing-api",
        ),
      ).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE", status });
    },
  );

  it.each([
    {
      collection_interval_seconds: 0.5,
      metrics: { cpu_percent: 20, memory_gb: 1, disk_gb: 2, network_gb: 3 },
    },
    {
      collection_interval_seconds: 27,
      metrics: { cpu_percent: 101, memory_gb: 1, disk_gb: 2, network_gb: 3 },
    },
    {
      collection_interval_seconds: 27,
      metrics: { cpu_percent: 20, memory_gb: 1, disk_gb: 2 },
    },
  ])("rejeita métricas fora do schema", async (payload) => {
    server = createServer((_request, response) =>
      response.writeHead(200).end(JSON.stringify(payload)),
    );
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;
    await expect(
      new MetricsAggregatorAdapter(`http://127.0.0.1:${port}`).fetchMetrics(
        "billing-api",
      ),
    ).rejects.toMatchObject({ code: "INVALID_UPSTREAM_RESPONSE" });
  });
});
