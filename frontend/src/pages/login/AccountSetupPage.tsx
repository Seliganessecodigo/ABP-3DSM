import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import greenErMark from '../../assets/green-er-mark.png'
import { useAccountSetup, type AccountSetupKind } from './useAccountSetup.ts'
import styles from './LoginPage.module.css'

export function AccountSetupPage({ kind, navigate }: Readonly<{ kind: AccountSetupKind; navigate: (url: string) => void }>) {
  const { t } = useTranslation('login')
  const { token, state, error, submit } = useAccountSetup(kind)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [state, token])
  const invitation = kind === 'invitation'
  const complete = state === 'complete'
  const invalid = token === '' && !complete
  let title = invitation ? 'setupInvitationTitle' : 'setupConfirmationTitle'
  if (complete) title = invitation ? 'setupCheckEmail' : 'setupReady'
  if (invalid) title = 'setupInvalidTitle'
  let submitLabel = invitation ? 'setupAccept' : 'setupCreatePassword'
  if (state === 'pending') submitLabel = 'setupSubmitting'

  return <main className={styles.page}>
    <img className={styles.watermark} src={greenErMark} alt="" />
    <header className={styles.heading}><p className={styles.eyebrow}>GreenER</p><h1>{t('setupWelcome')}</h1></header>
    <section className={`${styles.card} ${styles.setupCard}`} aria-labelledby="account-setup-heading" aria-busy={state === 'pending'}>
      <h2 id="account-setup-heading" ref={heading} tabIndex={-1}>{t(title)}</h2>
      {invalid && <p role="alert">{t('setupInvalidLink')}</p>}
      {complete && <p role="status">{t(invitation ? 'setupEmailSent' : 'setupReadyDescription')}</p>}
      {token && !complete && <>
        <p>{t(invitation ? 'setupInvitationDescription' : 'setupConfirmationDescription')}</p>
        <form key={token} onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget) }}>
          {invitation ? <>
            <label>{t('setupName')}<input className="form-control form-control--large" name="name" autoComplete="name" maxLength={160} required /></label>
            <label>{t('email')}<input className="form-control form-control--large" name="email" type="email" autoComplete="email" maxLength={320} required /></label>
          </> : <>
            <label>{t('setupNewPassword')}<input className="form-control form-control--large" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={1024} aria-describedby="password-hint" required /></label>
            <p id="password-hint" className={styles.hint}>{t('setupPasswordLength')}</p>
            <label>{t('setupConfirmPassword')}<input className="form-control form-control--large" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={1024} required /></label>
          </>}
          {error && <p className={styles.error} role="alert">{t(error)}</p>}
          <button className={styles.submit} type="submit" disabled={state === 'pending'}>{t(submitLabel)}</button>
        </form>
      </>}
      <a className={styles.backLink} href="/login" onClick={(event) => { event.preventDefault(); navigate('/login') }}>{t('totpBackToLogin')}</a>
    </section>
  </main>
}
