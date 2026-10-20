import {
  calculateObservationEnergy,
  parseZonedTimestampNanoseconds,
} from './energy-calculation'

describe('calculateObservationEnergy', () => {
  it('estimates energy for a complete observation with the initial model', () => {
    const result = calculateObservationEnergy({
      id: 'observation-1',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: 50,
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.averagePowerW).toBeCloseTo(50.87, 12)
    expect(result.energyKwh).toBeCloseTo(0.0008478333333333333, 16)
    expect(result).toMatchObject({
      modelKey: 'simplified-energy',
      modelVersion: '1',
      powerContributionsW: {
        cpuPercent: 50,
        memoryGb: 0.75,
        diskGb: 0.1,
        networkGb: 0.02,
      },
    })
    expect(result.reasons).toEqual([])
  })

  it('preserves an explicit zero as a calculable zero', () => {
    const result = calculateObservationEnergy({
      id: 'observation-zero',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: 0,
        memoryGb: 0,
        diskGb: 0,
        networkGb: 0,
      },
    })

    expect(result.averagePowerW).toBe(0)
    expect(result.energyKwh).toBe(0)
    expect(result.reasons).toEqual([])
  })

  it('does not estimate energy from a partial set of required metrics', () => {
    const result = calculateObservationEnergy({
      id: 'observation-missing-cpu',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.averagePowerW).toBeNull()
    expect(result.energyKwh).toBeNull()
    expect(result.powerContributionsW.cpuPercent).toBeNull()
    expect(result.reasons).toContainEqual({
      code: 'METRIC_MISSING',
      metric: 'cpuPercent',
    })
  })

  it('rejects numeric strings instead of coercing external metrics', () => {
    const result = calculateObservationEnergy({
      id: 'observation-string-cpu',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: '50',
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toContainEqual({
      code: 'METRIC_INVALID',
      metric: 'cpuPercent',
    })
  })

  it('rejects CPU percentages above the documented 0 to 100 range', () => {
    const result = calculateObservationEnergy({
      id: 'observation-high-cpu',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: 100.01,
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toContainEqual({
      code: 'METRIC_OUT_OF_RANGE',
      metric: 'cpuPercent',
    })
  })

  it('rejects negative memory quantities', () => {
    const result = calculateObservationEnergy({
      id: 'observation-negative-memory',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: 50,
        memoryGb: -1,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toContainEqual({
      code: 'METRIC_OUT_OF_RANGE',
      metric: 'memoryGb',
    })
  })

  it('normalizes equivalent zoned instants to the same UTC time', () => {
    expect(parseZonedTimestampNanoseconds('2026-10-18T13:00:00Z')).toBe(
      parseZonedTimestampNanoseconds('2026-10-18T10:00:00-03:00'),
    )
  })

  it('rejects timestamps without an offset or with an impossible calendar date', () => {
    expect(parseZonedTimestampNanoseconds('2026-10-18T10:00:00')).toBeNull()
    expect(parseZonedTimestampNanoseconds('2026-02-30T10:00:00Z')).toBeNull()
  })

  it('rejects non-finite metric values', () => {
    const result = calculateObservationEnergy({
      id: 'observation-nan-cpu',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: Number.NaN,
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toContainEqual({
      code: 'METRIC_INVALID',
      metric: 'cpuPercent',
    })
  })

  it('rejects observation intervals with zero or negative duration', () => {
    const metrics = {
      cpuPercent: 50,
      memoryGb: 2,
      diskGb: 10,
      networkGb: 1,
    }
    const zeroDuration = calculateObservationEnergy({
      id: 'observation-zero-duration',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:00:00.000Z',
      collectedAt: '2026-10-18T10:00:00.000Z',
      metrics,
    })
    const negativeDuration = calculateObservationEnergy({
      id: 'observation-negative-duration',
      applicationId: 'billing-api',
      intervalStart: '2026-10-18T10:01:00.000Z',
      intervalEnd: '2026-10-18T10:00:00.000Z',
      collectedAt: '2026-10-18T10:00:00.000Z',
      metrics,
    })

    expect(zeroDuration.energyKwh).toBeNull()
    expect(negativeDuration.energyKwh).toBeNull()
    expect(zeroDuration.reasons).toContainEqual({ code: 'INVALID_INTERVAL' })
    expect(negativeDuration.reasons).toContainEqual({
      code: 'INVALID_INTERVAL',
    })
  })

  it('rejects blank observation and application identifiers', () => {
    const result = calculateObservationEnergy({
      id: '   ',
      applicationId: '',
      intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z',
      collectedAt: '2026-10-18T10:01:00.000Z',
      metrics: {
        cpuPercent: 50,
        memoryGb: 2,
        diskGb: 10,
        networkGb: 1,
      },
    })

    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toEqual([
      { code: 'INVALID_OBSERVATION_ID' },
      { code: 'INVALID_APPLICATION_ID' },
    ])
  })

  it('records an immutable snapshot of the custom model parameters applied', () => {
    const model = {
      key: 'custom-energy',
      version: '2',
      cpuWattsAt100Percent: 200,
      memoryWattsPerGb: 0,
      diskWattsPerGb: 0,
      networkWattsPerGb: 0,
    }
    const result = calculateObservationEnergy(
      {
        id: 'observation-custom-model',
        applicationId: 'billing-api',
        intervalStart: '2026-10-18T10:00:00.000Z',
        intervalEnd: '2026-10-18T10:01:00.000Z',
        collectedAt: '2026-10-18T10:01:00.000Z',
        metrics: {
          cpuPercent: 50,
          memoryGb: 0,
          diskGb: 0,
          networkGb: 0,
        },
      },
      model,
    )

    model.cpuWattsAt100Percent = 400

    expect(result.averagePowerW).toBe(100)
    expect((result.energyKwh ?? 0) * 1000).toBeCloseTo(
      1.6666666666666667,
      14,
    )
    expect(result).toMatchObject({
      modelKey: 'custom-energy',
      modelVersion: '2',
      modelParameters: {
        cpuWattsAt100Percent: 200,
        memoryWattsPerGb: 0,
        diskWattsPerGb: 0,
        networkWattsPerGb: 0,
      },
    })
    expect(Object.isFrozen(result.modelParameters)).toBe(true)
  })

  it('rejects a model with negative power coefficients', () => {
    const result = calculateObservationEnergy(
      {
        id: 'observation-negative-coefficient',
        applicationId: 'billing-api',
        intervalStart: '2026-10-18T10:00:00.000Z',
        intervalEnd: '2026-10-18T10:01:00.000Z',
        collectedAt: '2026-10-18T10:01:00.000Z',
        metrics: {
          cpuPercent: 50,
          memoryGb: 2,
          diskGb: 10,
          networkGb: 1,
        },
      },
      {
        key: 'invalid-model',
        version: '1',
        cpuWattsAt100Percent: -100,
        memoryWattsPerGb: 0.375,
        diskWattsPerGb: 0.01,
        networkWattsPerGb: 0.02,
      },
    )

    expect(result.averagePowerW).toBeNull()
    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toContainEqual({ code: 'INVALID_MODEL' })
  })

  it('rejects energy that overflows even when the computed power is finite', () => {
    const result = calculateObservationEnergy({
      id: 'observation-energy-overflow',
      applicationId: 'billing-api',
      intervalStart: '0001-01-01T00:00:00.000Z',
      intervalEnd: '9999-01-01T00:00:00.000Z',
      collectedAt: '9999-01-01T00:00:00.000Z',
      metrics: {
        cpuPercent: 0,
        memoryGb: Number.MAX_VALUE,
        diskGb: 0,
        networkGb: 0,
      },
    })

    expect(result.averagePowerW).toBeNull()
    expect(result.energyKwh).toBeNull()
    expect(result.reasons).toContainEqual({ code: 'NON_FINITE_RESULT' })
  })

  it('avoids intermediate overflow when finite energy follows from large power and duration', () => {
    const result = calculateObservationEnergy(
      {
        id: 'observation-large-finite-energy',
        applicationId: 'billing-api',
        intervalStart: '2026-01-01T00:00:00.000Z',
        intervalEnd: '2026-02-11T16:00:00.000Z',
        collectedAt: '2026-02-11T16:00:00.000Z',
        metrics: {
          cpuPercent: 0,
          memoryGb: 1,
          diskGb: 0,
          networkGb: 0,
        },
      },
      {
        key: 'large-finite-energy',
        version: '1',
        cpuWattsAt100Percent: 0,
        memoryWattsPerGb: 1e308,
        diskWattsPerGb: 0,
        networkWattsPerGb: 0,
      },
    )

    expect(result.durationSeconds).toBe(3600000)
    expect(result.averagePowerW).toBe(1e308)
    expect(result.energyKwh).toBe(1e308)
    expect(result.reasons).toEqual([])
  })

  it('preserves a one-nanosecond observation duration at a modern epoch', () => {
    const result = calculateObservationEnergy(
      {
        id: 'observation-one-nanosecond',
        applicationId: 'billing-api',
        intervalStart: '2026-10-18T10:00:00.000000001Z',
        intervalEnd: '2026-10-18T10:00:00.000000002Z',
        collectedAt: '2026-10-18T10:00:00.000000002Z',
        metrics: {
          cpuPercent: 100,
          memoryGb: 0,
          diskGb: 0,
          networkGb: 0,
        },
      },
      {
        key: 'one-nanosecond-model',
        version: '1',
        cpuWattsAt100Percent: 100,
        memoryWattsPerGb: 0,
        diskWattsPerGb: 0,
        networkWattsPerGb: 0,
      },
    )

    expect(result.durationSeconds).toBe(1e-9)
    expect(result.energyKwh).toBeGreaterThan(0)
    expect(result.reasons).toEqual([])
  })
})
