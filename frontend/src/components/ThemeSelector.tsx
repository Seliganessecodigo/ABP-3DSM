import { useTranslation } from 'react-i18next'
import { useTheme } from '../app/useTheme.ts'
import './ThemeSelector.css'

export function ThemeSelector() {
  const { t } = useTranslation('common')
  const { theme, chooseTheme } = useTheme()
  const dark = theme === 'dark'
  return <button className="theme-toggle" type="button" role="switch" aria-label={t('theme.darkMode')} aria-checked={dark} onClick={() => chooseTheme(dark ? 'light' : 'dark')}>
    <svg className="theme-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M15.8 12.4A7 7 0 0 1 7.6 4.2 7.2 7.2 0 1 0 15.8 12.4Z" /></svg>
    <span className="theme-label">{t('theme.darkMode')}</span>
    <span className="theme-switch" aria-hidden="true"><span /></span>
  </button>
}
