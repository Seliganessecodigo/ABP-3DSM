import { expect, test } from '@playwright/test'
import { parseEnvironmentalSummary } from '../../src/features/analysis/environmentalSummary.ts'

const period = { from: '2026-10-08T10:00:00.000Z', to: '2026-10-08T11:00:00.000Z' }
const measure = { value: null, unit: 'kWh', reasons: [] }
function response() {
  return { status: 'empty', period, dataAsOf: null, totals: { energy: measure, emissions: { ...measure, unit: 'gCO2e' } }, coverage: { energy: 0, emissions: 0 }, states: { AVAILABLE: 0, UNAVAILABLE: 0, NO_METRICS: 0, REMOVED: 0 }, applications: [], provenance: { methodologies: [], factors: [], reasons: [] }, series: { granularity: 'hour', points: [{ bucketStart: period.from, bucketEnd: period.to, period, energy: measure, emissions: { ...measure, unit: 'gCO2e' }, coverage: { energy: 0, emissions: 0 } }] } }
}
test('series validation preserves missing values and legitimate zero', () => {
  const input = response()
  expect(parseEnvironmentalSummary(input, period).series?.points[0].energy.value).toBeNull()
  const zero = { ...input, series: { ...input.series, points: [{ ...input.series.points[0], energy: { ...measure, value: 0 } }] } }
  expect(parseEnvironmentalSummary(zero, period).series?.points[0].energy.value).toBe(0)
})
test('series validation rejects malformed metadata and invalid measurements', () => {
  const input = response()
  for (const series of [null, { granularity: 'minute', points: [] }, { granularity: 'day', points: [null] }, { ...input.series, points: [{ ...input.series.points[0], bucketStart: 'invalid' }] }, { ...input.series, points: [{ ...input.series.points[0], energy: { ...measure, value: Infinity } }] }, { ...input.series, points: [{ ...input.series.points[0], coverage: { energy: 2, emissions: 0 } }] }]) {
    expect(() => parseEnvironmentalSummary({ ...input, series }, period)).toThrow()
  }
})
