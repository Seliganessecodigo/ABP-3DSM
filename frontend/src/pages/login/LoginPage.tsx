import styles from './LoginPage.module.css'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthenticationError, type TotpProvisioning } from '../../features/authentication/api.ts'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { TotpAuthenticationStep } from '../../components/TotpAuthenticationStep.tsx'

type TotpState =
  | { kind: 'setup'; provisioning: TotpProvisioning }
  | { kind: 'challenge'; challengeToken: string }

export function LoginPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('login')
  const { signIn, beginTotpSetup, confirmTotpSetup, verifyTotpChallenge } = useAuthentication()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [totpState, setTotpState] = useState<TotpState | null>(null)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      const result = await signIn({ email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') })
      const password = formElement.elements.namedItem('password')
      if (password instanceof HTMLInputElement) password.value = ''
      if ('status' in result && result.status === 'TOTP_SETUP_REQUIRED') {
        setTotpState({ kind: 'setup', provisioning: await beginTotpSetup(result.setupToken) })
      } else if ('status' in result && result.status === 'TOTP_REQUIRED') {
        setTotpState({ kind: 'challenge', challengeToken: result.challengeToken })
      } else {
        navigate('/')
      }
    } catch (cause) {
      setError(cause instanceof AuthenticationError && cause.code === 'INVALID_TOTP_CHALLENGE'
        ? t('totpExpired')
        : cause instanceof AuthenticationError && cause.code === 'TOTP_CHALLENGE_RATE_LIMITED'
          ? t('totpRateLimited')
          : cause instanceof AuthenticationError && cause.code === 'TOTP_CHALLENGE_DELAYED'
            ? t('totpDelayed')
            : cause instanceof AuthenticationError && cause.status === 401
              ? t('invalidCredentials')
              : cause instanceof AuthenticationError && cause.status === 403
                ? t('forbidden')
                : t('totpGenericError'))
      const password = formElement.elements.namedItem('password')
      if (password instanceof HTMLInputElement) password.value = ''
    } finally { setSubmitting(false) }
  }
  async function submitTotpCode(code: string) {
    if (!totpState) return
    if (totpState.kind === 'setup') await confirmTotpSetup(totpState.provisioning.setupToken, code)
    else await verifyTotpChallenge(totpState.challengeToken, code)
    setTotpState(null)
    navigate('/')
  }
  if (totpState) {
    return <TotpAuthenticationStep
      kind={totpState.kind}
      provisioningUri={totpState.kind === 'setup' ? totpState.provisioning.provisioningUri : undefined}
      onSubmitCode={submitTotpCode}
      onCancel={() => { setTotpState(null); setError('') }}
      onExpired={() => { setTotpState(null); setError(t('totpExpired')) }}
    />
  }
  return <main className={styles.page}>
    <header className={styles.heading}><h1>{t('title')}</h1></header>
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
