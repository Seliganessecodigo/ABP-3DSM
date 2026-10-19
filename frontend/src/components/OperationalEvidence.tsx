import type { CollectionEvidence } from '../features/applications/api.ts'
import styles from './OperationalEvidence.module.css'
import { ActionButton } from './ActionButton.tsx'

type Labels = {
  heading: string; calculability: string; refresh: string; retry: string; loading: string; error: string; empty: string
  selectionUnavailable: string; stale: string; current: string; showingPrevious: string; interval: string
  received: string; metric: string; value: string; status: string; available: string; zero: string
  missing: string; invalid: string; noValue: string; zeroNote: string
  metrics: { cpu: string; memory: string; disk: string; network: string }
}

export function OperationalEvidence({ evidence, loading, notFound, selected, error, refreshing, calculability,
  labels, formatDate, formatNumber, onRefresh }: Readonly<{
  evidence: CollectionEvidence | null; loading: boolean; notFound: boolean; selected: boolean; error: boolean
  refreshing: boolean; calculability: string; labels: Labels; formatDate: (value: string) => string
  formatNumber: (value: number) => string; onRefresh: () => void
}>) {
  return <section className={styles.card} aria-label={labels.heading}>
    <h2>{labels.heading}</h2>
    <p>{labels.calculability}: {calculability}</p>
    <ActionButton onClick={onRefresh} disabled={refreshing}>{labels.refresh}</ActionButton>
    {loading && !evidence && <p role="status">{labels.loading}</p>}
    {error && !evidence && <div role="alert"><p>{labels.error}</p><ActionButton onClick={onRefresh}>{labels.retry}</ActionButton></div>}
    {notFound && !evidence && <p role="status">{selected ? labels.selectionUnavailable : labels.empty}</p>}
    {evidence && <>
      {error && <p role="alert">{labels.error}</p>}
      <p className={styles.freshness}>{evidence.isStale ? labels.stale : labels.current}{error && <> · {labels.showingPrevious}</>}</p>
      {notFound && selected && <p role="status">{labels.selectionUnavailable}</p>}
      <dl className={styles.dates}>
        <div><dt>{labels.interval}</dt><dd>{formatDate(evidence.intervalStart)} – {formatDate(evidence.intervalEnd)}</dd></div>
        <div><dt>{labels.received}</dt><dd>{formatDate(evidence.collectedAt)}</dd></div>
      </dl>
      <table className={styles.table}><thead><tr><th scope="col">{labels.metric}</th><th scope="col">{labels.value}</th><th scope="col">{labels.status}</th></tr></thead>
        <tbody>{(['cpu', 'memory', 'disk', 'network'] as const).map((key) => {
          const metric = evidence.metrics[key]
          const status = metric.status === 'available' ? (metric.value === 0 ? labels.zero : labels.available) : metric.status === 'missing' ? labels.missing : labels.invalid
          return <tr key={key}><th scope="row">{labels.metrics[key]}</th>
            <td>{metric.value === null ? labels.noValue : `${formatNumber(metric.value)}${metric.unit ? ` ${metric.unit}` : ''}`}</td><td>{status}</td></tr>
        })}</tbody>
      </table>
      <p className={styles.note}>{labels.zeroNote}</p>
      {error && <ActionButton onClick={onRefresh}>{labels.retry}</ActionButton>}
    </>}
  </section>
}
