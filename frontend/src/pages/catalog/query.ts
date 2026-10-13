import type { ApplicationState as State } from '../../features/applications/catalog.ts'

export const states: Array<{ value: State | 'ALL' }> = [
  { value: 'ALL' }, { value: 'AVAILABLE' }, { value: 'UNAVAILABLE' }, { value: 'NO_METRICS' }, { value: 'REMOVED' },
]
export function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const state = params.get('state') as State | null
  return {
    search: params.get('q') ?? '',
    state: states.some((option) => option.value === state) ? state as State : 'ALL' as const,
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}
export function makeUrl(query: { search: string; state: State | 'ALL'; page: number }) {
  const params = new URLSearchParams(window.location.search)
  for (const key of ['q', 'state', 'page']) params.delete(key)
  if (query.search) params.set('q', query.search)
  if (query.state !== 'ALL') params.set('state', query.state)
  if (query.page > 1) params.set('page', String(query.page))
  const queryString = params.toString()
  return `/${queryString ? `?${queryString}` : ''}`
}
