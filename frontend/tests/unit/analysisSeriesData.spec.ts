import { expect, test } from '@playwright/test'
import { chartDomain } from '../../src/pages/detail/analysisSeriesData.ts'

test('chart domain expands a narrow range instead of flattening it against zero', () => {
  const domain = chartDomain([0.935, 0.978])

  expect(domain.minimum).toBeCloseTo(0.92)
  expect(domain.maximum).toBeCloseTo(1)
  expect(domain.step).toBeCloseTo(0.02)
  expect(domain.minimum).toBeLessThanOrEqual(0.935)
  expect(domain.maximum).toBeGreaterThanOrEqual(0.978)
})

test('chart domain remains stable for zero and identical values', () => {
  expect(chartDomain([0, 0])).toEqual({ minimum: 0, maximum: 0.1, step: 0.025 })

  const constantDomain = chartDomain([0.95, 0.95])
  expect(constantDomain.minimum).toBeLessThan(0.95)
  expect(constantDomain.maximum).toBeGreaterThan(0.95)
})

test('chart domain ignores non-finite values and supplies a usable empty domain', () => {
  expect(chartDomain([Number.NaN, Number.POSITIVE_INFINITY])).toEqual({ minimum: 0, maximum: 1, step: 0.25 })
})
