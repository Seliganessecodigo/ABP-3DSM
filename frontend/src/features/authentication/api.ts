export interface SessionTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface AuthenticatedUser {
  id: string
  organizationId: string
  name: string
  email: string
  role: 'ADMIN' | 'ANALYST' | 'VISITOR'
}

export interface Credentials { email: string; password: string }
export class AuthenticationError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code = '') { super(`HTTP ${status}`); this.status = status; this.code = code }
}
export class TotpRequiredError extends Error {}

const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/+$/, '')
const endpoint = (path: string) => `${apiBase}/auth/${path}`
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }

function parseTokens(value: unknown): SessionTokens {
  if (!isRecord(value) || typeof value.accessToken !== 'string' || !value.accessToken ||
    typeof value.refreshToken !== 'string' || !value.refreshToken || value.tokenType !== 'Bearer' ||
    typeof value.expiresIn !== 'number' || !Number.isFinite(value.expiresIn) || value.expiresIn <= 0) {
    throw new Error('Resposta de sessão inválida')
  }
  return { accessToken: value.accessToken, refreshToken: value.refreshToken, tokenType: 'Bearer', expiresIn: value.expiresIn }
}

async function requestJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers } })
  if (!response.ok) {
    let code = ''
    try { const body: unknown = await response.json(); if (isRecord(body) && typeof body.code === 'string') code = body.code } catch { /* resposta sem JSON */ }
    throw new AuthenticationError(response.status, code)
  }
  if (response.status === 204) return null
  return response.json() as Promise<unknown>
}

export async function login(credentials: Credentials): Promise<SessionTokens> {
  const response = await requestJson(endpoint('login'), { method: 'POST', body: JSON.stringify(credentials) })
  if (isRecord(response) && (response.status === 'TOTP_REQUIRED' || response.status === 'TOTP_SETUP_REQUIRED')) throw new TotpRequiredError()
  return parseTokens(response)
}

export async function getCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
  const value = await requestJson(endpoint('me'), { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.organizationId !== 'string' ||
    typeof value.name !== 'string' || typeof value.email !== 'string' ||
    !['ADMIN', 'ANALYST', 'VISITOR'].includes(String(value.role))) throw new Error('Resposta de usuário inválida')
  return { id: value.id, organizationId: value.organizationId, name: value.name, email: value.email, role: value.role as AuthenticatedUser['role'] }
}

export async function refreshSession(refreshToken: string): Promise<SessionTokens> {
  return parseTokens(await requestJson(endpoint('sessions/refresh'), { method: 'POST', body: JSON.stringify({ refreshToken }) }))
}

export async function logout(accessToken: string): Promise<void> {
  await requestJson(endpoint('sessions/logout'), { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
}
