import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository'

export type AuditOutcome = 'success' | 'denied' | 'failed'

export type AuditActor =
  | { type: 'user'; userId: string }
  | { type: 'system'; componentId: string }
  | { type: 'operator'; operatorId: string }
  | { type: 'unauthenticated' }

export interface AuditEvent {
  actor: AuditActor
  action: string
  entityType: string
  entityId: string
  outcome: AuditOutcome
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  allowedSnapshotFields?: readonly string[]
  allowDeniedBeforeSnapshot?: boolean
  reason?: string | null
}

@Injectable()
export class AuditWriter {
  constructor(
    private readonly auditLogs: AuditLogsRepository,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async record(event: AuditEvent, manager?: EntityManager): Promise<void> {
    if (manager && event.outcome !== 'success') {
      throw new BadRequestException(
        'Denied and failed audit events must be written outside a transaction',
      )
    }
    if (
      !event.action.trim() ||
      event.action.length > 128 ||
      !event.entityType.trim() ||
      event.entityType.length > 128 ||
      !event.entityId.trim() ||
      event.entityId.length > 128 ||
      (event.reason != null && event.reason.length > 512)
    ) {
      throw new BadRequestException('Invalid audit event')
    }
    const actorId =
      event.actor.type === 'user'
        ? event.actor.userId
        : event.actor.type === 'system'
          ? event.actor.componentId
          : event.actor.type === 'operator'
            ? event.actor.operatorId
            : null
    if (actorId !== null && (!actorId.trim() || actorId.length > 128)) {
      throw new BadRequestException('Invalid audit actor')
    }
    const before =
      event.outcome === 'success' ||
      (event.outcome === 'denied' && event.allowDeniedBeforeSnapshot)
        ? sanitizeSnapshot(event.before, event.allowedSnapshotFields)
        : null
    const after =
      event.outcome === 'success'
        ? sanitizeSnapshot(event.after, event.allowedSnapshotFields)
        : null
    const userActor = event.actor.type === 'user' ? event.actor : null
    const storedActorLabel = userActor
      ? await (manager?.getRepository(UserEntity) ?? this.users).findOne({
          where: { id: userActor.userId },
          select: { id: true, name: true },
        }).then((user) => user?.name ?? null)
      : null
    const actorLabel =
      storedActorLabel && !storedActorLabel.includes('@')
        ? storedActorLabel.length <= 160
          ? storedActorLabel
          : null
        : null
    const actor =
      event.actor.type === 'user'
        ? event.actor.userId
        : event.actor.type === 'system'
          ? event.actor.componentId
          : event.actor.type === 'operator'
            ? event.actor.operatorId
            : 'unauthenticated'

    await this.auditLogs.append(
      {
        actor,
        actorType: event.actor.type,
        actorUserId: userActor?.userId ?? null,
        actorSystemId:
          event.actor.type === 'system' ? event.actor.componentId : null,
        actorExternalId:
          event.actor.type === 'operator' ? event.actor.operatorId : null,
        actorLabel,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        before,
        after,
        reason: event.reason ?? null,
        outcome: event.outcome,
      },
      manager,
    )
  }
}

function sanitizeSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
  allowedFields: readonly string[] | undefined,
): Record<string, unknown> | null {
  if (snapshot == null) return null
  if (!allowedFields) {
    throw new BadRequestException('Audit snapshot allowlist is required')
  }
  for (const [key, value] of Object.entries(snapshot)) {
    if (!allowedFields.includes(key) || isSensitiveKey(key) || containsSensitiveKey(value)) {
      throw new BadRequestException(`Unsupported audit snapshot field: ${key}`)
    }
  }
  return snapshot
}

function containsSensitiveKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsSensitiveKey)
  return Object.entries(value).some(
    ([key, nested]) => isSensitiveKey(key) || containsSensitiveKey(nested),
  )
}

function isSensitiveKey(key: string): boolean {
  return /password|token|secret|credential|hash|authorization|cookie|email/i.test(
    key,
  )
}
