import { aggregateEnvironmentalScopeSeries } from './environmental-scope-series'
import type { PersistedEnvironmentalInterval } from './persisted-environmental-period'

const from = '2026-10-01T00:00:00.000Z'
const to = '2026-10-01T02:00:00.000Z'
function observation(
  energy: string,
  carbon: string | null,
): PersistedEnvironmentalInterval {
  return {
    id: 'capture',
    intervalStart: from,
    intervalEnd: '2026-10-01T01:00:00.000Z',
    collectedAt: to,
    energyKwh: energy,
    carbonGrams: carbon,
    calculationEvidence: null,
  }
}

describe('aggregateEnvironmentalScopeSeries', () => {
  it('sums applications independently and preserves gaps and independent coverage', () => {
    const points = aggregateEnvironmentalScopeSeries(from, to, 'hour', [
      [observation('1', '85')],
      [observation('2', null)],
      [],
    ])
    expect(points).toHaveLength(2)
    expect(points[0]).toMatchObject({
      energy: { value: 3 },
      emissions: { value: 85 },
      coverage: { energy: 2 / 3, emissions: 1 / 3 },
    })
    expect(points[1]).toMatchObject({
      energy: { value: null },
      emissions: { value: null },
      coverage: { energy: 0, emissions: 0 },
    })
  })
  it('keeps legitimate zero distinct from an empty scope', () => {
    expect(
      aggregateEnvironmentalScopeSeries(from, to, 'day', [
        [observation('0', '0')],
      ])[0].energy.value,
    ).toBe(0)
    expect(
      aggregateEnvironmentalScopeSeries(from, to, 'day', [])[0],
    ).toMatchObject({ energy: { value: null }, emissions: { value: null } })
  })
})
