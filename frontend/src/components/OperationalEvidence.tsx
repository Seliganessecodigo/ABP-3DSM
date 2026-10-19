import type { CollectionEvidence, MetricStatus } from '../features/applications/api.ts'
import styles from './OperationalEvidence.module.css'
import { ActionButton } from './ActionButton.tsx'

export type MetricKey = keyof CollectionEvidence['metrics']
export type OperationalEvidenceQuery = {
  search: string
  metric: MetricKey | ''
  status: MetricStatus | ''
  sort: { column: 'metric' | 'status'; direction: 'asc' | 'desc' }
}

type Labels = {
  heading: string; calculability: string; refresh: string; retry: string; loading: string; error: string; empty: string
  selectionUnavailable: string; stale: string; current: string; showingPrevious: string; interval: string
  received: string; metric: string; value: string; status: string; available: string; zero: string
  missing: string; invalid: string; noValue: string; zeroNote: string
  searchLabel: string; searchPlaceholder: string; metricFilter: string; allMetrics: string
  statusFilter: string; allStatuses: string; clearFilters: string; noMatches: string
  filteredCount: (count: number, total: number) => string
  metrics: { cpu: string; memory: string; disk: string; network: string }
}

export function OperationalEvidence({ evidence, loading, notFound, selected, error, refreshing, calculability,
  labels, formatDate, formatNumber, onRefresh, locale, query, onQueryChange }: Readonly<{
  evidence: CollectionEvidence | null; loading: boolean; notFound: boolean; selected: boolean; error: boolean
  refreshing: boolean; calculability: string; labels: Labels; formatDate: (value: string) => string
  formatNumber: (value: number) => string; onRefresh: () => void; locale: string
  query: OperationalEvidenceQuery; onQueryChange: (query: OperationalEvidenceQuery) => void
}>) {
  const metricKeys: MetricKey[] = ['cpu', 'memory', 'disk', 'network']
  const statusLabel = (key: MetricKey) => {
    const metric = evidence?.metrics[key]
    if (!metric) return ''
    if (metric.status === 'available') return metric.value === 0 ? labels.zero : labels.available
    return metric.status === 'missing' ? labels.missing : labels.invalid
  }
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale)
  const visibleMetrics = evidence ? metricKeys.filter((key) => {
    const metric = evidence.metrics[key]
    const displayedValue = metric.value === null ? '' : `${formatNumber(metric.value)}${metric.unit ? ` ${metric.unit}` : ''}`
    const content = normalize([labels.metrics[key], displayedValue, statusLabel(key)].join(' '))
    return (!query.metric || query.metric === key) && (!query.status || query.status === metric.status) &&
      (!query.search || content.includes(normalize(query.search)))
  }) : []
  const collator = new Intl.Collator(locale, { sensitivity: 'base' })
  const rows = [...visibleMetrics].sort((left, right) => {
    const leftText = query.sort.column === 'metric' ? labels.metrics[left] : statusLabel(left)
    const rightText = query.sort.column === 'metric' ? labels.metrics[right] : statusLabel(right)
    const order = collator.compare(leftText, rightText)
    return order === 0 ? left.localeCompare(right) : query.sort.direction === 'asc' ? order : -order
  })
  const toggleSort = (column: OperationalEvidenceQuery['sort']['column']) => onQueryChange({
    ...query,
    sort: { column, direction: query.sort.column === column && query.sort.direction === 'asc' ? 'desc' : 'asc' },
  })
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
      <div className={styles.filters}>
        <label className={styles.search}>{labels.searchLabel}<input type="search" placeholder={labels.searchPlaceholder} value={query.search} onChange={(event) => onQueryChange({ ...query, search: event.target.value })} /></label>
        <label className={styles.filter}>{labels.metricFilter}<select value={query.metric} onChange={(event) => onQueryChange({ ...query, metric: metricKeys.find((key) => key === event.target.value) ?? '' })}><option value="">{labels.allMetrics}</option>{metricKeys.map((key) => <option key={key} value={key}>{labels.metrics[key]}</option>)}</select></label>
        <label className={styles.filter}>{labels.statusFilter}<select value={query.status} onChange={(event) => onQueryChange({ ...query, status: (['available', 'missing', 'invalid'] as const).find((status) => status === event.target.value) ?? '' })}><option value="">{labels.allStatuses}</option><option value="available">{labels.available}</option><option value="missing">{labels.missing}</option><option value="invalid">{labels.invalid}</option></select></label>
        <button type="button" className={styles.clearFilters} disabled={!query.search && !query.metric && !query.status} onClick={() => onQueryChange({ ...query, search: '', metric: '', status: '' })}>{labels.clearFilters}</button>
      </div>
      <p className={styles.filteredCount} aria-live="polite">{labels.filteredCount(rows.length, metricKeys.length)}</p>
      <table className={styles.table}><thead><tr><th scope="col" aria-sort={query.sort.column === 'metric' ? query.sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className={styles.sortButton} onClick={() => toggleSort('metric')}>{labels.metric}<span aria-hidden="true">{query.sort.column === 'metric' ? query.sort.direction === 'asc' ? ' \u2191' : ' \u2193' : ''}</span></button></th><th scope="col">{labels.value}</th><th scope="col" aria-sort={query.sort.column === 'status' ? query.sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className={styles.sortButton} onClick={() => toggleSort('status')}>{labels.status}<span aria-hidden="true">{query.sort.column === 'status' ? query.sort.direction === 'asc' ? ' \u2191' : ' \u2193' : ''}</span></button></th></tr></thead>
        <tbody>{rows.map((key) => {
          const metric = evidence.metrics[key]
          const status = statusLabel(key)
          return <tr key={key}><th scope="row">{labels.metrics[key]}</th>
            <td>{metric.value === null ? labels.noValue : `${formatNumber(metric.value)}${metric.unit ? ` ${metric.unit}` : ''}`}</td><td>{status}</td></tr>
        })}</tbody>
      </table>
      {rows.length === 0 && <p className={styles.noMatches} role="status">{labels.noMatches}</p>}
      <p className={styles.note}>{labels.zeroNote}</p>
      {error && <ActionButton onClick={onRefresh}>{labels.retry}</ActionButton>}
    </>}
  </section>
}
