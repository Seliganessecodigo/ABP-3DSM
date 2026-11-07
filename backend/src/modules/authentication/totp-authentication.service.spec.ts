import { EntityManager } from 'typeorm'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuthTokenEntity, AuthTokenKind } from '../../database/entities/auth-token.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import {
  UserAccountStatus,
  UserEntity,
  UserRole,
} from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AccessTokenService } from './access-token.service'
import { AuthPrincipal } from './authentication.service'
import { AuthClock } from './clock'
import { PasswordHasher } from './password-hasher.service'
import { TotpAuthenticationService } from './totp-authentication.service'
import { TotpService } from './totp.service'

describe('TotpAuthenticationService audit integration', () => {
  const organization = {
    id: 'org-1',
    recoveryRepresentativeEmail: 'old@example.test',
  } as OrganizationEntity
  const user = {
    id: 'admin-1',
    organizationId: organization.id,
    role: UserRole.ADMIN,
    status: UserAccountStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    email: 'admin@example.test',
    totpSecretCiphertext: 'ciphertext',
    totpKeyVersion: 'v1',
    totpLastUsedStep: '1',
    totpPendingCiphertext: 'pending',
    totpPendingKeyVersion: 'v1',
    totpPendingExpiresAt: new Date(),
  } as UserEntity
  const organizations = {
    findOne: jest.fn(),
    save: jest.fn(),
  }
  const users = {
    findOne: jest.fn(),
    save: jest.fn(),
  }
  const tokenRow = {
    userId: user.id,
    organizationId: user.organizationId,
    attempts: 0,
    consumedAt: null,
    revokedAt: null,
  }
  const tokens = {
    findOne: jest.fn(),
    save: jest.fn(async (entry) => entry),
    create: jest.fn((entry) => entry),
    update: jest.fn(),
  }
  const sessions = {
    create: jest.fn((entry) => entry),
    save: jest.fn(async (entry) => ({ ...entry, id: 'session-1' })),
    update: jest.fn(),
  }
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === OrganizationEntity) return organizations
      if (entity === UserEntity) return users
      if (entity === AuthTokenEntity) return tokens
      if (entity === AuthSessionEntity) return sessions
      throw new Error('Unexpected repository')
    }),
  } as unknown as EntityManager
  const dataSource = {
    transaction: jest.fn((work) => work(manager)),
  }
  const auditWriter = { record: jest.fn().mockResolvedValue({ id: 'event-1' }) }
  const accessTokens = {
    hashOpaqueToken: jest.fn((token) => `hash:${token}`),
    newRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    sign: jest.fn().mockReturnValue('access-token'),
  }
  const totp = {
    decrypt: jest.fn().mockReturnValue('totp-secret'),
    verify: jest.fn().mockReturnValue({ valid: true, timeStep: 10 }),
  }
  const principal = {
    userId: user.id,
    organizationId: user.organizationId,
    sessionId: 'session-1',
    role: UserRole.ADMIN,
    email: 'admin@example.test',
    name: 'Admin',
  } as AuthPrincipal
  let service: TotpAuthenticationService

  beforeEach(() => {
    jest.clearAllMocks()
    user.totpSecretCiphertext = 'ciphertext'
    user.totpKeyVersion = 'v1'
    user.totpLastUsedStep = '1'
    user.totpPendingCiphertext = 'pending'
    user.totpPendingKeyVersion = 'v1'
    user.totpPendingExpiresAt = new Date(Date.now() + 60000)
    tokenRow.attempts = 0
    tokens.findOne.mockResolvedValue(tokenRow)
    organizations.findOne.mockResolvedValue(organization)
    users.findOne.mockResolvedValue(user)
    service = new TotpAuthenticationService(
      dataSource as never,
      accessTokens as unknown as AccessTokenService,
      {} as PasswordHasher,
      totp as unknown as TotpService,
      { now: () => new Date() } as AuthClock,
      auditWriter as unknown as AuditWriter,
    )
  })

  it('attributes privileged recovery to the external operator in the mutation transaction', async () => {
    await service.recoverAdminTotp({
      organizationSlug: 'example',
      adminEmail: 'admin@example.test',
      representativeEmail: 'representative@example.test',
      operatorId: 'support-42',
      reason: 'Solicitação confirmada pelo responsável da organização',
    })

    expect(auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: { type: 'operator', operatorId: 'support-42' },
        action: 'auth.totp.recovered',
        entityType: 'user',
        entityId: user.id,
        outcome: 'success',
        reason: 'Solicitação confirmada pelo responsável da organização',
      }),
      manager,
    )
  })

  it('records TOTP login success inside the session transaction', async () => {
    await service.verifyLogin('challenge-token', '123456')

    expect(auditWriter.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: 'auth.login.totp.succeeded',
        actor: { type: 'user', userId: user.id },
        outcome: 'success',
      }),
      manager,
    )
    expect(auditWriter.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: 'auth.login.succeeded',
        actor: { type: 'user', userId: user.id },
        outcome: 'success',
      }),
    )
  })

  it('records TOTP replacement success inside the replacement transaction', async () => {
    const confirmation = {
      userId: user.id,
      organizationId: user.organizationId,
      consumedAt: null,
    }
    tokens.findOne.mockResolvedValue(confirmation)

    await service.confirmReplacement(principal, 'confirmation-token', '123456')

    expect(auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.totp.replaced' }),
      manager,
    )
  })

  it('records initial TOTP activation inside the setup transaction', async () => {
    user.totpSecretCiphertext = null
    user.totpKeyVersion = null
    tokens.findOne.mockResolvedValue({
      ...tokenRow,
      kind: AuthTokenKind.TOTP_SETUP_CONFIRMATION,
      consumedAt: null,
    })

    await service.confirmInitialSetup('setup-token', '123456')

    expect(auditWriter.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.totp.activated' }),
      manager,
    )
  })
})
