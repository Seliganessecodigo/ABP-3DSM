import { ForbiddenException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { UserAccountStatus, UserEntity, UserRole } from '../../database/entities/user.entity'
import { AuthSessionEntity } from '../../database/entities/auth-session.entity'
import { AuthTokenEntity } from '../../database/entities/auth-token.entity'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { AuthenticationController } from './authentication.controller'
import { AuthenticationService, AuthPrincipal } from './authentication.service'
import { PasswordHasher } from './password-hasher.service'

const principal: AuthPrincipal = { userId: 'user-1', organizationId: 'org-1', sessionId: 'session-1', role: UserRole.ANALYST, email: 'user@example.test', name: 'User' }
const now = new Date('2026-11-19T12:00:00Z')
function setup() {
  const account = { id: principal.userId, organizationId: principal.organizationId, status: UserAccountStatus.ACTIVE, emailVerifiedAt: now, passwordHash: 'old-hash' }
  const users = { findOne: jest.fn().mockResolvedValue(account), save: jest.fn() }
  const sessions = { update: jest.fn() }
  const tokens = { update: jest.fn() }
  const manager = { getRepository: jest.fn((entity: unknown) => entity === UserEntity ? users : entity === AuthSessionEntity ? sessions : tokens) }
  const dataSource = { transaction: jest.fn(async (run: (value: typeof manager) => Promise<void>) => run(manager)) }
  const hasher = { verify: jest.fn().mockResolvedValue(true), hash: jest.fn().mockResolvedValue('new-hash') }
  const audit = { record: jest.fn() }
  const service = new AuthenticationService({} as never, {} as never, hasher as unknown as PasswordHasher, dataSource as unknown as DataSource,
    { now: () => now }, audit as unknown as AuditWriter, {} as never, {} as never)
  return { service, account, users, sessions, tokens, manager, hasher, audit }
}

describe('Changing the authenticated account password', () => {
  it('verifies the stored password, changes only the caller account and revokes sessions and pending credentials in the audited transaction', async () => {
    const s = setup()
    await s.service.changePassword(principal, { currentPassword: 'old-password', password: 'new-password' })
    expect(s.users.findOne).toHaveBeenCalledWith({ where: { id: principal.userId, organizationId: principal.organizationId }, lock: { mode: 'pessimistic_write' } })
    expect(s.hasher.verify).toHaveBeenCalledWith('old-hash', 'old-password')
    expect(s.hasher.hash).toHaveBeenCalledWith('new-password')
    expect(s.users.save).toHaveBeenCalledWith(expect.objectContaining({ id: principal.userId, passwordHash: 'new-hash' }))
    expect(s.sessions.update).toHaveBeenCalledWith(expect.objectContaining({ userId: principal.userId }), { revokedAt: now })
    expect(s.tokens.update).toHaveBeenCalledWith(expect.objectContaining({ userId: principal.userId }), { revokedAt: now })
    expect(s.manager.getRepository).toHaveBeenCalledWith(AuthTokenEntity)
    expect(s.audit.record).toHaveBeenCalledWith({ actor: { type: 'user', userId: principal.userId }, action: 'auth.password.changed', entityType: 'user', entityId: principal.userId, outcome: 'success' }, s.manager)
    expect(JSON.stringify(s.audit.record.mock.calls)).not.toMatch(/old-password|new-password|new-hash/)
  })

  it.each(['missing', 'blocked', 'unverified', 'google-only', 'incorrect'] as const)('rejects %s credentials without changing password or sessions', async kind => {
    const s = setup()
    if (kind === 'missing') s.users.findOne.mockResolvedValue(null)
    if (kind === 'blocked') s.account.status = UserAccountStatus.BLOCKED
    if (kind === 'unverified') s.users.findOne.mockResolvedValue({ ...s.account, emailVerifiedAt: null })
    if (kind === 'google-only') s.account.passwordHash = ''
    if (kind === 'incorrect') s.hasher.verify.mockResolvedValue(false)
    await expect(s.service.changePassword(principal, { currentPassword: 'wrong', password: 'new-password' })).rejects.toBeInstanceOf(ForbiddenException)
    expect(s.users.save).not.toHaveBeenCalled()
    expect(s.sessions.update).not.toHaveBeenCalled()
    expect(s.tokens.update).not.toHaveBeenCalled()
    expect(s.audit.record).not.toHaveBeenCalled()
  })

  it('propagates an audit failure to roll back the transaction', async () => {
    const s = setup()
    s.audit.record.mockRejectedValue(new Error('audit unavailable'))
    await expect(s.service.changePassword(principal, { currentPassword: 'old-password', password: 'new-password' })).rejects.toThrow('audit unavailable')
  })
})

describe('Password change HTTP validation', () => {
  function setupController() {
    const service = { changePassword: jest.fn() }
    const controller = new AuthenticationController(service as unknown as AuthenticationService, {} as never, {} as never, {} as never)
    return { controller, service }
  }
  it.each([
    null, {}, { currentPassword: 123, password: '12345678' }, { currentPassword: '', password: '12345678' },
    { currentPassword: 'a'.repeat(1025), password: '12345678' }, { currentPassword: 'current', password: '1234567' },
    { currentPassword: 'current', password: 'a'.repeat(1025) },
  ])('rejects invalid field types and lengths', async body => {
    const s = setupController()
    await expect(s.controller.changePassword(principal, body as never)).rejects.toThrow()
    expect(s.service.changePassword).not.toHaveBeenCalled()
  })
  it.each([8, 1024])('accepts the password length boundary %s', async length => {
    const s = setupController()
    const input = { currentPassword: 'current', password: 'a'.repeat(length) }
    await s.controller.changePassword(principal, input)
    expect(s.service.changePassword).toHaveBeenCalledWith(principal, input)
  })
})
