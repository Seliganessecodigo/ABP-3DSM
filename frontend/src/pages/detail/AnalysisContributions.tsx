import type { AnalysisContributionsPage } from '../../features/analysis/source.ts'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './AnalysisContributions.module.css'
import { LoadingState } from '../../components/LoadingState.tsx'
import { formatNumber } from '../../utils/formatNumber.ts'

type Labels = Readonly<{
  heading: string
  historyDescription: string
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
  detailsHeading: string
  openContribution: string
  emptyContributions: string
  pageSize: string
  allRows: string
  previous: string
  next: string
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

type Contribution = AnalysisContributionsPage['contributions'][number]

function paginationPages(page: number, pageCount: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const first = page <= 3 ? 2 : page >= pageCount - 2 ? pageCount - 3 : page - 1
  const last = page <= 3 ? 4 : page >= pageCount - 2 ? pageCount - 1 : page + 1
  return [1, ...(first > 2 ? ['ellipsis-start' as const] : []), ...Array.from({ length: last - first + 1 }, (_, index) => first + index), ...(last < pageCount - 1 ? ['ellipsis-end' as const] : []), pageCount]
}

export function AnalysisContributions({ data, loading, error, locale, formatDate, labels, onPaginationChange, historyLayout = false, collectionHref, timeZone = 'UTC' }: Readonly<{
  data: AnalysisContributionsPage | null
  loading: boolean
  error: boolean
  locale: string
  formatDate: (value: string) => string
  labels: Labels
  onPaginationChange?: (page: number, pageSize: number | 'all') => void
  historyLayout?: boolean
  collectionHref?: (collectionId: string) => string
  timeZone?: string
}>) {
  const { t } = useTranslation('detail')
  const [selectedKey, setSelectedKey] = useState('')
  const interval = (from: string, to: string) => {
    const day = new Intl.DateTimeFormat(locale, { timeZone, day: '2-digit', month: '2-digit' })
    const time = new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    const sameMinute = day.format(new Date(from)) === day.format(new Date(to)) && time.format(new Date(from)) === time.format(new Date(to)) && from !== to
    const display = sameMinute ? new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }) : time
    return `${display.format(new Date(from))} → ${day.format(new Date(from)) === day.format(new Date(to)) ? '' : `${day.format(new Date(to))}, `}${display.format(new Date(to))}`
  }
  const number = (value: number | null, unit: string) => value === null
    ? '—'
    : `${new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)} ${unit}`
  const compactNumber = (value: number | null, unit: string) => value === null ? '—' : `${formatNumber(value, locale)} ${unit}`
  const coverage = (value: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(value)
  const validityDate = (value: string) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value))
  const reasons = (values: readonly Readonly<{ code: string; metric?: string }>[]) => values.map(({ code, metric }) =>
    `${labels.reasons[code] ?? code}${metric ? ` (${metric})` : ''}`).join(', ')
  const renderContribution = (contribution: Contribution, selectedHistoryContribution = false) => <li
    key={`${contribution.collectionId}-${contribution.countedInterval.from}-${contribution.countedInterval.to}`}>
    {selectedHistoryContribution
      ? <h4>{labels.countedInterval}: {formatDate(contribution.countedInterval.from)} – {formatDate(contribution.countedInterval.to)}</h4>
      : <h3>{labels.collection}: {contribution.collectionId}</h3>}
    <dl>
      {selectedHistoryContribution && <div><dt>{labels.collection}</dt><dd>{contribution.collectionId}</dd></div>}
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
  </li>
  if (data === null && !loading && !error) return null
  const contributionKey = (collectionId: string, from: string, to: string) => `${collectionId}:${from}:${to}`
  const selectedContribution = data?.contributions.find(({ collectionId, countedInterval }) =>
    contributionKey(collectionId, countedInterval.from, countedInterval.to) === selectedKey) ?? data?.contributions[0] ?? null
  const detailContributions = historyLayout
    ? selectedContribution ? [selectedContribution] : []
    : data?.contributions ?? []
  return <section className={`${styles.section} ${historyLayout ? styles.historySection : ''}`} aria-label={labels.heading}>
    <h2>{historyLayout ? <><span className={styles.desktopHeading}>{labels.heading}</span><span className={styles.mobileHeading}>{t('historyCompositionHeading')}</span></> : labels.heading}</h2>
    {historyLayout && <p>{labels.historyDescription}</p>}
    {loading && <LoadingState title={labels.loading} compact />}
    {error && <output role="alert">{labels.error}</output>}
    {data && <>
      {!historyLayout && <section className={styles.totals} aria-label={labels.totals}>
        <h3>{labels.totals}</h3>
        <p>{labels.energy}: {data.totals.energy.status === 'available' ? number(data.totals.energy.value, data.totals.energy.unit) : '—'}</p>
        <p>{labels.emissions}: {data.totals.emissions.status === 'available' ? number(data.totals.emissions.value, data.totals.emissions.unit) : '—'}</p>
        <p>{labels.coverage}: {coverage(data.coverage.energy)} / {coverage(data.coverage.emissions)}</p>
      </section>}
      {historyLayout && <div className={styles.historyTableScroll}>
        <table className={styles.historyTable} aria-label={labels.heading}>
          <thead><tr>
            <th scope="col">{labels.countedInterval}</th>
            <th scope="col">{labels.energy}</th>
            <th scope="col">{labels.emissions}</th>
            <th scope="col">{labels.durationRatio}</th>
            <th scope="col">{labels.methodology}</th>
            <th scope="col">{labels.detailsHeading}</th>
          </tr></thead>
          <tbody>{data.contributions.length === 0
            ? <tr><td colSpan={6}>{labels.emptyContributions}</td></tr>
            : data.contributions.map((contribution) => {
              const key = contributionKey(contribution.collectionId, contribution.countedInterval.from, contribution.countedInterval.to)
              const selected = key === (selectedContribution
                ? contributionKey(selectedContribution.collectionId, selectedContribution.countedInterval.from, selectedContribution.countedInterval.to)
                : '')
              return <tr key={key} aria-current={selected ? 'true' : undefined}>
                <td data-label={labels.countedInterval}><time title={`${formatDate(contribution.countedInterval.from)} – ${formatDate(contribution.countedInterval.to)}`}>{interval(contribution.countedInterval.from, contribution.countedInterval.to)}</time></td>
                <td data-label={labels.energy}>{compactNumber(contribution.energy.value, contribution.energy.unit)}</td>
                <td data-label={labels.emissions}>{compactNumber(contribution.emissions.value, contribution.emissions.unit)}</td>
                <td data-label={labels.durationRatio}>{new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(contribution.durationRatio)}</td>
                <td data-label={labels.methodology}>{contribution.methodology?.version ?? '—'}</td>
                <td data-label={labels.detailsHeading}><button type="button" aria-pressed={selected}
                  onClick={() => setSelectedKey(key)}>{labels.openContribution}</button></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>}
      {historyLayout && selectedContribution && <section className={styles.historyDetails} aria-label={labels.detailsHeading}>
        <h3>{t('historyContribution')} · {interval(selectedContribution.countedInterval.from, selectedContribution.countedInterval.to)}</h3>
        <div className={styles.selectedSummary}>
          <div>
            <p>{compactNumber(selectedContribution.energy.value, selectedContribution.energy.unit)} · {compactNumber(selectedContribution.emissions.value, selectedContribution.emissions.unit)}</p>
            <p>{labels.durationRatio}: {coverage(selectedContribution.durationRatio)}</p>
            <p>{labels.methodology}: {selectedContribution.methodology?.version ?? '—'}</p>
            {selectedContribution.factorSnapshot?.intensity !== null && selectedContribution.factorSnapshot?.intensity !== undefined && selectedContribution.factorSnapshot.unit !== null &&
              <p>{labels.factor}: {number(selectedContribution.factorSnapshot.intensity, selectedContribution.factorSnapshot.unit)}</p>}
          </div>
          {collectionHref && <a className="button secondary" href={collectionHref(selectedContribution.collectionId)}>{t('historyViewCollection')} →</a>}
        </div>
        <details className={styles.auditDetails}>
          <summary>{labels.detailsHeading} · {selectedContribution.collectionId}</summary>
          <ol className={styles.list}>{renderContribution(selectedContribution, true)}</ol>
        </details>
      </section>}
      {!historyLayout && <ol className={styles.list}>
        {detailContributions.map((contribution) => renderContribution(contribution))}
      </ol>}
      {!historyLayout && data.exclusions.length > 0 && <section className={styles.exclusions} aria-label={labels.exclusions}>
        <h3>{labels.exclusions}</h3>
        <ul className={styles.list}>{data.exclusions.map((exclusion) => <li key={`${exclusion.collectionId ?? 'none'}-${exclusion.from}-${exclusion.to}`}>
          <h4>{exclusion.collectionId ?? '—'}</h4>
          <p>{formatDate(exclusion.from)} – {formatDate(exclusion.to)}</p>
          {exclusion.energyReasons.length > 0 && <p>{labels.energy}: {reasons(exclusion.energyReasons)}</p>}
          {exclusion.emissionsReasons.length > 0 && <p>{labels.emissions}: {reasons(exclusion.emissionsReasons)}</p>}
        </li>)}</ul>
      </section>}
      <div className={styles.pagination}>
        <output aria-live="polite">{labels.pageStatus(data.pagination.page, data.pagination.totalPages)}</output>
        <label>{labels.pageSize}<select className="form-control form-control--compact" value={data.pagination.pageSize} disabled={!onPaginationChange}
          onChange={(event) => onPaginationChange?.(1, event.target.value === 'all' ? 'all' : Number(event.target.value))}>
          {[5, 10, 15, 20].map((size) => <option key={size} value={size}>{size}</option>)}
          <option value="all">{labels.allRows}</option>
        </select></label>
        <nav className={styles.pageControls} aria-label={labels.heading}>
          <button type="button" className={`button secondary ${styles.pageButton}`} aria-label={labels.previous} disabled={!onPaginationChange || data.pagination.page <= 1}
            onClick={() => onPaginationChange?.(data.pagination.page - 1, data.pagination.pageSize)}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12.5 4.5-5.5 5.5 5.5 5.5" /></svg></button>
          {paginationPages(data.pagination.page, data.pagination.totalPages).map(page => typeof page === 'number'
            ? <button key={page} type="button" aria-current={page === data.pagination.page ? 'page' : undefined}
              aria-label={labels.pageStatus(page, data.pagination.totalPages)} className={page === data.pagination.page ? styles.currentPage : styles.pageNumber}
              disabled={!onPaginationChange} onClick={() => onPaginationChange?.(page, data.pagination.pageSize)}>{page}</button>
            : <span key={page} aria-hidden="true">…</span>)}
          <button type="button" className={`button secondary ${styles.pageButton}`} aria-label={labels.next} disabled={!onPaginationChange || !data.pagination.hasNextPage}
            onClick={() => onPaginationChange?.(data.pagination.page + 1, data.pagination.pageSize)}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7.5 4.5 5.5 5.5-5.5 5.5" /></svg></button>
        </nav>
      </div>
    </>}
  </section>
}
