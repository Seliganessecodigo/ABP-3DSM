import { auditableChangeActions } from '../../shared/audit/audit-activity'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, QueryDeepPartialEntity, Repository } from 'typeorm'
import { AuditLogEntity } from '../entities/audit-log.entity'

export interface AuditLogQuery {
  search?: string
  id?: string
  actor?: string
  actorLabel?: string
  actorType?: 'user'
  action?: string
  entityType?: string
  entityId?: string
  reason?: string
  before?: string
  after?: string
  outcome?: 'success' | 'denied' | 'failed'
  createdAtFrom?: string
  createdAtTo?: string
  sortBy: 'id' | 'actor' | 'actorType' | 'actorLabel' | 'createdAt' | 'action' | 'entityType' | 'entityId' | 'reason' | 'outcome'
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: 5 | 10 | 15 | 20 | 'all'
}

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  async append(
    entry: Partial<AuditLogEntity>,
    manager?: EntityManager,
  ): Promise<AuditLogEntity> {
    const repository = manager?.getRepository(AuditLogEntity) ?? this.repository
    const entity = repository.create(entry)
    const values = { ...entry }
    delete values.actorUser
    const result = await repository.insert(
      values as unknown as QueryDeepPartialEntity<AuditLogEntity>,
    )
    entity.id = result.identifiers[0].id
    return entity
  }

  async listChanges(organizationId: string, filters: AuditLogQuery) {
    const query = this.repository.createQueryBuilder('audit')
      .innerJoin('audit.actorUser', 'actorUser')
      .where('actorUser.organizationId = :organizationId', { organizationId })
      .andWhere('audit.actorType = :actorType', { actorType: 'user' })
      .andWhere('audit.action IN (:...changeActions)', { changeActions: auditableChangeActions })

    const textColumns = {
      id: 'audit.id::text', actor: 'audit.actor', actorLabel: 'audit.actorLabel',
      action: 'audit.action', entityType: 'audit.entityType', entityId: 'audit.entityId', reason: 'audit.reason',
    } as const
    for (const field of Object.keys(textColumns) as (keyof typeof textColumns)[]) {
      const value = filters[field]
      if (value) query.andWhere(`${folded(textColumns[field])} LIKE :${field} ESCAPE '\\'`, { [field]: `%${escapeLike(fold(value))}%` })
    }
    for (const field of ['before', 'after'] as const) {
      const value = filters[field]
      if (value) query.andWhere(`${folded(`audit.${field}::text`)} LIKE :${field} ESCAPE '\\'`, { [field]: `%${escapeLike(fold(value))}%` })
    }
    if (filters.actorType) query.andWhere('audit.actorType = :requestedActorType', { requestedActorType: filters.actorType })
    if (filters.outcome) query.andWhere('audit.outcome = :outcome', { outcome: filters.outcome })
    if (filters.createdAtFrom) query.andWhere('audit.createdAt >= :createdAtFrom', { createdAtFrom: filters.createdAtFrom })
    if (filters.createdAtTo) query.andWhere('audit.createdAt <= :createdAtTo', { createdAtTo: filters.createdAtTo })
    if (filters.search) {
      const search = `%${escapeLike(fold(filters.search))}%`
      query.andWhere(`(${[
        'audit.id::text', 'audit.actorType', 'audit.actor', 'audit.actorLabel', 'audit.action', 'audit.entityType', 'audit.entityId',
        'audit.reason', 'audit.outcome', 'audit.before::text', 'audit.after::text',
        `to_char(audit.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
      ].map((field) => `${folded(`COALESCE(${field}, '')`)} LIKE :search ESCAPE '\\'`).join(' OR ')})`, { search })
    }

    const totalItems = await query.getCount()
    const totalPages = filters.pageSize === 'all' ? Number(totalItems > 0) : Math.ceil(totalItems / filters.pageSize)
    const page = Math.min(filters.pageSize === 'all' ? 1 : filters.page, Math.max(1, totalPages))
    const sortColumns: Record<typeof filters.sortBy, string> = {
      id: 'audit.id', actor: 'audit.actor', actorType: 'audit.actorType', actorLabel: 'audit.actorLabel', createdAt: 'audit.createdAt',
      action: 'audit.action', entityType: 'audit.entityType', entityId: 'audit.entityId',
      reason: 'audit.reason', outcome: 'audit.outcome',
    }
    const itemsQuery = query.clone().orderBy(sortColumns[filters.sortBy], filters.sortDirection.toUpperCase() as 'ASC' | 'DESC', 'NULLS LAST').addOrderBy('audit.id', 'ASC')
    if (filters.pageSize !== 'all') itemsQuery.skip((page - 1) * filters.pageSize).take(filters.pageSize)
    const items = await itemsQuery.getMany()
    return {
      items,
      pagination: {
        page,
        pageSize: filters.pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
      },
    }
  }
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

function folded(expression: string): string {
  return `translate(lower(coalesce(${expression}, '')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')`
}
