import { useRoute } from './app/useRoute.ts'
import { AppShell } from './components/AppShell.tsx'
import { CatalogPage } from './pages/catalog/CatalogPage.tsx'
import { ApplicationDetailPage } from './pages/detail/ApplicationDetailPage.tsx'
import { HistoryPage } from './pages/history/HistoryPage.tsx'
import { MethodologyPage } from './pages/methodology/MethodologyPage.tsx'
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx'
import { LoginPage } from './pages/login/LoginPage.tsx'
import { SsoCallbackPage } from './pages/login/SsoCallbackPage.tsx'
import { AuthenticationProvider } from './app/AuthenticationProvider.tsx'

function App() {
  return <AuthenticationProvider><Application /></AuthenticationProvider>
}

function Application() {
  const { route, navigate } = useRoute()
  const login = route.kind === 'login' || route.kind === 'sso-callback'
  let variant: 'default' | 'detail' | 'methodology' = 'default'
  if (route.kind === 'detail' || route.kind === 'history') variant = 'detail'
  if (route.kind === 'methodology' && !route.id) variant = 'methodology'
  return <AppShell navigate={navigate} variant={variant} login={login}>
    <RoutedPage route={route} navigate={navigate} />
  </AppShell>
}

function RoutedPage({ route, navigate }: Readonly<ReturnType<typeof useRoute>>) {
  switch (route.kind) {
    case 'login': return <LoginPage navigate={navigate} />
    case 'sso-callback': return <SsoCallbackPage navigate={navigate} />
    case 'dashboard': return <DashboardPage key="dashboard" navigate={navigate} />
    case 'history': return <HistoryPage key="history" navigate={navigate} />
    case 'detail': return <ApplicationDetailPage key={route.id} id={route.id} navigate={navigate} />
    case 'methodology': return <MethodologyPage key={route.id ?? 'index'} id={route.id} navigate={navigate} />
    default: return <CatalogPage key="catalog" navigate={navigate} />
  }
}

export default App
