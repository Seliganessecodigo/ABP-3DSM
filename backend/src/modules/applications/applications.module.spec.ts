import { createMonitoringScheduler } from './applications.module'

describe('ApplicationsModule monitoring providers', () => {
  afterEach(() => {
    delete process.env.MONITORING_SCHEDULE_INTERVAL_SECONDS
    jest.useRealTimers()
  })

  it('creates a scheduler wired to the monitoring cycle runner', async () => {
    jest.useFakeTimers()
    process.env.MONITORING_SCHEDULE_INTERVAL_SECONDS = '1'
    const runner = { run: jest.fn().mockResolvedValue(undefined) }
    const scheduler = createMonitoringScheduler(runner as never)

    scheduler.start()
    await jest.advanceTimersByTimeAsync(1000)

    expect(runner.run).toHaveBeenCalledTimes(1)
    scheduler.stop()
  })
})
