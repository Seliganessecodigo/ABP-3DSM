import type { Locale } from '../i18n/types.ts'

const timeZoneByLocale: Record<Locale, string> = {
  'pt-BR': 'America/Sao_Paulo',
  'en-US': 'Etc/GMT+0',
  'es-ES': 'Europe/Madrid',
  'fr-FR': 'Europe/Paris',
  'de-DE': 'Europe/Berlin',
  'it-IT': 'Europe/Rome',
  'ja-JP': 'Asia/Tokyo',
  'zh-CN': 'Asia/Shanghai',
  'ko-KR': 'Asia/Seoul',
  'ru-RU': 'Europe/Moscow',
  'hi-IN': 'Asia/Kolkata',
  'id-ID': 'Asia/Jakarta',
}

export function getTimeZoneForLocale(locale: string): string {
  return timeZoneByLocale[locale as Locale] ?? timeZoneByLocale['pt-BR']
}
