import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../components/ActionButton.tsx'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { AccountError, isAccountRole, type Account } from '../../features/authentication/accounts.ts'
import { applyAccountChange, type AccountChange } from '../../features/authentication/accountManagement.ts'
import { AuthenticationError } from '../../features/authentication/api.ts'
import styles from '../settings/SettingsPage.module.css'

function operationError(error: unknown): string {
  if (error instanceof AccountError || error instanceof AuthenticationError) {
    const messages: Partial<Record<number, string>> = { 401: 'sessionExpired', 403: 'denied', 409: 'conflict' }
    return messages[error.status] ?? 'loadFailed'
  }
  return 'loadFailed'
}

export function AccountManagement({ account, onClose, onSaved }: Readonly<{ account: Account | null; onClose: () => void; onSaved: () => void }>) {
  const { t } = useTranslation('settings')
  const { t: accounts } = useTranslation('accounts')
  const { authenticatedFetch } = useAuthentication()
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const request = useRef<AbortController | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Account['role']>(account?.role ?? 'VISITOR')
  const [status, setStatus] = useState<Account['status']>(account?.status ?? 'ACTIVE')
  const [kind, setKind] = useState<'role' | 'status'>('role')
  const [reason, setReason] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const trigger = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const element = dialog.current
    element?.showModal(); cancel.current?.focus()
    return () => { request.current?.abort(); element?.close(); document.body.style.overflow = previousOverflow; if (trigger instanceof HTMLElement) trigger.focus() }
  }, [])
  const label = account ? t('manageAccount', { name: account.name }) : t('createAccount')
  function prepareChange(): AccountChange {
    if (!account) return { kind: 'create', name: name.trim(), email: email.trim(), role, reason: reason.trim() }
    if (kind === 'role') return { kind, account, role, reason: reason.trim() }
    return { kind, account, status, reason: reason.trim() }
  }
  async function submit() {
    if (request.current) return
    if (account && !reviewed) { setReviewed(true); cancel.current?.focus(); return }
    const change = prepareChange()
    const controller = new AbortController()
    request.current = controller; setSaving(true); setError('')
    try {
      await applyAccountChange(authenticatedFetch, change, controller.signal)
      if (!controller.signal.aborted) onSaved()
    } catch (e) {
      if (!controller.signal.aborted) setError(operationError(e))
    } finally { if (request.current === controller) { request.current = null; if (!controller.signal.aborted) setSaving(false) } }
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="account-operation-title" onCancel={e => { e.preventDefault(); if (!saving) onClose() }}><form onSubmit={e => { e.preventDefault(); if (reason.trim()) void submit() }}>
    <h2 id="account-operation-title">{label}</h2><p>{t(account ? 'accessChangeDescription' : 'createDescription')}</p>
    {!reviewed && <>
      {!account && <><label>{accounts('name')}<input placeholder={accounts('name')} disabled={saving} className="form-control" required name="name" maxLength={160} value={name} onChange={e => setName(e.target.value)} /></label><label>{accounts('emailColumn')}<input placeholder={'email@example.com'} disabled={saving} className="form-control" name="email" required type="email" maxLength={320} value={email} onChange={e => setEmail(e.target.value)} /></label></>}
      {account && <label>{t('operation')}<select aria-label={t('operation')} disabled={saving} className="form-control" value={kind} onChange={e => { if (e.target.value === 'role' || e.target.value === 'status') setKind(e.target.value) }}><option value="role">{t('changeRole')}</option><option value="status">{t('changeStatus')}</option></select></label>}
      {(!account || kind === 'role') ? <label>{accounts('role')}<select aria-label={accounts('role')} disabled={saving} className="form-control" value={role} onChange={e => { if (isAccountRole(e.target.value)) setRole(e.target.value) }}>{(['VISITOR', 'ANALYST', 'ADMIN'] as const).map(value => <option value={value} key={value}>{accounts(`role.${value}`)}</option>)}</select></label> : <label>{accounts('status')}<select aria-label={accounts('status')} disabled={saving} className="form-control" value={status} onChange={e => { const v = e.target.value; if (v === 'ACTIVE' || v === 'BLOCKED' || v === 'DEACTIVATED') setStatus(v) }}>{(['ACTIVE', 'BLOCKED', 'DEACTIVATED'] as const).map(value => <option key={value} value={value}>{accounts(`status.${value}`)}</option>)}</select></label>}
      <label>{t('reason')}<textarea placeholder={t('reason')} disabled={saving} className="form-control" maxLength={512} required value={reason} onChange={e => setReason(e.target.value)} /></label>
    </>}
    {reviewed && account && <><p>{kind === 'role' ? accounts(`role.${account.role}`) : accounts(`status.${account.status}`)} → {kind === 'role' ? accounts(`role.${role}`) : accounts(`status.${status}`)}</p><p>{t('reason')}: {reason}</p></>}
    {error && <p className={styles.error} role="alert">{t(error)}</p>}
    <div className={styles.actions}><button ref={cancel} type="button" className="button secondary" disabled={saving} onClick={onClose}>{t('cancel')}</button>{reviewed && <button className="button secondary" type="button" disabled={saving} onClick={() => setReviewed(false)}>{t('edit')}</button>}<ActionButton type="submit" pending={saving} disabled={!reason.trim() || !!account && (kind === 'role' ? role === account.role : status === account.status)}>{t(account && !reviewed ? 'review' : 'confirm')}</ActionButton></div>
  </form></dialog>
}
