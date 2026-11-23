import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { MonitoringSettingsEntity } from '../entities/monitoring-settings.entity'
import { MonitoringControlVersionEntity } from '../entities/monitoring-control-version.entity'

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

  async setPaused(paused: boolean, author: { actor: string; reason: string }, manager: EntityManager): Promise<MonitoringSettingsEntity> {
    const repository = manager.getRepository(MonitoringSettingsEntity)
    const current = await repository.findOneByOrFail({ id: 'global' })
    const versions = manager.getRepository(MonitoringControlVersionEntity)
    const version = await versions.save(versions.create({
      paused, previousVersion: current.configurationVersion,
      actorType: 'user', actor: author.actor, reason: author.reason,
    }))
    return repository.save({ ...current, paused, configurationVersion: version.id, updatedAt: version.createdAt })
  }
}
