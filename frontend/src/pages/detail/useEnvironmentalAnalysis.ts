import { useEffect, useRef, useState } from 'react'
import type { AnalysisContributionsPage, AnalysisSeriesPoint, AnalysisSource, AnalysisSourceResult, AnalysisViewModel } from '../../features/analysis/source.ts'

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

type ContributionState = Readonly<{ context: string; bucketStart: string; loading: boolean; error: boolean; data: AnalysisContributionsPage | null }>
type ComparisonState = Readonly<{ key: string; points: readonly AnalysisSeriesPoint[] }>

function emptyState(key: string): State {
  return { key, status: 'loading', data: null, lastAttemptAt: null, lastSuccessAt: null, lastSuccessStatus: null }
}

function contextKey(applicationId: string, period: string, granularity: string | null) {
  return JSON.stringify([applicationId, period, granularity])
}

export function useEnvironmentalAnalysis(applicationId: string, period: string, granularity: string | null, source: AnalysisSource,
  enabled: boolean, refreshCycle: number, anchor: string) {
  const key = contextKey(applicationId, period, granularity)
  const [state, setState] = useState<State>(() => emptyState(key))
  const [attempt, setAttempt] = useState(0)
  const lastSuccessful = useRef<SuccessfulResult | null>(null)
  const [contributionState, setContributionState] = useState<ContributionState | null>(null)
  const [comparisonState, setComparisonState] = useState<ComparisonState | null>(null)
  const contributionController = useRef<AbortController | null>(null)
  const contributionContext = JSON.stringify([key, anchor])
  const current = state.key === key ? state : emptyState(key)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    contributionController.current?.abort()
    if (lastSuccessful.current?.key !== key) lastSuccessful.current = null
    if (!enabled) return () => { active = false; controller.abort() }
    const previous = lastSuccessful.current?.key === key ? lastSuccessful.current : null
    const lastAttemptAt = new Date().toISOString()
    setState({ key, status: previous ? 'refreshing' : 'loading', data: previous?.data ?? null,
      lastAttemptAt, lastSuccessAt: previous?.at ?? null, lastSuccessStatus: previous?.status ?? null })

    void source.load(applicationId, { period, anchor, ...(granularity === null ? {} : { granularity }) }, controller.signal).then((result: AnalysisSourceResult) => {
      if (!active || controller.signal.aborted) return
      const data = result.status === 'unavailable' ? null : result.data ?? null
      if (result.status === 'available' && data?.series.status === 'available' && source.loadComparisonSeries) {
        void source.loadComparisonSeries(applicationId, { period, anchor, ...(granularity === null ? {} : { granularity }) }, controller.signal)
          .then((points) => {
            if (active && !controller.signal.aborted) setComparisonState({ key, points })
          }).catch(() => undefined)
      }
      if (result.status === 'available') {
        const lastSuccessAt = new Date().toISOString()
        lastSuccessful.current = { key, status: 'available', data: result.data, at: lastSuccessAt }
        setState({ key, status: 'available', data: result.data, lastAttemptAt, lastSuccessAt, lastSuccessStatus: 'available' })
      } else if (result.status === 'empty') {
        const lastSuccessAt = new Date().toISOString()
        lastSuccessful.current = { key, status: 'empty', data: result.data ?? null, at: lastSuccessAt }
        setState({ key, status: 'empty', data: result.data ?? null, lastAttemptAt, lastSuccessAt, lastSuccessStatus: 'empty' })
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
      contributionController.current?.abort()
    }
  }, [applicationId, period, granularity, key, attempt, source, enabled, refreshCycle, anchor])

  const loadContributions = (bucketStart: string, page = 1, pageSize: number | 'all' = 10) => {
    if (!source.loadContributions) return
    contributionController.current?.abort()
    const controller = new AbortController()
    contributionController.current = controller
    const previous = contributionState?.context === contributionContext && contributionState.bucketStart === bucketStart ? contributionState.data : null
    setContributionState({ context: contributionContext, bucketStart, loading: true, error: false, data: previous })
    void source.loadContributions(applicationId, { period, anchor, ...(granularity === null ? {} : { granularity }) },
      bucketStart, page, pageSize, controller.signal).then((data) => {
      if (!controller.signal.aborted) setContributionState({ context: contributionContext, bucketStart, loading: false, error: false, data })
    }).catch(() => {
      if (!controller.signal.aborted) setContributionState({ context: contributionContext, bucketStart, loading: false, error: true, data: previous })
    })
  }

  return { ...current, comparisonPoints: comparisonState?.key === key ? comparisonState.points : [],
    contributions: contributionState?.context === contributionContext ? contributionState : null,
    ...(source.loadContributions ? { loadContributions } : {}), retry: () => setAttempt((value) => value + 1) }
}
