export const preferencePeriodKinds = ['24h', '7d', '30d', '90d', 'month', 'custom'] as const
export type PreferencePeriod = { kind: typeof preferencePeriodKinds[number]; from?: string; to?: string }
const timeZoneSuffix = /(?:[Zz]|[+-]\d{2}:\d{2})$/
export function readPreferencePeriod(value: unknown): PreferencePeriod {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid preference period')
  const data = value as Record<string, unknown>
  const kind = preferencePeriodKinds.find(item => item === data.kind)
  if (!kind) throw new Error('Invalid preference period')
  if (kind !== 'custom') return { kind }
  if (typeof data.from !== 'string' || typeof data.to !== 'string' || !timeZoneSuffix.test(data.from) || !timeZoneSuffix.test(data.to) || !Number.isFinite(Date.parse(data.from)) || !Number.isFinite(Date.parse(data.to)) || Date.parse(data.to) <= Date.parse(data.from)) throw new Error('Invalid custom preference period')
  return { kind, from: data.from, to: data.to }
}
export function validPreferencePeriod(value: PreferencePeriod): boolean {
  try { readPreferencePeriod(value); return true } catch { return false }
}
