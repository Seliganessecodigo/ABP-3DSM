import styles from './LoginPage.module.css'
import greenErMark from '../../assets/green-er-mark.png'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthenticationError, type TotpProvisioning } from '../../features/authentication/api.ts'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { TotpAuthenticationStep } from '../../components/TotpAuthenticationStep.tsx'
import { redirectToGoogleSso, ssoInvitationStorageKey, ssoVerifierStorageKey } from '../../features/authentication/sso.ts'

const ssoEnabled = import.meta.env.VITE_GOOGLE_SSO_ENABLED === 'true'

type TotpState =
  | { kind: 'setup'; provisioning: TotpProvisioning }
  | { kind: 'challenge'; challengeToken: string }

function readCredentials(form: FormData) {
  const email = form.get('email')
  const password = form.get('password')
  return {
    email: typeof email === 'string' ? email.trim() : '',
    password: typeof password === 'string' ? password : '',
  }
}

function clearPassword(formElement: HTMLFormElement) {
  const password = formElement.elements.namedItem('password')
  if (password instanceof HTMLInputElement) password.value = ''
}

function authenticationErrorKey(cause: unknown) {
  if (!(cause instanceof AuthenticationError)) return 'signInFailed'
  if (cause.code === 'INVALID_TOTP_CHALLENGE') return 'totpExpired'
  if (cause.code === 'TOTP_CHALLENGE_RATE_LIMITED') return 'totpRateLimited'
  if (cause.code === 'TOTP_CHALLENGE_DELAYED') return 'totpDelayed'
  if (cause.status === 401) return 'invalidCredentials'
  if (cause.status === 403) return 'forbidden'
  return 'signInFailed'
}

function googleButtonLabel(t: (key: string) => string, submitting: boolean, invitation: string) {
  if (submitting) return t('ssoStarting')
  if (invitation) return t('ssoAcceptInvitation')
  return t('ssoGoogle')
}

export function LoginPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('login')
  const { signIn, beginTotpSetup, confirmTotpSetup, verifyTotpChallenge } = useAuthentication()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [totpState, setTotpState] = useState<TotpState | null>(null)
  const [invitation, setInvitation] = useState(() =>
    new URLSearchParams(window.location.hash.slice(1)).get('sso_invite') ?? sessionStorage.getItem(ssoInvitationStorageKey) ?? '',
  )
  useEffect(() => {
    const fromFragment = new URLSearchParams(window.location.hash.slice(1)).get('sso_invite')
    if (fromFragment) {
      sessionStorage.setItem(ssoInvitationStorageKey, fromFragment)
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
    }
  }, [])
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const formElement = event.currentTarget
    const credentials = readCredentials(new FormData(formElement))
    try {
      sessionStorage.removeItem(ssoInvitationStorageKey)
      sessionStorage.removeItem(ssoVerifierStorageKey)
      setInvitation('')
      const result = await signIn(credentials)
      clearPassword(formElement)
      if ('status' in result && result.status === 'TOTP_SETUP_REQUIRED') {
        setTotpState({ kind: 'setup', provisioning: await beginTotpSetup(result.setupToken) })
      } else if ('status' in result && result.status === 'TOTP_REQUIRED') {
        setTotpState({ kind: 'challenge', challengeToken: result.challengeToken })
      } else {
        navigate('/')
      }
    } catch (cause) {
      setError(authenticationErrorKey(cause))
      clearPassword(formElement)
    } finally {
      setSubmitting(false)
    }
  }
  async function handleGoogleSignIn() {
    setError('')
    setSubmitting(true)
    try { await redirectToGoogleSso(invitation || undefined) }
    catch { setError('ssoFailed'); setSubmitting(false) }
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
      onExpired={() => { setTotpState(null); setError('totpExpired') }}
    />
  }
  return <main className={styles.page}>
    <img className={styles.watermark} src={greenErMark} alt="" />
    <header className={styles.heading}><p className={styles.eyebrow}>{t('title')}</p><h1>{t('heading')}</h1></header>
    <section className={styles.card} aria-labelledby="login-heading">
      <h2 id="login-heading">{t('submit')}</h2>
      <p>{t('description')}</p>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>{t('email')}<input className="form-control form-control--large" name="email" type="email" autoComplete="username" required /></label>
        <label>{t('password')}<input className="form-control form-control--large" name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className={styles.error} role="alert">{t(error)}</p>}
        <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? t('submitting') : t('submit')}</button>
      </form>
      {ssoEnabled && <div className={styles.sso}>
        <div className={styles.divider}><span>{t('ssoDivider')}</span></div>
        <button className={styles.google} type="button" onClick={() => void handleGoogleSignIn()} disabled={submitting}>
          {googleButtonLabel(t, submitting, invitation)}
        </button>
      </div>}
    </section>
  </main>
}
