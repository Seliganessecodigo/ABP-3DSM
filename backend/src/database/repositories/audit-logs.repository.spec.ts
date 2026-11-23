import { AuditLogsRepository } from './audit-logs.repository'

describe('AuditLogsRepository.listChanges', () => {
  function createRepository(totalItems = 1) {
    const builder = {
      innerJoin: jest.fn(), where: jest.fn(), andWhere: jest.fn(), getCount: jest.fn(), clone: jest.fn(),
      orderBy: jest.fn(), addOrderBy: jest.fn(), skip: jest.fn(), take: jest.fn(), getMany: jest.fn(),
    }
    for (const method of ['innerJoin', 'where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take'] as const) {
      builder[method].mockReturnValue(builder)
    }
    builder.getCount.mockResolvedValue(totalItems)
    builder.getMany.mockResolvedValue([{ id: 'event-1' }])
    builder.clone.mockReturnValue(builder)
    const instance = new AuditLogsRepository({ createQueryBuilder: () => builder } as never)
    return { instance, builder }
  }

  it('scopes before filtering and applies safe filters, folded search and stable paged ordering', async () => {
    const { instance, builder } = createRepository(12)
    const result = await instance.listChanges('org-1', {
      id: 'abc', actor: 'admin', actorLabel: 'Ana', actorType: 'user', action: 'account.role', entityType: 'user', entityId: '1',
      reason: 'suporte', before: 'old', after: 'new', outcome: 'success', createdAtFrom: '2026-01-01T00:00:00.000Z',
      createdAtTo: '2026-01-02T00:00:00.000Z', search: 'manutenção', sortBy: 'actorLabel', sortDirection: 'asc', page: 2, pageSize: 5,
    })

    expect(builder.where).toHaveBeenCalledWith('actorUser.organizationId = :organizationId', { organizationId: 'org-1' })
    expect(builder.andWhere).toHaveBeenCalledWith('audit.actorType = :actorType', { actorType: 'user' })
    expect(builder.andWhere).toHaveBeenCalledWith('audit.action IN (:...changeActions)', { changeActions: expect.arrayContaining(['account.role.changed', 'auth.password.changed', 'preference.saved']) })
    expect(builder.andWhere.mock.calls.length).toBeGreaterThan(12)
    expect(builder.orderBy).toHaveBeenCalledWith('audit.actorLabel', 'ASC', 'NULLS LAST')
    expect(builder.addOrderBy).toHaveBeenCalledWith('audit.id', 'ASC')
    expect(builder.skip).toHaveBeenCalledWith(5)
    expect(builder.take).toHaveBeenCalledWith(5)
    expect(result.pagination).toEqual({ page: 2, pageSize: 5, totalItems: 12, totalPages: 3, hasNextPage: true })
  })

  it('returns the full filtered set for all and clamps empty results to a stable first page', async () => {
    const all = createRepository(3)
    const allResult = await all.instance.listChanges('org-1', {
      sortBy: 'createdAt', sortDirection: 'desc', page: 1, pageSize: 'all',
    })
    expect(all.builder.skip).not.toHaveBeenCalled()
    expect(all.builder.take).not.toHaveBeenCalled()
    expect(allResult.pagination).toEqual({ page: 1, pageSize: 'all', totalItems: 3, totalPages: 1, hasNextPage: false })

    const empty = createRepository(0)
    const emptyResult = await empty.instance.listChanges('org-1', {
      sortBy: 'id', sortDirection: 'desc', page: 4, pageSize: 10,
    })
    expect(empty.builder.skip).toHaveBeenCalledWith(0)
    expect(emptyResult.pagination).toEqual({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0, hasNextPage: false })
  })
})
