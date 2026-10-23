import { expect, test } from '@playwright/test'
import { parseCollectionEvidence } from '../../src/features/applications/api.ts'

const collection = (environmental: unknown) => ({
  id: 'collection-1', applicationId: 'app-1', intervalStart: '2026-10-07T09:59:00.000Z', intervalEnd: '2026-10-07T10:00:00.000Z',
  collectedAt: '2026-10-07T10:00:00.000Z', collectionIntervalSeconds: 60, isStale: false, state: 'AVAILABLE', reason: 'METRICS_VALID', lastCheckedAt: null,
  metrics: Object.fromEntries(['cpu', 'memory', 'disk', 'network'].map((key) => [key, { value: 1, unit: '%', status: 'available' }])), environmental,
})

const environmental = {
  status: 'present', absenceReason: null,
  energy: { valueKwh: 0, calculatedValueKwh: 0, coverage: 1, durationSeconds: 60, averagePowerW: 0,
    model: { key: 'simplified-energy', version: '1', configId: null, configVersion: null, parameters: { cpuWattsAt100Percent: 100 },
      formula: { status: 'available', expression: 'power × duration', inputUnits: { cpuWattsAt100Percent: 'W' }, outputUnit: 'kWh', reason: null },
      powerContributionsW: { cpuPercent: 0, memoryGb: 0, diskGb: 0, networkGb: 0 }, reasons: [] } },
  carbon: { valueGramsCo2e: 0, calculatedValueGramsCo2e: 0, calculatedValueKilogramsCo2e: 0, factor: 85,
    factorSnapshot: { id: 'factor-1', version: 'v1', contractVersion: 'v1', regionCode: 'br-sudeste', country: 'Brazil', region: 'Sudeste', city: null,
      intensity: 85, unit: 'gCO2e/kWh', queriedAt: '2026-10-07T10:00:00.000Z', source: null, validFrom: null, validUntil: null },
    formula: { expression: 'kWh × gCO2e/kWh = gCO2e', energyUnit: 'kWh', factorUnit: 'gCO2e/kWh', gramsUnit: 'gCO2e', kilogramsUnit: 'kgCO2e' }, reasons: [] },
}

test('consome os dados ambientais persistidos, inclusive valores zero', () => {
  expect(parseCollectionEvidence(collection(environmental)).environmental).toEqual(environmental)
})

test('mantém evidência ambiental ausente sem convertê-la em zero', () => {
  const absent = { status: 'absent', absenceReason: 'ENVIRONMENTAL_EVIDENCE_UNAVAILABLE', energy: null, carbon: null }
  expect(parseCollectionEvidence(collection(absent)).environmental).toEqual(absent)
})

test('rejeita evidência ambiental incompatível com o contrato', () => {
  expect(() => parseCollectionEvidence(collection({ status: 'present', absenceReason: null, energy: null, carbon: null }))).toThrow()
})
