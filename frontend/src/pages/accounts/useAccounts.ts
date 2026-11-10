import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { AccountError, getAccounts, inviteWithGoogle, type AccountPage, type GoogleInvitation } from '../../features/authentication/accounts.ts'

function errorKey(error: unknown) {
  if (error instanceof AccountError) {
    if (error.status === 401) return 'sessionExpired'
    if (error.status === 403) return 'denied'
    if (error.status === 409) return 'unavailableAccount'
    if (error.status === 400) return 'invalidInvitation'
    if (error.status === 429) return 'rateLimited'
  }
  return 'inviteFailed'
}
export function useAccounts() {
  const { user, authenticatedFetch } = useAuthentication()
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<AccountPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inviteState, setInviteState] = useState<'idle' | 'pending' | 'sent'>('idle')
  const [inviteError, setInviteError] = useState('')
  const invitation = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getAccounts(authenticatedFetch, page, controller.signal).then(response => {
      if (!controller.signal.aborted) setResult(response)
    }).catch(error => {
      if (controller.signal.aborted) return
      setResult(null)
      setLoadError(error instanceof AccountError && (error.status === 401 || error.status === 403) ? errorKey(error) : 'loadFailed')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticatedFetch, user?.id, page, revision])
  useEffect(() => () => { invitation.current?.abort() }, [])
  const sendInvitation = useCallback(async (input: GoogleInvitation): Promise<boolean> => {
    if (invitation.current) return false
    const controller = new AbortController()
    invitation.current = controller
    setInviteState('pending')
    setInviteError('')
    try {
      await inviteWithGoogle(authenticatedFetch, input, controller.signal)
      if (controller.signal.aborted) return false
      setInviteState('sent')
      return true
    } catch (error) {
      if (!controller.signal.aborted) { setInviteError(errorKey(error)); setInviteState('idle') }
      return false
    } finally { if (invitation.current === controller) invitation.current = null }
  }, [authenticatedFetch])
  function startLoading() { setLoading(true); setLoadError('') }
  function changePage(offset: number) { startLoading(); setPage(value => value + offset) }
  function reload() { startLoading(); setRevision(value => value + 1) }
  return { user, page, changePage, result, loading, loadError, reload, inviteState, inviteError, sendInvitation }
}
