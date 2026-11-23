import { useCallback, useEffect, useState } from 'react'

type Route = { kind: 'recover-password' } | { kind: 'catalog' } | { kind: 'dashboard' } | { kind: 'ranking' } | { kind: 'comparison' } | { kind: 'history' } | { kind: 'regional-simulation' } | { kind: 'detail'; id: string } | { kind: 'methodology'; id: string | null } | { kind: 'administration' } | { kind: 'settings' } | { kind: 'login' } | { kind: 'sso-callback' } | { kind: 'setup-admin' } | { kind: 'confirm-email' }
const staticRoutes: Partial<Record<string, Route>> = {
  '/recover-password': { kind: 'recover-password' },
  '/settings': { kind: 'settings' }, '/settings/': { kind: 'settings' },
  '/': { kind: 'dashboard' },
  '/applications': { kind: 'catalog' }, '/applications/': { kind: 'catalog' },
  '/setup-admin': { kind: 'setup-admin' }, '/confirm-email': { kind: 'confirm-email' },
  '/sso/callback': { kind: 'sso-callback' }, '/login': { kind: 'login' },
  '/dashboard': { kind: 'dashboard' }, '/dashboard/': { kind: 'dashboard' },
  '/ranking': { kind: 'ranking' }, '/ranking/': { kind: 'ranking' },
  '/comparison': { kind: 'comparison' }, '/comparison/': { kind: 'comparison' },
  '/history': { kind: 'history' }, '/history/': { kind: 'history' },
  '/regional-simulation': { kind: 'regional-simulation' }, '/regional-simulation/': { kind: 'regional-simulation' },
  '/methodology': { kind: 'methodology', id: null }, '/methodology/': { kind: 'methodology', id: null },
  '/administration/calculations': { kind: 'administration' }, '/administration/calculations/': { kind: 'administration' },
}
function routeFromLocation(): Route {
  if (window.location.pathname === '/administration/users' || window.location.pathname === '/administration/users/') {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', 'users')
    window.history.replaceState({}, '', `/settings?${params}`)
    return { kind: 'settings' }
  }
  const direct = staticRoutes[window.location.pathname]
  // A referência nova mantém a atualização da tela quando só a query muda.
  if (direct) return { ...direct }
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
