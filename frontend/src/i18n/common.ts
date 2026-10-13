import type { Locale } from './types.ts'
import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-ES.json'
import frFR from './locales/fr-FR.json'
import deDE from './locales/de-DE.json'
import itIT from './locales/it-IT.json'
import jaJP from './locales/ja-JP.json'
import zhCN from './locales/zh-CN.json'

const translations = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
  'fr-FR': frFR,
  'de-DE': deDE,
  'it-IT': itIT,
  'ja-JP': jaJP,
  'zh-CN': zhCN,
} satisfies Record<Locale, typeof ptBR>

export default translations
