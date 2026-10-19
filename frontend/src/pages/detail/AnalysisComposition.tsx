import type { AnalysisCompositionResult, AnalysisPresentationReason, AnalysisReading } from '../../features/analysis/source.ts'
import styles from './AnalysisComposition.module.css'

export type AnalysisCompositionLabels = Readonly<{
  heading: string
  totalsHeading: string
  contributionsHeading: string
  exclusionsHeading: string
  energy: string
  emissions: string
  interval: string
  source: string
  reason: string
  empty: string
  unavailable: string
  notCalculable: string
  metricUnavailable: string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>

function Reading({ reading, locale, labels }: Readonly<{
  reading: AnalysisReading
  locale: string
  labels: AnalysisCompositionLabels
}>) {
  if (reading.status !== 'available') {
    return <div className={styles.unavailable}>
      <p>{reading.status === 'not-calculable' ? labels.notCalculable : labels.metricUnavailable}</p>
      <p>{labels.reasons[reading.reason]}</p>
    </div>
  }

  return <p className={styles.value}>{new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(reading.value)} {reading.unit}</p>
}

export function AnalysisComposition({ result, totals, locale, formatDate, labels }: Readonly<{
  result: AnalysisCompositionResult
  totals: Readonly<{ energy: AnalysisReading; emissions: AnalysisReading }> | null
  locale: string
  formatDate: (value: string) => string
  labels: AnalysisCompositionLabels
}>) {
  const interval = (from: string, to: string) => `${formatDate(from)} – ${formatDate(to)}`

  return <section className={styles.section} aria-label={labels.heading}>
    <h2>{labels.heading}</h2>
{totals !== null && <section className={styles.totals} aria-label={labels.totalsHeading}>
      <h3>{labels.totalsHeading}</h3>
      <div className={styles.totalGrid}>
        <div className={styles.total} role="group" aria-label={labels.energy}>
          <h4>{labels.energy}</h4>
          <Reading reading={totals.energy} locale={locale} labels={labels} />
        </div>
        <div className={styles.total} role="group" aria-label={labels.emissions}>
          <h4>{labels.emissions}</h4>
          <Reading reading={totals.emissions} locale={locale} labels={labels} />
        </div>
      </div>
    </section>}
    {result.status === 'empty' && <p className={styles.state} role="status">{labels.empty}</p>}
    {result.status === 'unavailable' && <div className={styles.state} role="status">
      <p>{labels.unavailable}</p>
      <p>{result.reason}</p>
    </div>}
    {result.status === 'available' && <>
      {result.contributions.length === 0 && result.exclusions.length === 0
        ? <p className={styles.state} role="status">{labels.empty}</p>
        : <>
          {result.contributions.length > 0 && <section className={styles.listSection} aria-label={labels.contributionsHeading}>
            <h3>{labels.contributionsHeading}</h3>
            <ul className={styles.list}>
              {result.contributions.map((contribution) => <li key={contribution.id}>
                <article className={styles.entry} role="group" aria-label={contribution.label}>
                  <h4>{contribution.label}</h4>
                  <dl className={styles.details}>
                    <div><dt>{labels.interval}</dt><dd>{interval(contribution.from, contribution.to)}</dd></div>
                    <div><dt>{labels.source}</dt><dd>{contribution.source}</dd></div>
                  </dl>
                  <div className={styles.readings}>
                    <div><h5>{labels.energy}</h5><Reading reading={contribution.energy} locale={locale} labels={labels} /></div>
                    <div><h5>{labels.emissions}</h5><Reading reading={contribution.emissions} locale={locale} labels={labels} /></div>
                  </div>
                </article>
              </li>)}
            </ul>
          </section>}
          {result.exclusions.length > 0 && <section className={styles.listSection} aria-label={labels.exclusionsHeading}>
            <h3>{labels.exclusionsHeading}</h3>
            <ul className={styles.list}>
              {result.exclusions.map((exclusion) => <li key={exclusion.id}>
                <article className={styles.exclusion} role="group" aria-label={exclusion.label}>
                  <h4>{exclusion.label}</h4>
                  <dl className={styles.details}>
                    <div><dt>{labels.interval}</dt><dd>{interval(exclusion.from, exclusion.to)}</dd></div>
                    <div><dt>{labels.reason}</dt><dd>{exclusion.reason}</dd></div>
                  </dl>
                </article>
              </li>)}
            </ul>
          </section>}
        </>}
    </>}
  </section>
}
