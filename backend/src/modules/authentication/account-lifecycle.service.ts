import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, IsNull } from 'typeorm'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserAccountStatus, UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AuthPrincipal } from './authentication.service'
import { AUTH_CLOCK, AuthClock } from './clock'

const ACCOUNT_STATUS_SNAPSHOT_FIELDS = ['status'] as const

interface ChangeStatusInput {
  status: UserAccountStatus
  expectedStatus: UserAccountStatus
  reason: string
}

interface StatusChangeDenied {
  kind: 'denied'
  code: string
  message: string
  statusCode: 403 | 409
  currentStatus: UserAccountStatus
}

@Injectable()
export class AccountLifecycleService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditWriter: AuditWriter,
    @Inject(AUTH_CLOCK)
    private readonly clock: AuthClock,
  ) {}

  async changeStatus(principal: AuthPrincipal, userId: string, input: ChangeStatusInput): Promise<{ userId: string; status: UserAccountStatus; changed: boolean }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const organization = await manager.getRepository(OrganizationEntity).findOne({
        where: { id: principal.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!organization) {
        throw new NotFoundException({
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organização não encontrada',
        })
      }
      const users = manager.getRepository(UserEntity)
      const actor = await users.findOne({
        where: {
          id: principal.userId,
          organizationId: principal.organizationId,
        },
        lock: { mode: 'pessimistic_write' },
      })
      const target = await users.findOne({
        where: { id: userId, organizationId: principal.organizationId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!target) {
        throw new NotFoundException({
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Conta não encontrada',
        })
      }

      const denied = (code: string, message: string, statusCode: 403 | 409): StatusChangeDenied => ({
        kind: 'denied',
        code,
        message,
        statusCode,
        currentStatus: target.status,
      })

      if (!actor || actor.status !== UserAccountStatus.ACTIVE || actor.role !== UserRole.ADMIN) {
        return denied('ACTIVE_ADMIN_REQUIRED', 'Somente Admin ativo pode alterar o estado de uma conta', 403)
      }

      if (target.status === input.status) {
        await this.auditWriter.record(
          {
            actor: { type: 'user', userId: actor.id },
            action: 'account.status.unchanged',
            entityType: 'user',
            entityId: target.id,
            outcome: 'success',
            before: { status: target.status },
            after: { status: target.status },
            allowedSnapshotFields: ACCOUNT_STATUS_SNAPSHOT_FIELDS,
            reason: input.reason,
          },
          manager,
        )
        return {
          kind: 'changed' as const,
          userId: target.id,
          status: target.status,
          changed: false,
        }
      }

      if (target.status !== input.expectedStatus) {
        return denied('ACCOUNT_STATUS_CONFLICT', 'O estado da conta foi alterado desde a última consulta', 409)
      }

      if (
        target.role === UserRole.ADMIN &&
        target.status === UserAccountStatus.ACTIVE &&
        input.status !== UserAccountStatus.ACTIVE &&
        (await users.count({
          where: {
            organizationId: target.organizationId,
            role: UserRole.ADMIN,
            status: UserAccountStatus.ACTIVE,
          },
        })) <= 1
      ) {
        return denied('LAST_ACTIVE_ADMIN', 'Não é permitido bloquear ou desativar o último Admin ativo', 409)
      }

      if (actor.id === target.id && input.status !== UserAccountStatus.ACTIVE) {
        return denied('SELF_ACCOUNT_LOCKOUT', 'Não é permitido remover o próprio acesso administrativo', 403)
      }

      const previousStatus = target.status
      target.status = input.status
      await users.save(target)
      await manager.getRepository(AuthSessionEntity).update({ userId: target.id, revokedAt: IsNull() }, { revokedAt: this.clock.now() })
      await this.auditWriter.record(
        {
          actor: { type: 'user', userId: actor.id },
          action: 'account.status.changed',
          entityType: 'user',
          entityId: target.id,
          outcome: 'success',
          before: { status: previousStatus },
          after: { status: target.status },
          allowedSnapshotFields: ACCOUNT_STATUS_SNAPSHOT_FIELDS,
          reason: input.reason,
        },
        manager,
      )
      return {
        kind: 'changed' as const,
        userId: target.id,
        status: target.status,
        changed: true,
      }
    })

    if (result.kind === 'denied') {
      await this.auditWriter.record({
        actor: { type: 'user', userId: principal.userId },
        action: 'account.status.denied',
        entityType: 'user',
        entityId: userId,
        outcome: 'denied',
        before: { status: result.currentStatus },
        allowedSnapshotFields: ACCOUNT_STATUS_SNAPSHOT_FIELDS,
        allowDeniedBeforeSnapshot: true,
        reason: input.reason,
      })
      const exception =
        result.statusCode === 409
          ? new ConflictException({
              code: result.code,
              message: result.message,
            })
          : new ForbiddenException({
              code: result.code,
              message: result.message,
            })
      throw exception
    }

    return {
      userId: result.userId,
      status: result.status,
      changed: result.changed,
    }
  }
}
