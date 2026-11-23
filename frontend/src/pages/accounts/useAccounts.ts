import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthenticationError } from '../../features/authentication/api.ts'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { AccountError, getAccounts, inviteWithGoogle, type AccountPage, type GoogleInvitation } from '../../features/authentication/accounts.ts'

function errorKey(error: unknown) {
  if (error instanceof AccountError || error instanceof AuthenticationError) {
    if (error.status === 401) return 'sessionExpired'
    if (error.status === 403) return 'denied'
    if (error.status === 409) return 'unavailableAccount'
    if (error.status === 400) return 'invalidInvitation'
    if (error.status === 429) return 'rateLimited'
  }
  return 'inviteFailed'
}
export function useAccounts(navigate: (url: string) => void) {
  const { user, authenticatedFetch } = useAuthentication()
  const params = new URLSearchParams(window.location.search)
  const query = new URLSearchParams()
  for (const key of ['search', 'name', 'email', 'role', 'status', 'page', 'pageSize', 'sortBy', 'sortDirection']) {
    const value = params.get(`users.${key}`)
    if (value) query.set(key, value)
  }
  if (!/^[1-9]\d*$/.test(query.get('page') ?? '') || !Number.isSafeInteger(Number(query.get('page')))) query.set('page', '1')
  if (!['5', '10', '15', '20', 'all'].includes(query.get('pageSize') ?? '')) query.set('pageSize', '10')
  if (query.get('pageSize') === 'all') query.set('page', '1')
  if (!['name', 'email', 'role', 'status'].includes(query.get('sortBy') ?? '')) query.set('sortBy', 'name')
  if (!['asc', 'desc'].includes(query.get('sortDirection') ?? '')) query.set('sortDirection', 'asc')
  const page = Number(query.get('page'))
  const queryString = query.toString()
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<AccountPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inviteState, setInviteState] = useState<'idle' | 'pending' | 'sent'>('idle')
  const [inviteError, setInviteError] = useState('')
  const invitation = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getAccounts(authenticatedFetch, new URLSearchParams(queryString), controller.signal).then(response => {
      if (!controller.signal.aborted) setResult(response)
    }).catch(error => {
      if (controller.signal.aborted) return
      if ((error instanceof AccountError || error instanceof AuthenticationError) && (error.status === 401 || error.status === 403)) setResult(null)
      setLoadError((error instanceof AccountError || error instanceof AuthenticationError) && (error.status === 401 || error.status === 403) ? errorKey(error) : 'loadFailed')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticatedFetch, user?.id, queryString, revision])
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
  function updateQuery(key: string, value: string, extra: Record<string, string> = {}) {
    for (const [name, text] of Object.entries(extra)) params.set(`users.${name}`, text)
    if (value) params.set(`users.${key}`, value); else params.delete(`users.${key}`)
    if (key !== 'page') params.set('users.page', '1')
    startLoading(); setResult(null)
    navigate(`/settings?${params}`)
  }
  function clearFilters() {
    for (const key of ['search', 'name', 'email', 'role', 'status']) params.delete(`users.${key}`)
    params.set('users.page', '1'); startLoading(); setResult(null); navigate(`/settings?${params}`)
  }
  function changePage(offset: number) { updateQuery('page', String(page + offset)) }
  function reload() { startLoading(); setRevision(value => value + 1) }
  return { user, query, updateQuery, clearFilters, page, changePage, result, loading, loadError, reload, inviteState, inviteError, sendInvitation }
}
