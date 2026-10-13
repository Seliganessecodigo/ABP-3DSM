import './AppShell.css'
import '../styles/shared.css'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector.tsx'

export function AppShell({ children, navigate, detail = false }: Readonly<{ children: React.ReactNode; navigate: (url: string) => void; detail?: boolean }>) {
  const { t } = useTranslation('common')
  return <div className="app-layout">
    <aside className="sidebar">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}><span>GreenER</span><small>{t('app.tagline')}</small></a>
      <nav aria-label={t('nav.main')}>
        <p className="nav-heading">{t('nav.monitoring')}</p>
        <button disabled><span aria-hidden="true">▦</span> <span>{t('nav.dashboard')}</span></button>
        <a href="/" aria-label={t('nav.applications')} aria-current={detail ? undefined : 'page'} className={!detail ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigate('/') }}>◉ <span>{t('nav.applications')}</span></a>
        <button disabled><span aria-hidden="true">◷</span> <span>{t('nav.history')}</span></button>
        <p className="nav-heading">{t('nav.analysis')}</p>
        <button disabled><span aria-hidden="true">♧</span> <span>{t('nav.ranking')}</span></button>
        <button disabled><span aria-hidden="true">⇄</span> <span>{t('nav.comparison')}</span></button>
        <button disabled><span aria-hidden="true">◎</span> <span>{t('nav.regionalSimulation')}</span></button>
        <p className="nav-heading">{t('nav.system')}</p>
        <button disabled><span aria-hidden="true">▤</span> <span>{t('nav.methodology')}</span></button>
        <button disabled><span aria-hidden="true">⚙</span> <span>{t('nav.settings')}</span></button>
      </nav>
      <div className="sidebar-foot">{t('nav.environment')}</div>
    </aside>
    <div className="workspace"><header className="topbar"><span>{t('topbar')}</span><div className="topbar-actions"><LanguageSelector /><span className="avatar" aria-label={t('account')}>ER</span></div></header>{children}</div>
  </div>
}
