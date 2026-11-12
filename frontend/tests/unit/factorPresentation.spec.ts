import { expect, test } from '@playwright/test'
import { factorPresentation } from '../../src/pages/detail/factorPresentation.ts'
import type { AnalysisFactor } from '../../src/features/analysis/source.ts'

function factor(intensity: number | string | null, unit: string | null = 'gCO2e/kWh'): AnalysisFactor {
  return { region: 'BR-SP', intensity, unit, queriedAt: '2026-10-01T00:00:00.000Z' }
}
test('repeated captures and versions do not turn a uniform intensity into multiple factors', () => {
  expect(factorPresentation({ status: 'available', factors: [factor(85), { ...factor('85.0'), version: 'other' }] }, 'pt-BR')).toBe('85 gCO2e/kWh')
})
test('different intensities show their numeric range without averaging', () => {
  expect(factorPresentation({ status: 'available', factors: [factor(115), factor(85)] }, 'pt-BR')).toBe('85–115 gCO2e/kWh')
})
test('missing or incompatible units never become zero or a combined range', () => {
  expect(factorPresentation({ status: 'available', factors: [factor(null)] }, 'pt-BR')).toBeNull()
  expect(factorPresentation({ status: 'available', factors: [factor(85, null)] }, 'pt-BR')).toBeNull()
  expect(factorPresentation({ status: 'available', factors: [] }, 'pt-BR')).toBeNull()
  expect(factorPresentation({ status: 'unavailable', reason: 'factorUnavailable' }, 'pt-BR')).toBeNull()
  expect(factorPresentation({ status: 'available', factors: [factor(0), factor(1, 'kgCO2e/kWh')] }, 'en-US')).toBe('0 gCO2e/kWh · 1 kgCO2e/kWh')
})
