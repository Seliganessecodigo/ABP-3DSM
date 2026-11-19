import { PasswordSettings } from './PasswordSettings.tsx'
import { CardIcon } from '../../components/CardIcon.tsx'
import { faPalette, faSliders, faUser } from '@fortawesome/free-solid-svg-icons'
import { Breadcrumbs } from '../../components/Breadcrumbs.tsx'
import { useTranslation } from 'react-i18next'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { useTheme } from '../../app/useTheme.ts'
import type { AuthenticatedUser } from '../../features/authentication/api.ts'
import { supportedLocales, localeNames } from '../../i18n.ts'
import { AccountsPage } from '../accounts/AccountsPage.tsx'
import { PageHelp, type HelpStep } from '../../components/PageHelp.tsx'
import { MonitoringSettings } from './MonitoringSettings.tsx'
import { AuditSettings } from './AuditSettings.tsx'
import styles from './SettingsPage.module.css'

const tabs = ['monitoring', 'users', 'audit', 'account'] as const
type SettingsTab = typeof tabs[number]
export function SettingsPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { user } = useAuthentication()
  const { t } = useTranslation('settings')
  const requested = new URLSearchParams(window.location.search).get('tab')
  const tab = tabs.find(tab => tab === requested) ?? (user?.role === 'ADMIN' ? 'monitoring' : 'account')
  const allowed = user?.role === 'ADMIN' ? tabs : ['account'] as const
  const permitted = tab === 'account' || user?.role === 'ADMIN'
  const helpByTab: Record<SettingsTab, readonly [HelpStep, ...HelpStep[]]> = {
    monitoring: [{ title: t('integrations'), description: t('refreshNote') }, { title: t('pause'), description: t('pauseDescription') }],
    users: [{ title: t('createAccount'), description: t('createDescription') }, { title: t('operation'), description: t('accessChangeDescription') }],
    audit: [{ title: t('tabs.audit'), description: t('auditDescription') }],
    account: [{ title: t('tabs.account'), description: t('accountDescription') }, { title: t('analysisPreferences'), description: t('preferencesDescription') }],
  }
  let help = helpByTab[tab]
  if (!user || !permitted) help = [{ title: t('title'), description: t(user ? 'denied' : 'signIn') }]
  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className="page-heading"><div><Breadcrumbs navigate={navigate} items={[{ label: t('title'), href: '/settings' }, { label: t(`tabs.${tab}`) }]} /><div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={help} /></div></div></header>
    <nav className={styles.tabs} aria-label={t('areas')}>{allowed.map(item => <a key={item} href={`/settings?tab=${item}`} aria-current={tab === item ? 'page' : undefined} onClick={event => { event.preventDefault(); const params = new URLSearchParams(window.location.search); params.set('tab', item); navigate(`/settings?${params}`) }}>{t(`tabs.${item}`)}</a>)}</nav>
    <div className={styles.panel}>
      <SettingsContent user={user} permitted={permitted} tab={tab} navigate={navigate} />
    </div>
  </main>
}
function SettingsContent({ user, permitted, tab, navigate }: Readonly<{ user: AuthenticatedUser | null; permitted: boolean; tab: SettingsTab; navigate: (url: string) => void }>) {
  const { t } = useTranslation('settings')
  if (!user) return <><p className="notice">{t('signIn')}</p><a className="button" href="/login" onClick={e => { e.preventDefault(); navigate('/login') }}>{t('login')}</a></>
  if (!permitted) return <p className="notice" role="alert">{t('denied')}</p>
  switch (tab) {
    case 'users': return <AccountsPage navigate={navigate} embedded />
    case 'monitoring': return <MonitoringSettings key={user.id} />
    case 'audit': return <AuditSettings key={user.id} navigate={navigate} />
    case 'account': return <PersonalSettings navigate={navigate} />
  }
}
function PersonalSettings({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { user, signOut } = useAuthentication()
  const { t, i18n } = useTranslation('settings')
  const { t: accounts } = useTranslation('accounts')
  const { preference, chooseTheme } = useTheme()
  if (!user) return null
  return <>
    <section className={`${styles.section} ${styles.details}`}><div><h2><CardIcon icon={faUser} size="small" inline />{t('tabs.account')}</h2><p>{t('accountDescription')}</p></div><dl className={styles.fields}>
      <div><dt>{accounts('name')}</dt><dd>{user.name}</dd></div><div><dt>{accounts('role')}</dt><dd>{accounts(`role.${user.role}`)}</dd></div><div><dt>{accounts('emailColumn')}</dt><dd>{user.email}</dd></div>
    </dl></section>
    <section className={`${styles.section} ${styles.details}`}><h2><CardIcon icon={faPalette} size="small" inline />{t('appearance')}</h2><div className={styles.preferences}>
      <label>{t('theme')}<select aria-label={t('theme')} className="form-control" value={preference} onChange={e => { const value = e.target.value; if (value === 'light' || value === 'dark' || value === 'system') chooseTheme(value) }}>{(['light', 'dark', 'system'] as const).map(theme => <option key={theme} value={theme}>{t(`theme.${theme}`)}</option>)}</select></label>
      <label>{t('language')}<select aria-label={t('language')} className="form-control" value={i18n.resolvedLanguage} onChange={e => { void i18n.changeLanguage(e.target.value) }}>{supportedLocales.map(locale => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>
    </div></section>
    <section className={`${styles.section} ${styles.details}`}><h2><CardIcon icon={faSliders} size="small" inline />{t('analysisPreferences')}</h2><div><p>{t('preferencesDescription')}</p><a href="/methodology" onClick={e => { e.preventDefault(); navigate('/methodology') }}>{t('openPreferences')}</a></div></section>
    <PasswordSettings navigate={navigate} />
    <div className={styles.section}><button className="button secondary" type="button" onClick={() => { void signOut().then(() => navigate('/')) }}>{t('signOut')}</button></div>
  </>
}
