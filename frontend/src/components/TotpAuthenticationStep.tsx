import QRCode from 'react-qr-code'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthenticationError } from '../features/authentication/api.ts'
import styles from './TotpAuthenticationStep.module.css'

type Props = Readonly<{
  kind: 'setup' | 'challenge'
  provisioningUri?: string
  onSubmitCode: (code: string) => Promise<void>
  onCancel: () => void
  onExpired: () => void
}>

export function TotpAuthenticationStep({ kind, provisioningUri, onSubmitCode, onCancel, onExpired }: Props) {
  const { t } = useTranslation('login')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const manualSecret = provisioningUri ? new URL(provisioningUri).searchParams.get('secret') ?? '' : ''
  const isSetup = kind === 'setup'

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) {
      setError(t('totpInvalidFormat'))
      codeRef.current?.focus()
      return
    }
    setSubmitting(true)
    try {
      await onSubmitCode(code)
    } catch (cause) {
      if (cause instanceof AuthenticationError && cause.code === 'INVALID_TOTP_CHALLENGE') {
        onExpired()
      } else if (cause instanceof AuthenticationError && cause.code === 'INVALID_TOTP_CODE') {
        setCode('')
        setError(t(isSetup ? 'totpSetupInvalidCode' : 'totpChallengeInvalidCode'))
        codeRef.current?.focus()
      } else if (cause instanceof AuthenticationError && cause.status === 403) {
        setError(t('forbidden'))
        codeRef.current?.focus()
      } else if (cause instanceof AuthenticationError && cause.code === 'TOTP_CHALLENGE_RATE_LIMITED') {
        setError(t('totpRateLimited'))
        codeRef.current?.focus()
      } else if (cause instanceof AuthenticationError && cause.code === 'TOTP_CHALLENGE_DELAYED') {
        setError(t('totpDelayed'))
        codeRef.current?.focus()
      } else {
        setError(t('totpGenericError'))
        codeRef.current?.focus()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function copyManualSecret() {
    try {
      await navigator.clipboard.writeText(manualSecret)
      setCopyMessage(t('totpCopied'))
    } catch {
      setCopyMessage(t('totpCopyFailed'))
    }
  }

  return <main className={styles.page}>
    <header className={styles.heading}>
      <h1>{t('title')}</h1>
    </header>
    <section className={styles.card} aria-labelledby="totp-heading">
      <h2 id="totp-heading" ref={headingRef} tabIndex={-1}>{t(isSetup ? 'totpSetupHeading' : 'totpChallengeHeading')}</h2>
      <p>{t(isSetup ? 'totpSetupDescription' : 'totpChallengeDescription')}</p>
      {isSetup && provisioningUri && <div className={styles.provisioning}>
        <div className={styles.qrFrame} role="img" aria-label={t('totpQrLabel')}>
          <QRCode value={provisioningUri} size={208} title={t('totpQrLabel')} aria-hidden="true" />
        </div>
        <details className={styles.manual}>
          <summary>{t('totpManualSetup')}</summary>
          <p>{t('totpManualWarning')}</p>
          <code>{manualSecret}</code>
          <button className="button secondary" type="button" onClick={() => void copyManualSecret()}>{t('totpCopySecret')}</button>
          {copyMessage && <p className={styles.copyMessage} role="status">{copyMessage}</p>}
        </details>
      </div>}
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <label htmlFor="totp-code">{t('totpCodeLabel')}</label>
        <input
          ref={codeRef}
          id="totp-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-describedby={error ? 'totp-error' : undefined}
        />
        {error && <p className={styles.error} id="totp-error" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? t('totpSubmitting') : t(isSetup ? 'totpSetupSubmit' : 'totpChallengeSubmit')}
        </button>
      </form>
      <button className={styles.cancel} type="button" onClick={onCancel}>{t('totpBackToLogin')}</button>
    </section>
  </main>
}
