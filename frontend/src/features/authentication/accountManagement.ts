import { AccountError, parseAccount, type Account, type AccountRole } from './accounts.ts'
type Request = (url: string, init?: RequestInit) => Promise<Response>
let base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
while (base.endsWith('/')) base = base.slice(0, -1)
export type AccountChange = { kind: 'create'; name: string; email: string; role: AccountRole; reason: string } |
  { kind: 'role'; account: Account; role: AccountRole; reason: string } |
  { kind: 'status'; account: Account; status: Account['status']; reason: string }
export async function applyAccountChange(request: Request, change: AccountChange, signal: AbortSignal): Promise<void> {
  const path = change.kind === 'create' ? '' : `/${encodeURIComponent(change.account.id)}/${change.kind}`
  let body: Record<string, unknown>
  if (change.kind === 'create') body = { name: change.name, email: change.email, role: change.role, reason: change.reason }
  else if (change.kind === 'role') body = { role: change.role, expectedRole: change.account.role, reason: change.reason }
  else body = { status: change.status, expectedStatus: change.account.status, reason: change.reason }
  const response = await request(`${base}/auth/users${path}`, { method: change.kind === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
  if (!response.ok) throw new AccountError(response.status)
  const value: unknown = await response.json()
  if (change.kind === 'status') {
    if (!value || typeof value !== 'object' || !('userId' in value) || value.userId !== change.account.id || !('status' in value) || value.status !== change.status || !('changed' in value) || typeof value.changed !== 'boolean') throw new Error('Invalid status response')
  } else {
    const account = parseAccount(value)
    if (account.role !== change.role || (change.kind === 'role' && account.id !== change.account.id)) throw new Error('Invalid account mutation response')
  }
}
