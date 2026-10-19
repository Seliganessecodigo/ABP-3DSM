import { useRoute } from './app/useRoute.ts'
import { AppShell } from './components/AppShell.tsx'
import { CatalogPage } from './pages/catalog/CatalogPage.tsx'
import { ApplicationDetailPage } from './pages/detail/ApplicationDetailPage.tsx'

function App() {
  const { route, navigate } = useRoute()
  return <AppShell navigate={navigate} variant={route.kind === 'detail' ? 'detail' : 'default'}>
    {route.kind === 'detail'
      ? <ApplicationDetailPage key={route.id} id={route.id} navigate={navigate} />
      : <CatalogPage key="catalog" navigate={navigate} />}
  </AppShell>
}

export default App
