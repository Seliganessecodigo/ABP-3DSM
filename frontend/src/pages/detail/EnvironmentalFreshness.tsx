import styles from './EnvironmentalFreshness.module.css'

export type EnvironmentalFreshnessLabels = Readonly<{
  heading: string
  lastAttempt: string
  lastSuccess: string
  noAttempt: string
  noSuccess: string
}>

export function EnvironmentalFreshness({ lastAttemptAt, lastSuccessAt, formatDate, labels, compact = false }: Readonly<{
  lastAttemptAt: string | null
  lastSuccessAt: string | null
  formatDate: (value: string) => string
  labels: EnvironmentalFreshnessLabels
  compact?: boolean
}>) {
  return <section className={`${styles.section}${compact ? ` ${styles.compact}` : ''}`} aria-label={labels.heading}>
    <h2>{labels.heading}</h2>
    <dl className={styles.timestamps}>
      <div><dt>{labels.lastAttempt}</dt><dd>{lastAttemptAt ? formatDate(lastAttemptAt) : labels.noAttempt}</dd></div>
      <div><dt>{labels.lastSuccess}</dt><dd>{lastSuccessAt ? formatDate(lastSuccessAt) : labels.noSuccess}</dd></div>
    </dl>
  </section>
}
