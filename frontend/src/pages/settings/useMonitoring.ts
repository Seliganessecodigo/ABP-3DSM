import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { getMonitoringHealth, setMonitoringPaused, MonitoringError, type MonitoringHealth } from '../../features/monitoring/api.ts'
import { AuthenticationError } from '../../features/authentication/api.ts'

export function monitoringError(error: unknown): 'sessionExpired' | 'denied' | 'loadFailed' {
  if (error instanceof MonitoringError || error instanceof AuthenticationError) {
    if (error.status === 401) return 'sessionExpired'
    if (error.status === 403) return 'denied'
  }
  return 'loadFailed'
}
export function useMonitoring() {
  const { authenticatedFetch, user } = useAuthentication()
  const [health, setHealth] = useState<MonitoringHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const operation = useRef<AbortController | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getMonitoringHealth(authenticatedFetch, controller.signal).then(result => {
      if (!controller.signal.aborted) setHealth(result)
    }).catch(e => { if (!controller.signal.aborted) { const key = monitoringError(e); if (key !== 'loadFailed') setHealth(null); setError(key) } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [authenticatedFetch, user?.id, revision])
  useEffect(() => () => operation.current?.abort(), [])
  const reload = useCallback(() => { setLoading(true); setError(''); setRevision(v => v + 1) }, [])
  async function changePaused(paused: boolean, reason: string): Promise<boolean> {
    if (operation.current) return false
    const controller = new AbortController()
    operation.current = controller
    setSaving(true); setSaveError('')
    try {
      await setMonitoringPaused(authenticatedFetch, paused, reason, controller.signal)
      if (controller.signal.aborted) return false
      setHealth(null)
      reload()
      return true
    } catch (e) { if (!controller.signal.aborted) { setSaveError(monitoringError(e)); reload() } return false }
    finally { if (operation.current === controller) { operation.current = null; if (!controller.signal.aborted) setSaving(false) } }
  }
  return { health, loading, error, reload, saving, saveError, changePaused }
}
