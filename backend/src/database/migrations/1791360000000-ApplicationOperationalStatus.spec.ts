import { QueryRunner } from 'typeorm'
import { ApplicationOperationalStatus1791360000000 } from './1791360000000-ApplicationOperationalStatus'

describe('ApplicationOperationalStatus1791360000000', () => {
  it('adds and removes the operational state columns', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const runner = { query } as unknown as QueryRunner
    const migration = new ApplicationOperationalStatus1791360000000()

    await migration.up(runner)
    expect(query).toHaveBeenCalledTimes(4)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "stateReason"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "lastObservationAt"'),
    )
    expect(query).toHaveBeenCalledWith(expect.stringContaining('ADD "isStale"'))
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "isCalculable"'),
    )

    query.mockClear()
    await migration.down(runner)
    expect(query).toHaveBeenCalledTimes(4)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "isCalculable"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "isStale"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "lastObservationAt"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "stateReason"'),
    )
  })
})
