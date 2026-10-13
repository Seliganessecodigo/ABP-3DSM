import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  eyebrow: 'Monitoraggio',
  title: 'Applicazioni',
  description: 'Catalogo delle applicazioni monitorate e del loro stato attuale.',
  refresh: 'Aggiorna catalogo',
  searchLabel: 'Cerca applicazioni per nome, identificativo o regione',
  searchPlaceholder: 'Cerca per nome, identificativo o regione...',
  filterLabel: 'Filtra le applicazioni per stato',
  loading: 'Caricamento delle applicazioni...',
  errorTitle: 'Impossibile consultare il catalogo',
  stale: 'Sono mostrati gli ultimi dati validi, che potrebbero non essere aggiornati.',
  errorNotRemoved: 'Questo non significa che le applicazioni siano state rimosse.',
  emptyTitle: 'Nessuna applicazione riconosciuta',
  empty: 'Il catalogo non contiene ancora applicazioni.',
  noResults: 'Nessuna applicazione corrisponde alla ricerca',
  adjustFilters: 'Controlla il termine o i filtri selezionati.',
  app: 'Applicazione',
  actions: 'Azioni',
  details: 'Visualizza dettagli',
  page: 'Pagina {{page}} di {{count}}',
  total_one: '{{count}} applicazione',
  total_other: '{{count}} applicazioni',
  previous: 'Precedente',
  next: 'Successiva',
  previousAria: 'Pagina precedente',
  nextAria: 'Pagina successiva',
  noneSelected: 'Nessuna applicazione selezionata',
  selectHint: 'Seleziona un’applicazione per consultarne dettagli, metriche e cronologia.',
  updated: 'Catalogo aggiornato',
  stateHint: 'Gli stati sono indicati con testo e indicatori visivi.',
} satisfies Widen<typeof ptBR>

export default messages
