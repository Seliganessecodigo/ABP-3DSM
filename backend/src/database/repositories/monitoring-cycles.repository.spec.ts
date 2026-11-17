import { MonitoringCyclesRepository } from './monitoring-cycles.repository'

describe('MonitoringCyclesRepository operational queries', () => {
  it('lists cycles newest first and returns a stable latest record', async () => {
    const latestQuery = { orderBy: jest.fn(), addOrderBy: jest.fn(), getOne: jest.fn() }
    latestQuery.orderBy.mockReturnValue(latestQuery)
    latestQuery.addOrderBy.mockReturnValue(latestQuery)
    latestQuery.getOne.mockResolvedValue({ id: 'cycle-1' })
    const repository = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: 'cycle-1' }], 1]),
      createQueryBuilder: jest.fn().mockReturnValue(latestQuery),
    }
    const cycles = new MonitoringCyclesRepository(repository as never)

    await expect(cycles.list(2, 10)).resolves.toEqual({ items: [{ id: 'cycle-1' }], total: 1, page: 2, limit: 10 })
    expect(repository.findAndCount).toHaveBeenCalledWith({ order: { startedAt: 'DESC', id: 'ASC' }, skip: 10, take: 10 })
    await expect(cycles.latest()).resolves.toEqual({ id: 'cycle-1' })
    expect(latestQuery.orderBy).toHaveBeenCalledWith('cycle.startedAt', 'DESC')
    expect(latestQuery.addOrderBy).toHaveBeenCalledWith('cycle.id', 'ASC')
  })
})
