import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { UserPreferenceEntity } from '../../database/entities/user-preference.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import type { AuthPrincipal } from '../authentication/authentication.service'
import type { PreferenceTab, PreferenceValue } from './preferences.dto'

@Injectable()
export class PreferencesRepository {
  constructor(
    private readonly database: DataSource,
    private readonly auditWriter: AuditWriter,
  ) {}
  find(userId: string) {
    return this.database.getRepository(UserPreferenceEntity).findBy({ userId })
  }
  save(principal: AuthPrincipal, tab: PreferenceTab, value: PreferenceValue, expectedRevision: number) {
    return this.database.transaction(async (manager) => {
      // The user lock also serializes concurrent first writes, where no preference row exists yet.
      await manager.getRepository(UserEntity).findOneOrFail({ where: { id: principal.userId, organizationId: principal.organizationId }, lock: { mode: 'pessimistic_write' } })
      const repository = manager.getRepository(UserPreferenceEntity)
      const before = await repository.findOneBy({ userId: principal.userId, tab })
      if ((before?.revision ?? 0) !== expectedRevision) return null
      const after = await repository.save(repository.create({ userId: principal.userId, tab, value, revision: expectedRevision + 1, updatedAt: new Date() }))
      await this.auditWriter.record({
        actor: { type: 'user', userId: principal.userId },
        action: 'preference.saved',
        entityType: 'user_preference',
        entityId: `${principal.userId}:${tab}`,
        before: before ? { value: before.value, revision: before.revision } : null,
        after: { value: after.value, revision: after.revision },
        allowedSnapshotFields: ['value', 'revision'],
        outcome: 'success',
      }, manager)
      return after
    })
  }
}
