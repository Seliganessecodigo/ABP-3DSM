import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  eyebrow: 'Monitoring',
  title: 'Applications',
  description: 'Catalog of monitored applications and their current status.',
  refresh: 'Refresh catalog',
  searchLabel: 'Search applications by name, ID, or region',
  searchPlaceholder: 'Search by name, ID, or region...',
  filterLabel: 'Filter applications by status',
  loading: 'Loading applications...',
  errorTitle: 'Could not load the catalog',
  stale: 'Showing the latest valid data; it may be out of date.',
  errorNotRemoved: 'This does not mean the applications were removed.',
  emptyTitle: 'No applications found',
  empty: 'The catalog has no applications yet.',
  noResults: 'No applications match your search',
  adjustFilters: 'Review your search term or selected filters.',
  app: 'Application',
  actions: 'Actions',
  details: 'View details',
  page: 'Page {{page}} of {{count}}',
  total_one: '{{count}} application',
  total_other: '{{count}} applications',
  previous: 'Previous',
  next: 'Next',
  previousAria: 'Previous page',
  nextAria: 'Next page',
  noneSelected: 'No application selected',
  selectHint: 'Select an application to view its details, metrics, and history.',
  updated: 'Catalog updated',
  stateHint: 'Application statuses use text and visual indicators.',
} satisfies Widen<typeof ptBR>

export default messages
