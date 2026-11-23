import { EntityManager } from 'typeorm'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AuthPrincipal } from '../authentication/authentication.service'
import { PreferenceValue } from './preferences.dto'
import { PreferencesRepository } from './preferences.repository'

describe('PreferencesRepository audit integration', () => {
  const principal = {
    userId: 'user-1',
    organizationId: 'org-1',
  } as AuthPrincipal
  const value = {
    threshold: 8,
    alertsEnabled: true,
    scope: 'application',
    referencePeriod: 'month',
    unit: 'kWh',
  } as PreferenceValue
  const userRepository = { findOneOrFail: jest.fn() }
  const preferences = {
    findOneBy: jest.fn(),
    create: jest.fn((entry) => entry),
    save: jest.fn(),
  }
  const manager = {
    getRepository: jest.fn((entity) =>
      entity === UserEntity ? userRepository : preferences,
    ),
  } as unknown as EntityManager
  const database = {
    transaction: jest.fn((work) => work(manager)),
  }
  const auditWriter = { record: jest.fn().mockResolvedValue(undefined) }
  let repository: PreferencesRepository

  beforeEach(() => {
    jest.clearAllMocks()
    userRepository.findOneOrFail.mockResolvedValue({ id: principal.userId })
    preferences.findOneBy.mockResolvedValue(null)
    preferences.save.mockImplementation(async (entry) => ({
      ...entry,
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    }))
    repository = new PreferencesRepository(
      database as never,
      auditWriter as unknown as AuditWriter,
    )
  })

  it('writes the preference and its audit event through the same transaction', async () => {
    const saved = await repository.save(principal, 'energy', value, 0)

    expect(saved).toMatchObject({ value, revision: 1 })
    expect(auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: { type: 'user', userId: principal.userId },
        action: 'preference.saved',
        entityType: 'user_preference',
        entityId: 'user-1:energy',
        before: null,
        after: { value, revision: 1 },
        outcome: 'success',
      }),
      manager,
    )
  })

  it('does not audit a stale revision', async () => {
    preferences.findOneBy.mockResolvedValue({ revision: 2 })

    await expect(repository.save(principal, 'energy', value, 1)).resolves.toBeNull()

    expect(preferences.save).not.toHaveBeenCalled()
    expect(auditWriter.record).not.toHaveBeenCalled()
  })

  it('propagates audit persistence failure so the transaction can roll back', async () => {
    const error = new Error('audit storage unavailable')
    auditWriter.record.mockRejectedValue(error)

    await expect(repository.save(principal, 'energy', value, 0)).rejects.toBe(
      error,
    )
  })
})
