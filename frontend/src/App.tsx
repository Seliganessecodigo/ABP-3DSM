import { useRoute } from './app/useRoute.ts'
import { AppShell } from './components/AppShell.tsx'
import { CatalogPage } from './pages/catalog/CatalogPage.tsx'
import { ApplicationDetailPage } from './pages/detail/ApplicationDetailPage.tsx'
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
  return <AppShell navigate={navigate} variant={route.kind === 'detail' ? 'detail' : 'default'} login={login}>
    {route.kind === 'login'
      ? <LoginPage navigate={navigate} />
      : route.kind === 'sso-callback'
      ? <SsoCallbackPage navigate={navigate} />
      : route.kind === 'dashboard'
      ? <DashboardPage key="dashboard" navigate={navigate} />
      : route.kind === 'detail'
      ? <ApplicationDetailPage key={route.id} id={route.id} navigate={navigate} />
      : route.kind === 'methodology'
        ? <MethodologyPage key={route.id ?? 'index'} id={route.id} navigate={navigate} />
        : <CatalogPage key="catalog" navigate={navigate} />}
  </AppShell>
}

export default App
