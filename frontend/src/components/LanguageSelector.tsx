import './LanguageSelector.css'
import { useTranslation } from 'react-i18next'
import { localeNames, supportedLocales, type Locale } from '../i18n.ts'

function LanguageFlag({ locale }: Readonly<{ locale: Locale }>) {
  const common = { viewBox: '0 0 24 16', 'aria-hidden': true as const, 'data-language-flag': locale }
  if (locale === 'pt-BR') return <svg {...common}><rect width="24" height="16" rx="2" fill="#159447"/><path d="m12 2 9 6-9 6-9-6z" fill="#ffdf00"/><circle cx="12" cy="8" r="3.3" fill="#2455a4"/></svg>
  if (locale === 'en-US') return <svg {...common}><rect width="24" height="16" rx="2" fill="#fff"/>{[1, 4, 7, 10, 13].map(y => <rect key={y} y={y} width="24" height="1.5" fill="#c83d4d"/>)}<path d="M0 0h11v8H0z" fill="#234477"/></svg>
  if (locale === 'es-ES') return <svg {...common}><rect width="24" height="16" rx="2" fill="#c8323e"/><path d="M0 4h24v8H0z" fill="#f6c844"/></svg>
  if (locale === 'fr-FR') return <svg {...common}><rect width="8" height="16" rx="2" fill="#244a9b"/><path d="M8 0h8v16H8z" fill="#fff"/><path d="M16 0h8v16h-8z" fill="#d83d4d"/></svg>
  if (locale === 'de-DE') return <svg {...common}><rect width="24" height="5.4" rx="2" fill="#222"/><path d="M0 5.3h24v5.4H0z" fill="#d43e42"/><path d="M0 10.6h24v5.4H0z" fill="#f3c641"/></svg>
  if (locale === 'it-IT') return <svg {...common}><rect width="8" height="16" rx="2" fill="#26935b"/><path d="M8 0h8v16H8z" fill="#fff"/><path d="M16 0h8v16h-8z" fill="#d9414a"/></svg>
  if (locale === 'ja-JP') return <svg {...common}><rect width="24" height="16" rx="2" fill="#fff"/><circle cx="12" cy="8" r="4.5" fill="#c93445"/></svg>
  return <svg {...common}><rect width="24" height="16" rx="2" fill="#d83d42"/><path d="m5 2 .8 1.7 1.9.2-1.4 1.2.4 1.8L5 6l-1.7.9.4-1.8-1.4-1.2 1.9-.2z" fill="#f5d34e"/></svg>
}

export function LanguageSelector() {
  const { i18n, t } = useTranslation('common')
  const selectedLocale = (i18n.resolvedLanguage ?? 'en-US') as Locale
  return <label className="language-control"><svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8a11 11 0 0 1 0 14.4 11 11 0 0 1 0-14.4Z" /></svg><span className="language-label">{t('language.label')}</span><span className="language-code" aria-hidden="true"><span className="language-flag"><LanguageFlag locale={selectedLocale} /></span>{selectedLocale.split('-')[0].toUpperCase()}</span><svg className="language-chevron" aria-hidden="true" viewBox="0 0 12 12"><path d="m3 4.5 3 3 3-3" /></svg><select aria-label={t('language.label')} value={selectedLocale} onChange={(event) => void i18n.changeLanguage(event.target.value as Locale)}>{supportedLocales.map((locale) => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
}
