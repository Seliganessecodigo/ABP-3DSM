import { MonitoringSettingsRepository } from './monitoring-settings.repository'

describe('MonitoringSettingsRepository', () => {
  it('reads, locks, and updates the global state through the supplied persistence context', async () => {
    const current = { id: 'global', paused: false }
    const query = { setLock: jest.fn(), where: jest.fn(), getOne: jest.fn() }
    query.setLock.mockReturnValue(query)
    query.where.mockReturnValue(query)
    query.getOne.mockResolvedValue(current)
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(current), findOneByOrFail: jest.fn().mockResolvedValue(current),
      save: jest.fn().mockImplementation((value) => value), createQueryBuilder: jest.fn().mockReturnValue(query),
    }
    const managerRepository = { ...repository }
    const manager = { getRepository: jest.fn().mockReturnValue(managerRepository) }
    const settings = new MonitoringSettingsRepository(repository as never)

    await expect(settings.get()).resolves.toBe(current)
    await expect(settings.isPaused()).resolves.toBe(false)
    await settings.getForUpdate(manager as never)
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write')
    expect(query.where).toHaveBeenCalledWith('settings.id = :id', { id: 'global' })
    await settings.setPaused(true)
    await settings.setPaused(false, manager as never)
    expect(manager.getRepository).toHaveBeenCalled()
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ paused: true }))
    expect(managerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ paused: false }))
  })

  it('fails closed when the seeded global setting is missing', async () => {
    const settings = new MonitoringSettingsRepository({ findOneBy: jest.fn().mockResolvedValue(null) } as never)
    await expect(settings.isPaused()).rejects.toThrow('Monitoring settings are unavailable')
  })
})
