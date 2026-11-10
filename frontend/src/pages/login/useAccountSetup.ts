import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { acceptAdminInvitation, AuthenticationError, confirmAdminEmail } from '../../features/authentication/api.ts'

export type AccountSetupKind = 'invitation' | 'confirmation'

function errorKey(cause: unknown) {
  if (cause instanceof AuthenticationError) {
    if (cause.status === 401) return 'setupInvalidLink'
    if (cause.code === 'EMAIL_ALREADY_IN_USE') return 'setupEmailInUse'
    if (cause.code === 'PASSWORD_TOO_SHORT' || cause.code === 'PASSWORD_TOO_LONG') return 'setupPasswordLength'
    if (cause.status === 429) return 'setupRateLimited'
  }
  return 'setupFailed'
}

export function useAccountSetup(kind: AccountSetupKind) {
  const captured = useRef(false)
  const pending = useRef<AbortController | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'form' | 'pending' | 'complete'>('form')
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    const capture = () => {
      const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
      if (captured.current && !value) return
      captured.current = true
      window.history.replaceState({}, '', window.location.pathname)
      pending.current?.abort()
      pending.current = null
      queueMicrotask(() => { setToken(value); setError(''); setState('form') })
    }
    capture()
    window.addEventListener('hashchange', capture)
    return () => window.removeEventListener('hashchange', capture)
  }, [])
  useEffect(() => () => pending.current?.abort(), [])

  async function submit(form: HTMLFormElement) {
    if (!token || pending.current) return
    const data = new FormData(form)
    const password = String(data.get('password') ?? '')
    setError('')
    if (kind === 'confirmation' && password !== data.get('confirmation')) {
      setError('setupPasswordMismatch')
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setState('pending')
    try {
      if (kind === 'invitation') {
        await acceptAdminInvitation({ token, name: String(data.get('name') ?? '').trim(), email: String(data.get('email') ?? '').trim() }, controller.signal)
      } else {
        await confirmAdminEmail({ token, password }, controller.signal)
      }
      if (controller.signal.aborted) return
      form.reset()
      setToken('')
      setState('complete')
    } catch (cause) {
      if (controller.signal.aborted) return
      setError(errorKey(cause))
      setState('form')
    } finally {
      if (pending.current === controller) pending.current = null
      for (const name of ['password', 'confirmation']) {
        const field = form.elements.namedItem(name)
        if (field instanceof HTMLInputElement) field.value = ''
      }
    }
  }
  return { token, state, error, submit }
}
