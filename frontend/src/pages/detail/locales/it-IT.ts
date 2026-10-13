import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  back: 'Torna al catalogo',
  loading: 'Caricamento dell’applicazione...',
  notFound: 'Applicazione non trovata',
  notFoundHint: 'Questo identificativo non è disponibile nel catalogo.',
  error: 'Impossibile consultare questa applicazione',
  errorHint: 'La richiesta non è riuscita. Riprova.',
  eyebrow: 'Applicazione monitorata',
  identity: 'Identificazione e stato',
  id: 'Identificativo',
  firstSeen: 'Prima osservazione',
  removedAt: 'Rimossa il',
  location: 'Posizione',
  regionCode: 'Codice regionale',
  latitude: 'Latitudine',
  longitude: 'Longitudine',
} satisfies Widen<typeof ptBR>

export default messages
