import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthenticationError, beginTotpSetup as requestTotpSetup, confirmTotpSetup as requestTotpConfirmation, exchangeSsoHandoff, getCurrentUser, login, logout, refreshSession, verifyTotpChallenge as requestTotpChallenge, type AuthenticatedUser, type Credentials, type LoginResult, type SessionTokens, type TotpProvisioning } from '../features/authentication/api.ts'
import { AuthenticationContext } from './authentication-context.ts'

export function AuthenticationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<{ tokens: SessionTokens; user: AuthenticatedUser } | null>(null)
  const sessionRef = useRef(session)
  useLayoutEffect(() => { sessionRef.current = session }, [session])
  const completeSession = useCallback(async (initial: SessionTokens) => {
    try {
      const user = await getCurrentUser(initial.accessToken)
      setSession({ tokens: initial, user })
    } catch (error) {
      if (!(error instanceof AuthenticationError) || error.status !== 401) throw error
      const refreshed = await refreshSession(initial.refreshToken)
      const user = await getCurrentUser(refreshed.accessToken)
      setSession({ tokens: refreshed, user })
    }
  }, [])
  const signIn = useCallback(async (credentials: Credentials): Promise<LoginResult> => {
    const result = await login(credentials)
    if (!('status' in result)) await completeSession(result)
    return result
  }, [completeSession])
  const completeSsoHandoff = useCallback(async (code: string, verifier: string): Promise<LoginResult> => {
    const result = await exchangeSsoHandoff(code, verifier)
    if (!('status' in result)) await completeSession(result)
    return result
  }, [completeSession])
  const beginTotpSetup = useCallback((setupToken: string): Promise<TotpProvisioning> => requestTotpSetup(setupToken), [])
  const confirmTotpSetup = useCallback(async (setupToken: string, code: string) => {
    await completeSession(await requestTotpConfirmation(setupToken, code))
  }, [completeSession])
  const verifyTotpChallenge = useCallback(async (challengeToken: string, code: string) => {
    await completeSession(await requestTotpChallenge(challengeToken, code))
  }, [completeSession])
  const signOut = useCallback(async () => {
    const active = session
    setSession(null)
    if (!active) return
    try { await logout(active.tokens.accessToken) } catch { /* a sessão local sempre termina */ }
  }, [session])
  const authenticatedFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const active = sessionRef.current
    if (!active) throw new AuthenticationError(401, 'AUTHENTICATION_REQUIRED')
    const send = (token: string) => fetch(url, { ...init, headers: { ...Object.fromEntries(new Headers(init.headers)), Authorization: `Bearer ${token}` } })
    let response = await send(active.tokens.accessToken)
    if (response.status !== 401) return response
    if (init.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const tokens = await refreshSession(active.tokens.refreshToken)
    const user = await getCurrentUser(tokens.accessToken)
    if (init.signal?.aborted || sessionRef.current !== active) throw new DOMException('Aborted', 'AbortError')
    setSession({ tokens, user })
    response = await send(tokens.accessToken)
    return response
  }, [])
  const value = useMemo(() => ({ user: session?.user ?? null, authenticatedFetch, signIn, completeSsoHandoff, beginTotpSetup, confirmTotpSetup, verifyTotpChallenge, signOut }), [session, authenticatedFetch, signIn, completeSsoHandoff, beginTotpSetup, confirmTotpSetup, verifyTotpChallenge, signOut])
  return <AuthenticationContext.Provider value={value}>{children}</AuthenticationContext.Provider>
}
