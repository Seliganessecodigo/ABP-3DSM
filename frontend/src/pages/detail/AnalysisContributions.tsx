import type { AnalysisContributionsPage } from '../../features/analysis/source.ts'
import styles from './AnalysisContributions.module.css'
import { LoadingState } from '../../components/LoadingState.tsx'

type Labels = Readonly<{
  heading: string
  loading: string
  error: string
  collection: string
  originalInterval: string
  countedInterval: string
  collectedAt: string
  energy: string
  emissions: string
  methodology: string
  factor: string
  totals: string
  coverage: string
  originalValue: string
  countedValue: string
  durationRatio: string
  exclusions: string
  reason: string
  parameters: string
  contractVersion: string
  factorId: string
  country: string
  region: string
  regionCode: string
  city: string
  intensity: string
  source: string
  queriedAt: string
  validFrom: string
  validUntil: string
  reasons: Readonly<Record<string, string>>
  pageStatus: (current: number, total: number) => string
}>

export function AnalysisContributions({ data, loading, error, locale, formatDate, labels }: Readonly<{
  data: AnalysisContributionsPage | null
  loading: boolean
  error: boolean
  locale: string
  formatDate: (value: string) => string
  labels: Labels
}>) {
  const number = (value: number | null, unit: string) => value === null
    ? '—'
    : `${new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)} ${unit}`
  const coverage = (value: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(value)
  const validityDate = (value: string) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
  const reasons = (values: readonly Readonly<{ code: string; metric?: string }>[]) => values.map(({ code, metric }) =>
    `${labels.reasons[code] ?? code}${metric ? ` (${metric})` : ''}`).join(', ')
  if (data === null && !loading && !error) return null
  return <section className={styles.section} aria-label={labels.heading}>
    <h2>{labels.heading}</h2>
    {loading && <LoadingState title={labels.loading} compact />}
    {error && <output role="alert">{labels.error}</output>}
    {data && <>
      <section className={styles.totals} aria-label={labels.totals}>
        <h3>{labels.totals}</h3>
        <p>{labels.energy}: {data.totals.energy.status === 'available' ? number(data.totals.energy.value, data.totals.energy.unit) : '—'}</p>
        <p>{labels.emissions}: {data.totals.emissions.status === 'available' ? number(data.totals.emissions.value, data.totals.emissions.unit) : '—'}</p>
        <p>{labels.coverage}: {coverage(data.coverage.energy)} / {coverage(data.coverage.emissions)}</p>
      </section>
      <ol className={styles.list}>
        {data.contributions.map((contribution) => <li key={`${contribution.collectionId}-${contribution.countedInterval.from}-${contribution.countedInterval.to}`}>
          <h3>{labels.collection}: {contribution.collectionId}</h3>
          <dl>
            <div><dt>{labels.originalInterval}</dt><dd>{formatDate(contribution.originalInterval.from)} – {formatDate(contribution.originalInterval.to)}</dd></div>
            <div><dt>{labels.countedInterval}</dt><dd>{formatDate(contribution.countedInterval.from)} – {formatDate(contribution.countedInterval.to)}</dd></div>
            <div><dt>{labels.collectedAt}</dt><dd>{formatDate(contribution.collectedAt)}</dd></div>
            <div><dt>{labels.energy}</dt><dd>{labels.originalValue}: {number(contribution.energy.originalValue, contribution.energy.unit)} · {labels.countedValue}: {number(contribution.energy.value, contribution.energy.unit)}</dd></div>
            <div><dt>{labels.emissions}</dt><dd>{labels.originalValue}: {number(contribution.emissions.originalValue, contribution.emissions.unit)} · {labels.countedValue}: {number(contribution.emissions.value, contribution.emissions.unit)}</dd></div>
            <div><dt>{labels.durationRatio}</dt><dd>{new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(contribution.durationRatio)}</dd></div>
            {contribution.energy.reasons.length > 0 && <div><dt>{labels.reason} · {labels.energy}</dt><dd>{reasons(contribution.energy.reasons)}</dd></div>}
            {contribution.emissions.reasons.length > 0 && <div><dt>{labels.reason} · {labels.emissions}</dt><dd>{reasons(contribution.emissions.reasons)}</dd></div>}
            {contribution.methodology && <div><dt>{labels.methodology}</dt><dd><span>{contribution.methodology.key}</span><span>{contribution.methodology.version}</span></dd></div>}
            {contribution.methodology && Object.entries(contribution.methodology.parameters).length > 0 && <div><dt>{labels.parameters}</dt><dd>{Object.entries(contribution.methodology.parameters).map(([key, value]) => `${key}: ${new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)}`).join(', ')}</dd></div>}
            {contribution.factorSnapshot && <>
              <div><dt>{labels.factor}</dt><dd>{contribution.factorSnapshot.version}</dd></div>
              {contribution.factorSnapshot.id !== null && <div><dt>{labels.factorId}</dt><dd>{contribution.factorSnapshot.id}</dd></div>}
              {contribution.factorSnapshot.contractVersion !== null && <div><dt>{labels.contractVersion}</dt><dd>{contribution.factorSnapshot.contractVersion}</dd></div>}
              {contribution.factorSnapshot.regionCode !== null && <div><dt>{labels.regionCode}</dt><dd>{contribution.factorSnapshot.regionCode}</dd></div>}
              {contribution.factorSnapshot.country !== null && <div><dt>{labels.country}</dt><dd>{contribution.factorSnapshot.country}</dd></div>}
              {contribution.factorSnapshot.region !== null && <div><dt>{labels.region}</dt><dd>{contribution.factorSnapshot.region}</dd></div>}
              {contribution.factorSnapshot.city !== null && <div><dt>{labels.city}</dt><dd>{contribution.factorSnapshot.city}</dd></div>}
              {contribution.factorSnapshot.intensity !== null && contribution.factorSnapshot.unit !== null && <div><dt>{labels.intensity}</dt><dd>{number(contribution.factorSnapshot.intensity, contribution.factorSnapshot.unit)}</dd></div>}
              {contribution.factorSnapshot.source !== null && <div><dt>{labels.source}</dt><dd>{contribution.factorSnapshot.source}</dd></div>}
              {contribution.factorSnapshot.queriedAt !== null && <div><dt>{labels.queriedAt}</dt><dd>{formatDate(contribution.factorSnapshot.queriedAt)}</dd></div>}
              {contribution.factorSnapshot.validFrom !== null && <div><dt>{labels.validFrom}</dt><dd>{validityDate(contribution.factorSnapshot.validFrom)}</dd></div>}
              {contribution.factorSnapshot.validUntil !== null && <div><dt>{labels.validUntil}</dt><dd>{validityDate(contribution.factorSnapshot.validUntil)}</dd></div>}
            </>}
          </dl>
        </li>)}
      </ol>
      {data.exclusions.length > 0 && <section className={styles.exclusions} aria-label={labels.exclusions}>
        <h3>{labels.exclusions}</h3>
        <ul className={styles.list}>{data.exclusions.map((exclusion) => <li key={`${exclusion.collectionId ?? 'none'}-${exclusion.from}-${exclusion.to}`}>
          <h4>{exclusion.collectionId ?? '—'}</h4>
          <p>{formatDate(exclusion.from)} – {formatDate(exclusion.to)}</p>
          {exclusion.energyReasons.length > 0 && <p>{labels.energy}: {reasons(exclusion.energyReasons)}</p>}
          {exclusion.emissionsReasons.length > 0 && <p>{labels.emissions}: {reasons(exclusion.emissionsReasons)}</p>}
        </li>)}</ul>
      </section>}
      <output aria-live="polite">{labels.pageStatus(data.pagination.page, data.pagination.totalPages)}</output>
    </>}
  </section>
}
