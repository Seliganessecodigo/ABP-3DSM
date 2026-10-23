import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomBytes } from 'node:crypto'
import {
  DataSource,
  IsNull,
  MoreThan,
  QueryFailedError,
  Repository,
} from 'typeorm'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import {
  AuthTokenEntity,
  AuthTokenKind,
} from '../../database/entities/auth-token.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserEntity, UserRole } from '../../database/entities/user.entity'
import { AccessTokenService } from './access-token.service'
import { EMAIL_DELIVERY, EmailDelivery } from './email-delivery'
import { AuthenticationPersistence } from './authentication.persistence'
import { PasswordHasher } from './password-hasher.service'
import { AUTH_CLOCK, AuthClock } from './clock'
import {
  AuthenticationLoginResponse,
  TotpAuthenticationService,
} from './totp-authentication.service'

const ACCESS_SECONDS = 15 * 60
const IDLE_SESSION_MS = 12 * 60 * 60 * 1000
const ABSOLUTE_SESSION_MS = 7 * 24 * 60 * 60 * 1000
const INVITATION_TTL_MS = 24 * 60 * 60 * 1000
const EMAIL_CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000

export interface AuthPrincipal {
  userId: string
  organizationId: string
  sessionId: string
  role: UserRole
  email: string
  name: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly persistence: AuthenticationPersistence,
    private readonly accessTokens: AccessTokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly dataSource: DataSource,
    @Inject(AUTH_CLOCK)
    private readonly clock: AuthClock,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
    @Inject(EMAIL_DELIVERY)
    private readonly emailDelivery: EmailDelivery,
    private readonly totpAuthentication: TotpAuthenticationService,
  ) {}

  async login(input: {
    organization: string
    email: string
    password: string
  }): Promise<AuthenticationLoginResponse> {
    this.accessTokens.assertConfigured()
    const organization = await this.persistence.findOrganizationBySlug(
      input.organization.trim().toLowerCase(),
    )
    const email = normalizeEmail(input.email)
    const user = organization
      ? await this.persistence.findUser(organization.id, email)
      : null

    if (
      !user ||
      !user.isActive ||
      !user.emailVerifiedAt ||
      !user.passwordHash
    ) {
      await this.recordAudit(
        'anonymous',
        'auth.login.failed',
        'user',
        'unknown',
        'denied',
      )
      throw invalidCredentials()
    }

    const passwordVerification = await this.passwordHasher.verifyWithUpgrade(
      user.passwordHash,
      input.password,
    )
    if (!passwordVerification.valid) {
      await this.recordAudit(
        'anonymous',
        'auth.login.failed',
        'user',
        'unknown',
        'denied',
      )
      throw invalidCredentials()
    }

    if (passwordVerification.upgradedHash) {
      user.passwordHash = passwordVerification.upgradedHash
      await this.persistence.updateUser(user)
    }
    if (user.role === UserRole.ADMIN) {
      await this.recordAudit(
        user.id,
        'auth.login.password.succeeded',
        'user',
        user.id,
        'succeeded',
      )
      return this.totpAuthentication.beginAdminLogin(user)
    }

    const now = this.clock.now()
    const refreshToken = this.accessTokens.newRefreshToken()
    const session = await this.persistence.createSession({
      userId: user.id,
      organizationId: user.organizationId,
      refreshTokenHash: this.accessTokens.hashOpaqueToken(refreshToken),
      lastActivityAt: now,
      absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_SESSION_MS),
      revokedAt: null,
      secondFactorVerifiedAt: null,
    })
    user.lastAccessAt = now
    await this.persistence.updateUser(user)
    await this.recordAudit(
      user.id,
      'auth.login.succeeded',
      'user',
      user.id,
      'succeeded',
    )
    return this.tokenResponse(user, session.id, refreshToken)
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    this.accessTokens.assertConfigured()
    if (typeof refreshToken !== 'string' || refreshToken.length < 32) {
      throw invalidCredentials()
    }
    const oldHash = this.accessTokens.hashOpaqueToken(refreshToken)
    const session = await this.persistence.findSessionForRefresh(oldHash)
    const now = this.clock.now()
    if (
      !session ||
      !this.sessionUsable(session, now) ||
      (session.user?.role === UserRole.ADMIN && !session.secondFactorVerifiedAt)
    ) {
      if (
        session &&
        (!session.user?.isActive || !session.user?.emailVerifiedAt)
      ) {
        await this.persistence.revokeSessionsForUser(session.userId, now)
      } else if (
        session &&
        session.user?.role === UserRole.ADMIN &&
        !session.secondFactorVerifiedAt
      ) {
        await this.persistence.revokeSession(session.id, now)
      }
      throw invalidCredentials()
    }

    const nextRefreshToken = this.accessTokens.newRefreshToken()
    const result = await this.persistence.updateSession(
      session.id,
      oldHash,
      this.accessTokens.hashOpaqueToken(nextRefreshToken),
      now,
    )
    if (!result.affected) {
      throw invalidCredentials()
    }
    session.lastActivityAt = now
    await this.recordAudit(
      session.userId,
      'auth.session.refreshed',
      'session',
      session.id,
      'succeeded',
    )
    return this.tokenResponse(session.user, session.id, nextRefreshToken)
  }

  beginInitialTotpSetup(setupToken: string) {
    return this.totpAuthentication.beginInitialSetup(setupToken)
  }

  confirmInitialTotpSetup(setupToken: string, code: string) {
    return this.totpAuthentication.confirmInitialSetup(setupToken, code)
  }

  verifyTotpLogin(challengeToken: string, code: string) {
    return this.totpAuthentication.verifyLogin(challengeToken, code)
  }

  beginTotpReplacement(
    principal: AuthPrincipal,
    password: string,
    currentCode: string,
  ) {
    return this.totpAuthentication.beginReplacement(
      principal,
      password,
      currentCode,
    )
  }

  confirmTotpReplacement(
    principal: AuthPrincipal,
    confirmationToken: string,
    code: string,
  ) {
    return this.totpAuthentication.confirmReplacement(
      principal,
      confirmationToken,
      code,
    )
  }

  async authenticate(accessToken: string): Promise<AuthPrincipal> {
    const claims = this.accessTokens.verify(accessToken)
    const session = await this.persistence.findSessionForAccess(
      claims.sid,
      claims.sub,
      claims.org,
    )
    const now = this.clock.now()
    if (
      !session ||
      !this.sessionUsable(session, now) ||
      (session.user?.role === UserRole.ADMIN && !session.secondFactorVerifiedAt)
    ) {
      if (session && !session.user?.isActive) {
        await this.persistence.revokeSessionsForUser(session.userId, now)
      } else if (session && !session.user?.emailVerifiedAt) {
        await this.persistence.revokeSessionsForUser(session.userId, now)
      } else if (session && !session.revokedAt) {
        await this.persistence.revokeSession(session.id, now)
      }
      throw invalidCredentials()
    }
    await this.persistence.touchSession(session.id, now)
    return {
      userId: session.user.id,
      organizationId: session.organizationId,
      sessionId: session.id,
      role: session.user.role,
      email: session.user.email,
      name: session.user.name,
    }
  }

  async logout(principal: AuthPrincipal): Promise<void> {
    await this.persistence.revokeSession(principal.sessionId, this.clock.now())
    await this.recordAudit(
      principal.userId,
      'auth.session.revoked',
      'session',
      principal.sessionId,
      'succeeded',
    )
  }

  async completeSsoLogin(user: UserEntity): Promise<AuthenticationLoginResponse> {
    this.accessTokens.assertConfigured()
    if (!user.isActive || !user.emailVerifiedAt) throw invalidCredentials()
    if (user.role === UserRole.ADMIN) {
      await this.recordAudit(
        user.id,
        'auth.sso.admin.totp.required',
        'user',
        user.id,
        'succeeded',
      )
      return this.totpAuthentication.beginAdminLogin(user)
    }

    const now = this.clock.now()
    const refreshToken = this.accessTokens.newRefreshToken()
    const session = await this.persistence.createSession({
      userId: user.id,
      organizationId: user.organizationId,
      refreshTokenHash: this.accessTokens.hashOpaqueToken(refreshToken),
      lastActivityAt: now,
      absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_SESSION_MS),
      revokedAt: null,
      secondFactorVerifiedAt: null,
    })
    user.lastAccessAt = now
    await this.persistence.updateUser(user)
    await this.recordAudit(
      user.id,
      'auth.sso.login.succeeded',
      'user',
      user.id,
      'succeeded',
    )
    return this.tokenResponse(user, session.id, refreshToken)
  }

  async acceptAdminInvitation(input: {
    token: string
    name: string
    email: string
  }): Promise<{ message: string }> {
    this.accessTokens.assertConfigured()
    const email = normalizeEmail(input.email)
    const now = this.clock.now()
    const tokenHash = this.accessTokens.hashOpaqueToken(input.token)
    let created: { user: UserEntity; confirmationToken: string }
    try {
      created = await this.dataSource.transaction(async (manager) => {
        const tokenRepository = manager.getRepository(AuthTokenEntity)
        const invite = await tokenRepository.findOne({
          where: {
            tokenHash,
            kind: AuthTokenKind.ADMIN_INVITATION,
            consumedAt: IsNull(),
            revokedAt: IsNull(),
            expiresAt: MoreThan(now),
          },
          lock: { mode: 'pessimistic_write' },
        })
        if (!invite) throw invalidInvitation()

        const users = manager.getRepository(UserEntity)
        if (
          await users.count({
            where: { organizationId: invite.organizationId },
          })
        ) {
          throw invalidInvitation()
        }
        invite.consumedAt = now
        await tokenRepository.save(invite)

        const createdUser = await users.save(
          users.create({
            organizationId: invite.organizationId,
            name: input.name.trim(),
            email,
            passwordHash: null,
            role: UserRole.ADMIN,
            isActive: true,
            emailVerifiedAt: null,
            lastAccessAt: null,
          }),
        )
        const rawConfirmation = randomBytes(48).toString('base64url')
        await tokenRepository.save(
          tokenRepository.create({
            tokenHash: this.accessTokens.hashOpaqueToken(rawConfirmation),
            kind: AuthTokenKind.EMAIL_CONFIRMATION,
            organizationId: invite.organizationId,
            userId: createdUser.id,
            email,
            expiresAt: new Date(now.getTime() + EMAIL_CONFIRMATION_TTL_MS),
            consumedAt: null,
            revokedAt: null,
          }),
        )
        return { user: createdUser, confirmationToken: rawConfirmation }
      })
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_IN_USE',
          message: 'Use um e-mail diferente para esta conta',
        })
      }
      throw error
    }

    const { user, confirmationToken } = created
    await this.sendEmailConfirmation(user, confirmationToken)
    await this.recordAudit(
      'representative',
      'auth.admin.invited',
      'user',
      user.id,
      'succeeded',
    )
    return {
      message:
        'Cadastro criado. Confirme o e-mail do Admin para ativar o acesso.',
    }
  }

  async confirmEmail(input: {
    token: string
    password: string
  }): Promise<{ message: string }> {
    this.accessTokens.assertConfigured()
    if (input.password.length < 8) {
      throw new BadRequestException({
        code: 'PASSWORD_TOO_SHORT',
        message: 'A senha deve ter pelo menos 8 caracteres',
      })
    }
    if (input.password.length > 1024) {
      throw new BadRequestException({
        code: 'PASSWORD_TOO_LONG',
        message: 'A senha excede o limite aceito',
      })
    }
    const now = this.clock.now()
    const tokenHash = this.accessTokens.hashOpaqueToken(input.token)
    const candidate = await this.persistence.tokens.findOne({
      where: {
        tokenHash,
        kind: AuthTokenKind.EMAIL_CONFIRMATION,
        consumedAt: IsNull(),
        revokedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    })
    if (!candidate) throw invalidConfirmation()
    const passwordHash = await this.passwordHasher.hash(input.password)
    const user = await this.dataSource.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(AuthTokenEntity)
      const confirmation = await tokenRepository.findOne({
        where: {
          tokenHash,
          kind: AuthTokenKind.EMAIL_CONFIRMATION,
          consumedAt: IsNull(),
          revokedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!confirmation?.userId) {
        throw invalidConfirmation()
      }
      confirmation.consumedAt = now
      await tokenRepository.save(confirmation)
      const users = manager.getRepository(UserEntity)
      const account = await users.findOne({
        where: {
          id: confirmation.userId!,
          organizationId: confirmation.organizationId,
        },
      })
      if (
        !account ||
        account.email !== confirmation.email ||
        account.emailVerifiedAt
      ) {
        throw invalidConfirmation()
      }
      account.passwordHash = passwordHash
      account.emailVerifiedAt = now
      await users.save(account)
      return account
    })
    await this.recordAudit(
      user.id,
      'auth.email.confirmed',
      'user',
      user.id,
      'succeeded',
    )
    return { message: 'E-mail confirmado. Você já pode entrar.' }
  }

  async createOrganizationInvitation(input: {
    name: string
    slug: string
    representativeEmail: string
  }): Promise<void> {
    this.accessTokens.assertConfigured()
    const slug = input.slug.trim().toLowerCase()
    const email = normalizeEmail(input.representativeEmail)
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      slug.length > 80 ||
      !input.name.trim() ||
      input.name.length > 160 ||
      !isEmail(email)
    ) {
      throw new BadRequestException(
        'Dados da organização ou do representante inválidos',
      )
    }
    const now = this.clock.now()
    const rawToken = randomBytes(48).toString('base64url')
    const organization = await this.dataSource.transaction(async (manager) => {
      const organizations = manager.getRepository(OrganizationEntity)
      if (await organizations.findOne({ where: { slug } })) {
        throw new ConflictException('A organização já existe')
      }
      const created = await organizations.save(
        organizations.create({
          name: input.name.trim(),
          slug,
          recoveryRepresentativeEmail: email,
        }),
      )
      const tokens = manager.getRepository(AuthTokenEntity)
      await tokens.save(
        tokens.create({
          tokenHash: this.accessTokens.hashOpaqueToken(rawToken),
          kind: AuthTokenKind.ADMIN_INVITATION,
          organizationId: created.id,
          userId: null,
          email,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
          consumedAt: null,
          revokedAt: null,
        }),
      )
      return created
    })
    await this.sendInvitationEmail(organization, email, rawToken)
    await this.recordAudit(
      'system',
      'auth.organization.created',
      'organization',
      organization.id,
      'succeeded',
    )
  }

  async issueAdminInvitation(
    organizationSlug: string,
    representativeEmail: string,
  ): Promise<void> {
    this.accessTokens.assertConfigured()
    const organization = await this.persistence.findOrganizationBySlug(
      organizationSlug.trim().toLowerCase(),
    )
    if (!organization)
      throw new BadRequestException('Organização não encontrada')
    if (
      await this.persistence.users.count({
        where: { organizationId: organization.id },
      })
    ) {
      throw new BadRequestException(
        'O convite inicial só pode ser emitido antes do primeiro cadastro',
      )
    }
    const now = this.clock.now()
    const email = normalizeEmail(representativeEmail)
    if (!isEmail(email))
      throw new BadRequestException('E-mail do representante inválido')
    const rawToken = randomBytes(48).toString('base64url')
    await this.dataSource.transaction(async (manager) => {
      const organizations = manager.getRepository(OrganizationEntity)
      organization.recoveryRepresentativeEmail = email
      await organizations.save(organization)
      const tokens = manager.getRepository(AuthTokenEntity)
      await tokens
        .createQueryBuilder()
        .update(AuthTokenEntity)
        .set({ revokedAt: now })
        .where('"organizationId" = :organizationId', {
          organizationId: organization.id,
        })
        .andWhere('"kind" = :kind', { kind: AuthTokenKind.ADMIN_INVITATION })
        .andWhere('"consumedAt" IS NULL')
        .andWhere('"revokedAt" IS NULL')
        .execute()
      await tokens.save(
        tokens.create({
          tokenHash: this.accessTokens.hashOpaqueToken(rawToken),
          kind: AuthTokenKind.ADMIN_INVITATION,
          organizationId: organization.id,
          userId: null,
          email,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
          consumedAt: null,
          revokedAt: null,
        }),
      )
    })
    await this.sendInvitationEmail(organization, email, rawToken)
    await this.recordAudit(
      'system',
      'auth.admin.invitation.issued',
      'organization',
      organization.id,
      'succeeded',
    )
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.persistence.revokeSessionsForUser(userId, this.clock.now())
  }

  async resendEmailConfirmation(input: {
    organization: string
    email: string
  }): Promise<{ message: string }> {
    this.accessTokens.assertConfigured()
    const organization = await this.persistence.findOrganizationBySlug(
      input.organization.trim().toLowerCase(),
    )
    const email = normalizeEmail(input.email)
    const generic = {
      message: 'Se a conta precisar de confirmação, um novo link será enviado.',
    }
    const user =
      organization && isEmail(email)
        ? await this.persistence.findUser(organization.id, email)
        : null
    if (!user || !user.isActive || user.emailVerifiedAt) return generic

    const now = this.clock.now()
    const rawToken = randomBytes(48).toString('base64url')
    await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(AuthTokenEntity)
      await tokens
        .createQueryBuilder()
        .update(AuthTokenEntity)
        .set({ revokedAt: now })
        .where('"userId" = :userId', { userId: user.id })
        .andWhere('"kind" = :kind', { kind: AuthTokenKind.EMAIL_CONFIRMATION })
        .andWhere('"consumedAt" IS NULL')
        .andWhere('"revokedAt" IS NULL')
        .execute()
      await tokens.save(
        tokens.create({
          tokenHash: this.accessTokens.hashOpaqueToken(rawToken),
          kind: AuthTokenKind.EMAIL_CONFIRMATION,
          organizationId: user.organizationId,
          userId: user.id,
          email,
          expiresAt: new Date(now.getTime() + EMAIL_CONFIRMATION_TTL_MS),
          consumedAt: null,
          revokedAt: null,
        }),
      )
    })
    await this.sendEmailConfirmation(user, rawToken)
    await this.recordAudit(
      user.id,
      'auth.email.confirmation.resent',
      'user',
      user.id,
      'succeeded',
    )
    return generic
  }

  private sessionUsable(session: AuthSessionEntity, now: Date): boolean {
    return Boolean(
      !session.revokedAt &&
      session.user?.isActive &&
      session.user.emailVerifiedAt &&
      session.absoluteExpiresAt > now &&
      session.lastActivityAt.getTime() + IDLE_SESSION_MS > now.getTime(),
    )
  }

  private tokenResponse(
    user: UserEntity,
    sessionId: string,
    refreshToken: string,
  ): TokenResponse {
    return {
      accessToken: this.accessTokens.sign(
        user.id,
        user.organizationId,
        sessionId,
        user.role,
      ),
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_SECONDS,
    }
  }

  private async sendInvitationEmail(
    organization: OrganizationEntity,
    to: string,
    token: string,
  ): Promise<void> {
    const baseUrl = this.applicationBaseUrl()
    const link = `${baseUrl}/setup-admin#token=${encodeURIComponent(token)}`
    await this.emailDelivery.send(
      to,
      `Convite para configurar o GreenER — ${organization.name}`,
      `Use este link para cadastrar o primeiro administrador da organização ${organization.name}: ${link}\n\nEle expira em 24 horas e pode ser usado uma única vez.`,
    )
  }

  private async sendEmailConfirmation(
    user: UserEntity,
    token: string,
  ): Promise<void> {
    const link = `${this.applicationBaseUrl()}/confirm-email#token=${encodeURIComponent(token)}`
    await this.emailDelivery.send(
      user.email,
      'Confirme seu e-mail no GreenER',
      `Confirme seu endereço e escolha uma senha usando este link: ${link}\n\nO link expira em 24 horas e pode ser usado uma única vez.`,
    )
  }

  private applicationBaseUrl(): string {
    const value = process.env.APP_BASE_URL
    if (!value) {
      throw new BadRequestException({
        code: 'APPLICATION_URL_NOT_CONFIGURED',
        message: 'O endereço da aplicação não está configurado',
      })
    }
    return value.replace(/\/$/, '')
  }

  private recordAudit(
    actor: string,
    action: string,
    entityType: string,
    entityId: string,
    outcome: string,
  ) {
    return this.auditLogs.insert({
      actor,
      actorUserId:
        actor === 'anonymous' ||
        actor === 'system' ||
        actor === 'representative' ||
        actor.startsWith('support:')
          ? null
          : actor,
      action,
      entityType,
      entityId,
      before: null,
      after: null,
      reason: null,
      outcome,
    })
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false
  return (error.driverError as { code?: string }).code === '23505'
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'E-mail, senha ou organização inválidos',
  })
}

function invalidInvitation(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_INVITATION',
    message: 'O convite é inválido, expirou ou já foi utilizado',
  })
}

function invalidConfirmation(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_EMAIL_CONFIRMATION',
    message: 'A confirmação é inválida, expirou ou já foi utilizada',
  })
}
