import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { UserPreferenceEntity } from '../../database/entities/user-preference.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import type { AuthPrincipal } from '../authentication/authentication.service'
import type { PreferenceTab, PreferenceValue } from './preferences.dto'

@Injectable()
export class PreferencesRepository {
  constructor(private readonly database: DataSource) {}
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
      await manager.getRepository(AuditLogEntity).save({
        actor: principal.userId, actorUserId: principal.userId, action: 'preference.saved', entityType: 'user_preference', entityId: `${principal.userId}:${tab}`,
        before: before ? { value: before.value, revision: before.revision } : null,
        after: { value: after.value, revision: after.revision }, reason: 'Preferência pessoal de apresentação', outcome: 'success',
      })
      return after
    })
  }
}
