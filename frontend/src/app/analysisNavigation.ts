/** Carry only analysis parameters understood by the destination, never table filters. */
export function analysisNavigationUrl(destination: '/dashboard' | '/history' | '/comparison' | '/regional-simulation', location: Pick<Location, 'pathname' | 'search'>): string {
  const current = new URLSearchParams(location.search)
  const next = new URLSearchParams()
  const keysByDestination = {
    '/history': ['period', 'granularity', 'from', 'to', 'seriesTimeZone'],
    '/dashboard': ['period', 'granularity', 'from', 'to'],
    '/comparison': ['period', 'granularity', 'from', 'to'],
    '/regional-simulation': ['period'],
  }
  const keys = keysByDestination[destination]
  for (const key of keys) {
    const value = current.get(key)
    if (value !== null) next.set(key, value)
  }
  // Ranking uses absolute dates; the other analysis pages require the custom-period marker.
  if ((location.pathname === '/ranking' || location.pathname === '/ranking/') && next.has('from') && next.has('to')) {
    next.set('period', 'custom')
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
