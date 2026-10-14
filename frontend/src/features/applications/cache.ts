import { parseApplication, type Application } from './api.ts'

export function readCachedCatalog(): Application[] | null {
  try {
    const cached: unknown = JSON.parse(window.sessionStorage.getItem('greener:applications') ?? 'null')
    return Array.isArray(cached) ? cached.map(parseApplication) : null
  } catch { return null }
}

export function cacheCatalog(applications: Application[]) {
  window.sessionStorage.setItem('greener:applications', JSON.stringify(applications))
}
