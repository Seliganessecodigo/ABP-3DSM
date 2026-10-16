import { getTimeZoneForLocale } from './timeZone.ts'

export function formatDate(value: string | null, locale: string, noObservation: string) {
  if (!value) return noObservation
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: getTimeZoneForLocale(locale), timeZoneName: 'short' }).format(new Date(value))
}
