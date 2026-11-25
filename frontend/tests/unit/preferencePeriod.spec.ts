import { expect, test } from '@playwright/test'
import { validPreferencePeriod } from '../../src/features/preferences/period.ts'

test('custom preferences require zoned dates in chronological order', () => {
  const from = '2026-11-24T09:00:00-03:00'
  const to = '2026-11-24T13:00:00Z'
  expect(validPreferencePeriod({ kind: 'custom', from, to })).toBe(true)
  expect(validPreferencePeriod({ kind: 'custom', from: from.slice(0, -6), to })).toBe(false)
  expect(validPreferencePeriod({ kind: 'custom', from: '2026-11-24 09:00:00 Z ', to })).toBe(false)
  expect(validPreferencePeriod({ kind: 'custom', from: to, to: from })).toBe(false)
})
