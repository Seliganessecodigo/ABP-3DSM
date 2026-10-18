import { QueryRunner } from 'typeorm'
import { MethodologyMetadata1791380000000 } from './1791380000000-MethodologyMetadata'

describe('MethodologyMetadata1791380000000', () => {
  it('adds versioned methodology metadata and immutable result snapshots', async () => {
    const query = jest.fn().mockResolvedValue(undefined)
    const runner = { query } as unknown as QueryRunner

    await new MethodologyMetadata1791380000000().up(runner)

    expect(query).toHaveBeenCalledTimes(2)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE "calculation_configs" ADD "methodology" jsonb'),
    )
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE "collections" ADD "methodologySnapshot" jsonb'),
    )

    query.mockClear()
    await new MethodologyMetadata1791380000000().down(runner)

    expect(query).toHaveBeenCalledTimes(2)
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "collections" DROP COLUMN "methodologySnapshot"',
    )
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "calculation_configs" DROP COLUMN "methodology"',
    )
  })
})
