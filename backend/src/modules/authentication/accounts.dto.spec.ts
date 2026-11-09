import { BadRequestException } from '@nestjs/common'
import { parseAccountsQuery, parseChangeAccountRole, parseCreateAccount } from './accounts.dto'
import { UserRole } from '../../database/entities/user.entity'

describe('account input boundaries', () => {
  const create = { name: ' Ana ', email: ' ANA@EXAMPLE.TEST ', role: 'ANALYST', reason: ' Equipe ' }
  it('normalizes identifiers and uses explicit pagination defaults', () => {
    expect(parseCreateAccount(create)).toEqual({ name: 'Ana', email: 'ana@example.test', role: 'ANALYST', reason: 'Equipe' })
    expect(parseAccountsQuery({})).toEqual({ dates: {}, sortBy: 'name', sortDirection: 'asc', page: 1, pageSize: 10 })
    expect(parseChangeAccountRole({ role: 'ADMIN', expectedRole: 'ANALYST', reason: ' Promoção ' })).toEqual({ role: UserRole.ADMIN, expectedRole: UserRole.ANALYST, reason: 'Promoção' })
  })
  it.each([null, [], {}, { ...create, role: 'ROOT' }, { ...create, email: 'invalid' }, { ...create, name: ' ' }, { ...create, name: 'a'.repeat(161) }, { ...create, reason: 'x'.repeat(513) }, { ...create, password: 'must-not-be-accepted' }, { ...create, organizationId: 'another' }])('rejects invalid account creation %j', input => {
    expect(() => parseCreateAccount(input)).toThrow(BadRequestException)
  })
  it.each(['@example.test', 'ana@@example.test', 'ana@localhost', 'ana@.test', 'ana@example.', 'ana b@example.test', 'ana@example. test'])('rejects malformed email %s without ambiguous backtracking', email => {
    expect(() => parseCreateAccount({ ...create, email })).toThrow(BadRequestException)
  })
  it.each([{}, { role: 'ADMIN', expectedRole: 'INVALID', reason: 'Reason' }, { role: 'ADMIN', expectedRole: 'ANALYST', reason: '' }, { role: 'ADMIN', expectedRole: 'ANALYST', reason: 'Reason', status: 'ACTIVE' }])('rejects invalid role changes %j', input => {
    expect(() => parseChangeAccountRole(input)).toThrow(BadRequestException)
  })
  it.each([
    { search: [] }, { name: '' }, { role: 'admin' }, { status: 'UNKNOWN' }, { sortBy: 'passwordHash' }, { sortDirection: 'DESC; DELETE' },
    { emailVerified: 'yes' }, { hasLastAccess: true }, { page: '0' }, { page: '1.5' }, { page: '9007199254740992' },
    { page: '9007199254740991', pageSize: '20' }, { pageSize: '1000' }, { pageSize: 5 }, { organizationId: 'other' },
    { createdAtFrom: '2026-01-01' }, { createdAtFrom: '2026-02-30T00:00:00Z' }, { createdAtFrom: '2026-01-01T24:00:00Z' },
    { createdAtFrom: '2026-02-01T00:00:00Z', createdAtTo: '2026-01-01T00:00:00Z' },
  ])('rejects invalid list parameters %j', input => {
    expect(() => parseAccountsQuery(input)).toThrow(BadRequestException)
  })
  it('normalizes dates and preserves independent combined filters', () => {
    expect(parseAccountsQuery({ search: ' sao ', id: 'id', name: 'ana', email: 'example', role: 'ADMIN', status: 'BLOCKED', emailVerified: 'false', hasLastAccess: 'true',
      sortBy: 'lastAccessAt', sortDirection: 'desc', page: '2', pageSize: 'all', createdAtFrom: '2026-01-01T00:00:00-03:00', createdAtTo: '2026-01-01T04:00:00Z' })).toMatchObject({
      search: 'sao', id: 'id', name: 'ana', email: 'example', role: 'ADMIN', status: 'BLOCKED', emailVerified: false, hasLastAccess: true,
      sortBy: 'lastAccessAt', sortDirection: 'desc', page: 2, pageSize: 'all', dates: { createdAt: { from: '2026-01-01T03:00:00.000Z', to: '2026-01-01T04:00:00.000Z' } },
    })
    expect(parseAccountsQuery({ pageSize: '15' }).pageSize).toBe(15)
  })
})
