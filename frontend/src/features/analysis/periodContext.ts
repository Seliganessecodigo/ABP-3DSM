export const periodPresets = ['24h', '7d', '30d', '90d'] as const
export type PeriodPreset = (typeof periodPresets)[number]

export function readPeriodSelection(search: string): PeriodPreset | null {
  const value = new URLSearchParams(search).get('period')
  if (value === null) return '7d'
  return periodPresets.find((preset) => preset === value) ?? null
}

export function urlWithPeriod(pathname: string, search: string, period: PeriodPreset): string {
  const params = new URLSearchParams(search)
  params.set('period', period)
  return `${pathname}?${params.toString()}`
}
