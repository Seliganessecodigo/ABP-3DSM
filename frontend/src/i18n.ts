import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { LocaleResource } from './i18n/types.ts'
import ptBR from './i18n/locales/pt-BR.ts'
import enUS from './i18n/locales/en-US.ts'
import esES from './i18n/locales/es-ES.ts'
import frFR from './i18n/locales/fr-FR.ts'
import deDE from './i18n/locales/de-DE.ts'
import itIT from './i18n/locales/it-IT.ts'
import jaJP from './i18n/locales/ja-JP.ts'
import zhCN from './i18n/locales/zh-CN.ts'

export const supportedLocales = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'] as const
export type Locale = (typeof supportedLocales)[number]
export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Portugu\u00eas (Brasil)', 'en-US': 'English (US)', 'es-ES': 'Espa\u00f1ol', 'fr-FR': 'Fran\u00e7ais',
  'de-DE': 'Deutsch', 'it-IT': 'Italiano', 'ja-JP': '\u65e5\u672c\u8a9e', 'zh-CN': '\u7b80\u4f53\u4e2d\u6587',
}

const translations: Record<Locale, LocaleResource> = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': esES, 'fr-FR': frFR, 'de-DE': deDE, 'it-IT': itIT, 'ja-JP': jaJP, 'zh-CN': zhCN }
export const resources = Object.fromEntries(supportedLocales.map((locale) => [locale, translations[locale]])) as Record<Locale, LocaleResource>

const storedLocale = localStorage.getItem('greener:locale')
const browserLocale = navigator.languages?.find((locale) => supportedLocales.includes(locale as Locale))
const initialLocale = supportedLocales.includes(storedLocale as Locale) ? storedLocale as Locale : browserLocale ?? 'pt-BR'
i18n.use(initReactI18next).init({ resources, lng: initialLocale, ns: ['common', 'catalog', 'detail'], defaultNS: 'common', fallbackLng: 'en-US', supportedLngs: supportedLocales, keySeparator: false, interpolation: { escapeValue: false }, returnNull: false })
i18n.on('languageChanged', (locale) => { localStorage.setItem('greener:locale', locale); document.documentElement.lang = locale })
document.documentElement.lang = initialLocale
export default i18n
