import { ConflictException, ForbiddenException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, EntityManager, QueryFailedError } from 'typeorm'
import { randomUUID } from 'node:crypto'
import { UserAccountStatus, UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AuthPrincipal } from './authentication.service'
import { AUTH_CLOCK, AuthClock } from './clock'
import { AccountResponseDto, AccountsQuery, ChangeAccountRoleDto, CreateAccountDto } from './accounts.dto'
import { AccountsRepository } from './accounts.repository'

const snapshotFields = ['name', 'role', 'status'] as const

function isDuplicateEmail(cause: unknown): boolean {
  if (!(cause instanceof QueryFailedError)) return false
  const driver = cause.driverError as { code?: string; constraint?: string }
  return driver.code === '23505' && ['uq_users_email', 'uq_users_email_lower'].includes(driver.constraint ?? '')
}

function response(account: UserEntity): AccountResponseDto {
  return { id: account.id, name: account.name, email: account.email, role: account.role, status: account.status,
    emailVerifiedAt: account.emailVerifiedAt?.toISOString() ?? null, lastAccessAt: account.lastAccessAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(), updatedAt: account.updatedAt.toISOString() }
}

@Injectable()
export class AccountsService {
  constructor(
    private readonly database: DataSource,
    private readonly accounts: AccountsRepository,
    private readonly audit: AuditWriter,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
  ) {}

  list(principal: AuthPrincipal, query: AccountsQuery) {
    return this.withAdmin(principal, 'account.list', principal.organizationId, null, async manager => {
      const result = await this.accounts.list(manager, principal.organizationId, query)
      return { items: result.accounts.map(response), pagination: result.pagination }
    })
  }

  create(principal: AuthPrincipal, input: CreateAccountDto) {
    const id = randomUUID()
    return this.withAdmin(principal, 'account.created', id, input.reason, async manager => {
      const account = await this.accounts.create(manager, principal.organizationId, id, input)
      await this.audit.record({ actor: { type: 'user', userId: principal.userId }, action: 'account.created',
        entityType: 'user', entityId: id, outcome: 'success', before: null,
        after: { name: account.name, role: account.role, status: account.status }, allowedSnapshotFields: snapshotFields, reason: input.reason }, manager)
      return response(account)
    })
  }

  changeRole(principal: AuthPrincipal, id: string, input: ChangeAccountRoleDto) {
    return this.withAdmin(principal, 'account.role.changed', id, input.reason, async manager => {
      const account = await this.accounts.findLocked(manager, principal.organizationId, id)
      if (!account) throw new NotFoundException({ code: 'ACCOUNT_NOT_FOUND', message: 'Conta não encontrada' })
      const before = { role: account.role }
      if (account.role !== input.role) {
        await this.assertRoleChange(manager, principal, account, input.expectedRole)
        await this.accounts.saveRole(manager, account, input.role)
        await this.accounts.revokeCredentials(manager, account.id, this.clock.now())
      }
      await this.audit.record({ actor: { type: 'user', userId: principal.userId }, action: 'account.role.changed',
        entityType: 'user', entityId: id, outcome: 'success', before, after: { role: account.role },
        allowedSnapshotFields: snapshotFields, reason: input.reason }, manager)
      return response(account)
    })
  }

  private async assertRoleChange(manager: EntityManager, principal: AuthPrincipal, account: UserEntity, expectedRole: UserRole): Promise<void> {
    if (account.role !== expectedRole) throw new ConflictException({ code: 'ACCOUNT_ROLE_CONFLICT', message: 'O papel da conta foi alterado desde a última consulta' })
    if (account.role !== UserRole.ADMIN || account.status !== UserAccountStatus.ACTIVE || !account.emailVerifiedAt) return
    if (await this.accounts.countActiveAdmins(manager, principal.organizationId) <= 1) {
      throw new ConflictException({ code: 'LAST_ACTIVE_ADMIN', message: 'Não é permitido remover o último Admin ativo' })
    }
    if (account.id === principal.userId) throw new ForbiddenException({ code: 'SELF_ACCOUNT_LOCKOUT', message: 'Não é permitido remover o próprio acesso administrativo' })
  }

  private async withAdmin<T>(principal: AuthPrincipal, action: string, entityId: string, reason: string | null, work: (manager: EntityManager) => Promise<T>): Promise<T> {
    try {
      return await this.database.transaction(async manager => {
        // Same organization-first lock order as account lifecycle, including concurrent demotions and status transitions.
        const organization = await this.accounts.lockOrganization(manager, principal.organizationId)
        const actor = organization && await this.accounts.findLocked(manager, principal.organizationId, principal.userId)
        if (!actor || actor.status !== UserAccountStatus.ACTIVE || actor.role !== UserRole.ADMIN) {
          throw new ForbiddenException({ code: 'ACTIVE_ADMIN_REQUIRED', message: 'Somente Admin ativo pode administrar contas' })
        }
        return work(manager)
      })
    } catch (cause) {
      const error = action === 'account.created' && isDuplicateEmail(cause)
        ? new ConflictException({ code: 'EMAIL_ALREADY_IN_USE', message: 'Não foi possível criar a conta com os dados informados' }) : cause
      await this.audit.record({ actor: { type: 'user', userId: principal.userId }, action, entityType: 'user', entityId,
        outcome: error instanceof HttpException && error.getStatus() < 500 ? 'denied' : 'failed', reason })
      throw error
    }
  }
}
