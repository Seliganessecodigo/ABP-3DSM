import {
  aggregatePersistedEnvironmentalPeriod,
  PersistedEnvironmentalInterval,
  projectPersistedEnvironmentalInterval,
} from './persisted-environmental-period'

const firstBoundary = '2026-10-01T00:00:00.000Z'
const middleBoundary = '2026-10-01T01:00:00.000Z'
const lastBoundary = '2026-10-01T02:00:00.000Z'

function savedInterval(
  overrides: Partial<PersistedEnvironmentalInterval> = {},
): PersistedEnvironmentalInterval {
  return {
    id: 'collection-older',
    intervalStart: firstBoundary,
    intervalEnd: lastBoundary,
    collectedAt: lastBoundary,
    energyKwh: '100',
    carbonGrams: '1000',
    calculationEvidence: {
      energy: {
        modelKey: 'saved-model',
        modelVersion: 'v1',
        modelParameters: { cpuWattsAt100Percent: 100 },
        reasons: [],
      },
      carbon: {
        factorSnapshot: {
          id: 'saved-factor',
          version: 'factor-v1',
          contractVersion: 'contract-v1',
          regionCode: 'br-sudeste',
          country: 'Brazil',
          region: 'Sudeste',
          city: null,
          intensity: 10,
          unit: 'gCO2e/kWh',
          queriedAt: lastBoundary,
          source: 'saved-source',
          validFrom: null,
          validUntil: null,
        },
        reasons: [],
      },
    },
    ...overrides,
  }
}

describe('aggregatePersistedEnvironmentalPeriod', () => {
  it('uses the latest overlapping saved collection without falling back for a missing measure', () => {
    const older = savedInterval()
    const newer = savedInterval({
      id: 'collection-newer',
      intervalStart: middleBoundary,
      intervalEnd: lastBoundary,
      collectedAt: '2026-10-01T03:00:00.000Z',
      energyKwh: '20',
      carbonGrams: null,
      calculationEvidence: {
        energy: {
          modelKey: 'saved-model',
          modelVersion: 'v2',
          modelParameters: { cpuWattsAt100Percent: 200 },
          reasons: [],
        },
        carbon: {
          factorSnapshot: null,
          reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
        },
      },
    })

    const result = aggregatePersistedEnvironmentalPeriod(
      firstBoundary,
      lastBoundary,
      [older, newer],
    )

    expect(result.energy).toEqual({ value: 70, unit: 'kWh', reasons: [] })
    expect(result.emissions).toEqual({
      value: 500,
      unit: 'gCO2e',
      reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
    })
    expect(result.coverage).toEqual({ energy: 1, emissions: 0.5 })
    expect(result.contributions).toMatchObject([
      {
        collectionId: older.id,
        countedInterval: { from: firstBoundary, to: middleBoundary },
        energy: { value: 50, unit: 'kWh', reasons: [] },
        emissions: { value: 500, unit: 'gCO2e', reasons: [] },
      },
      {
        collectionId: newer.id,
        countedInterval: { from: middleBoundary, to: lastBoundary },
        energy: { value: 20, unit: 'kWh', reasons: [] },
        emissions: {
          value: null,
          unit: 'gCO2e',
          reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
        },
      },
    ])
    expect(result.exclusions).toEqual([
      {
        collectionId: newer.id,
        interval: { from: middleBoundary, to: lastBoundary },
        energyReasons: [],
        emissionsReasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }],
      },
    ])
  })
  it('normalizes offset-equivalent counted bounds to UTC', () => {
    const result = projectPersistedEnvironmentalInterval(
      savedInterval(),
      '2026-10-01T02:00:00+02:00',
      '2026-10-01T03:00:00+02:00',
    )

    expect(result.interval).toEqual({
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-01T01:00:00.000Z',
    })
  })
  it('breaks collectedAt ties by lexical collection ID independent of input order', () => {
    const observations = [
      savedInterval({ id: 'collection-z', energyKwh: '90', carbonGrams: '900' }),
      savedInterval({ id: 'collection-a', energyKwh: '10', carbonGrams: '100' }),
      savedInterval({ id: 'collection-m', energyKwh: '50', carbonGrams: '500' }),
    ]
    const forward = aggregatePersistedEnvironmentalPeriod(firstBoundary, lastBoundary, observations)
    const reverse = aggregatePersistedEnvironmentalPeriod(
      firstBoundary,
      lastBoundary,
      [...observations].reverse(),
    )

    expect(forward).toEqual(reverse)
    expect(forward.energy).toEqual({ value: 10, unit: 'kWh', reasons: [] })
    expect(forward.emissions).toEqual({ value: 100, unit: 'gCO2e', reasons: [] })
    expect(forward.contributions.map(({ collectionId }) => collectionId)).toEqual(['collection-a'])
  })
  it('restores the next active overlap when nested winners expire', () => {
    const quarter = '2026-10-01T00:00:00.000Z'
    const half = '2026-10-01T00:30:00.000Z'
    const oneAndHalf = '2026-10-01T01:30:00.000Z'
    const twoAndHalf = '2026-10-01T02:30:00.000Z'
    const threeAndHalf = '2026-10-01T03:30:00.000Z'
    const end = '2026-10-01T04:00:00.000Z'
    const result = aggregatePersistedEnvironmentalPeriod(quarter, end, [
      savedInterval({
        id: 'collection-a',
        intervalStart: quarter,
        intervalEnd: end,
        collectedAt: end,
        energyKwh: '40',
        carbonGrams: '400',
      }),
      savedInterval({
        id: 'collection-b',
        intervalStart: half,
        intervalEnd: threeAndHalf,
        collectedAt: '2026-10-01T04:01:00.000Z',
        energyKwh: '60',
        carbonGrams: '600',
      }),
      savedInterval({
        id: 'collection-c',
        intervalStart: oneAndHalf,
        intervalEnd: twoAndHalf,
        collectedAt: '2026-10-01T04:02:00.000Z',
        energyKwh: '10',
        carbonGrams: '100',
      }),
    ])

    expect(result.energy).toEqual({ value: 60, unit: 'kWh', reasons: [] })
    expect(result.emissions).toEqual({ value: 600, unit: 'gCO2e', reasons: [] })
    expect(result.coverage).toEqual({ energy: 1, emissions: 1 })
    expect(result.contributions.map(({ collectionId, countedInterval }) => ({
      collectionId,
      countedInterval,
    }))).toEqual([
      { collectionId: 'collection-a', countedInterval: { from: quarter, to: half } },
      { collectionId: 'collection-b', countedInterval: { from: half, to: oneAndHalf } },
      { collectionId: 'collection-c', countedInterval: { from: oneAndHalf, to: twoAndHalf } },
      { collectionId: 'collection-b', countedInterval: { from: twoAndHalf, to: threeAndHalf } },
      { collectionId: 'collection-a', countedInterval: { from: threeAndHalf, to: end } },
    ])
  })
})
