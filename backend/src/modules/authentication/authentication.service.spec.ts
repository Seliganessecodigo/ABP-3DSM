import {
  UserAccountStatus,
  UserEntity,
  UserRole,
} from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AuthenticationPersistence } from './authentication.persistence'
import { AuthenticationService } from './authentication.service'
import { AuthClock } from './clock'
import { EmailDelivery } from './email-delivery'
import { AccessTokenService } from './access-token.service'
import { PasswordHasher } from './password-hasher.service'
import { TotpAuthenticationService } from './totp-authentication.service'

describe('AuthenticationService audit integration', () => {
  const persistence = {
    findUserByEmail: jest.fn(),
  }
  const accessTokens = {
    assertConfigured: jest.fn(),
  }
  const auditWriter = {
    record: jest.fn().mockResolvedValue({ id: 'event-1' }),
  }
  const totpAuthentication = {
    beginAdminLogin: jest.fn().mockResolvedValue({ status: 'TOTP_REQUIRED' }),
  }
  let service: AuthenticationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AuthenticationService(
      persistence as unknown as AuthenticationPersistence,
      accessTokens as unknown as AccessTokenService,
      {} as PasswordHasher,
      {} as never,
      { now: () => new Date() } as AuthClock,
      auditWriter as unknown as AuditWriter,
      {} as EmailDelivery,
      totpAuthentication as unknown as TotpAuthenticationService,
    )
  })

  it('records an unauthenticated actor when login credentials are rejected', async () => {
    persistence.findUserByEmail.mockResolvedValue(null)

    await expect(
      service.login({ email: 'unknown@example.test', password: 'bad-password' }),
    ).rejects.toThrow()

    expect(auditWriter.record).toHaveBeenCalledWith({
      actor: { type: 'unauthenticated' },
      action: 'auth.login.failed',
      entityType: 'user',
      entityId: 'unknown',
      outcome: 'denied',
    })
  })

  it('records an authenticated actor when SSO requires admin TOTP', async () => {
    const user = {
      id: 'user-1',
      status: UserAccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      role: UserRole.ADMIN,
    } as UserEntity

    await service.completeSsoLogin(user)

    expect(auditWriter.record).toHaveBeenCalledWith({
      actor: { type: 'user', userId: user.id },
      action: 'auth.sso.admin.totp.required',
      entityType: 'user',
      entityId: user.id,
      outcome: 'success',
    })
    expect(totpAuthentication.beginAdminLogin).toHaveBeenCalledWith(user)
  })
})
