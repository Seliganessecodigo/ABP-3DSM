import { useContext } from 'react'
import { AuthenticationContext } from './authentication-context.ts'

export function useAuthentication() {
  const context = useContext(AuthenticationContext)
  if (!context) throw new Error('useAuthentication requer AuthenticationProvider')
  return context
}
