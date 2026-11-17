import { useTranslation } from 'react-i18next'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { useTheme } from '../../app/useTheme.ts'
import { supportedLocales, localeNames } from '../../i18n.ts'
import { AccountsPage } from '../accounts/AccountsPage.tsx'
import { PageHelp, type HelpStep } from '../../components/PageHelp.tsx'
import { MonitoringSettings } from './MonitoringSettings.tsx'
import { AuditSettings } from './AuditSettings.tsx'
import styles from './SettingsPage.module.css'

const tabs = ['monitoring', 'users', 'audit', 'account'] as const
export type SettingsTab = typeof tabs[number]
export function SettingsPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { user } = useAuthentication()
  const { t } = useTranslation('settings')
  const requested = new URLSearchParams(window.location.search).get('tab')
  const tab = tabs.find(tab => tab === requested) ?? (user?.role === 'ADMIN' ? 'monitoring' : 'account')
  const allowed = user?.role === 'ADMIN' ? tabs : ['account'] as const
  const permitted = tab === 'account' || user?.role === 'ADMIN'
  const help: readonly [HelpStep, ...HelpStep[]] = tab === 'monitoring' ? [{ title: t('integrations'), description: t('refreshNote') }, { title: t('pause'), description: t('pauseDescription') }] :
    tab === 'users' ? [{ title: t('createAccount'), description: t('createDescription') }, { title: t('operation'), description: t('accessChangeDescription') }] :
    tab === 'audit' ? [{ title: t('tabs.audit'), description: t('auditDescription') }] : [{ title: t('tabs.account'), description: t('accountDescription') }, { title: t('analysisPreferences'), description: t('preferencesDescription') }]
  return <main className={styles.page} tabIndex={-1}>
    <header><p className="eyebrow">{t('eyebrow')}</p><div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={!user || !permitted ? [{ title: t('title'), description: t(user ? 'denied' : 'signIn') }] : help} /></div><p className={styles.description}>{t('description')}</p></header>
    <nav className={styles.tabs} aria-label={t('areas')}>{allowed.map(item => <a key={item} href={`/settings?tab=${item}`} aria-current={tab === item ? 'page' : undefined} onClick={event => { event.preventDefault(); const params = new URLSearchParams(window.location.search); params.set('tab', item); navigate(`/settings?${params}`) }}>{t(`tabs.${item}`)}</a>)}</nav>
    <div className={styles.panel}>
      {!user ? <><p className="notice">{t('signIn')}</p><a className="button" href="/login" onClick={e => { e.preventDefault(); navigate('/login') }}>{t('login')}</a></> : !permitted ? <p className="notice" role="alert">{t('denied')}</p> :
        tab === 'users' ? <AccountsPage navigate={navigate} embedded /> :
        tab === 'monitoring' ? <MonitoringSettings key={user.id} /> :
        tab === 'audit' ? <AuditSettings key={user.id} navigate={navigate} /> : <PersonalSettings navigate={navigate} />}
    </div>
  </main>
}
function PersonalSettings({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { user, signOut } = useAuthentication()
  const { t, i18n } = useTranslation('settings')
  const { t: accounts } = useTranslation('accounts')
  const { preference, chooseTheme } = useTheme()
  if (!user) return null
  return <>
    <section className={`${styles.section} ${styles.details}`}><div><h2>{t('tabs.account')}</h2><p>{t('accountDescription')}</p></div><dl className={styles.fields}>
      <div><dt>{accounts('name')}</dt><dd>{user.name}</dd></div><div><dt>{accounts('role')}</dt><dd>{accounts(`role.${user.role}`)}</dd></div><div><dt>{accounts('emailColumn')}</dt><dd>{user.email}</dd></div>
    </dl></section>
    <section className={`${styles.section} ${styles.details}`}><div><h2>{t('appearance')}</h2><p>{t('appearanceDescription')}</p></div><div className={styles.preferences}>
      <label>{t('theme')}<select aria-label={t('theme')} className="form-control" value={preference} onChange={e => { const value = e.target.value; if (value === 'light' || value === 'dark' || value === 'system') chooseTheme(value) }}>{(['light', 'dark', 'system'] as const).map(theme => <option key={theme} value={theme}>{t(`theme.${theme}`)}</option>)}</select></label>
      <label>{t('language')}<select aria-label={t('language')} className="form-control" value={i18n.resolvedLanguage} onChange={e => { void i18n.changeLanguage(e.target.value) }}>{supportedLocales.map(locale => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
    </div></section>
    <section className={`${styles.section} ${styles.details}`}><h2>{t('analysisPreferences')}</h2><div><p>{t('preferencesDescription')}</p><a href="/methodology" onClick={e => { e.preventDefault(); navigate('/methodology') }}>{t('openPreferences')}</a></div></section>
    <div className={`${styles.section} ${styles.row}`}><p>{t('accountSecurity')}</p><button className="button secondary" type="button" onClick={() => { void signOut().then(() => navigate('/')) }}>{t('signOut')}</button></div>
  </>
}
