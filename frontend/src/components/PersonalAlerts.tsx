import { useTranslation } from 'react-i18next'
import type { PersonalAlertApplication } from '../features/preferences/alerts.ts'
import type { PersonalAlertsState } from '../features/preferences/usePersonalAlerts.ts'
import styles from './PersonalAlerts.module.css'

export function PersonalAlertBadges({ application }: Readonly<{ application?: PersonalAlertApplication }>) {
  const { t, i18n } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const number = (value: number) => new Intl.NumberFormat(i18n.resolvedLanguage ?? 'pt-BR', { maximumFractionDigits: 3 }).format(value)
  const date = (value: string) => new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))
  return <div className={styles.badges}>{application?.evaluations.filter(item => item.status !== 'within').map(item => <div key={item.metric} className={item.status === 'exceeded' ? styles.warning : styles.unknown}>
    <strong>{t(`alertMetric.${item.metric}`)} · {t(item.status === 'exceeded' ? 'alertExceeded' : 'alertInsufficient')}</strong>
    <span>{item.value === null ? t('alertMissing') : `${number(item.value)} ${item.unit}`} · {t('alertLimit', { value: number(item.threshold), unit: item.unit })}</span>
    <small>{date(item.from)} → {date(item.to)} UTC · {t('alertCoverage', { value: number(item.coveragePercent) })}</small>
  </div>)}</div>
}
export function PersonalAlertsPanel({ state, applicationId, preview = false }: Readonly<{ state: PersonalAlertsState; applicationId?: string; preview?: boolean }>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  if (!preview && !state.loading && !state.error && !state.data?.configured) return null
  const applications = state.data?.applications.filter(item => (!applicationId || item.applicationId === applicationId) && item.evaluations.some(alert => alert.status !== 'within')) ?? []
  return <section className={styles.panel} aria-label={t('personalAlerts')} aria-busy={state.loading}>
    <h2>{t('personalAlerts')}</h2>
    <p>{t(preview ? 'realPreview' : 'personalAlertsNote')}</p>
    {state.loading && <output>{t('alertsLoading')}</output>}
    {state.error && <p role="alert">{t('alertsUnavailable')}</p>}
    {!state.loading && !state.error && <>
      {!state.data?.configured ? <p>{t('alertsDisabled')}</p> : !state.data.applications.length ? <p>{t('alertsEmpty')}</p> : !applications.length ? <p>{t('alertsNone')}</p> : <div className={styles.list}>{applications.map(application => <article key={application.applicationId}><h3>{application.name}</h3><PersonalAlertBadges application={application} /></article>)}</div>}
    </>}
  </section>
}
