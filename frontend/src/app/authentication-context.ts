import { createContext } from 'react'
import type { AuthenticatedUser, Credentials } from '../features/authentication/api.ts'

export interface AuthenticationContextValue {
  user: AuthenticatedUser | null
  signIn: (credentials: Credentials) => Promise<void>
  signOut: () => Promise<void>
}
export const AuthenticationContext = createContext<AuthenticationContextValue | null>(null)
