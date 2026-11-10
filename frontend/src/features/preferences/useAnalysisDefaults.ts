import { useEffect, useState } from 'react'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { getPreferences } from './api.ts'

export function useAnalysisDefaults(onApplied?: () => void) {
  const { user, authenticatedFetch } = useAuthentication()
  const userId = user?.id ?? null
  const [resolvedUser, setResolvedUser] = useState<string | null>(null)
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    const initial = new URL(window.location.href)
    if (initial.searchParams.has('period') && initial.searchParams.has('granularity')) return
    void getPreferences(authenticatedFetch, controller.signal).then(preferences => {
      if (controller.signal.aborted || window.location.pathname !== initial.pathname) return
      const analysis = preferences.analysis?.draft
      if (!analysis) return
      const current = new URL(window.location.href)
      if (!current.searchParams.has('period')) {
        const period = analysis.evaluationPeriod
        current.searchParams.set('period', period?.kind ?? `${analysis.period}d`)
        if (period?.kind === 'custom') {
          current.searchParams.set('from', period.from!)
          current.searchParams.set('to', period.to!)
        }
      }
      if (!current.searchParams.has('granularity')) current.searchParams.set('granularity', analysis.granularity)
      window.history.replaceState({}, '', `${current.pathname}${current.search}`)
      onApplied?.()
    }).catch(() => { /* Public analysis remains available when personal defaults cannot be read. */ })
      .finally(() => { if (!controller.signal.aborted) setResolvedUser(userId) })
    return () => controller.abort()
  }, [userId, authenticatedFetch, onApplied])
  const params = new URLSearchParams(window.location.search)
  return !userId || resolvedUser === userId || params.has('period') && params.has('granularity')
}
