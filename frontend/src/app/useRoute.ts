import { useCallback, useEffect, useState } from 'react'

type Route = { kind: 'catalog' } | { kind: 'detail'; id: string } | { kind: 'login' }
function routeFromLocation(): Route {
  if (window.location.pathname === '/login') return { kind: 'login' }
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
