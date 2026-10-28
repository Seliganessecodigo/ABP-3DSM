import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthentication } from '../../app/useAuthentication.ts'
import { type TotpProvisioning } from '../../features/authentication/api.ts'
import { redirectToGoogleSso, ssoInvitationStorageKey, ssoVerifierStorageKey } from '../../features/authentication/sso.ts'
import { TotpAuthenticationStep } from '../../components/TotpAuthenticationStep.tsx'
import styles from './LoginPage.module.css'

type TotpState = { kind: 'setup'; provisioning: TotpProvisioning } | { kind: 'challenge'; challengeToken: string }

export function SsoCallbackPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('login')
  const { completeSsoHandoff, beginTotpSetup, confirmTotpSetup, verifyTotpChallenge } = useAuthentication()
  const [callback, setCallback] = useState<{ code: string; verifier: string; failed: boolean } | null>(null)
  const error = callback?.failed ?? false
  const [totp, setTotp] = useState<TotpState | null>(null)
  const started = useRef(false)
  const callbackCaptured = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => { headingRef.current?.focus() }, [error, totp])

  useLayoutEffect(() => {
    if (callbackCaptured.current) return
    callbackCaptured.current = true
    const params = new URLSearchParams(window.location.search)
    const handoffCode = params.get('code') ?? ''
    const callbackError = params.has('error') || !handoffCode
    const verifier = callbackError ? '' : sessionStorage.getItem(ssoVerifierStorageKey) ?? ''
    window.history.replaceState({}, '', '/sso/callback')
    sessionStorage.removeItem(ssoVerifierStorageKey)
    queueMicrotask(() => setCallback({ code: handoffCode, verifier, failed: callbackError }))
  }, [])

  useEffect(() => {
    if (!callback?.code || started.current) return
    started.current = true
    if (!callback.verifier) {
      queueMicrotask(() => setCallback((current) => current ? { ...current, failed: true } : current))
      return
    }
    void completeSsoHandoff(callback.code, callback.verifier).then(async (result) => {
      if ('status' in result && result.status === 'TOTP_SETUP_REQUIRED') {
        setTotp({ kind: 'setup', provisioning: await beginTotpSetup(result.setupToken) })
      } else if ('status' in result && result.status === 'TOTP_REQUIRED') {
        setTotp({ kind: 'challenge', challengeToken: result.challengeToken })
      } else {
        sessionStorage.removeItem(ssoInvitationStorageKey)
        navigate('/')
      }
    }).catch(() => setCallback((current) => current ? { ...current, failed: true } : current))
  }, [callback, completeSsoHandoff, beginTotpSetup, navigate])

  async function submitTotp(value: string) {
    if (!totp) return
    if (totp.kind === 'setup') await confirmTotpSetup(totp.provisioning.setupToken, value)
    else await verifyTotpChallenge(totp.challengeToken, value)
    sessionStorage.removeItem(ssoInvitationStorageKey)
    sessionStorage.removeItem(ssoVerifierStorageKey)
    navigate('/')
  }

  async function retry() {
    setCallback((current) => current ? { ...current, failed: false } : current)
    try { await redirectToGoogleSso(sessionStorage.getItem(ssoInvitationStorageKey) ?? undefined) }
    catch { setCallback((current) => current ? { ...current, failed: true } : current) }
  }

  function abandon() {
    sessionStorage.removeItem(ssoInvitationStorageKey)
    sessionStorage.removeItem(ssoVerifierStorageKey)
    navigate('/login')
  }

  if (totp) return <TotpAuthenticationStep
    kind={totp.kind}
    provisioningUri={totp.kind === 'setup' ? totp.provisioning.provisioningUri : undefined}
    onSubmitCode={submitTotp}
    onCancel={abandon}
    onExpired={() => { setTotp(null); setCallback((current) => current ? { ...current, failed: true } : current) }}
  />

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="sso-callback-heading" aria-busy={!error}>
      <h1 id="sso-callback-heading" ref={headingRef} tabIndex={-1}>{error ? t('ssoErrorHeading') : t('ssoProcessing')}</h1>
      {error ? <>
        <p className={styles.error} role="alert">{t('ssoFailed')}</p>
        <button className={styles.submit} type="button" onClick={retry}>{t('ssoRetry')}</button>
        <button className={styles.cancel} type="button" onClick={abandon}>{t('ssoUseLocal')}</button>
      </> : <p role="status">{t('ssoProcessing')}</p>}
    </section>
  </main>
}
