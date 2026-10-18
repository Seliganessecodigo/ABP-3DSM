import { useEffect, useState } from 'react'
import { getApplication, getCollectionEvidence, getLatestCollectionEvidence, ApplicationRequestError, type Application, type CollectionEvidence } from '../../features/applications/api.ts'
import { APPLICATION_POLL_INTERVAL_MS } from '../../features/applications/polling.ts'

type DetailState = {
  id: string
  selectedCollectionId: string | null
  application: Application | null
  loading: boolean
  refreshing: boolean
  notFound: boolean
  error: boolean
  lastAttemptAt: string | null
  lastResponseAt: string | null
  collection: CollectionEvidence | null
  collectionLoading: boolean
  collectionNotFound: boolean
  collectionError: boolean
}

function emptyState(id: string, selectedCollectionId: string | null): DetailState {
  return { id, selectedCollectionId, application: null, loading: true, refreshing: false, notFound: false, error: false,
    lastAttemptAt: null, lastResponseAt: null, collection: null, collectionLoading: true, collectionNotFound: false, collectionError: false }
}

function stateForSelection(state: DetailState, id: string, selectedCollectionId: string | null): DetailState {
  if (state.id !== id) return emptyState(id, selectedCollectionId)
  if (state.selectedCollectionId === selectedCollectionId) return state
  return { ...state, selectedCollectionId, collection: null, collectionLoading: true,
    collectionNotFound: false, collectionError: false }
}

export function useApplicationDetail(id: string, selectedCollectionId: string | null) {
  const [state, setState] = useState(() => emptyState(id, selectedCollectionId))
  const current = stateForSelection(state, id, selectedCollectionId)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    let loadedHistorical = false
    const update = (change: (previous: DetailState) => DetailState) => {
      setState((previous) => change(stateForSelection(previous, id, selectedCollectionId)))
    }

    const load = async () => {
      controller = new AbortController()
      update((previous) => ({ ...previous, loading: previous.application === null, refreshing: true,
        collectionLoading: previous.collection === null || (selectedCollectionId !== null && previous.collection.id !== selectedCollectionId),
        lastAttemptAt: new Date().toISOString() }))
      try {
        const result = await getApplication(id, controller.signal)
        if (!active || controller.signal.aborted) return
        update((previous) => ({ ...previous, application: result, loading: false, notFound: false, error: false,
          lastResponseAt: new Date().toISOString() }))
        if (!selectedCollectionId || !loadedHistorical) {
          try {
            const evidence = selectedCollectionId
              ? await getCollectionEvidence(id, selectedCollectionId, controller.signal)
              : await getLatestCollectionEvidence(id, controller.signal)
            if (!active || controller.signal.aborted) return
            if (evidence.applicationId !== id) throw new Error('Evidência pertence a outra aplicação')
            update((previous) => ({ ...previous, collection: evidence, collectionLoading: false, collectionNotFound: false, collectionError: false }))
            if (selectedCollectionId) loadedHistorical = true
          } catch (evidenceError: unknown) {
            if (!active || controller.signal.aborted) return
            if (evidenceError instanceof ApplicationRequestError && evidenceError.status === 404) {
              update((previous) => ({ ...previous, collectionLoading: false, collectionNotFound: true, collectionError: false,
                collection: selectedCollectionId ? previous.collection : null }))
            } else update((previous) => ({ ...previous, collectionLoading: false, collectionError: true }))
            if (selectedCollectionId) loadedHistorical = true
          }
        }
      } catch (error_: unknown) {
        if (!active || controller.signal.aborted) return
        const status = error_ instanceof ApplicationRequestError ? error_.status : 0
        const code = error_ instanceof ApplicationRequestError ? error_.code : ''
        if (status === 404 || code === 'APPLICATION_NOT_FOUND') {
          update((previous) => ({ ...previous, loading: false, notFound: previous.application === null,
            error: previous.application !== null, collectionLoading: false,
            collectionError: previous.collection === null || previous.collectionError }))
        } else {
          update((previous) => ({ ...previous, loading: false, error: true, collectionLoading: false,
            collectionError: previous.collection === null || previous.collectionError }))
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
  }, [id, attempt, selectedCollectionId])
  const retry = () => {
    if (current.refreshing) return
    setAttempt((current) => current + 1)
  }
  return { ...current, pollingIntervalMs: APPLICATION_POLL_INTERVAL_MS, retry }
}
