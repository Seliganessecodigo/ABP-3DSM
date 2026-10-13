import ptBR from './pt-BR.ts'
import type { Widen } from '../types.ts'

const messages = {
  'language.label': 'Idioma',
  account: 'Cuenta',
  'app.tagline': 'Energía más consciente',
  topbar: 'GreenER · Monitorización',
  'nav.main': 'Navegación principal',
  'nav.monitoring': 'Monitorización',
  'nav.dashboard': 'Panel',
  'nav.applications': 'Aplicaciones',
  'nav.history': 'Historial',
  'nav.analysis': 'Análisis',
  'nav.ranking': 'Clasificación',
  'nav.comparison': 'Comparación',
  'nav.regionalSimulation': 'Simulación regional',
  'nav.system': 'Sistema',
  'nav.methodology': 'Metodología',
  'nav.settings': 'Configuración',
  'nav.environment': 'Monitorización ambiental',
  'actions.retry': 'Reintentar',
  'location.country': 'País',
  'location.region': 'Región',
  'location.city': 'Ciudad',
  'state.label': 'Estado',
  'date.lastCheck': 'Última comprobación',
  'location.cityUnknown': 'No indicada',
  'location.unknown': 'Ubicación no indicada',
  'date.noObservation': 'Sin observación',
  'state.ALL': 'Todas',
  'state.AVAILABLE': 'Disponible',
  'state.UNAVAILABLE': 'No disponible',
  'state.NO_METRICS': 'Sin métricas',
  'state.REMOVED': 'Eliminada',
} satisfies Widen<typeof ptBR>

export default messages
