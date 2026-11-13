/** Carry only analysis parameters understood by the destination, never table filters. */
export function analysisNavigationUrl(destination: '/dashboard' | '/history', location: Pick<Location, 'pathname' | 'search'>): string {
  const current = new URLSearchParams(location.search)
  const next = new URLSearchParams()
  const keys = destination === '/history' ? ['period', 'granularity', 'from', 'to', 'seriesTimeZone'] : ['period', 'granularity', 'from', 'to']
  for (const key of keys) {
    const value = current.get(key)
    if (value !== null) next.set(key, value)
  }
  if (destination === '/history') {
    const detail = /^\/services\/([^/]+)$/.exec(location.pathname)
    let applicationId = current.get('applicationId')
    if (detail) {
      try { applicationId = decodeURIComponent(detail[1]) } catch { applicationId = detail[1] }
    }
    if (applicationId) next.set('applicationId', applicationId)
  }
  return next.size ? `${destination}?${next}` : destination
}
