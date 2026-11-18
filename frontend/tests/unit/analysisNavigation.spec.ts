import { test, expect } from '@playwright/test'
import { analysisNavigationUrl } from '../../src/app/analysisNavigation.ts'

test('analysis navigation carries supported context and excludes unrelated table filters', () => {
  const location = { pathname: '/services/api%20worker', search: '?period=24h&granularity=hour&seriesTimeZone=UTC&search=secret&page=4&state=AVAILABLE' }
  const history = new URL(analysisNavigationUrl('/history', location), 'http://localhost')
  expect(Object.fromEntries(history.searchParams)).toEqual({ period: '24h', granularity: 'hour', seriesTimeZone: 'UTC', applicationId: 'api worker' })
  expect(analysisNavigationUrl('/dashboard', location)).toBe('/dashboard?period=24h&granularity=hour')
})

test('history selection survives return while absent and malformed contexts keep routing usable', () => {
  expect(analysisNavigationUrl('/history', { pathname: '/dashboard', search: '?period=7d&applicationId=api' })).toBe('/history?period=7d&applicationId=api')
  expect(analysisNavigationUrl('/dashboard', { pathname: '/', search: '' })).toBe('/dashboard')
  expect(analysisNavigationUrl('/history', { pathname: '/services/%ZZ', search: '' })).toBe('/history?applicationId=%25ZZ')
})
