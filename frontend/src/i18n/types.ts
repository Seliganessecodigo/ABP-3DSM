export const supportedLocales = ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'zh-CN'] as const
export type Locale = (typeof supportedLocales)[number]
export type NamespaceResources = Record<Locale, Record<string, string>>
