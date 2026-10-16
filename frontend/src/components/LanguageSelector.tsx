import './LanguageSelector.css'
import { useTranslation } from 'react-i18next'
import { localeNames, supportedLocales, type Locale } from '../i18n.ts'

export function LanguageSelector() {
  const { i18n, t } = useTranslation('common')
  const selectedLocale = (i18n.resolvedLanguage ?? 'en-US') as Locale
  return <label className="language-control"><svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.2" /><path d="M2.8 10h14.4M10 2.8a11 11 0 0 1 0 14.4 11 11 0 0 1 0-14.4Z" /></svg><span className="language-label">{t('language.label')}</span><span className="language-code" aria-hidden="true">{selectedLocale.split('-')[0].toUpperCase()}</span><svg className="language-chevron" aria-hidden="true" viewBox="0 0 12 12"><path d="m3 4.5 3 3 3-3" /></svg><select aria-label={t('language.label')} value={selectedLocale} onChange={(event) => void i18n.changeLanguage(event.target.value as Locale)}>{supportedLocales.map((locale) => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
}
