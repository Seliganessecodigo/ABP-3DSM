import { useEffect, useState } from 'react'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { getPersonalAlerts, type PersonalAlerts } from './alerts.ts'
import { APPLICATION_POLL_INTERVAL_MS } from '../applications/polling.ts'

export type PersonalAlertsState = { data: PersonalAlerts | null; loading: boolean; error: boolean }
export function usePersonalAlerts(): PersonalAlertsState {
  const { user, authenticatedFetch } = useAuthentication()
  const userId = user?.id ?? null
  const [state, setState] = useState<PersonalAlertsState & { userId: string | null }>({ data: null, loading: !!userId, error: false, userId })
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    async function load() {
      try {
        const data = await getPersonalAlerts(authenticatedFetch, controller.signal)
        if (!controller.signal.aborted) setState({ data, loading: false, error: false, userId })
      } catch {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error: true, userId })
      } finally { if (!controller.signal.aborted) timer = setTimeout(() => { void load() }, APPLICATION_POLL_INTERVAL_MS) }
    }
    void load()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [userId, authenticatedFetch])
  if (!userId) return { data: null, loading: false, error: false }
  return state.userId === userId ? state : { data: null, loading: true, error: false }
}
