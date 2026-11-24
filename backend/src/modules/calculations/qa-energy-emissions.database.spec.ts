import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createQualityFixture, type QualityFixture } from '../../../test/quality-fixture'
import { CollectionEntity } from '../../database/entities/collection.entity'
import { calculateObservationEnergy } from './energy-calculation'
import { calculateCarbonEmission, type CarbonFactorSnapshotInput } from './carbon-emission'
import { SIMPLIFIED_ENERGY_MODEL_V1 } from './energy-model'

const evidenceDir = resolve(__dirname, '../../../../.github/evidencias/qa-energia-emissoes')
const describeDatabase = process.env.TEST_DATABASE_URL ? describe : describe.skip
const factor: CarbonFactorSnapshotInput = {
  id: 'qa-factor', version: 'qa-factor-v1', contractVersion: '0.1.0', regionCode: 'br-sudeste',
  country: 'Brazil', region: 'Sudeste', city: null, intensity: 100, unit: 'gCO2e/kWh',
  queriedAt: '2026-11-23T00:00:00Z', source: null, validFrom: null, validUntil: null,
}

describe('CT-023/024: modelo fixo e limites numéricos', () => {
  it('S1: mantém fórmula e coeficientes fixos e distingue números finitos de overflow', () => {
    expect(SIMPLIFIED_ENERGY_MODEL_V1).toEqual({ key: 'simplified-energy', version: '1', cpuWattsAt100Percent: 100, memoryWattsPerGb: 0.375, diskWattsPerGb: 0.01, networkWattsPerGb: 0.02 })
    const observation = { id: 'qa-edge', applicationId: 'qa-edge', intervalStart: '2026-11-23T00:00:00Z', intervalEnd: '2026-11-23T01:00:00Z', collectedAt: '2026-11-23T01:00:00Z', metrics: { cpuPercent: 0, memoryGb: 1e-12, diskGb: 0, networkGb: 0 } }
    expect(calculateObservationEnergy(observation).energyKwh).toBeCloseTo(3.75e-16, 28)
    const large = calculateObservationEnergy({ ...observation, metrics: { ...observation.metrics, memoryGb: 1e12 } })
    expect(large.energyKwh).toBe(375000000)
    const overflow = calculateObservationEnergy({ ...observation, intervalStart: '0001-01-01T00:00:00Z', intervalEnd: '9999-01-01T00:00:00Z', metrics: { ...observation.metrics, memoryGb: Number.MAX_VALUE } })
    expect(overflow.energyKwh).toBeNull()
    expect(overflow.reasons).toContainEqual({ code: 'NON_FINITE_RESULT' })
  })

  it('CT-024 S1/S3/S4 e variações: 2 × 100 = 200 g = 0,2 kg; zero não substitui ausência', () => {
    expect(calculateCarbonEmission({ energyKwh: 2 }, factor)).toMatchObject({ emissionsGramsCo2e: 200, emissionsKilogramsCo2e: 0.2, reasons: [] })
    expect(calculateCarbonEmission({ energyKwh: 0 }, factor).emissionsGramsCo2e).toBe(0)
    expect(calculateCarbonEmission({ energyKwh: 2 }, { ...factor, intensity: 0 }).emissionsGramsCo2e).toBe(0)
    expect(calculateCarbonEmission({ energyKwh: 0 }, null)).toMatchObject({ emissionsGramsCo2e: null, reasons: [{ code: 'CARBON_FACTOR_UNAVAILABLE' }] })
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = calculateCarbonEmission({ energyKwh: invalid }, factor)
      expect(result.emissionsGramsCo2e).toBeNull()
      expect(result.reasons.length).toBeGreaterThan(0)
    }
    for (const invalid of [{ ...factor, intensity: -1 }, { ...factor, unit: 'kgCO2e/kWh' }]) expect(calculateCarbonEmission({ energyKwh: 2 }, invalid).emissionsGramsCo2e).toBeNull()
    const fractional = calculateCarbonEmission({ energyKwh: 0.123456789 }, { ...factor, intensity: 85.123456789 })
    expect(fractional.emissionsGramsCo2e).toBe(0.123456789 * 85.123456789)
  })
})

describeDatabase('CT-023/024: coleta normal → cálculo fixo → PostgreSQL → API', () => {
  let fixture: QualityFixture
  const captures: Record<string, unknown> = {}
  const requests: Array<{ path: string; status: number; body: unknown }> = []
  async function get(path: string) {
    const response = await fetch(`${fixture.url}${path}`)
    const body = await response.json()
    requests.push({ path, status: response.status, body })
    expect(response.status).toBe(200)
    return body
  }
  beforeAll(async () => { fixture = await createQualityFixture() }, 60_000)
  afterAll(async () => {
    mkdirSync(evidenceDir, { recursive: true })
    writeFileSync(resolve(evidenceDir, 'backend-evidence.json'), JSON.stringify({ at: new Date().toISOString(), model: SIMPLIFIED_ENERGY_MODEL_V1, captures, requests, upstreamRequests: fixture?.requests }, null, 2))
    await fixture?.close()
  }, 60_000)

  async function collect(name: string, interval: number, metrics: Record<string, number>, intensity: number | null = 100) {
    for (const id of ['quality-api', 'quality-worker']) fixture.sources.responses.set(`/metrics/${id}`, { status: 200, body: { collection_interval_seconds: interval, metrics } })
    fixture.sources.responses.set('/regions/br-sudeste/carbon-intensity', intensity === null
      ? { status: 404, body: { error: 'QA factor absent' } }
      : { status: 200, body: { region_code: 'br-sudeste', country: 'Brazil', region: 'Sudeste', city: null, carbon_intensity_gco2e_per_kwh: intensity, renewable_share_percent: 50 } })
    await fixture.cycle()
    const row = await fixture.database.getRepository(CollectionEntity).findOneOrFail({ where: { applicationId: 'quality-api' }, order: { collectedAt: 'DESC' } })
    captures[name] = row
    return row
  }

  it('CT-023 S2/S3: 50,87 W em 60/120 segundos gera energia proporcional e evidência própria', async () => {
    const metrics = { cpu_percent: 50, memory_gb: 2, disk_gb: 10, network_gb: 1 }
    const first = await collect('energy60s', 60, metrics)
    const second = await collect('energy120s', 120, metrics)
    expect(first.calculationEvidence?.energy.averagePowerW).toBeCloseTo(50.87, 12)
    expect(first.calculationEvidence?.energy.energyKwh).toBeCloseTo(50.87 * 60 / 3600000, 15)
    expect(second.calculationEvidence?.energy.energyKwh).toBeCloseTo(50.87 * 120 / 3600000, 15)
    expect(second.calculationEvidence?.energy.energyKwh).toBe(first.calculationEvidence!.energy.energyKwh! * 2)
    expect(first.energyKwh).toBe('0.00084783')
    expect(second.energyKwh).toBe('0.00169567')
    expect(second.id).not.toBe(first.id)
    expect(second.calculationEvidence?.energy.modelParameters).toEqual({ cpuWattsAt100Percent: 100, memoryWattsPerGb: 0.375, diskWattsPerGb: 0.01, networkWattsPerGb: 0.02 })
  })

  it('CT-023 S4 e CT-024 S3/S4: zero válido persiste; entrada inválida não cria energia; ausência de fator não vira zero', async () => {
    const zero = await collect('zero', 60, { cpu_percent: 0, memory_gb: 0, disk_gb: 0, network_gb: 0 })
    expect(zero.energyKwh).toBe('0.00000000')
    expect(zero.carbonGrams).toBe('0.00000000')
    const zeroFactor = await collect('zeroFactor', 60, { cpu_percent: 100, memory_gb: 0, disk_gb: 0, network_gb: 0 }, 0)
    expect(Number(zeroFactor.energyKwh)).toBeGreaterThan(0)
    expect(zeroFactor.carbonGrams).toBe('0.00000000')
    const missing = await collect('zeroWithoutFactor', 60, { cpu_percent: 0, memory_gb: 0, disk_gb: 0, network_gb: 0 }, null)
    expect(missing.energyKwh).toBe('0.00000000')
    expect(missing.carbonGrams).toBeNull()
    expect(missing.calculationEvidence?.carbon.reasons).toContainEqual({ code: 'CARBON_FACTOR_UNAVAILABLE' })
    const before = await fixture.database.getRepository(CollectionEntity).count()
    fixture.sources.responses.set('/metrics/quality-api', { status: 200, body: { collection_interval_seconds: 60, metrics: { memory_gb: 2, disk_gb: 0, network_gb: 0 } } })
    fixture.sources.responses.set('/metrics/quality-worker', { status: 200, body: { collection_interval_seconds: 60, metrics: { cpu_percent: -1, memory_gb: 2, disk_gb: 0, network_gb: 0 } } })
    await fixture.cycle()
    expect(await fixture.database.getRepository(CollectionEntity).count()).toBe(before)
  })

  it('CT-023 S5 e CT-024 S1/S2/S5: consulta original, agregado, metodologia e frações preservadas', async () => {
    const exact = await collect('exact2kwh', 72000, { cpu_percent: 100, memory_gb: 0, disk_gb: 0, network_gb: 0 })
    expect(exact.energyKwh).toBe('2.00000000')
    expect(exact.carbonGrams).toBe('200.00000000')
    const evidence = await get(`/applications/quality-api/collections/${exact.id}`)
    expect(evidence.environmental.carbon.calculatedValueKilogramsCo2e).toBe(0.2)
    expect(evidence.environmental.energy.model.formula.outputUnit).toBe('kWh')
    const from = new Date(exact.intervalStart.getTime() - 1000).toISOString()
    const to = new Date(exact.intervalEnd.getTime() + 1000).toISOString()
    const params = new URLSearchParams({ from, to })
    const detail = await get(`/applications/quality-api/analysis?${params}`)
    const summary = await get(`/analysis/summary?${params}`)
    expect(detail.energy.value).toBeGreaterThan(1.99)
    expect(summary.applications.find((item: {applicationId: string}) => item.applicationId === 'quality-api').energy).toEqual(detail.energy)
    expect(await fixture.database.getRepository(CollectionEntity).findOneByOrFail({ id: exact.id })).toEqual(exact)
    const comparisonParams = new URLSearchParams({ from, to, referenceApplicationId: 'quality-api' })
    comparisonParams.append('applicationIds', 'quality-api')
    comparisonParams.append('applicationIds', 'quality-worker')
    captures.ui = { application: await get('/applications/quality-api'), collection: evidence, detail, summary, comparison: await get(`/analysis/comparison?${comparisonParams}`) }
    const fraction = await collect('fraction', 60, { cpu_percent: 33.333333, memory_gb: 1.23456789, disk_gb: 0.12345678, network_gb: 0.45678912 }, 85.123456789)
    const expectedPower = 33.333333 + 1.23456789 * 0.375 + 0.12345678 * 0.01 + 0.45678912 * 0.02
    const expectedEnergy = expectedPower / 60000
    expect(fraction.calculationEvidence?.energy.energyKwh).toBeCloseTo(expectedEnergy, 15)
    const persistedFactor = Number(fraction.carbonFactor)
    expect(persistedFactor).toBe(85.12345679)
    expect(fraction.calculationEvidence?.carbon.factorSnapshot?.intensity).toBe(85.123456789)
    expect(fraction.calculationEvidence?.carbon.emissionsGramsCo2e).toBeCloseTo(expectedEnergy * 85.123456789, 14)
    expect(fraction.energyKwh).toBe(expectedEnergy.toFixed(8))
    expect(fraction.carbonGrams).toBe((expectedEnergy * 85.123456789).toFixed(8))
  })
})
