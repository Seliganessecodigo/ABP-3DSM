import { Injectable } from '@nestjs/common'
import { EntityManager, In, IsNull, Not, SelectQueryBuilder } from 'typeorm'
import { OrganizationEntity } from '../../database/entities/organization.entity'
import { UserAccountStatus, UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuthTokenEntity, AuthTokenKind } from '../../database/entities/auth-token.entity'
import { accountColumns, accountDateColumns, AccountsQuery, CreateAccountDto } from './accounts.dto'

function searchable(expression: string): string {
  return `regexp_replace(normalize(lower(${expression}), NFD), '[\u0300-\u036f]', '', 'g')`
}

function pattern(value: string): string {
  return `%${value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\\%_]/g, '\\$&')}%`
}

function applyColumnFilters(query: SelectQueryBuilder<UserEntity>, input: AccountsQuery): void {
  for (const column of ['id', 'name', 'email'] as const) {
    if (input[column]) query.andWhere(`${searchable(`CAST(account."${column}" AS text)`)} LIKE :${column}`, { [column]: pattern(input[column]) })
  }
  for (const column of ['role', 'status'] as const) {
    if (input[column]) query.andWhere(`account.${column} = :${column}`, { [column]: input[column] })
  }
  for (const [key, column] of [['emailVerified', 'emailVerifiedAt'], ['hasLastAccess', 'lastAccessAt']] as const) {
    if (input[key] !== undefined) query.andWhere(`account."${column}" IS ${input[key] ? 'NOT ' : ''}NULL`)
  }
}

function applyDateFilters(query: SelectQueryBuilder<UserEntity>, input: AccountsQuery): void {
  for (const column of accountDateColumns) {
    const range = input.dates[column]
    if (range?.from) query.andWhere(`account."${column}" >= :${column}From`, { [`${column}From`]: range.from })
    if (range?.to) query.andWhere(`account."${column}" <= :${column}To`, { [`${column}To`]: range.to })
  }
}

@Injectable()
export class AccountsRepository {
  lockOrganization(manager: EntityManager, organizationId: string) {
    return manager.getRepository(OrganizationEntity).findOne({ where: { id: organizationId }, lock: { mode: 'pessimistic_write' } })
  }

  findLocked(manager: EntityManager, organizationId: string, id: string) {
    return manager.getRepository(UserEntity).findOne({ where: { id, organizationId }, lock: { mode: 'pessimistic_write' } })
  }

  create(manager: EntityManager, organizationId: string, id: string, input: CreateAccountDto) {
    const users = manager.getRepository(UserEntity)
    return users.save(users.create({ id, organizationId, name: input.name, email: input.email, role: input.role,
      status: UserAccountStatus.ACTIVE, passwordHash: null, emailVerifiedAt: null, lastAccessAt: null }))
  }

  countActiveAdmins(manager: EntityManager, organizationId: string) {
    return manager.getRepository(UserEntity).countBy({ organizationId, role: UserRole.ADMIN, status: UserAccountStatus.ACTIVE, emailVerifiedAt: Not(IsNull()) })
  }

  saveRole(manager: EntityManager, account: UserEntity, role: UserRole) {
    account.role = role
    return manager.getRepository(UserEntity).save(account)
  }

  async revokeCredentials(manager: EntityManager, userId: string, at: Date) {
    await manager.getRepository(AuthSessionEntity).update({ userId, revokedAt: IsNull() }, { revokedAt: at })
    await manager.getRepository(AuthTokenEntity).update({ userId, revokedAt: IsNull(), consumedAt: IsNull(), kind: In([
      AuthTokenKind.TOTP_LOGIN_CHALLENGE, AuthTokenKind.TOTP_SETUP_CREDENTIAL,
      AuthTokenKind.TOTP_SETUP_CONFIRMATION, AuthTokenKind.TOTP_REPLACEMENT_CONFIRMATION,
    ]) }, { revokedAt: at })
  }

  async list(manager: EntityManager, organizationId: string, input: AccountsQuery) {
    const query = manager.getRepository(UserEntity).createQueryBuilder('account')
      .select(accountColumns.map(column => `account.${column}`))
      .where('account.organizationId = :organizationId', { organizationId })
    if (input.search) {
      const columns = accountColumns.map(column => accountDateColumns.includes(column as typeof accountDateColumns[number])
        ? `to_char(account."${column}" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
        : `CAST(account."${column}" AS text)`)
      query.andWhere(`(${columns.map(column => `${searchable(column)} LIKE :search`).join(' OR ')})`, { search: pattern(input.search) })
    }
    applyColumnFilters(query, input)
    applyDateFilters(query, input)
    const totalItems = await query.getCount()
    const totalPages = totalItems === 0 ? 0 : input.pageSize === 'all' ? 1 : Math.ceil(totalItems / input.pageSize)
    const page = Math.min(input.pageSize === 'all' ? 1 : input.page, Math.max(1, totalPages))
    // Every identifier comes from the DTO allowlist. Text follows the database collation; dates and enums keep their native types.
    query.orderBy(`account.${input.sortBy}`, input.sortDirection === 'asc' ? 'ASC' : 'DESC', 'NULLS LAST')
    if (input.sortBy !== 'id') query.addOrderBy('account.id', 'ASC')
    if (input.pageSize !== 'all') query.skip((page - 1) * input.pageSize).take(input.pageSize)
    return { accounts: await query.getMany(), pagination: { page, pageSize: input.pageSize, totalItems, totalPages, hasNextPage: page < totalPages } }
  }
}
