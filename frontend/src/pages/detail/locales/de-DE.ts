import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  back: 'Zurück zum Verzeichnis',
  loading: 'Anwendung wird geladen...',
  notFound: 'Anwendung nicht gefunden',
  notFoundHint: 'Diese Kennung ist im Verzeichnis nicht verfügbar.',
  error: 'Anwendung konnte nicht geladen werden',
  errorHint: 'Die Anfrage ist fehlgeschlagen. Bitte erneut versuchen.',
  eyebrow: 'Überwachte Anwendung',
  identity: 'Identität und Status',
  id: 'Kennung',
  firstSeen: 'Zuerst erfasst',
  removedAt: 'Entfernt am',
  location: 'Standort',
  regionCode: 'Regionscode',
  latitude: 'Breitengrad',
  longitude: 'Längengrad',
} satisfies Widen<typeof ptBR>

export default messages
