import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthenticationError, getCurrentUser, login, logout, refreshSession, type AuthenticatedUser, type Credentials, type SessionTokens } from '../features/authentication/api.ts'
import { AuthenticationContext } from './authentication-context.ts'

export function AuthenticationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<{ tokens: SessionTokens; user: AuthenticatedUser } | null>(null)
  const signIn = useCallback(async (credentials: Credentials) => {
    const initial = await login(credentials)
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
  const signOut = useCallback(async () => {
    const active = session
    setSession(null)
    if (!active) return
    try { await logout(active.tokens.accessToken) } catch { /* a sessão local sempre termina */ }
  }, [session])
  const value = useMemo(() => ({ user: session?.user ?? null, signIn, signOut }), [session, signIn, signOut])
  return <AuthenticationContext.Provider value={value}>{children}</AuthenticationContext.Provider>
}
