import { expect, test } from '@playwright/test'
import type { EnvironmentalSummaryApplication } from '../../src/features/analysis/environmentalSummary.ts'
import { selectDashboardRows, validDashboardFilters } from '../../src/pages/dashboard/dashboardData.ts'
import { readDashboardQuery } from '../../src/pages/dashboard/query.ts'

const values: EnvironmentalSummaryApplication[] = [
  {
    applicationId: 'svc-1', name: 'api-sao-paulo', state: 'AVAILABLE',
    energy: { value: 3, unit: 'kWh' }, emissions: { value: 85, unit: 'gCO2e' },
    coverage: { energy: 1, emissions: 0.5 },
  },
  {
    applicationId: 'svc-2', name: 'api-checkout', state: 'UNAVAILABLE',
    energy: { value: null, unit: 'kWh' }, emissions: { value: 12, unit: 'gCO2e' },
    coverage: { energy: 0, emissions: 1 },
  },
  {
    applicationId: 'svc-3', name: 'api-zero', state: 'AVAILABLE',
    energy: { value: 0, unit: 'kWh' }, emissions: { value: 0, unit: 'gCO2e' },
    coverage: { energy: 1, emissions: 1 },
  },
]
const catalog = [
  { id: 'svc-1', location: { regionCode: 'BR-SP', country: 'Brasil', region: 'São Paulo', city: null, latitude: -23.5, longitude: -46.6 } },
  { id: 'svc-2', location: null },
  { id: 'svc-3', location: { regionCode: 'US-VA', country: 'United States', region: 'Virginia', city: null, latitude: 38, longitude: -77 } },
]
const query = readDashboardQuery('')
const labelForState = (state: string) => state

test('dashboard defaults to seven days, ten rows and descending emissions', () => {
  expect(query).toMatchObject({
    period: '7d',
    page: 1,
    pageSize: 10,
    sort: { column: 'emissions', direction: 'desc' },
  })
})

test('filters application rows by accent-insensitive search and sorts missing values last', () => {
  const result = selectDashboardRows(values, catalog, { ...query, search: 'sao' }, 'pt-BR', labelForState)
  expect(result.items.map((item) => item.applicationId)).toEqual(['svc-1'])

  const sorted = selectDashboardRows(values, catalog, query, 'pt-BR', labelForState)
  expect(sorted.items.map((item) => item.applicationId)).toEqual(['svc-1', 'svc-2', 'svc-3'])
})

test('zero remains a real value and missing measures remain visible unless a numeric filter excludes them', () => {
  const zero = selectDashboardRows(values, catalog, {
    ...query, filters: { ...query.filters, energyMin: '0', energyMax: '0' },
  }, 'en-US', labelForState)
  expect(zero.items.map((item) => item.applicationId)).toEqual(['svc-3'])

  const missing = selectDashboardRows(values, catalog, {
    ...query, filters: { ...query.filters, energyMin: '0', energyMax: '0', energyMissing: true },
  }, 'en-US', labelForState)
  expect(missing.items.map((item) => item.applicationId)).toEqual(['svc-2', 'svc-3'])
})

test('invalid numeric filter ranges do not produce a success-shaped result', () => {
  expect(validDashboardFilters({ ...query.filters, energyMin: '5', energyMax: '2' })).toBe(false)
  expect(validDashboardFilters({ ...query.filters, emissionsCoverageMin: '-1' })).toBe(false)
  expect(validDashboardFilters({ ...query.filters, energyMin: 'not-a-number' })).toBe(false)
})
