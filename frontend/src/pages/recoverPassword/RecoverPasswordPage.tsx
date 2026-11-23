import { NavigationLink } from '../../components/NavigationLink.tsx'
import { CardIcon } from '../../components/CardIcon.tsx'
import { faKey } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { usePasswordRecovery } from './usePasswordRecovery.ts'
import styles from '../login/LoginPage.module.css'

export function RecoverPasswordPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('recoverPassword')
  const { t: login } = useTranslation('login')
  const { token, pending, complete, error, submit } = usePasswordRecovery()
  const submitLabel = token ? t('resetSubmit') : t('submit')
  return <main className={styles.page}>
    <section className={`${styles.card} ${styles.setupCard}`} aria-labelledby="recovery-title">
      <h1 id="recovery-title"><CardIcon icon={faKey} inline />{t('title')}</h1>
      {complete ? <output>{complete === 'reset' ? login('passwordChanged') : t('complete')}</output> : <>
        <p>{token ? t('resetDescription') : t('description')}</p>
        <form onSubmit={event => void submit(event)}>
          {token ? <>
            <label>{login('setupNewPassword')}<input className="form-control form-control--large" name="password" type="password" autoComplete="new-password" placeholder={login('setupPasswordLength')} minLength={8} maxLength={1024} required disabled={pending} aria-describedby="recovery-password-length" /></label>
            <p id="recovery-password-length" className={styles.hint}>{login('setupPasswordLength')}</p>
            <label>{login('setupConfirmPassword')}<input className="form-control form-control--large" name="confirmation" type="password" autoComplete="new-password" placeholder={login('setupConfirmPassword')} minLength={8} maxLength={1024} required disabled={pending} /></label>
          </> : <>
            <label>{t('organization')}<input className="form-control form-control--large" name="organization" autoComplete="organization" placeholder={t('organizationHint')} maxLength={80} required disabled={pending} /></label>
            <label>{login('email')}<input className="form-control form-control--large" name="email" type="email" autoComplete="email" placeholder="email@example.com" maxLength={320} required disabled={pending} /></label>
          </>}
          {error && <p role="alert" className={styles.error}>{t(error)}</p>}
          <button className={styles.submit} type="submit" disabled={pending}>{pending ? login('setupSubmitting') : submitLabel}</button>
        </form>
      </>}
      <NavigationLink className={styles.backLink} href="/login" navigate={navigate}>{t('backToLogin')}</NavigationLink>
    </section>
  </main>
}
