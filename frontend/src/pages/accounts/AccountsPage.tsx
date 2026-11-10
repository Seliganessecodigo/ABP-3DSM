import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { ActionButton } from '../../components/ActionButton.tsx'
import { isAccountRole, type GoogleInvitation } from '../../features/authentication/accounts.ts'
import { useAccounts } from './useAccounts.ts'
import styles from './AccountsPage.module.css'

export function AccountsPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { user } = useAuthentication()
  const { t } = useTranslation('accounts')
  if (user?.role !== 'ADMIN') return <main className="content" tabIndex={-1}><h1>{t('title')}</h1><p className="notice">{t(user ? 'denied' : 'signIn')}</p>{!user && <a className="button" href="/login" onClick={event => { event.preventDefault(); navigate('/login') }}>{t('login')}</a>}</main>
  return <AccountsAdministration key={user.id} />
}
function AccountsAdministration() {
  const { t } = useTranslation('accounts')
  const state = useAccounts()
  const { user, result, loading, loadError, reload, inviteState, inviteError, sendInvitation } = state
  const [draft, setDraft] = useState<GoogleInvitation>({ name: '', email: '', role: 'VISITOR' })
  const nameField = useRef<HTMLInputElement>(null)
  const pending = inviteState === 'pending'
  const ssoEnabled = import.meta.env.VITE_GOOGLE_SSO_ENABLED === 'true'
  function prepareInvitation(input: GoogleInvitation) {
    setDraft({ name: input.name, email: input.email, role: input.role })
    nameField.current?.focus()
  }
  return <main className={`content ${styles.page}`} tabIndex={-1}>
    <header className="page-heading"><div><p className="eyebrow">GreenER</p><h1>{t('title')}</h1><p>{t('subtitle')}</p></div></header>
    <section className={styles.panel} aria-labelledby="google-invitation-heading">
      <h2 id="google-invitation-heading">{t('inviteTitle')}</h2>
      <p>{t('inviteDescription')}</p>
      {ssoEnabled ? <>
        <p className={styles.hint}>{t('existingAccountHint')}</p>
        {user && <ActionButton appearance="secondary" disabled={pending} onClick={() => prepareInvitation(user)}>{t('linkMine')}</ActionButton>}
        <form className={styles.form} onSubmit={event => {
          event.preventDefault()
          if (pending) return
          void sendInvitation({ ...draft, name: draft.name.trim(), email: draft.email.trim() }).then(sent => { if (sent) setDraft({ name: '', email: '', role: 'VISITOR' }) })
        }}>
          <label>{t('name')}<input ref={nameField} className="form-control" name="name" autoComplete="name" maxLength={160} required disabled={pending} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>{t('email')}<input className="form-control" name="email" type="email" autoComplete="email" maxLength={320} required disabled={pending} value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} /></label>
          <div className={styles.field}><label htmlFor="invitation-role">{t('role')}</label><select id="invitation-role" className="form-control" name="role" disabled={pending} value={draft.role} onChange={event => { if (isAccountRole(event.target.value)) setDraft({ ...draft, role: event.target.value }) }}>{(['VISITOR', 'ANALYST', 'ADMIN'] as const).map(role => <option key={role} value={role}>{t(`role.${role}`)}</option>)}</select></div>
          <ActionButton type="submit" pending={pending}>{t(pending ? 'sending' : 'send')}</ActionButton>
        </form>
        {inviteState === 'sent' && <output className="notice">{t('sent')}</output>}
        {inviteError && <p role="alert" className={styles.error}>{t(inviteError)}</p>}
      </> : <p className="notice">{t('googleUnavailable')}</p>}
    </section>
    <section className={styles.panel} aria-labelledby="accounts-list-heading" aria-busy={loading}>
      <div className={styles.toolbar}><h2 id="accounts-list-heading">{t('listTitle')}</h2><ActionButton appearance="secondary" pending={loading} onClick={reload}>{t('refresh')}</ActionButton></div>
      {loading && <output className="notice">{t('loading')}</output>}
      {loadError && <p role="alert" className={styles.error}>{t(loadError)}</p>}
      {result && <>
        {result.items.length ? <div className={styles.tableScroll}><table className={styles.table}><caption>{t('listCaption')}</caption><thead><tr>{['name', 'emailColumn', 'role', 'status', 'actions'].map(key => <th key={key} scope="col">{t(key)}</th>)}</tr></thead><tbody>{result.items.map(account => <tr key={account.id}><th scope="row">{account.name}</th><td>{account.email}</td><td>{t(`role.${account.role}`)}</td><td>{t(`status.${account.status}`)}</td><td>{ssoEnabled && account.status === 'ACTIVE' && <ActionButton appearance="secondary" disabled={pending} onClick={() => prepareInvitation(account)} aria-label={t('inviteAccount', { name: account.name })}>{t('inviteAction')}</ActionButton>}</td></tr>)}</tbody></table></div> : <p className="notice">{t('empty')}</p>}
        <nav className={styles.pagination} aria-label={t('pagination')}><span>{t('page', { page: result.pagination.page, pages: Math.max(1, result.pagination.totalPages), total: result.pagination.totalItems })}</span><ActionButton appearance="secondary" disabled={loading || state.page <= 1} onClick={() => state.changePage(-1)}>{t('previous')}</ActionButton><ActionButton appearance="secondary" disabled={loading || !result.pagination.hasNextPage} onClick={() => state.changePage(1)}>{t('next')}</ActionButton></nav>
      </>}
    </section>
  </main>
}
