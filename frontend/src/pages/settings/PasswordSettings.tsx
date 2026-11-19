import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { ActionButton } from '../../components/ActionButton.tsx'
import { CardIcon } from '../../components/CardIcon.tsx'
import { AuthenticationError, changePassword } from '../../features/authentication/api.ts'
import styles from './SettingsPage.module.css'

export function PasswordSettings({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('settings')
  const { authenticatedFetch, signOut } = useAuthentication()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const currentPassword = String(fields.get('currentPassword') ?? '')
    const password = String(fields.get('password') ?? '')
    if (password !== fields.get('confirmation')) { setError('passwordMismatch'); return }
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    try {
      await changePassword(authenticatedFetch, { currentPassword, password }, controller.signal)
      if (controller.signal.aborted) return
      form.reset()
      await signOut()
      navigate('/login?passwordChanged=true')
    } catch (cause) {
      if (controller.signal.aborted) return
      setError(cause instanceof AuthenticationError && cause.status === 403 ? 'passwordDenied' : 'passwordFailed')
      form.reset()
    } finally { if (!controller.signal.aborted) setPending(false) }
  }
  return <section className={`${styles.section} ${styles.details}`}>
    <div><h2><CardIcon icon={faKey} size="small" inline />{t('changePassword')}</h2><p>{t('passwordChangeNote')}</p></div>
    <form className={styles.passwordForm} onSubmit={event => void submit(event)}>
      <label>{t('currentPassword')}<input className="form-control" name="currentPassword" type="password" autoComplete="current-password" maxLength={1024} required disabled={pending} placeholder={t('currentPassword')} /></label>
      <label>{t('newPassword')}<input className="form-control" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={1024} required disabled={pending} placeholder={t('passwordLength')} aria-describedby="password-length" /></label>
      <p id="password-length" className={styles.description}>{t('passwordLength')}</p>
      <label>{t('confirmPassword')}<input className="form-control" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={1024} required disabled={pending} placeholder={t('confirmPassword')} /></label>
      {error && <p role="alert" className={styles.error}>{t(error)}</p>}
      <ActionButton type="submit" pending={pending}>{t('changePassword')}</ActionButton>
    </form>
  </section>
}
