import type { AnalysisFactorResult } from '../../features/analysis/source.ts'
import { formatNumber } from '../../utils/formatNumber.ts'

export function factorPresentation(factor: AnalysisFactorResult | null, locale: string): string | null {
  if (factor?.status !== 'available' || factor.factors.length === 0) return null
  const values = factor.factors.map((entry) => ({ value: entry.intensity === null || typeof entry.intensity === 'string' && entry.intensity.trim() === '' ? NaN : Number(entry.intensity), unit: entry.unit }))
  if (values.some((entry) => !Number.isFinite(entry.value) || entry.unit === null)) return null
  const units = new Set(values.map((entry) => entry.unit))
  if (units.size !== 1) return [...new Set(values.map((entry) => `${formatNumber(entry.value, locale)} ${entry.unit}`))].join(' · ')
  const minimum = Math.min(...values.map((entry) => entry.value))
  const maximum = Math.max(...values.map((entry) => entry.value))
  return `${formatNumber(minimum, locale)}${maximum === minimum ? '' : `–${formatNumber(maximum, locale)}`} ${values[0].unit}`
}
