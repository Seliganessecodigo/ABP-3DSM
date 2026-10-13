import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  back: 'Volver al catálogo',
  loading: 'Cargando aplicación...',
  notFound: 'Aplicación no encontrada',
  notFoundHint: 'Este identificador no está disponible en el catálogo.',
  error: 'No se pudo consultar esta aplicación',
  errorHint: 'La consulta falló. Inténtalo de nuevo.',
  eyebrow: 'Aplicación monitorizada',
  identity: 'Identificación y estado',
  id: 'Identificador',
  firstSeen: 'Primera observación',
  removedAt: 'Eliminada el',
  location: 'Ubicación',
  regionCode: 'Código regional',
  latitude: 'Latitud',
  longitude: 'Longitud',
} satisfies Widen<typeof ptBR>

export default messages
