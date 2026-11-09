import { Inject, Injectable, OnModuleDestroy, OnModuleInit, HttpException, UnauthorizedException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'
import { DataSource, IsNull, MoreThan } from 'typeorm'
import { AuthTokenEntity, AuthTokenKind } from '../../database/entities/auth-token.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { UserAccountStatus, UserEntity } from '../../database/entities/user.entity'
import { PasswordRecoveryOutboxEntity } from '../../database/entities/password-recovery-outbox.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AUTH_CLOCK, AuthClock } from './clock'
import { EMAIL_DELIVERY, EmailDelivery } from './email-delivery'
import { PasswordHasher } from './password-hasher.service'

const TTL = 60 * 60 * 1000
const WINDOW = 15 * 60 * 1000
const ACCEPTED = { code: 'PASSWORD_RECOVERY_REQUEST_ACCEPTED' }

@Injectable()
export class PasswordRecoveryService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout
  private processing = false

  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordHasher: PasswordHasher,
    private readonly audit: AuditWriter,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
    @Inject(EMAIL_DELIVERY) private readonly email: EmailDelivery,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.processOutbox().catch(() => undefined)
    }, 5_000)
    this.timer.unref()
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
  }

  async request(input: { organization: string; email: string }, ip: string): Promise<typeof ACCEPTED> {
    const now = this.clock.now()
    const ipHash = hashIp(ip)
    const allowed = await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        `INSERT INTO password_recovery_ip_limits ("ipHash", "windowStartedAt", "requestCount") VALUES ($1, $2, 1)
         ON CONFLICT ("ipHash") DO UPDATE SET
           "windowStartedAt" = CASE WHEN password_recovery_ip_limits."windowStartedAt" <= $3 THEN $2 ELSE password_recovery_ip_limits."windowStartedAt" END,
           "requestCount" = CASE WHEN password_recovery_ip_limits."windowStartedAt" <= $3 THEN 1 ELSE password_recovery_ip_limits."requestCount" + 1 END
         RETURNING "requestCount"`, [ipHash, now, new Date(now.getTime() - WINDOW)])
      return Number(rows[0].requestCount) <= 20
    })
    if (!allowed) throw new HttpException({ code: 'PASSWORD_RECOVERY_RATE_LIMITED' }, 429)

    const email = input.email.trim().toLowerCase()
    const user = await this.dataSource.getRepository(UserEntity)
      .createQueryBuilder('user')
      .innerJoin('user.organization', 'organization')
      .where('organization.slug = :slug', { slug: input.organization.trim().toLowerCase() })
      .andWhere('LOWER(user.email) = :email', { email })
      .getOne()
    if (!user || user.status !== UserAccountStatus.ACTIVE || !user.emailVerifiedAt || !user.passwordHash) return ACCEPTED

    const rawToken = randomBytes(48).toString('base64url')
    const expiresAt = new Date(now.getTime() + TTL)
    let encrypted: ReturnType<typeof encryptPayload>
    try {
      encrypted = encryptPayload(JSON.stringify({
      to: user.email,
      subject: 'Recuperação de senha GreenER',
      text: `Use este link para recuperar sua senha: ${baseUrl()}/recover-password#token=${rawToken}\n\nO link expira em uma hora. Se você não solicitou esta recuperação, ignore esta mensagem.`,
      }))
    } catch {
      try {
        await this.audit.record({ actor: { type: 'system', componentId: 'password-recovery' }, action: 'auth.password-recovery.request.failed', entityType: 'user', entityId: user.id, outcome: 'failed' })
      } catch {
        // The response stays generic when the audit store is also unavailable.
      }
      return ACCEPTED
    }
    await this.dataSource.transaction(async (manager) => {
      const lockedUser = await manager.getRepository(UserEntity).findOne({
        where: { id: user.id },
        lock: { mode: 'pessimistic_write' },
      })
      if (!lockedUser || lockedUser.status !== UserAccountStatus.ACTIVE || !lockedUser.emailVerifiedAt || !lockedUser.passwordHash) return
      const acceptedCount = await manager.getRepository(AuthTokenEntity).count({
        where: { userId: user.id, kind: AuthTokenKind.PASSWORD_RECOVERY, createdAt: MoreThan(new Date(now.getTime() - WINDOW)) },
      })
      if (acceptedCount >= 5) return
      await manager.createQueryBuilder().update(AuthTokenEntity)
        .set({ revokedAt: now })
        .where('"userId" = :userId AND "kind" = :kind AND "consumedAt" IS NULL AND "revokedAt" IS NULL', { userId: user.id, kind: AuthTokenKind.PASSWORD_RECOVERY }).execute()
      const token = manager.create(AuthTokenEntity, {
        tokenHash: createHash('sha256').update(rawToken).digest('hex'),
        kind: AuthTokenKind.PASSWORD_RECOVERY,
        organizationId: user.organizationId,
        userId: user.id,
        email: user.email,
        expiresAt,
        consumedAt: null,
        revokedAt: null,
      })
      const saved = await manager.save(token)
      await manager.save(PasswordRecoveryOutboxEntity, manager.create(PasswordRecoveryOutboxEntity, {
        authTokenId: saved.id,
        encryptedPayload: encrypted.payload,
        keyVersion: encrypted.version,
        status: 'PENDING',
        attempts: 0,
        nextAttemptAt: now,
        expiresAt,
      }))
    })
    return ACCEPTED
  }

  async complete(input: { token: string; password: string }): Promise<void> {
    const now = this.clock.now()
    const tokenHash = createHash('sha256').update(input.token).digest('hex')
    const token = await this.dataSource.getRepository(AuthTokenEntity).findOne({
      where: { tokenHash, kind: AuthTokenKind.PASSWORD_RECOVERY, consumedAt: IsNull(), revokedAt: IsNull(), expiresAt: MoreThan(now) },
    })
    if (!token?.userId) {
      await this.audit.record({ actor: { type: 'unauthenticated' }, action: 'auth.password-recovery.completed', entityType: 'user', entityId: 'unknown', outcome: 'denied' })
      throw invalidRecovery()
    }
    const passwordHash = await this.passwordHasher.hash(input.password)
    const completed = await this.dataSource.transaction(async (manager) => {
      const lockedUser = await manager.getRepository(UserEntity).findOne({
        where: { id: token.userId! },
        lock: { mode: 'pessimistic_write' },
      })
      if (!lockedUser || lockedUser.status !== UserAccountStatus.ACTIVE || !lockedUser.emailVerifiedAt || !lockedUser.passwordHash) return false
      const result = await manager.createQueryBuilder().update(AuthTokenEntity)
        .set({ consumedAt: now })
        .where('id = :id AND "consumedAt" IS NULL AND "revokedAt" IS NULL AND "expiresAt" > :now', { id: token.id, now }).execute()
      if (result.affected !== 1) return false
      lockedUser.passwordHash = passwordHash
      await manager.getRepository(UserEntity).save(lockedUser)
      await manager.createQueryBuilder().update(AuthTokenEntity).set({ revokedAt: now })
        .where('"userId" = :userId AND "kind" = :kind AND "id" <> :id AND "consumedAt" IS NULL AND "revokedAt" IS NULL', { userId: token.userId, kind: AuthTokenKind.PASSWORD_RECOVERY, id: token.id }).execute()
      await manager.getRepository(AuthSessionEntity).createQueryBuilder().update()
        .set({ refreshRevokedAt: now }).where('"userId" = :userId AND "revokedAt" IS NULL AND "refreshRevokedAt" IS NULL', { userId: token.userId }).execute()
      await this.audit.record({ actor: { type: 'system', componentId: 'password-recovery' }, action: 'auth.password-recovery.completed', entityType: 'user', entityId: token.userId!, outcome: 'success' }, manager)
      return true
    })
    if (!completed) {
      await this.audit.record({ actor: { type: 'unauthenticated' }, action: 'auth.password-recovery.completed', entityType: 'user', entityId: token.userId, outcome: 'denied' })
      throw invalidRecovery()
    }
  }

  async processOutbox(): Promise<void> {
    if (this.processing) return
    this.processing = true
    try {
      const now = this.clock.now()
      const pending = await this.dataSource.getRepository(PasswordRecoveryOutboxEntity)
        .createQueryBuilder('outbox')
        .where('outbox.status = :status AND outbox."nextAttemptAt" <= :now', { status: 'PENDING', now })
        .orderBy('outbox."nextAttemptAt"', 'ASC')
        .take(10)
        .getMany()
      for (const item of pending) {
        if (item.nextAttemptAt > now) continue
        const token = await this.dataSource.getRepository(AuthTokenEntity).findOneBy({ id: item.authTokenId })
        if (!token || token.expiresAt <= now || item.expiresAt <= now || token.revokedAt) {
          await this.dataSource.getRepository(PasswordRecoveryOutboxEntity).update(item.id, { status: 'FAILED' })
          continue
        }
        try {
          const message = JSON.parse(decryptPayload(item.encryptedPayload, item.keyVersion)) as { to: string; subject: string; text: string }
          await this.email.send(message.to, message.subject, message.text)
          await this.dataSource.getRepository(PasswordRecoveryOutboxEntity).update(item.id, { status: 'SENT', attempts: item.attempts + 1 })
        } catch {
          const attempts = item.attempts + 1
          const nextAttemptAt = new Date(now.getTime() + Math.min(60_000 * 2 ** attempts, 15 * 60_000))
          await this.dataSource.getRepository(PasswordRecoveryOutboxEntity).update(item.id, { attempts, nextAttemptAt, ...(nextAttemptAt >= item.expiresAt ? { status: 'FAILED' as const } : {}) })
          await this.audit.record({ actor: { type: 'system', componentId: 'password-recovery' }, action: 'auth.password-recovery.delivery.failed', entityType: 'password-recovery-delivery', entityId: item.id, outcome: 'failed' })
        }
      }
    } finally { this.processing = false }
  }
}

function invalidRecovery() {
  return new UnauthorizedException({ code: 'PASSWORD_RECOVERY_TOKEN_INVALID' })
}

function encryptionKeys(requestedVersion?: string): { version: string; key: Buffer } {
  const version = requestedVersion ?? process.env.AUTH_TOTP_ENCRYPTION_KEY_VERSION
  let keys: Record<string, string>
  try { keys = JSON.parse(process.env.AUTH_TOTP_ENCRYPTION_KEYS ?? '') as Record<string, string> } catch { throw new Error('Auth encryption keyring is not configured') }
  const encoded = version ? keys[version] : undefined
  const key = encoded ? Buffer.from(encoded, 'base64') : Buffer.alloc(0)
  if (!version || !/^[a-zA-Z0-9_-]{1,32}$/.test(version) || key.length !== 32) throw new Error('Auth encryption keyring is not configured')
  return { version, key }
}

function encryptPayload(value: string): { payload: string; version: string } {
  const { version, key } = encryptionKeys()
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return { payload: Buffer.concat([nonce, cipher.getAuthTag(), body]).toString('base64url'), version }
}

function decryptPayload(value: string, version: string): string {
  const { key } = encryptionKeys(version)
  const payload = Buffer.from(value, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', key, payload.subarray(0, 12))
  decipher.setAuthTag(payload.subarray(12, 28))
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8')
}

function hashIp(ip: string): string {
  const { key } = encryptionKeys()
  return createHmac('sha256', key).update(`password-recovery-ip:${ip}`).digest('hex')
}

function baseUrl(): string {
  const value = process.env.APP_BASE_URL
  if (!value) throw new Error('APP_BASE_URL is not configured')
  return value.replace(/\/$/, '')
}
