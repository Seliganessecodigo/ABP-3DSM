import { calculateRegionalSimulation } from './regional-simulation'
import type { CarbonFactorSnapshotInput } from './carbon-emission'

const factor = (intensity: number, version: string): CarbonFactorSnapshotInput => ({
  id: `snapshot-${version}`,
  version,
  contractVersion: '0.1.0',
  regionCode: 'br-reference',
  country: 'Brazil',
  region: 'Reference',
  city: null,
  intensity,
  unit: 'gCO2e/kWh',
  queriedAt: '2026-10-01T00:00:00Z',
  source: null,
  validFrom: null,
  validUntil: null,
})

const segment = (
  energyKwh: number,
  factorSnapshot: CarbonFactorSnapshotInput | null,
  from = '2026-10-01T00:00:00Z',
  to = '2026-10-01T00:01:00Z',
)=> ({
  interval: { from, to },
  energy: { value: energyKwh, reasons: [] },
  factorSnapshot,
})

describe('calculateRegionalSimulation', () => {
  it('keeps energy constant and reports the destination delta using preserved and current factors', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:01:00Z',
      destinationRegionCode: 'br-destination',
      segments: [segment(10, factor(300, 'reference-v1'))],
      destinationFactor: {
        regionCode: 'br-destination',
        country: 'Brazil',
        region: 'Destination',
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-01T00:02:00Z',
      },
    })

    expect(result.energy).toEqual({ value: 10, unit: 'kWh', reasons: [] })
    expect(result.reference.emissions).toEqual({ value: 3000, unit: 'gCO2e', reasons: [] })
    expect(result.destination.emissions).toEqual({ value: 1000, unit: 'gCO2e', reasons: [] })
    expect(result.difference).toEqual({
      absolute: { value: -2000, unit: 'gCO2e', reasons: [] },
      percent: { value: -2 / 3, unit: 'ratio', reasons: [] },
    })
  })

  it('keeps the absolute delta available when the reference emissions are zero', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:01:00Z',
      destinationRegionCode: 'br-destination',
      segments: [segment(10, factor(0, 'zero-reference'))],
      destinationFactor: {
        regionCode: 'br-destination',
        country: 'Brazil',
        region: 'Destination',
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-01T00:02:00Z',
      },
    })

    expect(result.difference.absolute).toEqual({ value: 1000, unit: 'gCO2e', reasons: [] })
    expect(result.difference.percent).toEqual({
      value: null,
      unit: 'ratio',
      reasons: [{ code: 'ZERO_REFERENCE' }],
    })
  })

  it('keeps the destination total but hides differences when preserved reference coverage is lower', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:02:00Z',
      destinationRegionCode: 'br-destination',
      segments: [
        segment(5, factor(300, 'reference-v1'), '2026-10-01T00:00:00Z', '2026-10-01T00:01:00Z'),
        segment(5, null, '2026-10-01T00:01:00Z', '2026-10-01T00:02:00Z'),
      ],
      destinationFactor: {
        regionCode: 'br-destination',
        country: 'Brazil',
        region: 'Destination',
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-01T00:02:00Z',
      },
    })

    expect(result.energy.value).toBe(10)
    expect(result.reference.emissions.value).toBe(1500)
    expect(result.destination.emissions.value).toBe(1000)
    expect(result.coverage).toEqual({ energy: 1, reference: 0.5, destination: 1 })
    expect(result.difference.absolute).toEqual({
      value: null,
      unit: 'gCO2e',
      reasons: [{ code: 'INCOMPATIBLE_COVERAGE' }],
    })
    expect(result.reference.emissions.reasons).toEqual([
      { code: 'PRESERVED_REFERENCE_FACTOR_UNAVAILABLE' },
    ])
  })

  it('uses each preserved reference factor in its own segment and one destination factor for the whole period', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:02:00Z',
      destinationRegionCode: 'br-destination',
      segments: [
        segment(5, factor(300, 'reference-v1'), '2026-10-01T00:00:00Z', '2026-10-01T00:01:00Z'),
        segment(5, factor(200, 'reference-v2'), '2026-10-01T00:01:00Z', '2026-10-01T00:02:00Z'),
      ],
      destinationFactor: {
        regionCode: 'br-destination',
        country: 'Brazil',
        region: 'Destination',
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-01T00:03:00Z',
      },
    })

    expect(result.reference.emissions.value).toBe(2500)
    expect(result.destination.emissions.value).toBe(1000)
    expect(result.reference.factorSnapshots).toHaveLength(2)
    expect(result.difference.absolute.value).toBe(-1500)
    expect(result.difference.percent.value).toBe(-0.6)
  })

  it('preserves the reference when the current destination factor is unavailable', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:01:00Z',
      destinationRegionCode: 'br-destination',
      segments: [segment(10, factor(300, 'reference-v1'))],
      destinationFactor: null,
    })

    expect(result.reference.emissions.value).toBe(3000)
    expect(result.destination.emissions).toEqual({
      value: null,
      unit: 'gCO2e',
      reasons: [{ code: 'DESTINATION_FACTOR_UNAVAILABLE' }],
    })
    expect(result.difference.absolute.value).toBeNull()
  })

  it('compares only the shared calculable interval while keeping its partial coverage visible', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:02:00Z',
      destinationRegionCode: 'br-destination',
      segments: [
        segment(5, factor(300, 'reference-v1'), '2026-10-01T00:00:00Z', '2026-10-01T00:01:00Z'),
        {
          interval: { from: '2026-10-01T00:01:00Z', to: '2026-10-01T00:02:00Z' },
          energy: { value: null, reasons: [{ code: 'INVALID_METRIC', metric: 'energy' }] },
          factorSnapshot: null,
        },
      ],
      destinationFactor: {
        regionCode: 'br-destination',
        country: 'Brazil',
        region: 'Destination',
        city: null,
        intensity: 100,
        unit: 'gCO2e/kWh',
        queriedAt: '2026-10-01T00:02:00Z',
      },
    })

    expect(result.energy.value).toBe(5)
    expect(result.reference.emissions.value).toBe(1500)
    expect(result.destination.emissions.value).toBe(500)
    expect(result.coverage).toEqual({ energy: 0.5, reference: 0.5, destination: 0.5 })
    expect(result.difference.absolute.value).toBe(-1000)
    expect(result.difference.percent.value).toBeCloseTo(-2 / 3)
  })

  it('keeps invalid destination data unavailable instead of calculating with it', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:01:00Z',
      destinationRegionCode: 'br-destination',
      segments: [segment(10, factor(300, 'reference-v1'))],
      destinationFactor: {
        regionCode: 'br-destination',
        country: 'Brazil',
        region: 'Destination',
        city: null,
        intensity: 100,
        unit: 'kgCO2e/kWh',
        queriedAt: '2026-10-01T00:02:00Z',
      },
    })

    expect(result.reference.emissions.value).toBe(3000)
    expect(result.destination.emissions).toEqual({
      value: null,
      unit: 'gCO2e',
      reasons: [{ code: 'DESTINATION_FACTOR_INVALID' }],
    })
    expect(result.coverage.destination).toBe(0)
    expect(result.difference.absolute).toEqual({
      value: null,
      unit: 'gCO2e',
      reasons: [{ code: 'DESTINATION_FACTOR_INVALID' }],
    })
  })

  it('returns explicit unavailable reasons when there is no calculable energy', () => {
    const result = calculateRegionalSimulation({
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-01T00:01:00Z',
      destinationRegionCode: 'br-destination',
      segments: [],
      destinationFactor: null,
    })

    expect(result.energy).toEqual({
      value: null,
      unit: 'kWh',
      reasons: [{ code: 'NO_CALCULABLE_ENERGY' }],
    })
    expect(result.destination.emissions.reasons).toEqual([{ code: 'NO_CALCULABLE_ENERGY' }])
  })
})
