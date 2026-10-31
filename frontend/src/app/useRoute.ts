import { useCallback, useEffect, useState } from 'react'

type Route = { kind: 'catalog' } | { kind: 'dashboard' } | { kind: 'history' } | { kind: 'detail'; id: string } | { kind: 'methodology'; id: string | null } | { kind: 'login' } | { kind: 'sso-callback' }
function routeFromLocation(): Route {
  if (window.location.pathname === '/sso/callback') return { kind: 'sso-callback' }
  if (window.location.pathname === '/login') return { kind: 'login' }
  if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard/') return { kind: 'dashboard' }
  if (window.location.pathname === '/history' || window.location.pathname === '/history/') return { kind: 'history' }
  if (window.location.pathname === '/methodology' || window.location.pathname === '/methodology/') return { kind: 'methodology', id: null }
  const methodology = /^\/services\/([^/]+)\/methodology$/.exec(window.location.pathname)
  if (methodology) {
    try { return { kind: 'methodology', id: decodeURIComponent(methodology[1]) } } catch { return { kind: 'methodology', id: methodology[1] } }
  }
  const match = /^\/services\/(.+)$/.exec(window.location.pathname)
  if (!match) return { kind: 'catalog' }
  try { return { kind: 'detail', id: decodeURIComponent(match[1]) } } catch { return { kind: 'detail', id: match[1] } }
}
export function useRoute() {
  const [route, setRoute] = useState<Route>(routeFromLocation)
  useEffect(() => {
    const handlePopState = () => setRoute(routeFromLocation())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const navigate = useCallback((url: string) => {
    window.history.pushState({}, '', url)
    setRoute(routeFromLocation())
  }, [])
  return { route, navigate }
}
