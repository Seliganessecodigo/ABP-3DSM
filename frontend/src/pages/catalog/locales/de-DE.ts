import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  eyebrow: 'Überwachung',
  title: 'Anwendungen',
  description: 'Verzeichnis der überwachten Anwendungen und ihres aktuellen Status.',
  refresh: 'Verzeichnis aktualisieren',
  searchLabel: 'Anwendungen nach Name, Kennung oder Region suchen',
  searchPlaceholder: 'Nach Name, Kennung oder Region suchen...',
  filterLabel: 'Anwendungen nach Status filtern',
  loading: 'Anwendungen werden geladen...',
  errorTitle: 'Verzeichnis konnte nicht geladen werden',
  stale: 'Die letzten gültigen Daten werden angezeigt. Sie sind möglicherweise veraltet.',
  errorNotRemoved: 'Das bedeutet nicht, dass Anwendungen entfernt wurden.',
  emptyTitle: 'Keine Anwendungen gefunden',
  empty: 'Das Verzeichnis enthält noch keine Anwendungen.',
  noResults: 'Keine Anwendung entspricht der Suche',
  adjustFilters: 'Suchbegriff oder Filter überprüfen.',
  app: 'Anwendung',
  actions: 'Aktionen',
  details: 'Details anzeigen',
  page: 'Seite {{page}} von {{count}}',
  total_one: '{{count}} Anwendung',
  total_other: '{{count}} Anwendungen',
  previous: 'Zurück',
  next: 'Weiter',
  previousAria: 'Vorherige Seite',
  nextAria: 'Nächste Seite',
  noneSelected: 'Keine Anwendung ausgewählt',
  selectHint: 'Anwendung auswählen, um Details, Metriken und Verlauf anzuzeigen.',
  updated: 'Verzeichnis aktualisiert',
  stateHint: 'Anwendungsstatus werden mit Text und visuellen Hinweisen dargestellt.',
} satisfies Widen<typeof ptBR>

export default messages
