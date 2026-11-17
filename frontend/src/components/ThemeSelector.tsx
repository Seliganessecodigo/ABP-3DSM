import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '../app/useTheme.ts'
import './ThemeSelector.css'

export function ThemeSelector() {
  const { t } = useTranslation('common')
  const { theme, chooseTheme } = useTheme()
  const dark = theme === 'dark'
  return <button className="theme-toggle" type="button" role="switch" aria-label={t('theme.darkMode')} aria-checked={dark} onClick={() => chooseTheme(dark ? 'light' : 'dark')}>
    <FontAwesomeIcon className="theme-icon" icon={faMoon} aria-hidden="true" />
    <span className="theme-label">{t('theme.darkMode')}</span>
    <span className="theme-switch" aria-hidden="true"><span /></span>
  </button>
}
