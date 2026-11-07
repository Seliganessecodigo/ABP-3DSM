import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import {
  UserAccountStatus,
  UserEntity,
  UserRole,
} from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AuthPrincipal } from './authentication.service'
import { AccountLifecycleService } from './account-lifecycle.service'

describe('AccountLifecycleService', () => {
  const now = new Date('2025-01-02T03:04:05.000Z')
  const principal: AuthPrincipal = {
    userId: 'admin-id',
    organizationId: 'organization-id',
    sessionId: 'session-id',
    role: UserRole.ADMIN,
    email: 'admin@example.test',
    name: 'Admin',
  }

  function createHarness() {
    const organizationRepository = { findOne: jest.fn() }
    const userRepository = {
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    }
    const sessionRepository = { update: jest.fn() }
    const getRepository = jest.fn((entity: unknown) => {
      if (entity === OrganizationEntity) return organizationRepository
      if (entity === UserEntity) return userRepository
      if (entity === AuthSessionEntity) return sessionRepository
      throw new Error('Unexpected repository')
    })
    const manager = { getRepository } as unknown as EntityManager
    const dataSource = {
      transaction: jest.fn(
        (work: (entityManager: EntityManager) => Promise<unknown>) =>
          work(manager),
      ),
    } as unknown as DataSource
    const auditWriter = { record: jest.fn().mockResolvedValue(undefined) }
    const service = new AccountLifecycleService(
      dataSource,
      auditWriter as unknown as AuditWriter,
      { now: () => now },
    )
    const actor = {
      id: principal.userId,
      organizationId: principal.organizationId,
      role: UserRole.ADMIN,
      status: UserAccountStatus.ACTIVE,
    }
    const target = {
      id: 'target-id',
      organizationId: principal.organizationId,
      role: UserRole.ANALYST,
      status: UserAccountStatus.ACTIVE,
    }
    organizationRepository.findOne.mockResolvedValue({ id: principal.organizationId })
    userRepository.findOne
      .mockResolvedValueOnce(actor)
      .mockResolvedValueOnce(target)

    return {
      service,
      organizationRepository,
      userRepository,
      sessionRepository,
      auditWriter,
      actor,
      target,
    }
  }

  const input = {
    status: UserAccountStatus.BLOCKED,
    expectedStatus: UserAccountStatus.ACTIVE,
    reason: 'Temporary suspension',
  }

  it('updates the account, revokes sessions, and audits in one transaction', async () => {
    const harness = createHarness()
    harness.userRepository.save.mockResolvedValue(harness.target)
    harness.sessionRepository.update.mockResolvedValue({ affected: 2 })

    await expect(
      harness.service.changeStatus(principal, harness.target.id, input),
    ).resolves.toEqual({
      userId: harness.target.id,
      status: UserAccountStatus.BLOCKED,
      changed: true,
    })

    expect(harness.target.status).toBe(UserAccountStatus.BLOCKED)
    expect(harness.sessionRepository.update).toHaveBeenCalledWith(
      { userId: harness.target.id, revokedAt: expect.anything() },
      { revokedAt: now },
    )
    expect(harness.auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'account.status.changed',
        outcome: 'success',
        before: { status: UserAccountStatus.ACTIVE },
        after: { status: UserAccountStatus.BLOCKED },
      }),
      expect.any(Object),
    )
  })

  it('treats a repeated request as idempotent before checking the expected status', async () => {
    const harness = createHarness()
    harness.target.status = UserAccountStatus.BLOCKED

    await expect(
      harness.service.changeStatus(principal, harness.target.id, {
        ...input,
        expectedStatus: UserAccountStatus.DEACTIVATED,
      }),
    ).resolves.toEqual({
      userId: harness.target.id,
      status: UserAccountStatus.BLOCKED,
      changed: false,
    })

    expect(harness.userRepository.save).not.toHaveBeenCalled()
    expect(harness.sessionRepository.update).not.toHaveBeenCalled()
    expect(harness.auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'account.status.unchanged',
        before: { status: UserAccountStatus.BLOCKED },
        after: { status: UserAccountStatus.BLOCKED },
      }),
      expect.any(Object),
    )
  })

  it('throws when the organization or target account is missing', async () => {
    const missingOrganization = createHarness()
    missingOrganization.organizationRepository.findOne.mockResolvedValue(null)
    await expect(
      missingOrganization.service.changeStatus(
        principal,
        'target-id',
        input,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)

    const missingTarget = createHarness()
    missingTarget.userRepository.findOne
      .mockReset()
      .mockResolvedValueOnce(missingTarget.actor)
      .mockResolvedValueOnce(null)
    await expect(
      missingTarget.service.changeStatus(principal, 'target-id', input),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it.each([
    ['missing', null, UserAccountStatus.ACTIVE, UserRole.ADMIN],
    ['inactive', principal.userId, UserAccountStatus.BLOCKED, UserRole.ADMIN],
    ['non-admin', principal.userId, UserAccountStatus.ACTIVE, UserRole.ANALYST],
  ])('denies a %s actor and records the denial', async (_, actorId, status, role) => {
    const harness = createHarness()
    harness.userRepository.findOne
      .mockReset()
      .mockResolvedValueOnce(
        actorId
          ? {
              ...harness.actor,
              status,
              role,
            }
          : null,
      )
      .mockResolvedValueOnce(harness.target)

    await expect(
      harness.service.changeStatus(principal, harness.target.id, input),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(harness.auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'account.status.denied',
        outcome: 'denied',
        allowDeniedBeforeSnapshot: true,
      }),
    )
  })

  it('rejects stale preconditions', async () => {
    const harness = createHarness()

    await expect(
      harness.service.changeStatus(principal, harness.target.id, {
        ...input,
        expectedStatus: UserAccountStatus.DEACTIVATED,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(harness.auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'account.status.denied' }),
    )
  })

  it('protects the last active Admin before applying the self-lockout rule', async () => {
    const harness = createHarness()
    harness.target.id = principal.userId
    harness.target.role = UserRole.ADMIN
    harness.userRepository.count.mockResolvedValue(1)

    await expect(
      harness.service.changeStatus(principal, harness.target.id, input),
    ).rejects.toBeInstanceOf(ConflictException)

    harness.userRepository.count.mockResolvedValue(2)
    harness.userRepository.findOne
      .mockResolvedValueOnce(harness.actor)
      .mockResolvedValueOnce(harness.target)
    await expect(
      harness.service.changeStatus(principal, harness.target.id, input),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
