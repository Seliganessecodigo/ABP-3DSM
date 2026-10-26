import { useCallback, useEffect, useRef, useState } from 'react'
import { getApplications, type Application } from '../../features/applications/api.ts'
import { getEnvironmentalSummary, type EnvironmentalSummary, type EnvironmentalSummaryFilters } from '../../features/analysis/environmentalSummary.ts'
import { APPLICATION_POLL_INTERVAL_MS } from '../../features/applications/polling.ts'

type SummaryStatus = 'loading' | 'refreshing' | 'available' | 'empty' | 'error' | 'invalid-period'
type SummaryState = Readonly<{
  key: string
  status: SummaryStatus
  data: EnvironmentalSummary | null
  lastAttemptAt: string | null
}>
type SuccessfulSummary = Readonly<{ key: string; data: EnvironmentalSummary }>
type ApplicationsState = Readonly<{ items: readonly Application[]; loading: boolean; error: boolean }>

function currentAnchor(): string {
  return new Date().toISOString()
}

export function useDashboard(filters: Omit<EnvironmentalSummaryFilters, 'anchor'> | null) {
  const period = filters?.period ?? null
  const state = filters?.state ?? null
  const regionCode = filters?.regionCode ?? ''
  const [anchor, setAnchor] = useState(currentAnchor)
  const key = period === null ? 'invalid-period' : JSON.stringify([period, state, regionCode])
  const [summary, setSummary] = useState<SummaryState>({
    key, status: filters === null ? 'invalid-period' : 'loading', data: null, lastAttemptAt: null,
  })
  const [applications, setApplications] = useState<ApplicationsState>({ items: [], loading: true, error: false })
  const [attempt, setAttempt] = useState(0)
  const successful = useRef<SuccessfulSummary | null>(null)
  const current = summary.key === key ? summary : {
    key, status: filters === null ? 'invalid-period' as const : 'loading' as const, data: null, lastAttemptAt: null,
  }

  useEffect(() => {
    if (period === null) return
    const controller = new AbortController()
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const previous = successful.current?.key === key ? successful.current : null
    const lastAttemptAt = new Date().toISOString()
    const requestFilters: EnvironmentalSummaryFilters = { period, anchor, state, regionCode }
    setSummary({ key, status: previous ? 'refreshing' : 'loading', data: previous?.data ?? null, lastAttemptAt })
    setApplications((state) => ({ ...state, loading: state.items.length === 0, error: false }))

    const summaryRequest = getEnvironmentalSummary(requestFilters, controller.signal).then((data) => {
      if (!active || controller.signal.aborted) return
      successful.current = { key, data }
      setSummary({ key, status: data.status, data, lastAttemptAt })
    }).catch(() => {
      if (!active || controller.signal.aborted) return
      setSummary({ key, status: 'error', data: previous?.data ?? null, lastAttemptAt })
    })
    const applicationsRequest = getApplications(controller.signal).then((items) => {
      if (active && !controller.signal.aborted) setApplications({ items, loading: false, error: false })
    }).catch(() => {
      if (active && !controller.signal.aborted) {
        setApplications((state) => ({ ...state, loading: false, error: true }))
      }
    })

    void Promise.all([summaryRequest, applicationsRequest]).finally(() => {
      if (active && !controller.signal.aborted) {
        timer = setTimeout(() => {
          setAnchor(currentAnchor())
          setAttempt((value) => value + 1)
        }, APPLICATION_POLL_INTERVAL_MS)
      }
    })
    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
      controller.abort()
    }
  }, [anchor, attempt, key, period, regionCode, state])

  const refresh = useCallback(() => {
    setAnchor(currentAnchor())
    setAttempt((value) => value + 1)
  }, [])
  return { ...current, applications, refresh, retry: refresh }
}
