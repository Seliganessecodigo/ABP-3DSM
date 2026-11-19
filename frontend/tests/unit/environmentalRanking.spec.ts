import { expect, test } from '@playwright/test'
import { parseEnvironmentalRanking, type EnvironmentalRankingQuery } from '../../src/features/analysis/environmentalRanking.ts'

const query: EnvironmentalRankingQuery = {
  from: '2026-11-01T00:00:00.000Z', to: '2026-11-08T00:00:00.000Z', metric: 'energy', direction: 'desc', page: 1, pageSize: 10,
}

function response(overrides: Record<string, unknown> = {}) {
  return {
    status: 'available', metric: 'energy', direction: 'desc', period: { from: query.from, to: query.to },
    scope: {
      applicationCount: 1, rankedCount: 1, unrankedCount: 0,
      energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 4, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.8, emissions: 0.7 },
    },
    presentation: { rankedCount: 1, unrankedCount: 0 },
    pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    items: [{
      applicationId: 'service-1', name: 'Service 1', state: 'AVAILABLE', stateReason: null,
      location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null },
      energy: { value: 2, unit: 'kWh', reasons: [] }, emissions: { value: 4, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0.8, emissions: 0.7 }, rankability: 'ranked', position: 1, participation: 1,
    }],
    ...overrides,
  }
}

test('validates the ranking contract without converting missing values to zero', () => {
  const result = parseEnvironmentalRanking(response(), query)
  expect(result.items[0].energy.value).toBe(2)
  expect(result.items[0].location.city).toBeNull()
})

test('rejects a response for a different period and invalid coverage', () => {
  expect(() => parseEnvironmentalRanking(response({ period: { from: query.from, to: '2026-11-09T00:00:00.000Z' } }), query)).toThrow()
  const invalid = response()
  ;(invalid.items[0].coverage as { energy: number }).energy = 2
  expect(() => parseEnvironmentalRanking(invalid, query)).toThrow()
})

test('preserves unranked applications when the selected metric has no calculable total', () => {
  const empty = response({
    status: 'empty',
    scope: {
      applicationCount: 1, rankedCount: 0, unrankedCount: 1,
      energy: { value: null, unit: 'kWh', reasons: [] }, emissions: { value: null, unit: 'gCO2e', reasons: [] },
      coverage: { energy: 0, emissions: 0 },
    },
    presentation: { rankedCount: 0, unrankedCount: 1 },
    items: [{
      ...((response().items as Record<string, unknown>[])[0]),
      energy: { value: null, unit: 'kWh', reasons: [{ code: 'NO_OBSERVATION' }] },
      emissions: { value: null, unit: 'gCO2e', reasons: [{ code: 'NO_OBSERVATION' }] },
      coverage: { energy: 0, emissions: 0 }, rankability: 'unranked', position: null, participation: null,
    }],
  })
  expect(parseEnvironmentalRanking(empty, query).items[0].rankability).toBe('unranked')
})
