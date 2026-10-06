import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  MonitoringCycleEntity,
  MonitoringCycleStatus,
} from '../entities/monitoring-cycle.entity'

@Injectable()
export class MonitoringCyclesRepository {
  constructor(
    @InjectRepository(MonitoringCycleEntity)
    private readonly repository: Repository<MonitoringCycleEntity>,
  ) {}

  start(details?: Record<string, unknown>): Promise<MonitoringCycleEntity> {
    return this.repository.save(
      this.repository.create({
        status: MonitoringCycleStatus.RUNNING,
        startedAt: new Date(),
        details: details ?? null,
      }),
    )
  }

  async finish(
    id: string,
    result: Pick<
      MonitoringCycleEntity,
      'status' | 'discoveredCount' | 'processedCount' | 'failedCount' | 'persistedCount'
    > & { details?: Record<string, unknown> | null },
  ): Promise<MonitoringCycleEntity> {
    const cycle = await this.repository.findOneByOrFail({ id })
    const finishedAt = new Date()
    return this.repository.save({
      ...cycle,
      id,
      ...result,
      details: result.details ?? null,
      finishedAt,
      durationMs: String(finishedAt.getTime() - cycle.startedAt.getTime()),
    })
  }
}
