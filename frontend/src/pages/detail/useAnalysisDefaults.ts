import { useEffect, useState } from 'react'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { getPreferences } from '../../features/preferences/api.ts'

export function useAnalysisDefaults() {
  const { user, authenticatedFetch } = useAuthentication()
  const userId = user?.id ?? null
  const [resolvedUser, setResolvedUser] = useState<string | null>(null)
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    const initial = new URL(window.location.href)
    if (initial.searchParams.has('period') && initial.searchParams.has('granularity')) return
    void getPreferences(authenticatedFetch, controller.signal).then((preferences) => {
      if (controller.signal.aborted || window.location.pathname !== initial.pathname) return
      const analysis = preferences.analysis?.draft
      if (!analysis) return
      const current = new URL(window.location.href)
      // Explicit URL filters, including choices made while loading, always take precedence.
      if (!current.searchParams.has('period')) current.searchParams.set('period', `${analysis.period}d`)
      if (!current.searchParams.has('granularity')) current.searchParams.set('granularity', analysis.granularity)
      window.history.replaceState({}, '', `${current.pathname}${current.search}`)
    }).catch(() => { /* Existing public defaults remain usable if personal preferences cannot be read. */ })
      .finally(() => { if (!controller.signal.aborted) setResolvedUser(userId) })
    return () => controller.abort()
  }, [userId, authenticatedFetch])
  const params = new URLSearchParams(window.location.search)
  return !userId || resolvedUser === userId || params.has('period') && params.has('granularity')
}
