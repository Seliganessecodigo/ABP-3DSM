import './LanguageSelector.css'
import { useTranslation } from 'react-i18next'
import { localeNames, supportedLocales, type Locale } from '../i18n.ts'

export function LanguageSelector() {
  const { i18n, t } = useTranslation('common')
  return <label className="language-control"><span>{t('language.label')}</span><select aria-label={t('language.label')} value={i18n.resolvedLanguage} onChange={(event) => void i18n.changeLanguage(event.target.value as Locale)}>{supportedLocales.map((locale) => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
}
