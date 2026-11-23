import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { CardIcon } from '../../components/CardIcon.tsx'
import type { CollectionSuccess } from '../../features/analysis/environmentalSummary.ts'
import styles from './DashboardPage.module.css'

export function CollectionSuccessCard({ summary }: Readonly<{ summary?: CollectionSuccess }>) {
  const { t, i18n } = useTranslation('dashboard')
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const rate = summary?.rate ?? null
  const percentage = rate === null ? '—' : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(rate)
  const number = new Intl.NumberFormat(locale)
  return <article id="dashboard-collection-success" className={`${styles.card} ${styles.coverageCard}`}>
    <h2><CardIcon icon={faCircleCheck} size="small" inline />{t('collectionSuccess.title')}</h2>
    {!summary || rate === null ? <><p className={styles.metricValue}>—</p><p className={styles.coverageLine}>{t(summary ? 'collectionSuccess.empty' : 'collectionSuccess.unavailable')}</p></> : <>
      <div className={styles.coverageVisual}>
        <div className={styles.coverageRing} role="img" aria-label={`${t('collectionSuccess.title')}: ${percentage}`}
          style={{ background: `conic-gradient(var(--accent-default) ${rate * 100}%, var(--control-hover) 0)` }}><strong>{percentage}</strong></div>
        <dl className={styles.coverageList}>
          <div><dt>{t('collectionSuccess.successful')}</dt><dd>{number.format(summary.successful)}</dd></div>
          <div><dt>{t('collectionSuccess.total')}</dt><dd>{number.format(summary.total)}</dd></div>
        </dl>
      </div>
      {summary?.firstAttemptAt && <p className={styles.coverageLine}>{t('collectionSuccess.since', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(summary.firstAttemptAt)) })}</p>}
    </>}
  </article>
}
