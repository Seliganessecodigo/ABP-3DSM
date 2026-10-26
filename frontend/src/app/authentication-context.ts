import { createContext } from 'react'
import type { AuthenticatedUser, Credentials, LoginResult, TotpProvisioning } from '../features/authentication/api.ts'

export interface AuthenticationContextValue {
  user: AuthenticatedUser | null
  signIn: (credentials: Credentials) => Promise<LoginResult>
  beginTotpSetup: (setupToken: string) => Promise<TotpProvisioning>
  confirmTotpSetup: (setupToken: string, code: string) => Promise<void>
  verifyTotpChallenge: (challengeToken: string, code: string) => Promise<void>
  signOut: () => Promise<void>
}
export const AuthenticationContext = createContext<AuthenticationContextValue | null>(null)
