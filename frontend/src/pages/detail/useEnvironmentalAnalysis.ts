import { useEffect, useRef, useState } from 'react'
import type { AnalysisSource, AnalysisSourceResult, AnalysisViewModel } from '../../features/analysis/source.ts'

type State = Readonly<{
  key: string
  status: 'loading' | 'refreshing' | 'available' | 'empty' | 'unavailable' | 'error'
  data: AnalysisViewModel | null
  lastAttemptAt: string | null
  lastSuccessAt: string | null
  lastSuccessStatus: 'available' | 'empty' | null
}>

type SuccessfulResult = Readonly<{
  key: string
  status: 'available' | 'empty'
  data: AnalysisViewModel | null
  at: string
}>

function emptyState(key: string): State {
  return { key, status: 'loading', data: null, lastAttemptAt: null, lastSuccessAt: null, lastSuccessStatus: null }
}

function contextKey(applicationId: string, period: string, granularity: string | null) {
  return JSON.stringify([applicationId, period, granularity])
}

export function useEnvironmentalAnalysis(applicationId: string, period: string, granularity: string | null, source: AnalysisSource,
  enabled: boolean, refreshCycle: number) {
  const key = contextKey(applicationId, period, granularity)
  const [state, setState] = useState<State>(() => emptyState(key))
  const [attempt, setAttempt] = useState(0)
  const lastSuccessful = useRef<SuccessfulResult | null>(null)
  const current = state.key === key ? state : emptyState(key)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    if (lastSuccessful.current?.key !== key) lastSuccessful.current = null
    if (!enabled) return () => { active = false; controller.abort() }
    const previous = lastSuccessful.current?.key === key ? lastSuccessful.current : null
    const lastAttemptAt = new Date().toISOString()
    setState({ key, status: previous ? 'refreshing' : 'loading', data: previous?.data ?? null,
      lastAttemptAt, lastSuccessAt: previous?.at ?? null, lastSuccessStatus: previous?.status ?? null })

    void source.load(applicationId, { period, ...(granularity === null ? {} : { granularity }) }, controller.signal).then((result: AnalysisSourceResult) => {
      if (!active || controller.signal.aborted) return
      if (result.status === 'available') {
        const lastSuccessAt = new Date().toISOString()
        lastSuccessful.current = { key, status: 'available', data: result.data, at: lastSuccessAt }
        setState({ key, status: 'available', data: result.data, lastAttemptAt, lastSuccessAt, lastSuccessStatus: 'available' })
      } else if (result.status === 'empty') {
        const lastSuccessAt = new Date().toISOString()
        lastSuccessful.current = { key, status: 'empty', data: null, at: lastSuccessAt }
        setState({ key, status: 'empty', data: null, lastAttemptAt, lastSuccessAt, lastSuccessStatus: 'empty' })
      } else {
        setState({ key, status: 'unavailable', data: previous?.data ?? null, lastAttemptAt,
          lastSuccessAt: previous?.at ?? null, lastSuccessStatus: previous?.status ?? null })
      }
    }).catch(() => {
      if (!active || controller.signal.aborted) return
      setState({ key, status: 'error', data: previous?.data ?? null, lastAttemptAt,
        lastSuccessAt: previous?.at ?? null, lastSuccessStatus: previous?.status ?? null })
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [applicationId, period, granularity, key, attempt, source, enabled, refreshCycle])

  return { ...current, retry: () => setAttempt((value) => value + 1) }
}
