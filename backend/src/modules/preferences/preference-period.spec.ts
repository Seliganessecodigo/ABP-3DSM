import { BadRequestException } from '@nestjs/common'
import { preferencePeriodRange, validatePreferencePeriod } from './preference-period'
import { validatePreference } from './preferences.service'

const now = new Date('2026-11-10T12:00:00.000Z')
describe('períodos de preferências', () => {
  it.each(['24h', '7d', '30d', '90d', 'month'] as const)('aceita e resolve %s em UTC', kind => {
    const period = validatePreferencePeriod({ kind })
    const range = preferencePeriodRange(period, now)
    expect(range.to).toBe(now.toISOString())
    expect(Date.parse(range.from)).toBeLessThan(Date.parse(range.to))
    if (kind === 'month') expect(range.from).toBe('2026-11-01T00:00:00.000Z')
    if (kind === '24h') expect(range.from).toBe('2026-11-09T12:00:00.000Z')
  })
  it('preserva intervalo personalizado com fuso e fim exclusivo', () => {
    const period = { kind: 'custom', from: '2026-10-01T03:00:00-03:00', to: '2026-10-02T03:00:00-03:00' }
    expect(preferencePeriodRange(validatePreferencePeriod(period), now)).toEqual({ from: period.from, to: period.to })
  })
  it.each([null, [], {}, { kind: 'year' }, { kind: 'month', from: now.toISOString() },
    { kind: 'custom' }, { kind: 'custom', from: '2026-10-01', to: '2026-10-02' },
    { kind: 'custom', from: '2026-02-30T00:00:00Z', to: now.toISOString() },
    { kind: 'custom', from: now.toISOString(), to: now.toISOString() },
    { kind: 'custom', from: now.toISOString(), to: '2026-01-01T00:00:00Z' },
    { kind: 'custom', from: '2026-10-01T00:00:00Z', to: now.toISOString(), extra: true },
  ])('rejeita período inválido %j', value => expect(() => validatePreferencePeriod(value)).toThrow(BadRequestException))
  it.each([
    ['energy', { threshold: 1, alertsEnabled: true, scope: 'application', unit: 'kWh', period: { kind: '7d' } }],
    ['emissions', { threshold: 0, alertsEnabled: false, scope: 'application', unit: 'kgCO2e', period: { kind: '30d' } }],
    ['coverage', { thresholdPercent: 100, alertsEnabled: true, period: { kind: 'month' } }],
    ['analysis', { granularity: 'day', period: { kind: 'custom', from: '2026-01-01T00:00:00Z', to: now.toISOString() } }],
  ])('aceita formato novo em %s', (tab, value) => expect(validatePreference(tab, { expectedRevision: 0, value }).value).toEqual(value))
  it.each([
    ['analysis', { period: { kind: '7d' }, granularity: 'minute' }],
    ['analysis', { period: { kind: '7d' }, granularity: 'day', periodDays: 7 }],
    ['coverage', { period: { kind: '7d' }, alertsEnabled: true, thresholdPercent: 101 }],
    ['energy', { period: { kind: '7d' }, alertsEnabled: true, threshold: -1, scope: 'application', unit: 'kWh' }],
    ['emissions', { period: { kind: '7d' }, alertsEnabled: true, threshold: 1, scope: 'application', unit: 'gCO2e' }],
  ])('não mistura formatos nem aceita contrato inválido em %s', (tab, value) => expect(() => validatePreference(tab, { expectedRevision: 0, value })).toThrow(BadRequestException))
})
