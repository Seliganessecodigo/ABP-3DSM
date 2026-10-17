import { useTranslation } from 'react-i18next'
import { useTheme } from '../app/useTheme.ts'
import './ThemeSelector.css'

export function ThemeSelector() {
  const { t } = useTranslation('common')
  const { preference, chooseTheme } = useTheme()
  return <div className="theme-selector" role="group" aria-label={t('theme.label')}>
    <div className="theme-options">
      <button type="button" aria-label={t('theme.light')} aria-pressed={preference === 'light'} onClick={() => chooseTheme('light')}>
        <span aria-hidden="true">☀</span><span className="theme-option-label">{t('theme.light')}</span>
      </button>
      <button type="button" aria-label={t('theme.dark')} aria-pressed={preference === 'dark'} onClick={() => chooseTheme('dark')}>
        <span aria-hidden="true">☾</span><span className="theme-option-label">{t('theme.dark')}</span>
      </button>
    </div>
    <button className="theme-system" type="button" aria-label={t('theme.system')} aria-pressed={preference === 'system'} onClick={() => chooseTheme('system')}>
      <span aria-hidden="true">▣</span><span className="theme-option-label">{t('theme.system')}</span>
    </button>
  </div>
}
