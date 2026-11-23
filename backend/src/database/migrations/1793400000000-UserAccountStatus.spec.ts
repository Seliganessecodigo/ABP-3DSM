import { QueryRunner } from 'typeorm'
import { UserAccountStatus1793400000000 } from './1793400000000-UserAccountStatus'

describe('UserAccountStatus1793400000000', () => {
  it('maps legacy active flags to active or deactivated account states', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const runner = { query } as unknown as QueryRunner
    const migration = new UserAccountStatus1793400000000()

    await migration.up(runner)

    expect(query).toHaveBeenCalledWith(expect.stringContaining(`CASE WHEN "isActive" THEN 'ACTIVE'::"public"."users_status_enum" ELSE 'DEACTIVATED'::"public"."users_status_enum" END`))
    expect(query).toHaveBeenCalledWith('ALTER TABLE "users" DROP COLUMN "isActive"')
  })

  it('collapses non-active states when reverting the migration', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const runner = { query } as unknown as QueryRunner
    const migration = new UserAccountStatus1793400000000()

    await migration.down(runner)

    expect(query).toHaveBeenCalledWith(`UPDATE "users" SET "isActive" = ("status" = 'ACTIVE')`)
  })
})
