import { useEffect, useState } from 'react'
import { ApplicationRequestError, getApplication, getApplications, getCollectionEvidence, getLatestCollectionEvidence,
  type Application, type CollectionEvidence, type EnvironmentalEvidence } from '../../features/applications/api.ts'

type State = { id: string; application: Application | null; collection: CollectionEvidence | null; data: EnvironmentalEvidence | null;
  applications: Application[]; status: 'loading' | 'available' | 'not-calculable' | 'no-collection' | 'no-result' | 'unavailable' | 'not-found' | 'api-unavailable' | 'select-application' | 'catalog-empty' | 'error' }
const emptyState = (id: string): State => ({ id, application: null, collection: null, data: null, applications: [], status: 'loading' })
const detailState = (id: string, application: Application, collection: CollectionEvidence | null, data: EnvironmentalEvidence | null, status: State['status']): State =>
  ({ id, application, collection, data, applications: [], status })

export function useMethodology(id: string | null) {
  const selectedCollectionId = new URLSearchParams(window.location.search).get('collectionId')
  const [state, setState] = useState(() => emptyState(id ?? ''))
  const [attempt, setAttempt] = useState(0)
  const current = state.id === (id ?? '') ? state : emptyState(id ?? '')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const load = async () => {
      if (!id) {
        try {
          const applications = await getApplications(controller.signal)
          if (active) setState({ ...emptyState(''), applications, status: applications.length ? 'select-application' : 'catalog-empty' })
        } catch {
          if (active && !controller.signal.aborted) setState({ ...emptyState(''), status: 'error' })
        }
        return
      }
      setState({ ...emptyState(id), status: 'loading' })
      let application: Application
      try {
        application = await getApplication(id, controller.signal)
      } catch (error: unknown) {
        if (!active || controller.signal.aborted) return
        setState({ ...emptyState(id), status: error instanceof ApplicationRequestError && error.status === 404 && error.code === 'APPLICATION_NOT_FOUND' ? 'not-found' : 'error' })
        return
      }
      if (!active) return
      let collection: CollectionEvidence
      try {
        collection = selectedCollectionId
          ? await getCollectionEvidence(id, selectedCollectionId, controller.signal)
          : await getLatestCollectionEvidence(id, controller.signal)
      } catch (error: unknown) {
        if (!active || controller.signal.aborted) return
        setState(detailState(id, application, null, null,
          error instanceof ApplicationRequestError && error.status === 404 && error.code === 'COLLECTION_NOT_FOUND' ? 'no-collection' : 'error'))
        return
      }
      if (!active) return
      if (collection.applicationId !== id) {
        setState(detailState(id, application, collection, null, 'error'))
        return
      }
      setState(detailState(id, application, collection, null, 'loading'))
      try {
        const data = collection.environmental
        setState(detailState(id, application, collection, data, data.status === 'absent' ? 'unavailable'
          : data.energy?.valueKwh === null || !data.energy ? 'not-calculable' : 'available'))
      } catch {
        if (!active || controller.signal.aborted) return
        setState(detailState(id, application, collection, null, 'error'))
      }
    }
    void load()
    return () => { active = false; controller.abort() }
  }, [id, selectedCollectionId, attempt])

  return { ...current, retry: () => setAttempt((value) => value + 1) }
}
