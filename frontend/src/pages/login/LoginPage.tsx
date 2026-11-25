import { CardIcon } from '../../components/CardIcon.tsx'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { PageHelp } from '../../components/PageHelp.tsx'
import styles from './LoginPage.module.css'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthenticationError, type TotpProvisioning } from '../../features/authentication/api.ts'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { TotpAuthenticationStep } from '../../components/TotpAuthenticationStep.tsx'
import { readSsoInvitation, redirectToGoogleSso, ssoInvitationStorageKey, ssoVerifierStorageKey } from '../../features/authentication/sso.ts'

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
    readSsoInvitation(new URLSearchParams(window.location.hash.slice(1)).get('sso_invite')) ??
      readSsoInvitation(sessionStorage.getItem(ssoInvitationStorageKey)) ?? '',
  )
  useEffect(() => {
    const fromFragment = new URLSearchParams(window.location.hash.slice(1)).get('sso_invite')
    if (fromFragment !== null) {
      const token = readSsoInvitation(fromFragment)
      if (token) sessionStorage.setItem(ssoInvitationStorageKey, token)
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
    <header className={styles.heading}><div className="heading-title"><h1>{t('heading')}</h1><PageHelp steps={[
  { title: t('heading'), description: t('description'), target: 'main form' },
  { title: t('totpChallengeHeading'), description: t('totpChallengeDescription'), target: 'main form' },
]} /></div></header>
    <section className={styles.card} aria-labelledby="login-heading">
      <h2 id="login-heading"><CardIcon icon={faLock} size="small" inline />{t('submit')}</h2>
      {new URLSearchParams(window.location.search).get('passwordChanged') === 'true' && <output>{t('passwordChanged')}</output>}
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>{t('email')}<input placeholder={'email@example.com'} className="form-control form-control--large" name="email" type="email" autoComplete="username" required /></label>
        <label>{t('password')}<input placeholder={t('password')} className="form-control form-control--large" name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className={styles.error} role="alert">{t(error)}</p>}
        <button className={styles.submit} type="submit" disabled={submitting}>{submitting ? t('submitting') : t('submit')}</button>
      </form>
      <button className={styles.cancel} type="button" onClick={() => navigate('/recover-password')}>{t('forgotPassword')}</button>
      {ssoEnabled && <div className={styles.sso}>
        <div className={styles.divider}><span>{t('ssoDivider')}</span></div>
        <button className={styles.google} type="button" onClick={() => void handleGoogleSignIn()} disabled={submitting}>
          <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17v5h6.6c3.87-3.56 6.08-8.8 6.08-14.67Z"/><path fill="#34A853" d="M24 44c5.5 0 10.12-1.82 13.5-4.87l-6.6-5c-1.83 1.23-4.18 1.97-6.9 1.97-5.32 0-9.83-3.59-11.44-8.42H5.75v5.18A20.4 20.4 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.56 27.68a12.3 12.3 0 0 1 0-7.36v-5.18H5.75a20 20 0 0 0 0 17.72Z"/><path fill="#EA4335" d="M24 11.9c3 0 5.7 1.03 7.82 3.05l5.87-5.87C34.12 5.75 29.5 4 24 4A20.4 20.4 0 0 0 5.75 15.14l6.81 5.18C14.17 15.49 18.68 11.9 24 11.9Z"/></svg>
          {googleButtonLabel(t, submitting, invitation)}
        </button>
      </div>}
    </section>
  </main>
}
