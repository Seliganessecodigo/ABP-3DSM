import { getTimeZoneForLocale } from './timeZone.ts'

export function formatIntervalBoundary(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone }).format(new Date(value))
}

export function formatDateRangeBoundary(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone }).format(new Date(value))
}

export function formatDate(value: string | null, locale: string, noObservation: string, timeZone?: string) {
  if (!value) return noObservation
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: timeZone ?? getTimeZoneForLocale(locale), timeZoneName: 'short' }).format(new Date(value))
}
