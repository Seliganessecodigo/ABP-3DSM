import { QueryRunner } from 'typeorm'
import { AuditActorIdentity1793300000000 } from './1793300000000-AuditActorIdentity'

describe('AuditActorIdentity1793300000000', () => {
  it('adds and removes explicit actor identity columns', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const runner = { query } as unknown as QueryRunner
    const migration = new AuditActorIdentity1793300000000()

    await migration.up(runner)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "actorType" character varying(32)'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "actorSystemId" character varying(128)'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "actorExternalId" character varying(128)'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD "actorLabel" character varying(160)'),
    )

    query.mockClear()
    await migration.down(runner)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "actorLabel"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "actorExternalId"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "actorSystemId"'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP COLUMN "actorType"'),
    )
  })
})
