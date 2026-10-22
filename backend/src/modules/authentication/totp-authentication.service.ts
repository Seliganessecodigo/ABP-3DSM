import {
  BadRequestException,
  Inject,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, IsNull, MoreThan, Repository } from 'typeorm'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import {
  AuthTokenEntity,
  AuthTokenKind,
} from '../../database/entities/auth-token.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserEntity, UserRole } from '../../database/entities/user.entity'
import { AccessTokenService } from './access-token.service'
import { AUTH_CLOCK, AuthClock } from './clock'
import { PasswordHasher } from './password-hasher.service'
import { TotpService } from './totp.service'
import type { AuthPrincipal, TokenResponse } from './authentication.service'

const SESSION_MS = 7 * 24 * 60 * 60 * 1000
const SETUP_CREDENTIAL_MS = 5 * 60 * 1000
const CHALLENGE_MS = 5 * 60 * 1000
const PENDING_SETUP_MS = 10 * 60 * 1000
const CHALLENGE_WINDOW_MS = 15 * 60 * 1000

export interface TotpSetupRequired {
  status: 'TOTP_SETUP_REQUIRED'
  setupToken: string
  expiresIn: 300
}

export interface TotpChallengeRequired {
  status: 'TOTP_REQUIRED'
  challengeToken: string
  expiresIn: 300
}

export type AuthenticationLoginResponse =
  | TokenResponse
  | TotpSetupRequired
  | TotpChallengeRequired

@Injectable()
export class TotpAuthenticationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accessTokens: AccessTokenService,
    private readonly passwords: PasswordHasher,
    private readonly totp: TotpService,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
  ) {}

  async beginAdminLogin(user: UserEntity): Promise<TotpSetupRequired | TotpChallengeRequired> {
    const now = this.clock.now()
    if (!user.totpSecretCiphertext || !user.totpKeyVersion) {
      const rawToken = this.accessTokens.newRefreshToken()
      await this.dataSource.transaction(async (manager) => {
        const lockedUser = await manager.getRepository(UserEntity).findOne({
          where: { id: user.id, organizationId: user.organizationId },
          lock: { mode: 'pessimistic_write' },
        })
        if (
          !isEligibleAdmin(lockedUser) ||
          (lockedUser.totpSecretCiphertext && lockedUser.totpKeyVersion)
        ) {
          throw invalidTotpChallenge()
        }
        await this.createToken(manager, {
          user: lockedUser,
          kind: AuthTokenKind.TOTP_SETUP_CREDENTIAL,
          expiresAt: new Date(now.getTime() + SETUP_CREDENTIAL_MS),
          rawToken,
        })
      })
      return { status: 'TOTP_SETUP_REQUIRED', setupToken: rawToken, expiresIn: 300 }
    }

    const rawToken = this.accessTokens.newRefreshToken()
    await this.dataSource.transaction(async (manager) => {
      const lockedUser = await manager.getRepository(UserEntity).findOne({
        where: { id: user.id, organizationId: user.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (
        !isEligibleAdmin(lockedUser) ||
        !lockedUser.totpSecretCiphertext ||
        !lockedUser.totpKeyVersion
      ) {
        throw invalidTotpChallenge()
      }
      await this.enforceChallengeRate(manager, lockedUser, now)
      await this.createToken(manager, {
        user: lockedUser,
        kind: AuthTokenKind.TOTP_LOGIN_CHALLENGE,
        expiresAt: new Date(now.getTime() + CHALLENGE_MS),
        rawToken,
      })
    })
    return { status: 'TOTP_REQUIRED', challengeToken: rawToken, expiresIn: 300 }
  }

  async beginInitialSetup(setupToken: string): Promise<{
    setupToken: string
    provisioningUri: string
    expiresIn: 600
  }> {
    const now = this.clock.now()
    const rawConfirmation = this.accessTokens.newRefreshToken()
    const result = await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(AuthTokenEntity)
      const credential = await tokens.findOne({
        where: {
          tokenHash: this.accessTokens.hashOpaqueToken(setupToken),
          kind: AuthTokenKind.TOTP_SETUP_CREDENTIAL,
          consumedAt: IsNull(),
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!credential?.userId) throw invalidTotpChallenge()
      const users = manager.getRepository(UserEntity)
      const user = await users.findOne({
        where: { id: credential.userId, organizationId: credential.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!isEligibleAdmin(user) || user.totpSecretCiphertext) {
        throw invalidTotpChallenge()
      }
      const secret = this.totp.newSecret()
      const encrypted = this.totp.encrypt(secret)
      user.totpPendingCiphertext = encrypted.ciphertext
      user.totpPendingKeyVersion = encrypted.keyVersion
      user.totpPendingExpiresAt = new Date(now.getTime() + PENDING_SETUP_MS)
      await users.save(user)
      credential.consumedAt = now
      await tokens.save(credential)
      const confirmation = await this.createToken(manager, {
        user,
        kind: AuthTokenKind.TOTP_SETUP_CONFIRMATION,
        expiresAt: new Date(now.getTime() + PENDING_SETUP_MS),
        rawToken: rawConfirmation,
      })
      return { user, secret, confirmation }
    })
    await this.recordAudit(result.user.id, 'auth.totp.setup.started', result.user.id)
    return {
      setupToken: rawConfirmation,
      provisioningUri: this.totp.provisioningUri(result.secret, result.user.email),
      expiresIn: 600,
    }
  }

  async confirmInitialSetup(setupToken: string, code: string): Promise<TokenResponse> {
    const now = this.clock.now()
    const session = await this.confirmPendingSetup(
      setupToken,
      code,
      AuthTokenKind.TOTP_SETUP_CONFIRMATION,
      now,
    )
    return this.sessionResponse(session.user, session.id, session.refreshToken)
  }

  async verifyLogin(challengeToken: string, code: string): Promise<TokenResponse> {
    const now = this.clock.now()
    const result = await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(AuthTokenEntity)
      const challenge = await tokens.findOne({
        where: {
          tokenHash: this.accessTokens.hashOpaqueToken(challengeToken),
          kind: AuthTokenKind.TOTP_LOGIN_CHALLENGE,
          consumedAt: IsNull(),
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!challenge?.userId || challenge.attempts >= 5) {
        return { error: invalidTotpChallenge() as UnauthorizedException }
      }
      const users = manager.getRepository(UserEntity)
      const user = await users.findOne({
        where: { id: challenge.userId, organizationId: challenge.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!isEligibleAdmin(user) || !user.totpSecretCiphertext || !user.totpKeyVersion) {
        return { error: invalidTotpChallenge() as UnauthorizedException }
      }
      const secret = this.totp.decrypt(user.totpSecretCiphertext, user.totpKeyVersion)
      const verified = this.totp.verify(secret, code, now.getTime())
      if (
        !verified.valid ||
        verified.timeStep === null ||
        (user.totpLastUsedStep !== null && verified.timeStep <= Number(user.totpLastUsedStep))
      ) {
        challenge.attempts += 1
        if (challenge.attempts >= 5) challenge.revokedAt = now
        await tokens.save(challenge)
        return { error: invalidTotpCode() as UnauthorizedException }
      }
      challenge.consumedAt = now
      user.totpLastUsedStep = String(verified.timeStep)
      user.lastAccessAt = now
      await tokens.save(challenge)
      await users.save(user)
      const session = await this.createSession(manager, user, now)
      await manager.getRepository(AuditLogEntity).insert(
        auditRecord(user.id, 'auth.login.totp.succeeded', 'user', user.id),
      )
      return { session, user }
    })
    if ('error' in result) throw result.error
    await this.recordAudit(result.session.userId, 'auth.login.succeeded', result.session.userId)
    return this.sessionResponse(
      result.user,
      result.session.id,
      result.session.refreshToken,
    )
  }

  async beginReplacement(
    principal: AuthPrincipal,
    password: string,
    currentCode: string,
  ): Promise<{ confirmationToken: string; provisioningUri: string; expiresIn: 600 }> {
    const now = this.clock.now()
    const rawConfirmation = this.accessTokens.newRefreshToken()
    const result = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity)
      const user = await users.findOne({
        where: { id: principal.userId, organizationId: principal.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!isEligibleAdmin(user) || !user.passwordHash || !user.totpSecretCiphertext || !user.totpKeyVersion) {
        throw invalidTotpChallenge()
      }
      const passwordCheck = await this.passwords.verifyWithUpgrade(user.passwordHash, password)
      if (!passwordCheck.valid) throw invalidCredentials()
      if (passwordCheck.upgradedHash) user.passwordHash = passwordCheck.upgradedHash
      const currentSecret = this.totp.decrypt(user.totpSecretCiphertext, user.totpKeyVersion)
      const verified = this.totp.verify(currentSecret, currentCode, now.getTime())
      if (
        !verified.valid ||
        verified.timeStep === null ||
        (user.totpLastUsedStep !== null && verified.timeStep <= Number(user.totpLastUsedStep))
      ) {
        throw invalidTotpCode()
      }
      user.totpLastUsedStep = String(verified.timeStep)
      const secret = this.totp.newSecret()
      const encrypted = this.totp.encrypt(secret)
      user.totpPendingCiphertext = encrypted.ciphertext
      user.totpPendingKeyVersion = encrypted.keyVersion
      user.totpPendingExpiresAt = new Date(now.getTime() + PENDING_SETUP_MS)
      await users.save(user)
      await this.createToken(manager, {
        user,
        kind: AuthTokenKind.TOTP_REPLACEMENT_CONFIRMATION,
        expiresAt: new Date(now.getTime() + PENDING_SETUP_MS),
        rawToken: rawConfirmation,
      })
      return { user, secret }
    })
    await this.recordAudit(principal.userId, 'auth.totp.replacement.started', principal.userId)
    return {
      confirmationToken: rawConfirmation,
      provisioningUri: this.totp.provisioningUri(result.secret, result.user.email),
      expiresIn: 600,
    }
  }

  async confirmReplacement(
    principal: AuthPrincipal,
    confirmationToken: string,
    code: string,
  ): Promise<{ message: string }> {
    const now = this.clock.now()
    await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(AuthTokenEntity)
      const confirmation = await tokens.findOne({
        where: {
          tokenHash: this.accessTokens.hashOpaqueToken(confirmationToken),
          userId: principal.userId,
          organizationId: principal.organizationId,
          kind: AuthTokenKind.TOTP_REPLACEMENT_CONFIRMATION,
          consumedAt: IsNull(),
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!confirmation) throw invalidTotpChallenge()
      const users = manager.getRepository(UserEntity)
      const user = await users.findOne({
        where: { id: principal.userId, organizationId: principal.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (
        !isEligibleAdmin(user) ||
        !user.totpPendingCiphertext ||
        !user.totpPendingKeyVersion ||
        !user.totpPendingExpiresAt ||
        user.totpPendingExpiresAt <= now
      ) {
        throw invalidTotpChallenge()
      }
      const secret = this.totp.decrypt(user.totpPendingCiphertext, user.totpPendingKeyVersion)
      const verified = this.totp.verify(secret, code, now.getTime())
      if (!verified.valid || verified.timeStep === null) throw invalidTotpCode()
      user.totpSecretCiphertext = user.totpPendingCiphertext
      user.totpKeyVersion = user.totpPendingKeyVersion
      user.totpLastUsedStep = String(verified.timeStep)
      clearPendingTotp(user)
      confirmation.consumedAt = now
      await users.save(user)
      await tokens.save(confirmation)
      await manager.getRepository(AuthSessionEntity).update(
        { userId: user.id, revokedAt: IsNull() },
        { revokedAt: now },
      )
      await tokens.update(
        {
          userId: user.id,
          kind: AuthTokenKind.TOTP_LOGIN_CHALLENGE,
          consumedAt: IsNull(),
          revokedAt: IsNull(),
        },
        { revokedAt: now },
      )
      await manager.getRepository(AuditLogEntity).insert(
        auditRecord(user.id, 'auth.totp.replaced', 'user', user.id),
      )
    })
    return { message: 'Autenticador substituído. Entre novamente para continuar.' }
  }

  async recoverAdminTotp(input: {
    organizationSlug: string
    adminEmail: string
    representativeEmail: string
    operatorId: string
    reason: string
  }): Promise<void> {
    const organizationSlug = input.organizationSlug.trim().toLowerCase()
    const adminEmail = normalizeEmail(input.adminEmail)
    const representativeEmail = normalizeEmail(input.representativeEmail)
    const operatorId = input.operatorId.trim()
    const reason = input.reason.trim()
    if (
      !organizationSlug ||
      !isEmail(adminEmail) ||
      !isEmail(representativeEmail) ||
      !operatorId ||
      operatorId.length > 110 ||
      !reason ||
      reason.length > 512
    ) {
      throw new BadRequestException('Dados de recuperação inválidos')
    }
    const now = this.clock.now()
    await this.dataSource.transaction(async (manager) => {
      const organizations = manager.getRepository(OrganizationEntity)
      const organization = await organizations.findOne({
        where: { slug: organizationSlug },
        lock: { mode: 'pessimistic_write' },
      })
      const users = manager.getRepository(UserEntity)
      const user = organization
        ? await users.findOne({
            where: { organizationId: organization.id, email: adminEmail, role: UserRole.ADMIN },
            lock: { mode: 'pessimistic_write' },
          })
        : null
      if (!organization || !user) throw new BadRequestException('Conta Admin não encontrada')
      const before = { representativeEmail: organization.recoveryRepresentativeEmail }
      organization.recoveryRepresentativeEmail = representativeEmail
      await organizations.save(organization)
      user.totpSecretCiphertext = null
      user.totpKeyVersion = null
      user.totpLastUsedStep = null
      clearPendingTotp(user)
      await users.save(user)
      const tokens = manager.getRepository(AuthTokenEntity)
      await tokens.update(
        { userId: user.id, consumedAt: IsNull(), revokedAt: IsNull() },
        { revokedAt: now },
      )
      await manager.getRepository(AuthSessionEntity).update(
        { userId: user.id, revokedAt: IsNull() },
        { revokedAt: now },
      )
      const audit = manager.getRepository(AuditLogEntity).create({
        actor: `support:${operatorId}`,
        actorUserId: null,
        action: 'auth.totp.recovered',
        entityType: 'user',
        entityId: user.id,
        before,
        after: { representativeEmail },
        reason,
        outcome: 'succeeded',
      })
      await manager.getRepository(AuditLogEntity).save(audit)
    })
  }

  private async confirmPendingSetup(
    rawToken: string,
    code: string,
    kind: AuthTokenKind,
    now: Date,
  ): Promise<{ userId: string; user: UserEntity; id: string; refreshToken: string }> {
    const refreshToken = this.accessTokens.newRefreshToken()
    const result = await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(AuthTokenEntity)
      const confirmation = await tokens.findOne({
        where: {
          tokenHash: this.accessTokens.hashOpaqueToken(rawToken),
          kind,
          consumedAt: IsNull(),
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!confirmation?.userId) throw invalidTotpChallenge()
      const users = manager.getRepository(UserEntity)
      const user = await users.findOne({
        where: { id: confirmation.userId, organizationId: confirmation.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (
        !isEligibleAdmin(user) ||
        user.totpSecretCiphertext ||
        !user.totpPendingCiphertext ||
        !user.totpPendingKeyVersion ||
        !user.totpPendingExpiresAt ||
        user.totpPendingExpiresAt <= now
      ) {
        throw invalidTotpChallenge()
      }
      const secret = this.totp.decrypt(user.totpPendingCiphertext, user.totpPendingKeyVersion)
      const verified = this.totp.verify(secret, code, now.getTime())
      if (!verified.valid || verified.timeStep === null) throw invalidTotpCode()
      user.totpSecretCiphertext = user.totpPendingCiphertext
      user.totpKeyVersion = user.totpPendingKeyVersion
      user.totpLastUsedStep = String(verified.timeStep)
      user.lastAccessAt = now
      clearPendingTotp(user)
      confirmation.consumedAt = now
      await users.save(user)
      await tokens.save(confirmation)
      const session = await this.createSession(manager, user, now, refreshToken)
      await manager.getRepository(AuditLogEntity).insert(
        auditRecord(user.id, 'auth.totp.activated', 'user', user.id),
      )
      return { user, session }
    })
    return {
      userId: result.user.id,
      user: result.user,
      id: result.session.id,
      refreshToken,
    }
  }

  private async enforceChallengeRate(
    manager: import('typeorm').EntityManager,
    user: UserEntity,
    now: Date,
  ): Promise<void> {
    const since = new Date(now.getTime() - CHALLENGE_WINDOW_MS)
    const recent = await manager.getRepository(AuthTokenEntity).find({
      where: {
        userId: user.id,
        kind: AuthTokenKind.TOTP_LOGIN_CHALLENGE,
        createdAt: MoreThan(since),
      },
      order: { createdAt: 'DESC' },
    })
    if (recent.length >= 5) {
      throw new HttpException({
        code: 'TOTP_CHALLENGE_RATE_LIMITED',
        message: 'Tente novamente mais tarde',
      }, HttpStatus.TOO_MANY_REQUESTS)
    }
    if (recent.length) {
      const delayMs = Math.min(16, 2 ** (recent.length - 1)) * 1000
      const retryAt = recent[0].createdAt.getTime() + delayMs
      if (retryAt > now.getTime()) {
        throw new HttpException({
          code: 'TOTP_CHALLENGE_DELAYED',
          message: 'Tente novamente mais tarde',
          retryAfterSeconds: Math.ceil((retryAt - now.getTime()) / 1000),
        }, HttpStatus.TOO_MANY_REQUESTS)
      }
    }
  }

  private createToken(
    manager: EntityManager,
    input: { user: UserEntity; kind: AuthTokenKind; expiresAt: Date; rawToken: string },
  ) {
    const tokens = manager.getRepository(AuthTokenEntity)
    return tokens.save(
      tokens.create({
        tokenHash: this.accessTokens.hashOpaqueToken(input.rawToken),
        kind: input.kind,
        organizationId: input.user.organizationId,
        userId: input.user.id,
        email: input.user.email,
        createdAt: this.clock.now(),
        expiresAt: input.expiresAt,
        consumedAt: null,
        revokedAt: null,
        attempts: 0,
      }),
    )
  }

  private async createSession(
    manager: EntityManager,
    user: UserEntity,
    now: Date,
    refreshToken = this.accessTokens.newRefreshToken(),
  ): Promise<AuthSessionEntity & { refreshToken: string }> {
    const repository = manager.getRepository(AuthSessionEntity)
    const session = await repository.save(
      repository.create({
        userId: user.id,
        organizationId: user.organizationId,
        refreshTokenHash: this.accessTokens.hashOpaqueToken(refreshToken),
        lastActivityAt: now,
        absoluteExpiresAt: new Date(now.getTime() + SESSION_MS),
        revokedAt: null,
        secondFactorVerifiedAt: now,
      }),
    )
    return Object.assign(session, { refreshToken })
  }

  private sessionResponse(
    user: UserEntity,
    sessionId: string,
    refreshToken: string,
  ): TokenResponse {
    return {
      accessToken: this.accessTokens.sign(user.id, user.organizationId, sessionId, user.role),
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    }
  }

  private recordAudit(userId: string, action: string, entityId: string) {
    return this.auditLogs.insert(auditRecord(userId, action, 'user', entityId))
  }
}

function isEligibleAdmin(user: UserEntity | null): user is UserEntity {
  return Boolean(user?.isActive && user.emailVerifiedAt && user.role === UserRole.ADMIN)
}

function clearPendingTotp(user: UserEntity): void {
  user.totpPendingCiphertext = null
  user.totpPendingKeyVersion = null
  user.totpPendingExpiresAt = null
}

function auditRecord(actor: string, action: string, entityType: string, entityId: string) {
  return {
    actor,
    actorUserId: actor.startsWith('support:') ? null : actor,
    action,
    entityType,
    entityId,
    before: null,
    after: null,
    reason: null,
    outcome: 'succeeded',
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'E-mail, senha ou organização inválidos',
  })
}

function invalidTotpChallenge(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_TOTP_CHALLENGE',
    message: 'Desafio TOTP inválido ou expirado',
  })
}

function invalidTotpCode(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_TOTP_CODE',
    message: 'Código TOTP inválido ou expirado',
  })
}
