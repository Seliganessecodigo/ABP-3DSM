import { BadRequestException } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserAccountStatus, UserRole } from '../../database/entities/user.entity'

export class CreateAccountDto {
  @ApiProperty({ maxLength: 160 }) name!: string
  @ApiProperty({ maxLength: 320, format: 'email' }) email!: string
  @ApiProperty({ enum: UserRole }) role!: UserRole
  @ApiProperty({ maxLength: 512 }) reason!: string
}

export class ChangeAccountRoleDto {
  @ApiProperty({ enum: UserRole }) role!: UserRole
  @ApiProperty({ enum: UserRole }) expectedRole!: UserRole
  @ApiProperty({ maxLength: 512 }) reason!: string
}

export const accountColumns = ['id', 'name', 'email', 'role', 'status', 'emailVerifiedAt', 'lastAccessAt', 'createdAt', 'updatedAt'] as const
export type AccountColumn = typeof accountColumns[number]
export const accountDateColumns = ['emailVerifiedAt', 'lastAccessAt', 'createdAt', 'updatedAt'] as const
export type AccountDateColumn = typeof accountDateColumns[number]

export class AccountsQueryDto {
  @ApiPropertyOptional({ description: 'Trecho sem caixa/acentos nas colunas públicas; datas em ISO UTC e enums por código.' }) search?: string
  @ApiPropertyOptional() id?: string
  @ApiPropertyOptional() name?: string
  @ApiPropertyOptional() email?: string
  @ApiPropertyOptional({ enum: UserRole }) role?: UserRole
  @ApiPropertyOptional({ enum: UserAccountStatus }) status?: UserAccountStatus
  @ApiPropertyOptional({ enum: ['true', 'false'] }) emailVerified?: string
  @ApiPropertyOptional({ enum: ['true', 'false'] }) hasLastAccess?: string
  @ApiPropertyOptional({ format: 'date-time' }) emailVerifiedAtFrom?: string
  @ApiPropertyOptional({ format: 'date-time' }) emailVerifiedAtTo?: string
  @ApiPropertyOptional({ format: 'date-time' }) lastAccessAtFrom?: string
  @ApiPropertyOptional({ format: 'date-time' }) lastAccessAtTo?: string
  @ApiPropertyOptional({ format: 'date-time' }) createdAtFrom?: string
  @ApiPropertyOptional({ format: 'date-time' }) createdAtTo?: string
  @ApiPropertyOptional({ format: 'date-time' }) updatedAtFrom?: string
  @ApiPropertyOptional({ format: 'date-time' }) updatedAtTo?: string
  @ApiPropertyOptional({ enum: accountColumns, default: 'name' }) sortBy?: AccountColumn
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' }) sortDirection?: string
  @ApiPropertyOptional({ default: '1' }) page?: string
  @ApiPropertyOptional({ enum: ['5', '10', '15', '20', 'all'], default: '10' }) pageSize?: string
}

export class AccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() name!: string
  @ApiProperty({ format: 'email' }) email!: string
  @ApiProperty({ enum: UserRole }) role!: UserRole
  @ApiProperty({ enum: UserAccountStatus }) status!: UserAccountStatus
  @ApiProperty({ nullable: true, format: 'date-time' }) emailVerifiedAt!: string | null
  @ApiProperty({ nullable: true, format: 'date-time' }) lastAccessAt!: string | null
  @ApiProperty({ format: 'date-time' }) createdAt!: string
  @ApiProperty({ format: 'date-time' }) updatedAt!: string
}

export class AccountsPaginationDto {
  @ApiProperty() page!: number
  @ApiProperty({ oneOf: [{ type: 'integer', enum: [5, 10, 15, 20] }, { type: 'string', enum: ['all'] }] }) pageSize!: number | 'all'
  @ApiProperty() totalItems!: number
  @ApiProperty() totalPages!: number
  @ApiProperty() hasNextPage!: boolean
}

export class AccountsResponseDto {
  @ApiProperty({ type: [AccountResponseDto] }) items!: AccountResponseDto[]
  @ApiProperty({ type: AccountsPaginationDto }) pagination!: AccountsPaginationDto
}

export interface AccountsQuery {
  search?: string
  id?: string
  name?: string
  email?: string
  role?: UserRole
  status?: UserAccountStatus
  emailVerified?: boolean
  hasLastAccess?: boolean
  dates: Partial<Record<AccountDateColumn, { from?: string; to?: string }>>
  sortBy: AccountColumn
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: 5 | 10 | 15 | 20 | 'all'
}

function invalid(): never {
  throw new BadRequestException({ code: 'INVALID_ACCOUNT_INPUT', message: 'Dados ou parâmetros de conta inválidos' })
}

function record(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid()
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !allowed.includes(key))) invalid()
  return input
}

function text(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) invalid()
  return value.trim()
}

export function parseCreateAccount(value: unknown): CreateAccountDto {
  const input = record(value, ['name', 'email', 'role', 'reason'])
  const email = text(input.email, 320).toLowerCase()
  if (!validEmail(email)) invalid()
  return { name: text(input.name, 160), email, role: parseRole(input.role), reason: text(input.reason, 512) }
}

function validEmail(email: string): boolean {
  const separator = email.indexOf('@')
  const domain = email.slice(separator + 1)
  const dot = domain.indexOf('.', 1)
  return separator > 0 && separator === email.lastIndexOf('@') && dot > 0 && dot < domain.length - 1 && !/\s/.test(email)
}

export function parseChangeAccountRole(value: unknown): ChangeAccountRoleDto {
  const input = record(value, ['role', 'expectedRole', 'reason'])
  return { role: parseRole(input.role), expectedRole: parseRole(input.expectedRole), reason: text(input.reason, 512) }
}

function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  if (!choices.includes(value as T)) invalid()
  return value as T
}

function parseRole(value: unknown): UserRole {
  return choice(value, Object.values(UserRole))
}

function date(value: unknown): string {
  const input = text(value, 40)
  // Require an explicit offset; reject normalized impossible calendar dates as well.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(input)
  if (!match || !Number.isFinite(Date.parse(input))) invalid()
  const day = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`)
  if (day.toISOString().slice(0, 10) !== input.slice(0, 10)) invalid()
  return new Date(input).toISOString()
}

function parsePagination(input: Record<string, unknown>): Pick<AccountsQuery, 'page' | 'pageSize'> {
  const size = choice(input.pageSize === undefined ? '10' : input.pageSize, ['5', '10', '15', '20', 'all'] as const)
  const pageSize = size === 'all' ? 'all' : Number(size) as 5 | 10 | 15 | 20
  const rawPage = input.page === undefined ? '1' : input.page
  if (typeof rawPage !== 'string' || !/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage))) invalid()
  const page = Number(rawPage)
  if (pageSize !== 'all' && !Number.isSafeInteger((page - 1) * pageSize)) invalid()
  return { page, pageSize }
}

function parseDateRanges(input: Record<string, unknown>): AccountsQuery['dates'] {
  const dates: AccountsQuery['dates'] = {}
  for (const column of accountDateColumns) {
    const from = input[`${column}From`] === undefined ? undefined : date(input[`${column}From`])
    const to = input[`${column}To`] === undefined ? undefined : date(input[`${column}To`])
    if (from && to && from > to) invalid()
    if (from || to) dates[column] = { from, to }
  }
  return dates
}

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined ? undefined : choice(value, ['true', 'false']) === 'true'
}

export function parseAccountsQuery(value: unknown): AccountsQuery {
  const dateKeys = accountDateColumns.flatMap(column => [`${column}From`, `${column}To`])
  const input = record(value, ['search', 'id', 'name', 'email', 'role', 'status', 'emailVerified', 'hasLastAccess', 'sortBy', 'sortDirection', 'page', 'pageSize', ...dateKeys])
  const textFilters: Pick<AccountsQuery, 'search' | 'id' | 'name' | 'email'> = {}
  for (const key of ['search', 'id', 'name', 'email'] as const) {
    if (input[key] !== undefined) textFilters[key] = text(input[key], 320)
  }
  return { ...textFilters, ...parsePagination(input), dates: parseDateRanges(input),
    role: input.role === undefined ? undefined : parseRole(input.role),
    status: input.status === undefined ? undefined : choice(input.status, Object.values(UserAccountStatus)),
    emailVerified: optionalBoolean(input.emailVerified), hasLastAccess: optionalBoolean(input.hasLastAccess),
    sortBy: choice(input.sortBy === undefined ? 'name' : input.sortBy, accountColumns),
    sortDirection: choice(input.sortDirection === undefined ? 'asc' : input.sortDirection, ['asc', 'desc']),
  }
}
