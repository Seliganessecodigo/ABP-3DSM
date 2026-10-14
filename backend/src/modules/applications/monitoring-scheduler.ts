import {
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common'

export class MonitoringScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer: ReturnType<typeof setInterval> | undefined
  private cycleInProgress = false
  private readonly logger = new Logger(MonitoringScheduler.name)

  constructor(
    private readonly intervalSeconds: number,
    private readonly runCycle: () => Promise<void> | void,
  ) {}

  onApplicationBootstrap(): void {
    this.start()
  }

  onApplicationShutdown(): void {
    this.stop()
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      void this.runScheduledCycle()
    }, this.intervalSeconds * 1000)
  }

  stop(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  private async runScheduledCycle(): Promise<void> {
    if (this.cycleInProgress) return
    this.cycleInProgress = true
    try {
      await this.runCycle()
    } catch {
      this.logger.error('A scheduled monitoring cycle failed unexpectedly.')
    } finally {
      this.cycleInProgress = false
    }
  }
}
