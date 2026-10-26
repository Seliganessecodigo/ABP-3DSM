import { useRoute } from './app/useRoute.ts'
import { AppShell } from './components/AppShell.tsx'
import { CatalogPage } from './pages/catalog/CatalogPage.tsx'
import { ApplicationDetailPage } from './pages/detail/ApplicationDetailPage.tsx'
import { LoginPage } from './pages/login/LoginPage.tsx'
import { AuthenticationProvider } from './app/AuthenticationProvider.tsx'
import { SsoCallbackPage } from './pages/login/SsoCallbackPage.tsx'

function App() {
  return <AuthenticationProvider><Application /></AuthenticationProvider>
}

function Application() {
  const { route, navigate } = useRoute()
  return <AppShell navigate={navigate} detail={route.kind === 'detail'} login={route.kind === 'login' || route.kind === 'sso-callback'}>
    {route.kind === 'login'
      ? <LoginPage navigate={navigate} />
      : route.kind === 'sso-callback'
      ? <SsoCallbackPage navigate={navigate} />
      : route.kind === 'detail'
      ? <ApplicationDetailPage key={route.id} id={route.id} navigate={navigate} />
      : <CatalogPage key="catalog" navigate={navigate} />}
  </AppShell>
}

export default App
