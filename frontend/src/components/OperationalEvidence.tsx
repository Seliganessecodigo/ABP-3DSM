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
  heading: string; title: string; calculability: string; refresh: string; retry: string; loading: string; error: string; empty: string
  selectionUnavailable: string; stale: string; current: string; showingPrevious: string; interval: string
  received: string; metric: string; value: string; status: string; available: string; zero: string
  missing: string; invalid: string; noValue: string; zeroNote: string
  searchLabel: string; searchPlaceholder: string; metricFilter: string; allMetrics: string
  filtersHeading: string
  statusFilter: string; allStatuses: string; clearFilters: string; noMatches: string
  filteredCount: (count: number, total: number) => string
  metrics: { cpu: string; memory: string; disk: string; network: string }
}

function formatMetricValue(value: number | null, unit: string | null, formatNumber: (value: number) => string) {
  if (value === null) return ''
  const suffix = unit ? ` ${unit}` : ''
  return `${formatNumber(value)}${suffix}`
}

function sortPresentation(query: OperationalEvidenceQuery['sort'], column: OperationalEvidenceQuery['sort']['column']):
  Readonly<{ ariaSort: 'ascending' | 'descending' | 'none'; indicator: string }> {
  if (query.column !== column) return { ariaSort: 'none', indicator: '' }
  if (query.direction === 'asc') return { ariaSort: 'ascending', indicator: ' \u2191' }
  return { ariaSort: 'descending', indicator: ' \u2193' }
}

export function OperationalEvidence({ evidence, loading, notFound, selected, error, refreshing, calculability,
  labels, formatDate, formatNumber, onRefresh, locale, query, onQueryChange, compact = false }: Readonly<{
  evidence: CollectionEvidence | null; loading: boolean; notFound: boolean; selected: boolean; error: boolean
  refreshing: boolean; calculability: string; labels: Labels; formatDate: (value: string) => string
  formatNumber: (value: number) => string; onRefresh: () => void; locale: string
  query: OperationalEvidenceQuery; onQueryChange: (query: OperationalEvidenceQuery) => void
  compact?: boolean
}>) {
  const metricKeys: MetricKey[] = ['cpu', 'memory', 'disk', 'network']
  const statusLabel = (key: MetricKey) => {
    const metric = evidence?.metrics[key]
    if (!metric) return ''
    if (metric.status === 'available') return metric.value === 0 ? labels.zero : labels.available
    if (metric.status === 'missing') return labels.missing
    return labels.invalid
  }
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale)
  const visibleMetrics = evidence ? metricKeys.filter((key) => {
    const metric = evidence.metrics[key]
    const displayedValue = formatMetricValue(metric.value, metric.unit, formatNumber)
    const content = normalize([labels.metrics[key], displayedValue, statusLabel(key)].join(' '))
    return (!query.metric || query.metric === key) && (!query.status || query.status === metric.status) &&
      (!query.search || content.includes(normalize(query.search)))
  }) : []
  const collator = new Intl.Collator(locale, { sensitivity: 'base' })
  const rows = [...visibleMetrics].sort((left, right) => {
    const leftText = query.sort.column === 'metric' ? labels.metrics[left] : statusLabel(left)
    const rightText = query.sort.column === 'metric' ? labels.metrics[right] : statusLabel(right)
    const order = collator.compare(leftText, rightText)
    if (order === 0) return left.localeCompare(right)
    return query.sort.direction === 'asc' ? order : -order
  })
  const toggleSort = (column: OperationalEvidenceQuery['sort']['column']) => onQueryChange({
    ...query,
    sort: { column, direction: query.sort.column === column && query.sort.direction === 'asc' ? 'desc' : 'asc' },
  })
  const metricSort = sortPresentation(query.sort, 'metric')
  const statusSort = sortPresentation(query.sort, 'status')
  return <section className={`${styles.card}${compact ? ` ${styles.compact}` : ''}`} aria-label={labels.heading}>
    <header className={styles.heading}><h2>{labels.title}</h2>
      <ActionButton aria-label={labels.refresh} onClick={onRefresh} disabled={refreshing}>{labels.refresh}</ActionButton>
    </header>
    {!compact && <p>{labels.calculability}: {calculability}</p>}
    {loading && !evidence && <p role="status">{labels.loading}</p>}
    {error && !evidence && <div role="alert"><p>{labels.error}</p><ActionButton onClick={onRefresh}>{labels.retry}</ActionButton></div>}
    {notFound && !evidence && <p role="status">{selected ? labels.selectionUnavailable : labels.empty}</p>}
    {evidence && <>
      {error && <p role="alert">{labels.error}</p>}
      <p className={styles.freshness}>{evidence.isStale ? labels.stale : labels.current}{error && <> · {labels.showingPrevious}</>}</p>
      {notFound && selected && <p role="status">{labels.selectionUnavailable}</p>}
      <details className={styles.filtersDisclosure} open={!compact}><summary>{labels.filtersHeading}</summary>
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
      <div className={styles.filteredCount}><output aria-live="polite">{labels.filteredCount(rows.length, metricKeys.length)}</output></div>
      </details>
      <table className={styles.table}><thead><tr><th scope="col" aria-sort={metricSort.ariaSort}><button type="button" className={styles.sortButton} onClick={() => toggleSort('metric')}>{labels.metric}<span aria-hidden="true">{metricSort.indicator}</span></button></th><th scope="col">{labels.value}</th><th scope="col" aria-sort={statusSort.ariaSort}><button type="button" className={styles.sortButton} onClick={() => toggleSort('status')}>{labels.status}<span aria-hidden="true">{statusSort.indicator}</span></button></th></tr></thead>
        <tbody>{rows.map((key) => {
          const metric = evidence.metrics[key]
          const status = statusLabel(key)
          return <tr key={key}><th scope="row">{labels.metrics[key]}</th>
            <td>{metric.value === null ? labels.noValue : formatMetricValue(metric.value, metric.unit, formatNumber)}</td><td><span className={`${styles.status}${metric.status === 'available' ? ` ${styles.statusAvailable}` : metric.status === 'missing' ? ` ${styles.statusMissing}` : ` ${styles.statusInvalid}`}`}>{status}</span></td></tr>
        })}</tbody>
      </table>
      {rows.length === 0 && <div className={styles.noMatches}><output aria-live="polite">{labels.noMatches}</output></div>}
      <p className={styles.note}>{labels.zeroNote}</p>
      {error && <ActionButton onClick={onRefresh}>{labels.retry}</ActionButton>}
    </>}
  </section>
}
