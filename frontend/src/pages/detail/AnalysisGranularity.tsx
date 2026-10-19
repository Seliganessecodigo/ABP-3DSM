import type { AnalysisGranularityCapabilities } from '../../features/analysis/source.ts'
import styles from './AnalysisGranularity.module.css'

export type AnalysisGranularityLabels = Readonly<{
  heading: string
  unavailable: string
  unsupported: string
  repair: string
}>

export function AnalysisGranularity({ capabilities, requestedValue, onChange, labels, compact = false }: Readonly<{
  capabilities: AnalysisGranularityCapabilities
  requestedValue: string | null
  onChange: (value: string) => void
  labels: AnalysisGranularityLabels
  compact?: boolean
}>) {
  const sectionClass = compact ? `${styles.section} ${styles.compact}` : styles.section
  if (capabilities.status === 'unavailable') {
    return <section className={sectionClass} aria-labelledby="analysis-granularity-heading">
      <h2 id="analysis-granularity-heading">{labels.heading}</h2>
      <output className={styles.unavailable}>{labels.unavailable}</output>
    </section>
  }

  const requestedIsSupported = capabilities.options.some(({ value }) => value === requestedValue)
  const selectedValue = capabilities.options.some(({ value }) => value === capabilities.selectedValue)
    ? capabilities.selectedValue
    : null

  return <section className={sectionClass} aria-labelledby="analysis-granularity-heading">
    <fieldset className={styles.options} aria-labelledby="analysis-granularity-heading">
      <h2 id="analysis-granularity-heading">{labels.heading}</h2>
      {requestedValue !== null && !requestedIsSupported && <div className={styles.alert} role="alert">
        <p>{labels.unsupported}</p>
        <button type="button" className={styles.repair} disabled={selectedValue === null}
          onClick={() => selectedValue !== null && onChange(selectedValue)}>{labels.repair}</button>
      </div>}
      <div className={styles.choices}>
        {capabilities.options.map(({ value, label }) => <button key={value} type="button"
          className={styles.option} aria-pressed={selectedValue === value}
          onClick={() => onChange(value)}>{label}</button>)}
      </div>
    </fieldset>
  </section>
}
