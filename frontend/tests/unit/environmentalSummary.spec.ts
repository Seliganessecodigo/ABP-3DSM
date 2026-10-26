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
