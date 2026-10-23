import styles from './LoginPage.module.css'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthenticationError, TotpRequiredError } from '../../features/authentication/api.ts'
import { useAuthentication } from '../../app/useAuthentication.ts'

export function LoginPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('login')
  const { signIn } = useAuthentication()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await signIn({ email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') })
      navigate('/')
    } catch (cause) {
      setError(cause instanceof TotpRequiredError ? t('totpRequired') : cause instanceof AuthenticationError && cause.status === 403 ? t('forbidden') : t('invalidCredentials'))
      const password = formElement.elements.namedItem('password')
      if (password instanceof HTMLInputElement) password.value = ''
    } finally { setSubmitting(false) }
  }
  return <main className={styles.page}>
    <header className={styles.heading}><h1>{t('title')}</h1><p>{t('subtitle')}</p></header>
    <section className={styles.card} aria-labelledby="login-heading">
      <h2 id="login-heading">{t('heading')}</h2>
      <p>{t('description')}</p>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>{t('email')}<input name="email" type="email" autoComplete="username" required /></label>
        <label>{t('password')}<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? t('submitting') : t('submit')}</button>
      </form>
    </section>
  </main>
}
