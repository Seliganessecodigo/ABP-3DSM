import { CardIcon } from '../../components/CardIcon.tsx'
import { faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons'
import { SortButton } from '../../components/SortButton.tsx'
import { Pagination } from '../../components/Pagination.tsx'
import { PageHelp } from '../../components/PageHelp.tsx'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { ActionButton } from '../../components/ActionButton.tsx'
import { tableSortPresentation } from '../../utils/tableSortPresentation.ts'
import { AccountManagement } from './AccountManagement.tsx'
import { isAccountRole, type GoogleInvitation, type Account } from '../../features/authentication/accounts.ts'
import { useAccounts } from './useAccounts.ts'
import styles from './AccountsPage.module.css'

export function AccountsPage({ navigate, embedded = false }: Readonly<{ navigate: (url: string) => void; embedded?: boolean }>) {
  const { user } = useAuthentication()
  const { t } = useTranslation('accounts')
  if (user?.role !== 'ADMIN') return <main className="content" tabIndex={-1}><header className="page-heading"><div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={[{ title: t('title'), description: t(user ? 'denied' : 'signIn') }]} /></div></header><p className="notice">{t(user ? 'denied' : 'signIn')}</p>{!user && <a className="button" href="/login" onClick={event => { event.preventDefault(); navigate('/login') }}>{t('login')}</a>}</main>
  return <AccountsAdministration key={user.id} embedded={embedded} navigate={navigate} />
}
function AccountsAdministration({ embedded, navigate }: Readonly<{ embedded: boolean; navigate: (url: string) => void }>) {
  const { t } = useTranslation('accounts')
  const { t: settings } = useTranslation('settings')
  const [management, setManagement] = useState<{ account: Account | null } | null>(null)
  const [saved, setSaved] = useState(false)
  const state = useAccounts(navigate)
  const { user, result, loading, loadError, reload, inviteState, inviteError, sendInvitation } = state
  const [draft, setDraft] = useState<GoogleInvitation>({ name: '', email: '', role: 'VISITOR' })
  const nameField = useRef<HTMLInputElement>(null)
  const pending = inviteState === 'pending'
  const ssoEnabled = import.meta.env.VITE_GOOGLE_SSO_ENABLED === 'true'
  function prepareInvitation(input: GoogleInvitation) {
    setDraft({ name: input.name, email: input.email, role: input.role })
    nameField.current?.focus()
  }
  const Container = embedded ? 'section' : 'main'
  return <Container className={embedded ? styles.page : `content ${styles.page}`} tabIndex={-1}>
    <header className={embedded ? styles.toolbar : `page-heading ${styles.pageHeading}`}><div>{!embedded && <p className="eyebrow">GreenER</p>}<div className="heading-title">{embedded ? <h2>{t('title')}</h2> : <h1>{t('title')}</h1>}{!embedded && <PageHelp steps={[
  { title: t('inviteTitle'), description: t('inviteDescription'), target: '[aria-labelledby="google-invitation-heading"]' },
  { title: t('listTitle'), description: t('existingAccountHint'), target: '[aria-labelledby="accounts-list-heading"]' },
]} />}</div></div><button type="button" className="button" onClick={() => { setSaved(false); setManagement({ account: null }) }}>{settings('createAccount')}</button></header>
    {saved && <output>{settings('saved')}</output>}
    <section className={styles.panel} aria-labelledby="accounts-list-heading" aria-busy={loading}>
      <div className={styles.toolbar}><h2 id="accounts-list-heading"><CardIcon icon={faUsers} size="small" inline />{t('listTitle')}</h2><ActionButton appearance="secondary" pending={loading} onClick={reload}>{t('refresh')}</ActionButton></div>
      {loading && <output className="notice">{t('loading')}</output>}
      {loadError && <><p role="alert" className={styles.error}>{t(loadError)}</p>{result && <p className="notice">{settings('previousData')}</p>}</>}
      <div className={styles.filters}>
        <label>{settings('search')}<input className="form-control" type="search" maxLength={320} value={state.query.get('search') ?? ''} onChange={e => state.updateQuery('search', e.target.value)} /></label>
        <label>{t('role')}<select className="form-control" value={state.query.get('role') ?? ''} onChange={e => state.updateQuery('role', e.target.value)}><option value="">{settings('all')}</option>{(['ADMIN', 'ANALYST', 'VISITOR'] as const).map(value => <option key={value} value={value}>{t(`role.${value}`)}</option>)}</select></label>
        <label>{t('status')}<select className="form-control" value={state.query.get('status') ?? ''} onChange={e => state.updateQuery('status', e.target.value)}><option value="">{settings('all')}</option>{(['ACTIVE', 'BLOCKED', 'DEACTIVATED'] as const).map(value => <option key={value} value={value}>{t(`status.${value}`)}</option>)}</select></label>
      </div>
      <details><summary>{settings('filters')}</summary><div className={styles.filters}>{(['name', 'email'] as const).map(key => <label key={key}>{t(key === 'email' ? 'emailColumn' : key)}<input className="form-control" maxLength={320} value={state.query.get(key) ?? ''} onChange={e => state.updateQuery(key, e.target.value)} /></label>)}</div></details>
      <button type="button" className="button secondary" onClick={state.clearFilters}>{settings('clear')}</button>
      {result && <>
        {result.items.length ? <div className={styles.tableScroll}><table className={styles.table}><caption>{t('listCaption')}</caption><thead><tr>{(['name', 'email', 'role', 'status'] as const).map(key => { const sort = tableSortPresentation(key, state.query.get('sortBy'), state.query.get('sortDirection')); return <th key={key} scope="col" aria-sort={sort.ariaSort}><SortButton state={sort.ariaSort} onClick={() => state.updateQuery('sortBy', key, { sortDirection: state.query.get('sortBy') === key && state.query.get('sortDirection') === 'asc' ? 'desc' : 'asc' })}>{t(key === 'email' ? 'emailColumn' : key)}</SortButton></th> })}<th scope="col">{t('actions')}</th></tr></thead><tbody>{result.items.map(account => <tr key={account.id}><th scope="row">{account.name}</th><td>{account.email}</td><td>{t(`role.${account.role}`)}</td><td>{t(`status.${account.status}`)}</td><td><button type="button" className="button secondary" onClick={() => { setSaved(false); setManagement({ account }) }}>{settings('manageAccount', { name: account.name })}</button>{ssoEnabled && account.status === 'ACTIVE' && <ActionButton appearance="secondary" disabled={pending} onClick={() => prepareInvitation(account)} aria-label={t('inviteAccount', { name: account.name })}>{t('inviteAction')}</ActionButton>}</td></tr>)}</tbody></table></div> : <p className="notice">{['search', 'name', 'email', 'role', 'status'].some(key => state.query.get(key)) ? settings('noResults') : t('empty')}</p>}
        <Pagination page={result.pagination.page} pageCount={result.pagination.totalPages} label={t('pagination')} disabled={loading} hasNextPage={result.pagination.hasNextPage}
          summary={t('page', { page: result.pagination.page, pages: Math.max(1, result.pagination.totalPages), total: result.pagination.totalItems })}
          pageSize={{ value: result.pagination.pageSize, options: [5, 10, 15, 20, 'all'], onChange: value => state.updateQuery('pageSize', value) }}
          onPageChange={page => state.changePage(page - state.page)} />
      </>}
    </section>
    <section className={styles.panel} aria-labelledby="google-invitation-heading">
      <h2 id="google-invitation-heading"><CardIcon icon={faUserPlus} size="small" inline />{t('inviteTitle')}</h2>

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
    {management && <AccountManagement account={management.account} onClose={() => setManagement(null)} onSaved={() => { setManagement(null); setSaved(true); reload() }} />}
  </Container>
}
