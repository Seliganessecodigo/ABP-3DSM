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
export interface TotpSetupRequired {
  status: 'TOTP_SETUP_REQUIRED'
  setupToken: string
  expiresIn: number
}
export interface TotpChallengeRequired {
  status: 'TOTP_REQUIRED'
  challengeToken: string
  expiresIn: number
}
export type LoginResult = SessionTokens | TotpSetupRequired | TotpChallengeRequired
export type SsoHandoffResult = LoginResult
export interface TotpProvisioning {
  setupToken: string
  provisioningUri: string
  expiresIn: number
}
export class AuthenticationError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code = '') { super(`HTTP ${status}`); this.status = status; this.code = code }
}

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

function parseLoginResult(value: unknown): LoginResult {
  if (isRecord(value) && value.status === 'TOTP_SETUP_REQUIRED' &&
    typeof value.setupToken === 'string' && value.setupToken &&
    typeof value.expiresIn === 'number' && Number.isFinite(value.expiresIn) && value.expiresIn > 0) {
    return { status: 'TOTP_SETUP_REQUIRED', setupToken: value.setupToken, expiresIn: value.expiresIn }
  }
  if (isRecord(value) && value.status === 'TOTP_REQUIRED' &&
    typeof value.challengeToken === 'string' && value.challengeToken &&
    typeof value.expiresIn === 'number' && Number.isFinite(value.expiresIn) && value.expiresIn > 0) {
    return { status: 'TOTP_REQUIRED', challengeToken: value.challengeToken, expiresIn: value.expiresIn }
  }
  return parseTokens(value)
}

function parseTotpProvisioning(value: unknown): TotpProvisioning {
  if (!isRecord(value) || typeof value.setupToken !== 'string' || !value.setupToken ||
    typeof value.provisioningUri !== 'string' || !value.provisioningUri ||
    typeof value.expiresIn !== 'number' || !Number.isFinite(value.expiresIn) || value.expiresIn <= 0) {
    throw new Error('Resposta de configuraÃ§Ã£o TOTP invÃ¡lida')
  }
  let uri: URL
  try { uri = new URL(value.provisioningUri) } catch { throw new Error('URI de configuraÃ§Ã£o TOTP invÃ¡lida') }
  if (uri.protocol !== 'otpauth:' || uri.hostname !== 'totp' || !uri.searchParams.get('secret')) {
    throw new Error('URI de configuraÃ§Ã£o TOTP invÃ¡lida')
  }
  return { setupToken: value.setupToken, provisioningUri: uri.toString(), expiresIn: value.expiresIn }
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

export async function login(credentials: Credentials): Promise<LoginResult> {
  const response = await requestJson(endpoint('login'), { method: 'POST', body: JSON.stringify(credentials) })
  return parseLoginResult(response)
}

export function googleSsoStartUrl(codeChallenge: string, invitation?: string): string {
  const url = new URL(endpoint('sso/google'), window.location.origin)
  url.searchParams.set('code_challenge', codeChallenge)
  if (invitation) url.searchParams.set('invite', invitation)
  return url.toString()
}

export async function exchangeSsoHandoff(code: string, codeVerifier: string): Promise<SsoHandoffResult> {
  return parseLoginResult(await requestJson(endpoint('sso/handoff/exchange'), {
    method: 'POST',
    body: JSON.stringify({ code, codeVerifier }),
  }))
}

export async function beginTotpSetup(setupToken: string): Promise<TotpProvisioning> {
  const response = await requestJson(endpoint('totp/setup'), { method: 'POST', body: JSON.stringify({ setupToken }) })
  return parseTotpProvisioning(response)
}

export async function confirmTotpSetup(setupToken: string, code: string): Promise<SessionTokens> {
  return parseTokens(await requestJson(endpoint('totp/setup/confirm'), {
    method: 'POST',
    body: JSON.stringify({ setupToken, code }),
  }))
}

export async function verifyTotpChallenge(challengeToken: string, code: string): Promise<SessionTokens> {
  return parseTokens(await requestJson(endpoint('totp/challenge'), {
    method: 'POST',
    body: JSON.stringify({ challengeToken, code }),
  }))
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
