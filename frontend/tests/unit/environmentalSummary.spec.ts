import { expect, test } from '@playwright/test'
import { analysisRangeFor } from '../../src/features/analysis/source.ts'
import { parseEnvironmentalSummary } from '../../src/features/analysis/environmentalSummary.ts'

const period = {
  from: '2026-10-01T00:00:00.000Z',
  to: '2026-10-08T00:00:00.000Z',
}

function summary(overrides: Record<string, unknown> = {}) {
  return {
    status: 'available',
    period,
    dataAsOf: '2026-10-07T23:55:00.000Z',
    totals: {
      energy: { value: 3, unit: 'kWh', reasons: [] },
      emissions: { value: 85, unit: 'gCO2e', reasons: [] },
    },
    coverage: { energy: 1, emissions: 2 / 3 },
    states: { AVAILABLE: 1, UNAVAILABLE: 1, NO_METRICS: 0, REMOVED: 1 },
    applications: [{
      applicationId: 'svc-1',
      name: 'api-pagamentos',
      state: 'AVAILABLE',
      energy: { value: 3, unit: 'kWh', reasons: [] },
      emissions: { value: 85, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 1, emissions: 2 / 3 },
    }],
    provenance: { methodologies: [], factors: [], reasons: [] },
    ...overrides,
  }
}

test('analysis period uses the same exact rolling UTC interval as detail', () => {
  expect(analysisRangeFor('24h', new Date('2026-10-08T00:00:00.000Z'))).toEqual({
    from: '2026-10-07T00:00:00.000Z',
    to: '2026-10-08T00:00:00.000Z',
  })
})

test('summary preserves null readings, independent coverage and zero-valued states', () => {
  const response = summary({
    totals: {
      energy: { value: 0, unit: 'kWh', reasons: [] },
      emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] },
    },
    coverage: { energy: 0.5, emissions: 0 },
    states: { AVAILABLE: 0, UNAVAILABLE: 0, NO_METRICS: 3, REMOVED: 0 },
    applications: [],
  })

  expect(parseEnvironmentalSummary(response, period)).toMatchObject({
    totals: { energy: { value: 0 }, emissions: { value: null } },
    coverage: { energy: 0.5, emissions: 0 },
    states: { NO_METRICS: 3 },
    applications: [],
  })
})

test('summary rejects a mismatched interval, invalid coverage and duplicate identities', () => {
  expect(() => parseEnvironmentalSummary(summary({ period: { from: 'bad', to: period.to } }), period)).toThrow()
  expect(() => parseEnvironmentalSummary(summary({ coverage: { energy: 1.1, emissions: 0 } }), period)).toThrow()
  expect(() => parseEnvironmentalSummary(summary({ applications: [...summary().applications, ...summary().applications] }), period)).toThrow()
})

test('custom periods accept equivalent server timestamps with a different UTC offset', () => {
  const expected = { from: '2026-09-30T21:00:00-03:00', to: '2026-10-07T21:00:00-03:00' }
  expect(parseEnvironmentalSummary(summary(), expected).period).toEqual(expected)
})

const seriesPeriod = { from: '2026-10-08T10:00:00.000Z', to: '2026-10-08T11:00:00.000Z' }
const measure = { value: null, unit: 'kWh', reasons: [] }
function seriesResponse() {
  return { status: 'empty', period: seriesPeriod, dataAsOf: null, totals: { energy: measure, emissions: { ...measure, unit: 'gCO2e' } }, coverage: { energy: 0, emissions: 0 }, states: { AVAILABLE: 0, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 }, applications: [], provenance: { methodologies: [], factors: [], reasons: [] }, series: { granularity: 'hour', points: [{ bucketStart: seriesPeriod.from, bucketEnd: seriesPeriod.to, period: seriesPeriod, energy: measure, emissions: { ...measure, unit: 'gCO2e' }, coverage: { energy: 0, emissions: 0 } }] } }
}
test('series validation preserves missing values and legitimate zero', () => {
  const input = seriesResponse()
  expect(parseEnvironmentalSummary(input, seriesPeriod).series?.points[0].energy.value).toBeNull()
  const zero = { ...input, series: { ...input.series, points: [{ ...input.series.points[0], energy: { ...measure, value: 0 } }] } }
  expect(parseEnvironmentalSummary(zero, seriesPeriod).series?.points[0].energy.value).toBe(0)
})
test('series validation rejects malformed metadata and invalid measurements', () => {
  const input = seriesResponse()
  for (const series of [null, { granularity: 'minute', points: [] }, { granularity: 'day', points: [null] }, { ...input.series, points: [{ ...input.series.points[0], bucketStart: 'invalid' }] }, { ...input.series, points: [{ ...input.series.points[0], energy: { ...measure, value: Infinity } }] }, { ...input.series, points: [{ ...input.series.points[0], coverage: { energy: 2, emissions: 0 } }] }]) {
    expect(() => parseEnvironmentalSummary({ ...input, series }, seriesPeriod)).toThrow()
  }
})

test('series validation rejects foreign periods, overlapping intervals and incompatible units', () => {
  const input = seriesResponse()
  const point = input.series.points[0]
  for (const points of [
    [{ ...point, period: { from: '2026-10-08T09:00:00.000Z', to: seriesPeriod.to } }],
    [{ ...point, period: { from: seriesPeriod.to, to: seriesPeriod.from } }],
    [{ ...point, energy: { ...measure, unit: 'Wh' } }],
    [{ ...point, energy: { ...measure, value: -1 } }],
    [point, point],
  ]) {
    expect(() => parseEnvironmentalSummary({ ...input, series: { ...input.series, points } }, seriesPeriod)).toThrow()
  }
})
