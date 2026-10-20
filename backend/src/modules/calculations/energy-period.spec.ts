import { aggregateApplicationEnergyPeriod } from './energy-period'

const observation = {
  id: 'collection-a',
  applicationId: 'app-a',
  intervalStart: '2026-10-18T10:00:00Z',
  intervalEnd: '2026-10-18T10:01:00Z',
  collectedAt: '2026-10-18T10:01:00Z',
  metrics: { cpuPercent: 50, memoryGb: 2, diskGb: 10, networkGb: 1 },
}

const period = {
  applicationId: 'app-a',
  periodStart: '2026-10-18T10:00:00Z',
  periodEnd: '2026-10-18T10:01:00Z',
}

describe('aggregateApplicationEnergyPeriod', () => {
  it('preserves a nanosecond period at a modern date instead of collapsing its bounds', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period,
      periodStart: '2026-10-18T10:00:00.000000001Z', periodEnd: '2026-10-18T10:00:00.000000002Z',
      observations: [observation],
    })
    expect(result.periodDurationSeconds).toBe(1e-9)
    expect(result.validDurationSeconds).toBe(1e-9)
    expect(result.coverage).toBe(1)
    expect(result.contributions[0].intervalStart).toBe('2026-10-18T10:00:00.000000001Z')
    expect(result.contributions[0].intervalEnd).toBe('2026-10-18T10:00:00.000000002Z')
  })

  it('reports a nonrepresentable accumulated total without returning infinity', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period,
      periodStart: '2026-01-01T00:00:00Z', periodEnd: '2026-03-25T08:00:00Z',
      observations: [
        { ...observation, intervalStart: '2026-01-01T00:00:00Z', intervalEnd: '2026-02-11T16:00:00Z',
          metrics: { cpuPercent: 0, memoryGb: 1, diskGb: 0, networkGb: 0 } },
        { ...observation, id: 'collection-b', intervalStart: '2026-02-11T16:00:00Z',
          intervalEnd: '2026-03-25T08:00:00Z',
          metrics: { cpuPercent: 0, memoryGb: 1, diskGb: 0, networkGb: 0 } },
      ], model: { key: 'large-model', version: '1', cpuWattsAt100Percent: 0,
        memoryWattsPerGb: 1e308, diskWattsPerGb: 0, networkWattsPerGb: 0 },
    })
    expect(result.energyKwh).toBeNull()
    expect(result.coverage).toBe(1)
    expect(result.reasons).toEqual([{ code: 'NON_FINITE_RESULT' }])
  })

  it('preserves distinct submillisecond slice boundaries in its explanation', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period,
      periodStart: '1970-01-01T00:00:00.0001Z', periodEnd: '1970-01-01T00:00:00.0002Z',
      observations: [{ ...observation, intervalStart: '1970-01-01T00:00:00Z',
        intervalEnd: '1970-01-01T00:00:01Z', collectedAt: '1970-01-01T00:00:01Z' }],
    })
    expect(result.contributions[0].intervalStart).toBe('1970-01-01T00:00:00.0001Z')
    expect(result.contributions[0].intervalEnd).toBe('1970-01-01T00:00:00.0002Z')
    expect(result.validDurationSeconds).toBeCloseTo(0.0001, 12)
  })

  it('keeps finite energy when a large valid power is integrated over a short slice', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [{
      ...observation, metrics: { cpuPercent: 0, memoryGb: 1, diskGb: 0, networkGb: 0 },
    }], model: { key: 'large-model', version: '1', cpuWattsAt100Percent: 0,
      memoryWattsPerGb: 1e308, diskWattsPerGb: 0, networkWattsPerGb: 0 } })

    expect(Number.isFinite(result.energyKwh)).toBe(true)
    expect((result.energyKwh ?? 0) / 1e303).toBeCloseTo(1.6666666666666667, 14)
  })

  it('resolves equal receipt times by ascending identity independently of input order', () => {
    const other = { ...observation, id: 'collection-b',
      metrics: { cpuPercent: 100, memoryGb: 0, diskGb: 0, networkGb: 0 } }
    for (const observations of [[other, observation], [observation, other]]) {
      const result = aggregateApplicationEnergyPeriod({ ...period, observations })
      expect(result.energyKwh).toBeCloseTo(0.0008478333333333333, 16)
      expect(result.contributions.map((part) => part.observationId)).toEqual(['collection-a'])
    }
  })

  it('does not increase energy or time coverage when an observation is repeated', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [observation, {
      ...observation, metrics: { ...observation.metrics },
    }] })
    expect(result.energyKwh).toBeCloseTo(0.0008478333333333333, 16)
    expect(result.validDurationSeconds).toBe(60)
    expect(result.contributions).toHaveLength(1)
  })

  it('treats an observed zero as valid energy with full coverage', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [{
      ...observation, metrics: { cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 },
    }] })
    expect(result.energyKwh).toBe(0)
    expect(result.coverage).toBe(1)
  })

  it('does not include an observation that starts at the exclusive period end', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [{
      ...observation, intervalStart: period.periodEnd, intervalEnd: '2026-10-18T10:02:00Z',
    }] })
    expect(result.energyKwh).toBeNull()
    expect(result.coverage).toBe(0)
  })

  it('normalizes equivalent timezone offsets without changing the selected period', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period,
      periodStart: '2026-10-18T07:00:00-03:00', periodEnd: '2026-10-18T07:01:00-03:00',
      observations: [observation],
    })
    expect(result.energyKwh).toBeCloseTo(0.0008478333333333333, 16)
    expect(result.validDurationSeconds).toBe(60)
  })

  it('reports an invalid observation interval instead of silently discarding it', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [{
      ...observation, intervalEnd: observation.intervalStart,
    }] })

    expect(result.energyKwh).toBeNull()
    expect(result.coverage).toBe(0)
    expect(result.exclusions).toContainEqual(expect.objectContaining({
      observationId: observation.id, reasons: expect.arrayContaining([{ code: 'INVALID_INTERVAL' }]),
    }))
  })

  it('rejects conflicting payloads with the same observation identity regardless of input order', () => {
    const conflicting = { ...observation, metrics: { ...observation.metrics, cpuPercent: 100 } }
    for (const observations of [[observation, conflicting], [conflicting, observation]]) {
      expect(() => aggregateApplicationEnergyPeriod({ ...period, observations }))
        .toThrow('CONFLICTING_OBSERVATION_ID')
    }
  })

  it('rejects an empty target identity before aggregating observations', () => {
    expect(() => aggregateApplicationEnergyPeriod({
      ...period, applicationId: ' ', observations: [observation],
    })).toThrow('INVALID_APPLICATION_ID')
  })

  it.each([
    ['2026-10-18T10:00:00', period.periodEnd],
    ['2026-02-30T10:00:00Z', period.periodEnd],
    [period.periodEnd, period.periodStart],
    [period.periodStart, period.periodStart],
  ])('rejects an invalid requested period %s to %s', (periodStart, periodEnd) => {
    expect(() => aggregateApplicationEnergyPeriod({
      ...period, periodStart, periodEnd, observations: [],
    })).toThrow('INVALID_PERIOD')
  })

  it('exposes the contributing time slices and explicit uncovered gaps', () => {
    const result = aggregateApplicationEnergyPeriod({
      ...period, periodEnd: '2026-10-18T10:02:00Z', observations: [observation],
    })

    expect(result.contributions).toEqual([expect.objectContaining({
      observationId: 'collection-a', intervalStart: '2026-10-18T10:00:00.000Z',
      intervalEnd: '2026-10-18T10:01:00.000Z', durationSeconds: 60,
      modelKey: 'simplified-energy', modelVersion: '1',
    })])
    expect(result.contributions[0].energyKwh).toBeCloseTo(0.0008478333333333333, 16)
    expect(result.exclusions).toContainEqual(expect.objectContaining({
      observationId: null, intervalStart: '2026-10-18T10:01:00.000Z',
      intervalEnd: '2026-10-18T10:02:00.000Z', reasons: [{ code: 'NO_OBSERVATION' }],
    }))
  })

  it('keeps the gap when the winning newer observation has missing metrics', () => {
    const result = aggregateApplicationEnergyPeriod({
      ...period, periodEnd: '2026-10-18T10:03:00Z', observations: [
        { ...observation, intervalEnd: '2026-10-18T10:03:00Z' },
        { ...observation, id: 'new-invalid', intervalStart: '2026-10-18T10:01:00Z',
          intervalEnd: '2026-10-18T10:02:00Z', collectedAt: '2026-10-18T10:04:00Z',
          metrics: { memoryGb: 2, diskGb: 10, networkGb: 1 } },
      ],
    })

    expect(result.energyKwh).toBeCloseTo(0.001695666666666667, 16)
    expect(result.validDurationSeconds).toBe(120)
    expect(result.coverage).toBeCloseTo(2 / 3, 14)
    expect(result.exclusions).toContainEqual(expect.objectContaining({
      observationId: 'new-invalid', reasons: [{ code: 'METRIC_MISSING', metric: 'cpuPercent' }],
    }))
  })

  it('explicitly excludes another application instead of mixing its energy', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [observation, {
      ...observation, id: 'foreign', applicationId: 'other-app', collectedAt: '2026-10-18T10:02:00Z',
    }] })

    expect(result.energyKwh).toBeCloseTo(0.0008478333333333333, 16)
    expect(result.exclusions).toContainEqual(expect.objectContaining({
      observationId: 'foreign', reasons: [{ code: 'APPLICATION_MISMATCH' }],
    }))
  })

  it('uses the latest observation in overlapping time without double counting', () => {
    const result = aggregateApplicationEnergyPeriod({
      ...period, periodEnd: '2026-10-18T10:03:00Z', observations: [
        { ...observation, intervalEnd: '2026-10-18T10:02:00Z', collectedAt: '2026-10-18T10:02:00Z' },
        { ...observation, id: 'collection-b', intervalStart: '2026-10-18T10:01:00Z',
          intervalEnd: '2026-10-18T10:03:00Z', collectedAt: '2026-10-18T10:03:00Z',
          metrics: { cpuPercent: 100, memoryGb: 0, diskGb: 0, networkGb: 0 } },
      ],
    })

    expect(result.energyKwh).toBeCloseTo(0.004181166666666667, 16)
    expect(result.validDurationSeconds).toBe(180)
    expect(result.coverage).toBe(1)
  })

  it('sums disjoint valid intervals while keeping gaps out of coverage', () => {
    const result = aggregateApplicationEnergyPeriod({
      ...period, periodEnd: '2026-10-18T10:04:00Z', observations: [observation, {
        ...observation, id: 'collection-b', intervalStart: '2026-10-18T10:02:00Z',
        intervalEnd: '2026-10-18T10:03:00Z', collectedAt: '2026-10-18T10:03:00Z',
        metrics: { cpuPercent: 100, memoryGb: 0, diskGb: 0, networkGb: 0 },
      }],
    })

    expect(result.energyKwh).toBeCloseTo(0.0025145, 16)
    expect(result.validDurationSeconds).toBe(120)
    expect(result.periodDurationSeconds).toBe(240)
    expect(result.coverage).toBe(0.5)
  })

  it('counts only the portion of an observation inside the requested period', () => {
    const result = aggregateApplicationEnergyPeriod({
      ...period, periodStart: '2026-10-18T10:00:30Z', observations: [observation],
    })

    expect(result.energyKwh).toBeCloseTo(0.0004239166666666667, 16)
    expect(result.validDurationSeconds).toBe(30)
    expect(result.periodDurationSeconds).toBe(30)
    expect(result.coverage).toBe(1)
  })

  it('reports unavailable energy rather than zero when no observations exist', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [] })

    expect(result.energyKwh).toBeNull()
    expect(result.validDurationSeconds).toBe(0)
    expect(result.coverage).toBe(0)
  })

  it('reports energy and full time coverage for one valid observation', () => {
    const result = aggregateApplicationEnergyPeriod({ ...period, observations: [observation] })

    expect(result.energyKwh).toBeCloseTo(0.0008478333333333333, 16)
    expect(result.validDurationSeconds).toBe(60)
    expect(result.periodDurationSeconds).toBe(60)
    expect(result.coverage).toBe(1)
  })
})
