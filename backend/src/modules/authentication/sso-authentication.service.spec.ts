import { ForbiddenException } from '@nestjs/common'
import { EntityManager } from 'typeorm'
import { ExternalIdentityEntity } from '../../database/entities/external-identity.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { SsoInvitationEntity } from '../../database/entities/sso-invitation.entity'
import { UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AccessTokenService } from './access-token.service'
import { AuthPrincipal, AuthenticationService } from './authentication.service'
import { AuthClock } from './clock'
import { EmailDelivery } from './email-delivery'
import { GoogleOidcClient } from './google-oidc-client'
import { SsoAuthenticationService } from './sso-authentication.service'

describe('SsoAuthenticationService audit integration', () => {
  const auditWriter = { record: jest.fn().mockResolvedValue({ id: 'event-1' }) }
  const transactionRepository = {
    findOne: jest.fn(),
    remove: jest.fn(),
  }
  const invitationQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  }
  const invitationRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(invitationQueryBuilder),
    create: jest.fn((entry) => entry),
    save: jest.fn((entry) => Promise.resolve({ ...entry, id: 'invitation-1' })),
  }
  const manager = {
    getRepository: jest.fn((entity) =>
      entity === SsoInvitationEntity ? invitationRepository : transactionRepository,
    ),
  } as unknown as EntityManager
  const dataSource = {
    transaction: jest.fn((work) => work(manager)),
    getRepository: jest.fn((entity) => {
      if (entity === OrganizationEntity) {
        return { findOne: jest.fn().mockResolvedValue({ id: 'org-1' }) }
      }
      if (entity === UserEntity) {
        return {
          createQueryBuilder: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
          }),
        }
      }
      throw new Error('Unexpected repository')
    }),
  }
  const accessTokens = {
    assertConfigured: jest.fn(),
    newRefreshToken: jest.fn().mockReturnValue('raw-invitation-token'),
    hashOpaqueToken: jest.fn().mockReturnValue('invitation-token-hash'),
  }
  const emailDelivery = { send: jest.fn().mockResolvedValue(undefined) }
  let service: SsoAuthenticationService
  const principal = {
    userId: 'admin-1',
    organizationId: 'org-1',
    sessionId: 'session-1',
    role: UserRole.ADMIN,
    email: 'admin@example.test',
    name: 'Admin',
  } as AuthPrincipal

  beforeEach(() => {
    jest.clearAllMocks()
    transactionRepository.findOne.mockResolvedValue({
      userId: 'user-2',
      organizationId: principal.organizationId,
      provider: 'google',
    } as ExternalIdentityEntity)
    service = new SsoAuthenticationService(
      dataSource as never,
      accessTokens as unknown as AccessTokenService,
      {} as GoogleOidcClient,
      {} as AuthenticationService,
      { now: () => new Date() } as AuthClock,
      emailDelivery as unknown as EmailDelivery,
      auditWriter as unknown as AuditWriter,
    )
  })

  it('records an invitation by its stable database ID inside the transaction', async () => {
    const previousUrl = process.env.APP_BASE_URL
    process.env.APP_BASE_URL = 'https://app.example.test'

    try {
      await service.issueInvitation(principal, {
        email: 'new-user@example.test',
        name: 'New User',
        role: UserRole.ANALYST,
      })
    } finally {
      if (previousUrl === undefined) delete process.env.APP_BASE_URL
      else process.env.APP_BASE_URL = previousUrl
    }

    expect(auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.sso.invitation.issued',
        entityId: 'invitation-1',
        outcome: 'success',
      }),
      manager,
    )
    expect(auditWriter.record.mock.calls[0][0]).not.toHaveProperty(
      'tokenHash',
    )
  })

  it('records a denied administrative attempt outside a transaction', async () => {
    const analyst = { ...principal, role: UserRole.ANALYST }

    await expect(
      service.revokeIdentity(analyst, 'user-2'),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(dataSource.transaction).not.toHaveBeenCalled()
    expect(auditWriter.record).toHaveBeenCalledWith({
      actor: { type: 'user', userId: principal.userId },
      action: 'auth.sso.identity.revoked',
      entityType: 'user',
      entityId: 'user-2',
      outcome: 'denied',
      reason: 'insufficient_role',
    })
  })

  it('commits identity revocation and its audit event through one manager', async () => {
    await service.revokeIdentity(principal, 'user-2')

    expect(transactionRepository.remove).toHaveBeenCalled()
    expect(auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: { type: 'user', userId: principal.userId },
        action: 'auth.sso.identity.revoked',
        entityId: 'user-2',
        outcome: 'success',
      }),
      manager,
    )
  })

  it('records an unsuccessful revocation outside the rolled-back transaction', async () => {
    transactionRepository.findOne.mockResolvedValue(null)

    await expect(
      service.revokeIdentity(principal, 'missing-user'),
    ).rejects.toThrow()

    expect(auditWriter.record).toHaveBeenCalledWith({
      actor: { type: 'user', userId: principal.userId },
      action: 'auth.sso.identity.revoked',
      entityType: 'user',
      entityId: 'missing-user',
      outcome: 'failed',
      reason: 'identity_not_found',
    })
  })
})
