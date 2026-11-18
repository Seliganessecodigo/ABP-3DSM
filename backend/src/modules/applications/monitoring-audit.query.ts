import { BadRequestException } from '@nestjs/common'
import { AuditLogQuery } from '../../database/repositories/audit-logs.repository'

export const auditSortColumns = [
  'id', 'actor', 'actorType', 'actorLabel', 'createdAt', 'action', 'entityType', 'entityId', 'reason', 'outcome',
] as const
export type AuditSortColumn = (typeof auditSortColumns)[number]
export type AuditPageSize = 5 | 10 | 15 | 20 | 'all'

export type MonitoringAuditQuery = AuditLogQuery

export function parseMonitoringAuditQuery(value: unknown): MonitoringAuditQuery {
  const input = object(value)
  const allowed = [
    'search', 'id', 'actor', 'actorLabel', 'actorType', 'action', 'entityType', 'entityId', 'reason', 'before', 'after', 'outcome',
    'createdAtFrom', 'createdAtTo', 'sortBy', 'sortDirection', 'page', 'pageSize',
  ]
  if (Object.keys(input).some((key) => !allowed.includes(key))) invalid()

  const pageSizeValue = choice(input.pageSize ?? '10', ['5', '10', '15', '20', 'all'])
  const pageSize = pageSizeValue === 'all' ? 'all' : Number(pageSizeValue) as 5 | 10 | 15 | 20
  const rawPage = input.page ?? '1'
  if (typeof rawPage !== 'string' || !/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage))) invalid()
  if (pageSize === 'all' && rawPage !== '1') invalid()
  if (pageSize !== 'all' && !Number.isSafeInteger((Number(rawPage) - 1) * pageSize)) invalid()

  const dates = {
    createdAtFrom: input.createdAtFrom === undefined ? undefined : date(input.createdAtFrom),
    createdAtTo: input.createdAtTo === undefined ? undefined : date(input.createdAtTo),
  }
  if (dates.createdAtFrom && dates.createdAtTo && dates.createdAtFrom > dates.createdAtTo) invalid()

  return {
    ...dates,
    ...textFilters(input),
    actorType: input.actorType === undefined ? undefined : choice(input.actorType, ['user']) as 'user',
    outcome: input.outcome === undefined ? undefined : choice(input.outcome, ['success', 'denied', 'failed']) as MonitoringAuditQuery['outcome'],
    sortBy: input.sortBy === undefined ? 'createdAt' : choice(input.sortBy, auditSortColumns) as AuditSortColumn,
    sortDirection: input.sortDirection === undefined ? 'desc' : choice(input.sortDirection, ['asc', 'desc']) as 'asc' | 'desc',
    page: Number(rawPage),
    pageSize,
  }
}

function textFilters(input: Record<string, unknown>): Pick<MonitoringAuditQuery, 'search' | 'id' | 'actor' | 'actorLabel' | 'action' | 'entityType' | 'entityId' | 'reason' | 'before' | 'after'> {
  const result: ReturnType<typeof textFilters> = {}
  for (const key of ['search', 'id', 'actor', 'actorLabel', 'action', 'entityType', 'entityId', 'reason', 'before', 'after'] as const) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 320) invalid()
      result[key] = input[key].trim()
    }
  }
  return result
}

function date(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) invalid()
  const day = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  if (day.toISOString().slice(0, 10) !== value.slice(0, 10)) invalid()
  return new Date(value).toISOString()
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid()
  return value as Record<string, unknown>
}

function choice(value: unknown, allowed: readonly string[]): string {
  if (typeof value !== 'string' || !allowed.includes(value)) invalid()
  return value
}

function invalid(): never {
  throw new BadRequestException({ code: 'INVALID_MONITORING_AUDIT_QUERY', message: 'Filtros ou paginação de auditoria inválidos' })
}
