import type { AuthenticatedUser } from './api.ts'

type AuthenticatedFetch = (url: string, init?: RequestInit) => Promise<Response>
export type AccountRole = AuthenticatedUser['role']
export interface Account {
  id: string
  name: string
  email: string
  role: AccountRole
  status: 'ACTIVE' | 'BLOCKED' | 'DEACTIVATED'
}
export interface AccountPage {
  items: Account[]
  pagination: { page: number; totalPages: number; totalItems: number; hasNextPage: boolean }
}
export type GoogleInvitation = Pick<Account, 'name' | 'email' | 'role'>
export class AccountError extends Error {
  readonly status: number
  constructor(status: number) { super(`Accounts HTTP ${status}`); this.status = status }
}
let base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
while (base.endsWith('/')) base = base.slice(0, -1)
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
export function isAccountRole(value: unknown): value is AccountRole { return value === 'ADMIN' || value === 'ANALYST' || value === 'VISITOR' }
function parseAccount(value: unknown): Account {
  if (!record(value) || typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || typeof value.email !== 'string' || !isAccountRole(value.role) || (value.status !== 'ACTIVE' && value.status !== 'BLOCKED' && value.status !== 'DEACTIVATED')) throw new Error('Invalid account response')
  return { id: value.id, name: value.name, email: value.email, role: value.role, status: value.status }
}
function nonnegativeInteger(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 }
export async function getAccounts(request: AuthenticatedFetch, page: number, signal: AbortSignal): Promise<AccountPage> {
  const response = await request(`${base}/auth/users?page=${page}&pageSize=10`, { signal })
  if (!response.ok) throw new AccountError(response.status)
  const value: unknown = await response.json()
  if (!record(value) || !Array.isArray(value.items) || !record(value.pagination)) throw new Error('Invalid accounts response')
  const pagination = value.pagination
  if (!nonnegativeInteger(pagination.page) || pagination.page < 1 || !nonnegativeInteger(pagination.totalPages) || !nonnegativeInteger(pagination.totalItems) || typeof pagination.hasNextPage !== 'boolean') throw new Error('Invalid accounts pagination')
  return { items: value.items.map(parseAccount), pagination: { page: pagination.page, totalPages: pagination.totalPages, totalItems: pagination.totalItems, hasNextPage: pagination.hasNextPage } }
}
export async function inviteWithGoogle(request: AuthenticatedFetch, input: GoogleInvitation, signal: AbortSignal): Promise<void> {
  const response = await request(`${base}/auth/sso/invitations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal })
  if (!response.ok) throw new AccountError(response.status)
  const value: unknown = await response.json()
  if (!record(value) || typeof value.expiresAt !== 'string' || !Number.isFinite(Date.parse(value.expiresAt))) throw new Error('Invalid invitation response')
}
