import { useEffect, useState } from 'react'
import { getApplications, type Application } from '../../features/applications/api.ts'
import { readCachedCatalog, cacheCatalog } from '../../features/applications/cache.ts'

export function useCatalog() {
  const [snapshot] = useState(readCachedCatalog)
  const [applications, setApplications] = useState<Application[]>(snapshot ?? [])
  const [hasSnapshot, setHasSnapshot] = useState(snapshot !== null)
  const [loading, setLoading] = useState(snapshot === null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    getApplications(controller.signal).then((parsed) => {
      if (controller.signal.aborted) return
      cacheCatalog(parsed)
      setApplications(parsed); setHasSnapshot(true); setError(false)
    }).catch(() => {
      if (!controller.signal.aborted) setError(true)
    }).finally(() => {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false) }
    })
    return () => controller.abort()
  }, [attempt])
  const retry = () => {
    setLoading(!hasSnapshot)
    setRefreshing(hasSnapshot)
    setError(false)
    setAttempt((current) => current + 1)
  }
  const refresh = () => {
    if (refreshing) return
    setLoading(false)
    setRefreshing(true)
    setError(false)
    setAttempt((current) => current + 1)
  }
  return { applications, hasSnapshot, loading, refreshing, error, refresh, retry }
}
