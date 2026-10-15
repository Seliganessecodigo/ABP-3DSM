import { useEffect, useState } from 'react'
import { getApplication, ApplicationRequestError, type Application } from '../../features/applications/api.ts'
import { APPLICATION_POLL_INTERVAL_MS } from '../../features/applications/polling.ts'

type DetailState = {
  id: string
  application: Application | null
  loading: boolean
  refreshing: boolean
  notFound: boolean
  error: boolean
  lastAttemptAt: string | null
  lastResponseAt: string | null
}

function emptyState(id: string): DetailState {
  return { id, application: null, loading: true, refreshing: false, notFound: false, error: false,
    lastAttemptAt: null, lastResponseAt: null }
}

export function useApplicationDetail(id: string) {
  const [state, setState] = useState(() => emptyState(id))
  const current = state.id === id ? state : emptyState(id)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    const update = (change: (previous: DetailState) => DetailState) => {
      setState((previous) => change(previous.id === id ? previous : emptyState(id)))
    }

    const load = async () => {
      controller = new AbortController()
      update((previous) => ({ ...previous, loading: previous.application === null, refreshing: true,
        lastAttemptAt: new Date().toISOString() }))
      try {
        const result = await getApplication(id, controller.signal)
        if (!active || controller.signal.aborted) return
        update((previous) => ({ ...previous, application: result, loading: false, notFound: false, error: false,
          lastResponseAt: new Date().toISOString() }))
      } catch (error_: unknown) {
        if (!active || controller.signal.aborted) return
        const status = error_ instanceof ApplicationRequestError ? error_.status : 0
        const code = error_ instanceof ApplicationRequestError ? error_.code : ''
        if (status === 404 || code === 'APPLICATION_NOT_FOUND') {
          update((previous) => ({ ...previous, loading: false, notFound: previous.application === null,
            error: previous.application !== null }))
        } else {
          update((previous) => ({ ...previous, loading: false, error: true }))
        }
      } finally {
        if (active && !controller.signal.aborted) {
          update((previous) => ({ ...previous, refreshing: false }))
          timer = setTimeout(() => { void load() }, APPLICATION_POLL_INTERVAL_MS)
        }
      }
    }

    void load()
    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
      controller?.abort()
    }
  }, [id, attempt])
  const retry = () => {
    if (current.refreshing) return
    setAttempt((current) => current + 1)
  }
  return { ...current, pollingIntervalMs: APPLICATION_POLL_INTERVAL_MS, retry }
}
