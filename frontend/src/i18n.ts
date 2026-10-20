import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import commonTranslations from './i18n/common.ts'
import { supportedLocales, type Locale, type NamespaceResources } from './i18n/types.ts'

export { supportedLocales, type Locale } from './i18n/types.ts'
export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Portugu\u00eas (Brasil)', 'en-US': 'English (US)', 'es-ES': 'Espa\u00f1ol', 'fr-FR': 'Fran\u00e7ais',
  'de-DE': 'Deutsch', 'it-IT': 'Italiano', 'ja-JP': '\u65e5\u672c\u8a9e', 'zh-CN': '\u7b80\u4f53\u4e2d\u6587',
}

const pageNamespaces = import.meta.glob<NamespaceResources>('./pages/*/i18n.ts', { eager: true, import: 'default' })
const namespaces = {
  common: commonTranslations,
  ...Object.fromEntries(Object.entries(pageNamespaces).map(([path, translations]) => [path.split('/')[2], translations])),
}
const resources = Object.fromEntries(supportedLocales.map((locale) => [
  locale,
  Object.fromEntries(Object.entries(namespaces).map(([namespace, translations]) => [namespace, translations[locale]])),
]))

let storedLocale: string | null = null
try { storedLocale = localStorage.getItem('greener:locale') }
catch { /* Use the browser locale when storage is unavailable. */ }
const browserLocale = navigator.languages?.find((locale) => supportedLocales.includes(locale as Locale))
const initialLocale = supportedLocales.includes(storedLocale as Locale) ? storedLocale as Locale : browserLocale ?? 'pt-BR'
i18n.use(initReactI18next).init({ resources, lng: initialLocale, ns: Object.keys(namespaces), defaultNS: 'common', fallbackLng: 'en-US', supportedLngs: supportedLocales, keySeparator: false, interpolation: { escapeValue: false }, returnNull: false })
i18n.on('languageChanged', (locale) => {
  try { localStorage.setItem('greener:locale', locale) }
  catch { /* Language changes remain available for this session. */ }
  document.documentElement.lang = locale
})
document.documentElement.lang = initialLocale
export default i18n
