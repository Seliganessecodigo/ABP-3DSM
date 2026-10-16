import { useEffect, useState } from 'react'
import { getApplications, type Application } from '../../features/applications/api.ts'
import { readCachedCatalog, cacheCatalog } from '../../features/applications/cache.ts'
import { APPLICATION_POLL_INTERVAL_MS } from '../../features/applications/polling.ts'

export function useCatalog() {
  const [snapshot] = useState(readCachedCatalog)
  const [applications, setApplications] = useState<Application[]>(snapshot ?? [])
  const [hasSnapshot, setHasSnapshot] = useState(snapshot !== null)
  const [loading, setLoading] = useState(snapshot === null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [lastAttemptAt, setLastAttemptAt] = useState<string | null>(null)
  const [lastResponseAt, setLastResponseAt] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const load = async () => {
      controller = new AbortController()
      setRefreshing(true)
      setLastAttemptAt(new Date().toISOString())
      try {
        const parsed = await getApplications(controller.signal)
        if (!active || controller.signal.aborted) return
        cacheCatalog(parsed)
        setApplications(parsed)
        setHasSnapshot(true)
        setError(false)
        setLastResponseAt(new Date().toISOString())
      } catch {
        if (active && !controller.signal.aborted) setError(true)
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false)
          setRefreshing(false)
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
  }, [attempt])
  const retry = () => {
    if (refreshing) return
    setLoading(!hasSnapshot)
    setAttempt((current) => current + 1)
  }
  const refresh = () => {
    if (refreshing) return
    setLoading(false)
    setAttempt((current) => current + 1)
  }
  return { applications, hasSnapshot, loading, refreshing, error, lastAttemptAt, lastResponseAt,
    pollingIntervalMs: APPLICATION_POLL_INTERVAL_MS, refresh, retry }
}
