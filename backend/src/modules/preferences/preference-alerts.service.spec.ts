import { PreferenceAlertsService } from './preference-alerts.service'
import { PreferencesService } from './preferences.service'
import { EnvironmentalAnalysisSummaryService } from '../applications/environmental-analysis-summary.service'
import { BadRequestException } from '@nestjs/common'
import { UserRole } from '../../database/entities/user.entity'

const principal = { userId: 'one', organizationId: 'org', sessionId: 'session', name: 'Ana', email: 'ana@example.test', role: UserRole.ANALYST }
const energy = { threshold: 8, alertsEnabled: true, scope: 'application', referencePeriod: 'month', unit: 'kWh' }
const input = () => ({ energy, emissions: { ...energy, threshold: 1, unit: 'kgCO2e' }, coverage: { thresholdPercent: 80, alertsEnabled: true } })
const application = () => ({ applicationId: 'app-1', name: 'Application', state: 'AVAILABLE', energy: { value: 9, unit: 'kWh' }, emissions: { value: 1500, unit: 'gCO2e' }, coverage: { energy: 1, emissions: 1 } })
describe('avisos reais e prévia pelo mesmo avaliador', () => {
  const preferences = { find: jest.fn() }
  const summary = { getSummary: jest.fn() }
  const service = new PreferenceAlertsService(preferences as unknown as PreferencesService, summary as unknown as EnvironmentalAnalysisSummaryService)
  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-11-10T12:00:00Z'))
    summary.getSummary.mockResolvedValue({ applications: [application()] })
  })
  afterEach(() => jest.useRealTimers())
  it('consulta só o usuário autenticado e produz a mesma prévia sem gravar', async () => {
    preferences.find.mockResolvedValue({ energy: { value: energy }, emissions: { value: input().emissions }, coverage: { value: input().coverage } })
    expect(await service.find(principal)).toEqual(await service.evaluate(input()))
    expect(preferences.find).toHaveBeenCalledWith(principal)
  })
  it('deduplica períodos e converte gCO2e para kgCO2e antes de comparar', async () => {
    const result = await service.evaluate(input())
    expect(summary.getSummary).toHaveBeenCalledTimes(1)
    expect(summary.getSummary).toHaveBeenCalledWith({ from: '2026-11-01T00:00:00.000Z', to: '2026-11-10T12:00:00.000Z', includeProvenance: 'false' }, { includeMissingApplications: true })
    expect(result.applications[0].evaluations).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: 'energy', value: 9, threshold: 8, status: 'exceeded' }),
      expect.objectContaining({ metric: 'emissions', value: 1.5, threshold: 1, unit: 'kgCO2e', status: 'exceeded' }),
    ]))
  })
  it('não ultrapassa limite na igualdade; cobertura usa comparação inversa', async () => {
    const app = application(); app.energy.value = 8; app.emissions.value = 1000; app.coverage = { energy: .8, emissions: .79 }
    summary.getSummary.mockResolvedValue({ applications: [app] })
    const evaluations = (await service.evaluate(input())).applications[0].evaluations
    expect(evaluations.map(item => item.status)).toEqual(['insufficient-data', 'insufficient-data', 'within', 'exceeded'])
  })
  it('não transforma ausência em zero e não declara parcial abaixo do limite como seguro', async () => {
    summary.getSummary.mockResolvedValue({ applications: [{ ...application(), energy: { value: null }, emissions: { value: 0 }, coverage: { energy: 0, emissions: .5 } }] })
    const evaluations = (await service.evaluate(input())).applications[0].evaluations
    expect(evaluations[0]).toMatchObject({ value: null, status: 'insufficient-data' })
    expect(evaluations[1]).toMatchObject({ value: 0, status: 'insufficient-data' })
    expect(evaluations[2]).toMatchObject({ value: 0, status: 'exceeded' })
  })
  it('mantém ultrapassagem demonstrada por dados parciais sem extrapolar', async () => {
    summary.getSummary.mockResolvedValue({ applications: [{ ...application(), coverage: { energy: .2, emissions: .2 } }] })
    expect((await service.evaluate(input())).applications[0].evaluations[0]).toMatchObject({ value: 9, coveragePercent: 20, status: 'exceeded' })
  })
  it('não consulta histórico sem limites ativos; ausência de conta salva não cria limites', async () => {
    expect(await service.evaluate({ energy: null, emissions: null, coverage: null })).toMatchObject({ configured: false, applications: [] })
    expect(await service.evaluate({ energy: { ...energy, alertsEnabled: false }, emissions: null, coverage: null })).toMatchObject({ configured: false })
    expect(summary.getSummary).not.toHaveBeenCalled()
  })
  it('preserva três períodos independentes e intervalo personalizado', async () => {
    const custom = { kind: 'custom', from: '2026-01-01T00:00:00Z', to: '2026-01-02T00:00:00Z' }
    const modern = { threshold: energy.threshold, alertsEnabled: energy.alertsEnabled, scope: energy.scope, unit: energy.unit }
    const result = await service.evaluate({ energy: { ...modern, period: { kind: '7d' } }, emissions: { ...modern, unit: 'kgCO2e', period: custom }, coverage: { ...input().coverage, period: { kind: '30d' } } })
    expect(summary.getSummary).toHaveBeenCalledTimes(3)
    expect(result.applications[0].evaluations[1]).toMatchObject({ period: custom, from: custom.from, to: custom.to })
  })
  it('preserva falha de agregação como erro', async () => {
    summary.getSummary.mockRejectedValue(new Error('database unavailable'))
    await expect(service.evaluate(input())).rejects.toThrow('database unavailable')
  })
  it('primeiro instante do mês não inventa intervalo ou zero', async () => {
    jest.setSystemTime(new Date('2026-11-01T00:00:00Z'))
    expect(await service.evaluate(input())).toMatchObject({ configured: true, applications: [] })
    expect(summary.getSummary).not.toHaveBeenCalled()
  })
  it.each([null, [], {}, { ...input(), userId: 'other' }, { ...input(), energy: { ...energy, threshold: '8' } }])('valida a fronteira de prévia %j', async value => {
    await expect(service.evaluate(value)).rejects.toThrow(BadRequestException)
    expect(summary.getSummary).not.toHaveBeenCalled()
  })
})
