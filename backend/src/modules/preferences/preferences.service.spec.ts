import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common'
import { PreferencesService, validatePreference } from './preferences.service'
import { PreferencesRepository } from './preferences.repository'
import { UserRole } from '../../database/entities/user.entity'

const principal = { userId: 'user', organizationId: 'org', sessionId: 'session', name: 'Ana', email: 'ana@example.test', role: UserRole.VISITOR }
const limit = { threshold: 8, alertsEnabled: true, scope: 'application', referencePeriod: 'month', unit: 'kWh' }

describe('contrato de preferências pessoais', () => {
  it.each([
    ['energy', limit],
    ['emissions', { ...limit, threshold: 0, unit: 'kgCO2e', alertsEnabled: false }],
    ['coverage', { thresholdPercent: 0, alertsEnabled: false }],
    ['coverage', { thresholdPercent: 100, alertsEnabled: true }],
    ['analysis', { periodDays: 7, granularity: 'hour' }],
    ['analysis', { periodDays: 30, granularity: 'day' }],
  ])('aceita %s sem aplicar valores padrão', (tab, value) => {
    expect(validatePreference(tab, { expectedRevision: 0, value }).value).toEqual(value)
  })
  it.each([
    ['other', { expectedRevision: 0, value: limit }], ['energy', null], ['energy', []],
    ['energy', { expectedRevision: '0', value: limit }], ['energy', { expectedRevision: -1, value: limit }],
    ['energy', { expectedRevision: 1.5, value: limit }], ['energy', { expectedRevision: 0, value: null }],
    ['energy', { expectedRevision: 0, value: { ...limit, threshold: NaN } }],
    ['energy', { expectedRevision: 0, value: { ...limit, threshold: Infinity } }],
    ['energy', { expectedRevision: 0, value: { ...limit, threshold: -1 } }],
    ['energy', { expectedRevision: 0, value: { ...limit, threshold: '8' } }],
    ['energy', { expectedRevision: 0, value: { ...limit, unit: 'W' } }],
    ['energy', { expectedRevision: 0, value: { ...limit, alertsEnabled: 'true' } }],
    ['energy', { expectedRevision: 0, value: { ...limit, scope: 'all' } }],
    ['energy', { expectedRevision: 0, value: { ...limit, referencePeriod: 'day' } }],
    ['energy', { expectedRevision: 0, value: limit, userId: 'other' }],
    ['coverage', { expectedRevision: 0, value: { thresholdPercent: 101, alertsEnabled: true } }],
    ['coverage', { expectedRevision: 0, value: { thresholdPercent: 80, alertsEnabled: null } }],
    ['analysis', { expectedRevision: 0, value: { periodDays: 90, granularity: 'hour' } }],
    ['analysis', { expectedRevision: 0, value: { periodDays: 7, granularity: 'minute' } }],
  ])('rejeita contrato inválido em %s', (tab, input) => {
    expect(() => validatePreference(tab, input)).toThrow(BadRequestException)
  })
})

describe('serviço de preferências', () => {
  const repository = { find: jest.fn(), save: jest.fn() }
  const service = new PreferencesService(repository as unknown as PreferencesRepository)
  beforeEach(() => jest.resetAllMocks())
  it('mantém ausência como null e consulta somente o usuário autenticado', async () => {
    repository.find.mockResolvedValue([])
    await expect(service.find(principal)).resolves.toEqual({ energy: null, emissions: null, coverage: null, analysis: null })
    expect(repository.find).toHaveBeenCalledWith('user')
  })
  it('expõe valores salvos, revisão e instante', async () => {
    repository.find.mockResolvedValue([{ tab: 'energy', value: limit, revision: 2, updatedAt: new Date('2026-10-28T12:00:00Z') }])
    expect((await service.find(principal)).energy).toEqual({ value: limit, revision: 2, updatedAt: '2026-10-28T12:00:00.000Z' })
  })
  it('salva uma aba sem reescrever outras preferências', async () => {
    repository.save.mockResolvedValue({ value: limit, revision: 1, updatedAt: new Date('2026-10-28T12:00:00Z') })
    await expect(service.save(principal, 'energy', { expectedRevision: 0, value: limit })).resolves.toMatchObject({ value: limit, revision: 1 })
    expect(repository.save).toHaveBeenCalledWith(principal, 'energy', limit, 0)
  })
  it('não grava corpo inválido', async () => {
    await expect(service.save(principal, 'energy', {})).rejects.toThrow(BadRequestException)
    expect(repository.save).not.toHaveBeenCalled()
  })
  it('retorna conflito sem sobrescrever revisão', async () => {
    repository.save.mockResolvedValue(null)
    await expect(service.save(principal, 'energy', { expectedRevision: 0, value: limit })).rejects.toThrow(ConflictException)
  })
  it('não converte falha de leitura em ausência', async () => {
    repository.find.mockRejectedValue(new Error('database password hidden'))
    await expect(service.find(principal)).rejects.toThrow(ServiceUnavailableException)
  })
  it('não confirma salvamento quando a transação falha', async () => {
    repository.save.mockRejectedValue(new Error('database password hidden'))
    await expect(service.save(principal, 'energy', { expectedRevision: 0, value: limit })).rejects.toThrow(ServiceUnavailableException)
  })
})
