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
      <p>{readingUnavailableLabel(reading.status, labels)}</p>
      <p>{labels.reasons[reading.reason]}</p>
    </div>
  }

  return <p className={styles.value}>{new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(reading.value)} {reading.unit}</p>
}

function readingUnavailableLabel(status: AnalysisReading['status'], labels: AnalysisCompositionLabels) {
  return status === 'not-calculable' ? labels.notCalculable : labels.metricUnavailable
}

export function AnalysisComposition({ result, totals, locale, formatDate, labels, compact = false }: Readonly<{
  result: AnalysisCompositionResult
  totals: Readonly<{ energy: AnalysisReading; emissions: AnalysisReading }> | null
  locale: string
  formatDate: (value: string) => string
  labels: AnalysisCompositionLabels
  compact?: boolean
}>) {
  const interval = (from: string, to: string) => `${formatDate(from)} – ${formatDate(to)}`

  const reasonLabel = (reason: string) => Object.hasOwn(labels.reasons, reason)
    ? labels.reasons[reason as AnalysisPresentationReason]
    : reason
  const compactLayout = compact && result.status !== 'available'

  return <section className={`${styles.section}${compactLayout ? ` ${styles.compact}` : ''}`} aria-label={labels.heading}>
    <h2>{labels.heading}</h2>
{totals !== null && <section className={styles.totals} aria-label={labels.totalsHeading}>
      <h3>{labels.totalsHeading}</h3>
      <div className={styles.totalGrid}>
        <fieldset className={styles.total} aria-labelledby="composition-energy-heading">
          <h4 id="composition-energy-heading">{labels.energy}</h4>
          <Reading reading={totals.energy} locale={locale} labels={labels} />
        </fieldset>
        <fieldset className={styles.total} aria-labelledby="composition-emissions-heading">
          <h4 id="composition-emissions-heading">{labels.emissions}</h4>
          <Reading reading={totals.emissions} locale={locale} labels={labels} />
        </fieldset>
      </div>
    </section>}
    {result.status === 'empty' && <output className={styles.state}>{labels.empty}</output>}
    {result.status === 'unavailable' && <output className={styles.state}>
      <span>{reasonLabel(result.reason) === labels.unavailable ? labels.unavailable : `${labels.unavailable}: ${reasonLabel(result.reason)}`}</span>
    </output>}
    {result.status === 'available' && <>
      {result.contributions.length === 0 && result.exclusions.length === 0
        ? <output className={styles.state}>{labels.empty}</output>
        : <>
          {result.contributions.length > 0 && <section className={styles.listSection} aria-label={labels.contributionsHeading}>
            <h3>{labels.contributionsHeading}</h3>
            <ul className={styles.list}>
              {result.contributions.map((contribution) => <li key={contribution.id}>
                <fieldset className={styles.entry} aria-labelledby={`composition-contribution-${contribution.id}`}>
                  <h4 id={`composition-contribution-${contribution.id}`}>{contribution.label}</h4>
                  <dl className={styles.details}>
                    <div><dt>{labels.interval}</dt><dd>{interval(contribution.from, contribution.to)}</dd></div>
                    <div><dt>{labels.source}</dt><dd>{contribution.source}</dd></div>
                  </dl>
                  <div className={styles.readings}>
                    <div><h5>{labels.energy}</h5><Reading reading={contribution.energy} locale={locale} labels={labels} /></div>
                    <div><h5>{labels.emissions}</h5><Reading reading={contribution.emissions} locale={locale} labels={labels} /></div>
                  </div>
                </fieldset>
              </li>)}
            </ul>
          </section>}
          {result.exclusions.length > 0 && <section className={styles.listSection} aria-label={labels.exclusionsHeading}>
            <h3>{labels.exclusionsHeading}</h3>
            <ul className={styles.list}>
              {result.exclusions.map((exclusion) => <li key={exclusion.id}>
                <fieldset className={styles.exclusion} aria-labelledby={`composition-exclusion-${exclusion.id}`}>
                  <h4 id={`composition-exclusion-${exclusion.id}`}>{exclusion.label}</h4>
                  <dl className={styles.details}>
                    <div><dt>{labels.interval}</dt><dd>{interval(exclusion.from, exclusion.to)}</dd></div>
                    <div><dt>{labels.reason}</dt><dd>{exclusion.reason}</dd></div>
                  </dl>
                </fieldset>
              </li>)}
            </ul>
          </section>}
        </>}
    </>}
  </section>
}
