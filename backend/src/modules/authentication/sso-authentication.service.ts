import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import {
  DataSource,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  QueryFailedError,
  Repository,
} from 'typeorm'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { ExternalIdentityEntity } from '../../database/entities/external-identity.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { SsoHandoffEntity } from '../../database/entities/sso-handoff.entity'
import { SsoInvitationEntity } from '../../database/entities/sso-invitation.entity'
import { SsoTransactionEntity } from '../../database/entities/sso-transaction.entity'
import { UserEntity, UserRole } from '../../database/entities/user.entity'
import { AUTH_CLOCK, AuthClock } from './clock'
import { EMAIL_DELIVERY, EmailDelivery } from './email-delivery'
import { AccessTokenService } from './access-token.service'
import { AuthPrincipal, AuthenticationService } from './authentication.service'
import { GoogleIdentity, GoogleOidcClient, googlePkceChallenge } from './google-oidc-client'

const INVITATION_TTL_MS = 24 * 60 * 60 * 1000
const OIDC_TRANSACTION_TTL_MS = 10 * 60 * 1000
const HANDOFF_TTL_MS = 60 * 1000

@Injectable()
export class SsoAuthenticationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accessTokens: AccessTokenService,
    private readonly google: GoogleOidcClient,
    private readonly authentication: AuthenticationService,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
    @Inject(EMAIL_DELIVERY) private readonly emailDelivery: EmailDelivery,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
    @InjectRepository(ExternalIdentityEntity)
    private readonly identities: Repository<ExternalIdentityEntity>,
    @InjectRepository(SsoInvitationEntity)
    private readonly invitations: Repository<SsoInvitationEntity>,
  ) {}

  async issueInvitation(
    principal: AuthPrincipal,
    input: { email: string; name: string; role: UserRole },
  ): Promise<{ expiresAt: string }> {
    this.accessTokens.assertConfigured()
    if (principal.role !== UserRole.ADMIN) throw forbidden()
    const email = normalizeEmail(input.email)
    const name = input.name.trim()
    if (!isEmail(email) || !name || name.length > 160) {
      throw new BadRequestException({
        code: 'INVALID_SSO_INVITATION',
        message: 'Os dados do convite SSO são inválidos',
      })
    }
    if (!Object.values(UserRole).includes(input.role)) {
      throw new BadRequestException({
        code: 'INVALID_USER_ROLE',
        message: 'O papel informado não é válido',
      })
    }
    const rawToken = randomBytes(48).toString('base64url')
    const tokenHash = this.accessTokens.hashOpaqueToken(rawToken)
    const now = this.clock.now()
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS)
    const organization = await this.dataSource
      .getRepository(OrganizationEntity)
      .findOne({ where: { id: principal.organizationId } })
    if (!organization) throw forbidden()
    const existingAccount = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('lower(user.email) = :email', { email })
      .getOne()
    if (
      existingAccount &&
      (existingAccount.organizationId !== principal.organizationId ||
        !existingAccount.isActive)
    ) {
      throw new ConflictException({
        code: 'SSO_INVITATION_ACCOUNT_UNAVAILABLE',
        message: 'A conta existente não pode receber este convite',
      })
    }

    await this.dataSource.transaction(async (manager) => {
      const invitations = manager.getRepository(SsoInvitationEntity)
      await invitations
        .createQueryBuilder()
        .update(SsoInvitationEntity)
        .set({ revokedAt: now })
        .where('"organizationId" = :organizationId', {
          organizationId: principal.organizationId,
        })
        .andWhere('lower("email") = :email', { email })
        .andWhere('"consumedAt" IS NULL')
        .andWhere('"revokedAt" IS NULL')
        .execute()
      await invitations.save(
        invitations.create({
          tokenHash,
          organizationId: principal.organizationId,
          email,
          name,
          role: input.role,
          createdByUserId: principal.userId,
          expiresAt,
          consumedAt: null,
          revokedAt: null,
        }),
      )
    })

    const frontend = configuredUrl(process.env.APP_BASE_URL, 'APP_BASE_URL')
    const inviteUrl = new URL('/login', frontend)
    inviteUrl.hash = new URLSearchParams({ sso_invite: rawToken }).toString()
    await this.emailDelivery.send(
      email,
      'Convite para acessar o GreenER',
      `Olá, ${name}. Um administrador convidou você para acessar o GreenER.\n\n` +
        `Entre com sua conta Google por este link (válido por 24 horas):\n${inviteUrl.toString()}`,
    )
    await this.auditLogs.save(
      auditRecord(principal.userId, 'auth.sso.invitation.issued', 'sso_invitation', tokenHash, {
        organizationId: principal.organizationId,
        email,
        role: input.role,
      }),
    )
    return { expiresAt: expiresAt.toISOString() }
  }

  async revokeIdentity(
    principal: AuthPrincipal,
    userId: string,
  ): Promise<void> {
    if (principal.role !== UserRole.ADMIN) throw forbidden()
    if (principal.userId === userId) throw forbidden()
    const identity = await this.identities.findOne({
      where: { userId, organizationId: principal.organizationId, provider: 'google' },
      relations: { user: true },
    })
    if (!identity) throw new NotFoundException({ code: 'SSO_IDENTITY_NOT_FOUND' })
    await this.identities.remove(identity)
    await this.auditLogs.save(
      auditRecord(principal.userId, 'auth.sso.identity.revoked', 'user', userId, {
        organizationId: principal.organizationId,
        provider: 'google',
      }),
    )
  }

  async startLogin(input: {
    handoffCodeChallenge: string
    invitationToken?: string
  }): Promise<{ state: string; authorizationUrl: URL }> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(input.handoffCodeChallenge)) {
      throw new BadRequestException({
        code: 'INVALID_PKCE_CHALLENGE',
        message: 'O desafio PKCE é inválido',
      })
    }
    const redirectUri = callbackUrl()
    const state = randomBytes(32).toString('base64url')
    const nonce = randomBytes(32).toString('base64url')
    const googleCodeVerifier = randomBytes(48).toString('base64url')
    let invitationTokenHash: string | null = null
    if (input.invitationToken) {
      if (input.invitationToken.length < 32 || input.invitationToken.length > 256) {
        throw invalidInvitation()
      }
      invitationTokenHash = this.accessTokens.hashOpaqueToken(input.invitationToken)
    }
    const now = this.clock.now()
    await this.dataSource
      .getRepository(SsoTransactionEntity)
      .delete({ expiresAt: LessThanOrEqual(now) })
    await this.dataSource.getRepository(SsoTransactionEntity).save({
      stateHash: this.accessTokens.hashOpaqueToken(state),
      nonce,
      googleCodeVerifier,
      handoffCodeChallenge: input.handoffCodeChallenge,
      invitationTokenHash,
      expiresAt: new Date(now.getTime() + OIDC_TRANSACTION_TTL_MS),
      consumedAt: null,
    })
    return {
      state,
      authorizationUrl: this.google.authorizationUrl({
        state,
        nonce,
        codeChallenge: googlePkceChallenge(googleCodeVerifier),
        redirectUri,
      }),
    }
  }

  async completeCallback(input: {
    code: string
    state: string
    browserState: string | null
  }): Promise<string> {
    if (
      !input.code ||
      input.code.length > 2048 ||
      !input.state ||
      input.state.length !== 43 ||
      input.state !== input.browserState
    ) {
      throw invalidSsoLogin()
    }
    const now = this.clock.now()
    const stateHash = this.accessTokens.hashOpaqueToken(input.state)
    const transaction = await this.dataSource.transaction(async (manager) => {
      const transactions = manager.getRepository(SsoTransactionEntity)
      const record = await transactions.findOne({
        where: {
          stateHash,
          consumedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!record) throw invalidSsoLogin()
      record.consumedAt = now
      await transactions.save(record)
      return record
    })
    const identity = await this.google.authenticateCode({
      code: input.code,
      codeVerifier: transaction.googleCodeVerifier,
      nonce: transaction.nonce,
      redirectUri: callbackUrl(),
    })
    const user = await this.resolveIdentity(identity, transaction.invitationTokenHash)
    const handoffCode = randomBytes(48).toString('base64url')
    await this.dataSource
      .getRepository(SsoHandoffEntity)
      .delete({ expiresAt: LessThanOrEqual(now) })
    await this.dataSource.getRepository(SsoHandoffEntity).save({
      codeHash: this.accessTokens.hashOpaqueToken(handoffCode),
      codeChallenge: transaction.handoffCodeChallenge,
      userId: user.id,
      organizationId: user.organizationId,
      expiresAt: new Date(now.getTime() + HANDOFF_TTL_MS),
      consumedAt: null,
    })
    return handoffCode
  }

  async exchangeHandoff(input: {
    code: string
    codeVerifier: string
  }) {
    if (
      input.code.length < 32 ||
      input.code.length > 256 ||
      !/^[A-Za-z0-9._~-]{43,128}$/.test(input.codeVerifier)
    ) {
      throw invalidSsoLogin()
    }
    const now = this.clock.now()
    const codeHash = this.accessTokens.hashOpaqueToken(input.code)
    const expectedChallenge = googlePkceChallenge(input.codeVerifier)
    const user = await this.dataSource.transaction(async (manager) => {
      const handoffs = manager.getRepository(SsoHandoffEntity)
      const handoff = await handoffs.findOne({
        where: {
          codeHash,
          consumedAt: IsNull(),
          expiresAt: MoreThan(now),
        },
        lock: { mode: 'pessimistic_write' },
      })
      if (!handoff || !safeEqual(handoff.codeChallenge, expectedChallenge)) {
        throw invalidSsoLogin()
      }
      handoff.consumedAt = now
      await handoffs.save(handoff)
      const account = await manager.getRepository(UserEntity).findOne({
        where: {
          id: handoff.userId,
          organizationId: handoff.organizationId,
          isActive: true,
        },
      })
      if (!account || !account.emailVerifiedAt) throw invalidSsoLogin()
      return account
    })
    return this.authentication.completeSsoLogin(user)
  }

  private async resolveIdentity(
    identity: GoogleIdentity,
    invitationTokenHash: string | null,
  ): Promise<UserEntity> {
    const now = this.clock.now()
    try {
      return await this.dataSource.transaction(async (manager) => {
        const identities = manager.getRepository(ExternalIdentityEntity)
        const existingIdentity = await identities.findOne({
          where: { issuer: identity.issuer, subject: identity.subject },
          relations: { user: true },
        })
        if (existingIdentity) {
          if (!existingIdentity.user.isActive || !existingIdentity.user.emailVerifiedAt) {
            throw invalidSsoLogin()
          }
          if (invitationTokenHash) {
            const invitation = await manager
              .getRepository(SsoInvitationEntity)
              .findOne({
                where: {
                  tokenHash: invitationTokenHash,
                  consumedAt: IsNull(),
                  revokedAt: IsNull(),
                  expiresAt: MoreThan(now),
                },
                lock: { mode: 'pessimistic_write' },
              })
            if (invitation && invitation.organizationId !== existingIdentity.organizationId) {
              throw invalidInvitation()
            }
            if (
              invitation &&
              invitation.organizationId === existingIdentity.organizationId &&
              invitation.email === identity.email
            ) {
              invitation.consumedAt = now
              await manager.getRepository(SsoInvitationEntity).save(invitation)
            }
          }
          return existingIdentity.user
        }
        if (!invitationTokenHash) throw invalidSsoLogin()

        const invitations = manager.getRepository(SsoInvitationEntity)
        const invitation = await invitations.findOne({
          where: {
            tokenHash: invitationTokenHash,
            consumedAt: IsNull(),
            revokedAt: IsNull(),
            expiresAt: MoreThan(now),
          },
          lock: { mode: 'pessimistic_write' },
        })
        if (!invitation || invitation.email !== identity.email) {
          throw invalidInvitation()
        }
        const users = manager.getRepository(UserEntity)
        let user = await users
          .createQueryBuilder('user')
          .where('lower(user.email) = :email', { email: identity.email })
          .setLock('pessimistic_write')
          .getOne()
        if (user && user.organizationId !== invitation.organizationId) {
          throw invalidInvitation()
        }
        if (user && !user.isActive) throw invalidInvitation()
        if (!user) {
          user = await users.save(
            users.create({
              name: invitation.name,
              email: invitation.email,
              organizationId: invitation.organizationId,
              passwordHash: null,
              emailVerifiedAt: now,
              role: invitation.role,
              isActive: true,
              lastAccessAt: null,
            }),
          )
        } else if (!user.emailVerifiedAt) {
          user.emailVerifiedAt = now
          user = await users.save(user)
        }
        invitation.consumedAt = now
        await invitations.save(invitation)
        const link = identities.create({
          provider: 'google',
          issuer: identity.issuer,
          subject: identity.subject,
          userId: user.id,
          organizationId: user.organizationId,
        })
        await identities.save(link)
        await manager.getRepository(AuditLogEntity).save(
          auditRecord(user.id, 'auth.sso.identity.linked', 'user', user.id, {
            organizationId: user.organizationId,
            provider: 'google',
          }),
        )
        return user
      })
    } catch (error) {
      if (error instanceof QueryFailedError && isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'SSO_IDENTITY_ALREADY_LINKED',
          message: 'Esta identidade Google já está vinculada a outra conta',
        })
      }
      throw error
    }
  }
}

function configuredUrl(value: string | undefined, name: string): URL {
  if (!value) throw new BadRequestException(`${name} não configurada`)
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new BadRequestException(`${name} inválida`)
  }
  if (
    url.username ||
    url.password ||
    url.hash ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalHost(url.hostname)))
  ) {
    throw new BadRequestException(`${name} inválida`)
  }
  return url
}

function callbackUrl(): string {
  return configuredUrl(process.env.GOOGLE_CALLBACK_URL, 'GOOGLE_CALLBACK_URL').toString()
}

function isLocalHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isEmail(email: string): boolean {
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}

function invalidInvitation(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_SSO_INVITATION',
    message: 'O convite SSO é inválido ou expirou',
  })
}

function invalidSsoLogin(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_SSO_LOGIN',
    message: 'Não foi possível autenticar com esta conta Google',
  })
}

function forbidden(): ForbiddenException {
  return new ForbiddenException({
    code: 'INSUFFICIENT_ROLE',
    message: 'Você não tem permissão para esta operação',
  })
}

function auditRecord(
  actor: string,
  action: string,
  entityType: string,
  entityId: string,
  after: Record<string, unknown>,
) {
  return {
    actor,
    actorUserId: actor,
    action,
    entityType,
    entityId,
    before: null,
    after,
    reason: null,
    outcome: 'succeeded',
  }
}

function isUniqueViolation(error: QueryFailedError): boolean {
  return (error.driverError as { code?: string }).code === '23505'
}
