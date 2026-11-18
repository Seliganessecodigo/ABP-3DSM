import { ApplicationsRepository } from './applications.repository'

describe('ApplicationsRepository.monitoringHealth', () => {
  it('returns persisted catalog, stale, delayed and observation aggregates', async () => {
    const query = { select: jest.fn(), addSelect: jest.fn(), getRawOne: jest.fn() }
    query.select.mockReturnValue(query)
    query.addSelect.mockReturnValue(query)
    query.getRawOne.mockResolvedValue({ knownCount: '12', staleCount: '3', delayedCount: '2', lastObservationAt: new Date(0) })
    const applications = new ApplicationsRepository({ createQueryBuilder: jest.fn().mockReturnValue(query) } as never)

    await expect(applications.monitoringHealth()).resolves.toEqual({
      knownCount: 12, staleCount: 3, delayedCount: 2, lastObservationAt: new Date(0),
    })
    expect(query.addSelect).toHaveBeenCalledTimes(3)
  })

  it('keeps absent aggregates as empty counts and an absent observation', async () => {
    const query = { select: jest.fn(), addSelect: jest.fn(), getRawOne: jest.fn().mockResolvedValue(undefined) }
    query.select.mockReturnValue(query)
    query.addSelect.mockReturnValue(query)
    const applications = new ApplicationsRepository({ createQueryBuilder: jest.fn().mockReturnValue(query) } as never)
    await expect(applications.monitoringHealth()).resolves.toEqual({
      knownCount: 0, staleCount: 0, delayedCount: 0, lastObservationAt: null,
    })
  })
})
