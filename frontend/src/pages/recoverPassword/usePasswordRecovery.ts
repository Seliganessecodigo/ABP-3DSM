import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { AuthenticationError, completePasswordRecovery, requestPasswordRecovery } from '../../features/authentication/api.ts'

function recoveryError(cause: unknown): string {
  if (cause instanceof AuthenticationError && cause.status === 401) return 'invalidLink'
  if (cause instanceof AuthenticationError && cause.status === 429) return 'rateLimited'
  return 'failed'
}

export function usePasswordRecovery() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '')
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState<'request' | 'reset' | null>(null)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useLayoutEffect(() => { window.history.replaceState({}, '', window.location.pathname + window.location.search) }, [])
  useEffect(() => () => request.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const password = String(fields.get('password') ?? '')
    if (token && password !== fields.get('confirmation')) { setError('passwordMismatch'); return }
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      if (token) await completePasswordRecovery({ token, password }, controller.signal)
      else await requestPasswordRecovery({ organization: String(fields.get('organization') ?? '').trim(), email: String(fields.get('email') ?? '').trim() }, controller.signal)
      if (!controller.signal.aborted) { form.reset(); setComplete(token ? 'reset' : 'request'); setToken('') }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(recoveryError(cause))
        if (token) form.reset()
      }
    } finally { if (!controller.signal.aborted) setPending(false) }
  }
  return { token, pending, complete, error, submit }
}
