import { MonitoringIncidentsRepository } from './monitoring-incidents.repository'

describe('MonitoringIncidentsRepository health queries', () => {
  it('aggregates health by integration and limits the latest incident list', async () => {
    const query = {
      select: jest.fn(), addSelect: jest.fn(), groupBy: jest.fn(), getRawMany: jest.fn(),
    }
    query.select.mockReturnValue(query)
    query.addSelect.mockReturnValue(query)
    query.groupBy.mockReturnValue(query)
    query.getRawMany.mockResolvedValue([{ integration: 'metrics', openCount: '1' }])
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
      find: jest.fn().mockResolvedValue([{ id: 'incident-1' }]),
    }
    const incidents = new MonitoringIncidentsRepository(repository as never)

    await expect(incidents.healthByIntegration()).resolves.toEqual([{ integration: 'metrics', openCount: '1' }])
    expect(query.addSelect).toHaveBeenCalledTimes(6)
    expect(query.groupBy).toHaveBeenCalledWith('incident.integration')
    await expect(incidents.recentForHealth(7)).resolves.toEqual([{ id: 'incident-1' }])
    expect(repository.find).toHaveBeenCalledWith({ order: { latestAttemptAt: 'DESC', id: 'ASC' }, take: 7 })
  })
})
