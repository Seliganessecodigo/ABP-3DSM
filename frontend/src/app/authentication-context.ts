import { createContext } from 'react'
import type { AuthenticatedUser, Credentials, LoginResult, TotpProvisioning } from '../features/authentication/api.ts'

export interface AuthenticationContextValue {
  user: AuthenticatedUser | null
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>
  signIn: (credentials: Credentials) => Promise<LoginResult>
  completeSsoHandoff: (code: string, verifier: string) => Promise<LoginResult>
  beginTotpSetup: (setupToken: string) => Promise<TotpProvisioning>
  confirmTotpSetup: (setupToken: string, code: string) => Promise<void>
  verifyTotpChallenge: (challengeToken: string, code: string) => Promise<void>
  signOut: () => Promise<void>
}
export const AuthenticationContext = createContext<AuthenticationContextValue | null>(null)
