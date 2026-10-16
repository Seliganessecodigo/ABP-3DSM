import { MonitoringScheduler } from "./monitoring-scheduler";

describe("agendador de monitoramento", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("inicia o primeiro ciclo somente depois do intervalo configurado", async () => {
    jest.useFakeTimers();
    const runCycle = jest.fn().mockResolvedValue(undefined);
    const scheduler = new MonitoringScheduler(60, runCycle);

    scheduler.start();
    await jest.advanceTimersByTimeAsync(59_999);
    expect(runCycle).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(runCycle).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it("não inicia outro ciclo enquanto o anterior ainda está executando", async () => {
    jest.useFakeTimers();
    let releaseFirstCycle!: () => void;
    const firstCycle = new Promise<void>((resolve) => {
      releaseFirstCycle = resolve;
    });
    const runCycle = jest
      .fn<Promise<void>, []>()
      .mockReturnValueOnce(firstCycle)
      .mockResolvedValue(undefined);
    const scheduler = new MonitoringScheduler(1, runCycle);

    scheduler.start();
    await jest.advanceTimersByTimeAsync(2_000);
    expect(runCycle).toHaveBeenCalledTimes(1);

    releaseFirstCycle();
    await firstCycle;
    await jest.advanceTimersByTimeAsync(1_000);
    expect(runCycle).toHaveBeenCalledTimes(2);

    scheduler.stop();
  });

  it("expõe o tick perdido depois que o ciclo ativo termina", async () => {
    jest.useFakeTimers();
    let releaseFirstCycle!: () => void;
    const firstCycle = new Promise<void>((resolve) => {
      releaseFirstCycle = resolve;
    });
    const runCycle = jest.fn().mockReturnValue(firstCycle);
    const recordSkippedCycle = jest.fn().mockResolvedValue(undefined);
    const scheduler = new MonitoringScheduler(1, runCycle, recordSkippedCycle);

    scheduler.start();
    await jest.advanceTimersByTimeAsync(1_000);
    await jest.advanceTimersByTimeAsync(1_000);
    expect(runCycle).toHaveBeenCalledTimes(1);
    expect(recordSkippedCycle).not.toHaveBeenCalled();

    releaseFirstCycle();
    await firstCycle;
    await jest.advanceTimersByTimeAsync(0);

    expect(recordSkippedCycle).toHaveBeenCalledWith(expect.any(Date));
    scheduler.stop();
  });
});
