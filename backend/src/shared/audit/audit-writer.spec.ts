import type { EntityManager, Repository } from 'typeorm'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository'
import { AuditWriter } from './audit-writer'

describe('AuditWriter', () => {
  const user = { id: 'user-1', name: 'Admin Example' } as UserEntity
  let auditLogs: jest.Mocked<Pick<AuditLogsRepository, 'append'>>
  let users: jest.Mocked<Pick<Repository<UserEntity>, 'findOne'>>
  let writer: AuditWriter

  beforeEach(() => {
    auditLogs = { append: jest.fn().mockResolvedValue({ id: 'event-1' }) }
    users = { findOne: jest.fn().mockResolvedValue(user) }
    writer = new AuditWriter(
      auditLogs as unknown as AuditLogsRepository,
      users as unknown as Repository<UserEntity>,
    )
  })

  it('persists an attributed success with a safe snapshot', async () => {
    await writer.record({
      actor: { type: 'user', userId: user.id },
      action: 'account.role.changed',
      entityType: 'user',
      entityId: user.id,
      outcome: 'success',
      before: { organizationId: 'org-1' },
      after: { organizationId: 'org-1' },
      allowedSnapshotFields: ['organizationId'],
      reason: 'role_change',
    })

    expect(auditLogs.append).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: user.id,
        actorType: 'user',
        actorUserId: user.id,
        actorLabel: user.name,
        action: 'account.role.changed',
        entityType: 'user',
        entityId: user.id,
        outcome: 'success',
        before: { organizationId: 'org-1' },
        after: { organizationId: 'org-1' },
        reason: 'role_change',
      }),
      undefined,
    )
  })

  it('persists system identity and omits snapshots for denied events', async () => {
    await writer.record({
      actor: { type: 'system', componentId: 'monitoring-scheduler' },
      action: 'monitoring.pause.denied',
      entityType: 'monitoring',
      entityId: 'global',
      outcome: 'denied',
      before: { state: 'running' },
      after: { state: 'paused' },
      allowedSnapshotFields: ['state'],
    })

    expect(auditLogs.append).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'monitoring-scheduler',
        actorType: 'system',
        actorSystemId: 'monitoring-scheduler',
        actorUserId: null,
        actorLabel: null,
        outcome: 'denied',
        before: null,
        after: null,
      }),
      undefined,
    )
    expect(users.findOne).not.toHaveBeenCalled()
  })

  it('preserves the external operator identity for privileged recovery', async () => {
    await writer.record({
      actor: { type: 'operator', operatorId: 'support-42' },
      action: 'auth.totp.recovered',
      entityType: 'user',
      entityId: user.id,
      outcome: 'success',
      reason: 'Solicitação confirmada pelo responsável da organização',
    })

    expect(auditLogs.append).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'support-42',
        actorType: 'operator',
        actorExternalId: 'support-42',
        actorUserId: null,
        actorSystemId: null,
        reason: 'Solicitação confirmada pelo responsável da organização',
      }),
      undefined,
    )
    expect(users.findOne).not.toHaveBeenCalled()
  })

  it('rejects snapshot fields outside the entity allowlist before persistence', async () => {
    await expect(
      writer.record({
        actor: { type: 'system', componentId: 'auth-service' },
        action: 'auth.login.failed',
        entityType: 'user',
        entityId: 'unknown',
        outcome: 'success',
        after: { passwordHash: 'secret' },
        allowedSnapshotFields: ['organizationId'],
      }),
    ).rejects.toThrow('Unsupported audit snapshot field')

    expect(auditLogs.append).not.toHaveBeenCalled()
  })

  it('rejects invalid events and nested sensitive snapshot fields', async () => {
    await expect(
      writer.record({
        actor: { type: 'system', componentId: 'auth-service' },
        action: ' ',
        entityType: 'user',
        entityId: 'unknown',
        outcome: 'success',
      }),
    ).rejects.toThrow('Invalid audit event')

    await expect(
      writer.record({
        actor: { type: 'system', componentId: 'auth-service' },
        action: 'user.preference.changed',
        entityType: 'user',
        entityId: 'user-1',
        outcome: 'success',
        after: { preferences: [{ apiToken: 'secret' }] },
        allowedSnapshotFields: ['preferences'],
      }),
    ).rejects.toThrow('Unsupported audit snapshot field')

    expect(auditLogs.append).not.toHaveBeenCalled()
  })

  it('requires an allowlist and accepts explicitly permitted nested data', async () => {
    const event = {
      actor: { type: 'system' as const, componentId: 'preferences-service' },
      action: 'user.preference.changed',
      entityType: 'user_preference',
      entityId: 'user-1:analysis',
      outcome: 'success' as const,
      after: { settings: [{ mode: 'dark' }] },
    }

    await expect(writer.record(event)).rejects.toThrow(
      'Audit snapshot allowlist is required',
    )
    await writer.record({ ...event, allowedSnapshotFields: ['settings'] })

    expect(auditLogs.append).toHaveBeenCalledWith(
      expect.objectContaining({ after: event.after }),
      undefined,
    )
  })

  it('uses the caller transaction and propagates persistence errors', async () => {
    const manager = { getRepository: jest.fn() } as unknown as EntityManager
    const error = new Error('audit storage unavailable')
    auditLogs.append.mockRejectedValue(error)

    await expect(
      writer.record(
        {
          actor: { type: 'system', componentId: 'auth-service' },
          action: 'auth.organization.created',
          entityType: 'organization',
          entityId: 'org-1',
          outcome: 'success',
        },
        manager,
      ),
    ).rejects.toBe(error)

    expect(auditLogs.append).toHaveBeenCalledWith(
      expect.any(Object),
      manager,
    )
  })

  it('does not write a denied event inside a transaction that may be rolled back', async () => {
    const manager = { getRepository: jest.fn() } as unknown as EntityManager

    await expect(
      writer.record(
        {
          actor: { type: 'unauthenticated' },
          action: 'auth.login.failed',
          entityType: 'user',
          entityId: 'unknown',
          outcome: 'denied',
        },
        manager,
      ),
    ).rejects.toThrow('Denied and failed audit events must be written outside a transaction')

    expect(auditLogs.append).not.toHaveBeenCalled()

    await writer.record({
      actor: { type: 'unauthenticated' },
      action: 'auth.login.failed',
      entityType: 'user',
      entityId: 'unknown',
      outcome: 'denied',
      before: { organizationId: 'org-1' },
      after: { organizationId: 'org-2' },
      allowedSnapshotFields: ['organizationId'],
    })

    expect(auditLogs.append).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'unauthenticated',
        actorType: 'unauthenticated',
        actorUserId: null,
        before: null,
        after: null,
      }),
      undefined,
    )
  })
})
