import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { MonitoringSettingsEntity } from '../entities/monitoring-settings.entity'

@Injectable()
export class MonitoringSettingsRepository {
  constructor(
    @InjectRepository(MonitoringSettingsEntity)
    private readonly repository: Repository<MonitoringSettingsEntity>,
  ) {}

  get(manager?: EntityManager): Promise<MonitoringSettingsEntity | null> {
    return (manager?.getRepository(MonitoringSettingsEntity) ?? this.repository).findOneBy({ id: 'global' })
  }

  getForUpdate(manager: EntityManager): Promise<MonitoringSettingsEntity | null> {
    return manager.getRepository(MonitoringSettingsEntity).createQueryBuilder('settings')
      .setLock('pessimistic_write').where('settings.id = :id', { id: 'global' }).getOne()
  }

  async isPaused(): Promise<boolean> {
    const settings = await this.get()
    if (!settings) throw new Error('Monitoring settings are unavailable')
    return settings.paused
  }

  async setPaused(paused: boolean, manager?: EntityManager): Promise<MonitoringSettingsEntity> {
    const repository = manager?.getRepository(MonitoringSettingsEntity) ?? this.repository
    const current = await repository.findOneByOrFail({ id: 'global' })
    return repository.save({ ...current, paused, updatedAt: new Date() })
  }
}
