export const periodPresets = ['24h', '7d', '30d', '90d'] as const
export type PeriodPreset = (typeof periodPresets)[number] | 'month' | 'custom'
export function readCustomAnalysisRange(search: string): { from: string; to: string } | undefined {
  const params = new URLSearchParams(search)
  if (params.get('period') !== 'custom') return undefined
  const from = params.get('from'), to = params.get('to')
  if (!from || !to || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to)) || Date.parse(to) <= Date.parse(from)) return undefined
  return { from, to }
}

export function readPeriodSelection(search: string): PeriodPreset | null {
  const value = new URLSearchParams(search).get('period')
  if (value === null) return '7d'
  if (value === 'month') return value
  if (value === 'custom') return readCustomAnalysisRange(search) ? value : null
  return periodPresets.find((preset) => preset === value) ?? null
}

export function urlWithPeriod(pathname: string, search: string, period: PeriodPreset): string {
  const params = new URLSearchParams(search)
  params.set('period', period)
  if (period !== 'custom') { params.delete('from'); params.delete('to') }
  return `${pathname}?${params.toString()}`
}
