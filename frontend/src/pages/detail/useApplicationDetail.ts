import { useEffect, useState } from 'react'
import { getApplication, ApplicationRequestError, type Application } from '../../features/applications/api.ts'

export function useApplicationDetail(id: string) {
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    getApplication(id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setApplication(result)
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return
      const status = failure instanceof ApplicationRequestError ? failure.status : 0
      const code = failure instanceof ApplicationRequestError ? failure.code : ''
      if (status === 404 || code === 'APPLICATION_NOT_FOUND') setNotFound(true)
      else setError(true)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id, attempt])
  const retry = () => {
    setLoading(true)
    setError(false)
    setAttempt((current) => current + 1)
  }
  return { application, loading, notFound, error, retry }
}
