import { MonitoringSettingsRepository } from './monitoring-settings.repository'
import { MonitoringSettingsEntity } from '../entities/monitoring-settings.entity'

describe('MonitoringSettingsRepository', () => {
  it('reads, locks, and updates the global state through the supplied persistence context', async () => {
    const current = { id: 'global', paused: false, configurationVersion: 'version-1' }
    const query = { setLock: jest.fn(), where: jest.fn(), getOne: jest.fn() }
    query.setLock.mockReturnValue(query)
    query.where.mockReturnValue(query)
    query.getOne.mockResolvedValue(current)
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(current), findOneByOrFail: jest.fn().mockResolvedValue(current),
      save: jest.fn().mockImplementation((value) => value), createQueryBuilder: jest.fn().mockReturnValue(query),
    }
    const managerRepository = { ...repository }
    const version = { id: 'version-2', createdAt: new Date(1) }
    const versions = { create: jest.fn(value => value), save: jest.fn().mockResolvedValue(version) }
    const manager = { getRepository: jest.fn(entity => entity === MonitoringSettingsEntity ? managerRepository : versions) }
    const settings = new MonitoringSettingsRepository(repository as never)

    await expect(settings.get()).resolves.toBe(current)
    await expect(settings.get(manager as never)).resolves.toBe(current)
    await expect(settings.isPaused()).resolves.toBe(false)
    await settings.getForUpdate(manager as never)
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write')
    expect(query.where).toHaveBeenCalledWith('settings.id = :id', { id: 'global' })
    await settings.setPaused(true, { actor: 'admin', reason: 'Maintenance' }, manager as never)
    expect(versions.save).toHaveBeenCalledWith({ paused: true, previousVersion: 'version-1', actorType: 'user', actor: 'admin', reason: 'Maintenance' })
    expect(managerRepository.save).toHaveBeenCalledWith({ id: 'global', paused: true, configurationVersion: 'version-2', updatedAt: version.createdAt })
  })

  it('fails closed when the seeded global setting is missing', async () => {
    const settings = new MonitoringSettingsRepository({ findOneBy: jest.fn().mockResolvedValue(null) } as never)
    await expect(settings.isPaused()).rejects.toThrow('Monitoring settings are unavailable')
  })
})
