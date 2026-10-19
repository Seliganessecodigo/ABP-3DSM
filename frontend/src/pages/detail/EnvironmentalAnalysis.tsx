import { ActionButton } from '../../components/ActionButton.tsx'
import type { AnalysisFactor, AnalysisFactorResult, AnalysisMethodologyResult, AnalysisPresentationReason, AnalysisReading, AnalysisViewModel } from '../../features/analysis/source.ts'
import { AnalysisSeries } from './AnalysisSeries.tsx'
import { AnalysisComposition } from './AnalysisComposition.tsx'
import type { AnalysisCompositionLabels } from './AnalysisComposition.tsx'
import { EnvironmentalFreshness } from './EnvironmentalFreshness.tsx'
import type { EnvironmentalFreshnessLabels } from './EnvironmentalFreshness.tsx'
import type { AnalysisSeriesPageSize, AnalysisSeriesQuery } from './seriesQuery.ts'
import type { ReactNode } from 'react'
import styles from './EnvironmentalAnalysis.module.css'

type Labels = Readonly<{
  heading: string
  energy: string
  emissions: string
  factor: string
  coverage: string
  energyCoverage: string
  emissionsCoverage: string
  factorsHeading: string
  methodologyHeading: string
  composition: AnalysisCompositionLabels
  freshness: EnvironmentalFreshnessLabels
  seriesHeading: string
  moment: string
  tableEnergy: string
  tableEmissions: string
  graph: string
  table: string
  energyChart: string
  emissionsChart: string
  noPoints: string
  gapsNote: string
  pageSize: string
  allRows: string
  pageChoice: string
  pageStatus: (current: number, total: number) => string
  search: string
  searchPlaceholder: string
  from: string
  to: string
  timeZone: (zone: string) => string
  invalidDateRange: string
  energyUnit: string
  emissionsUnit: string
  selectUnit: string
  energyMin: string
  energyMax: string
  emissionsMin: string
  emissionsMax: string
  invalidNumericRange: string
  invalidUnit: string
  clearFilters: string
  mixedUnits: string
  energyStatus: string
  emissionsStatus: string
  allStatuses: string
  availableStatus: string
  unavailableStatus: string
  notCalculableStatus: string
  noMatches: string
  previous: string
  next: string
  rangeStatus: (start: number, end: number, count: number) => string
  methodologyUnavailable: string
  intensity: string
  region: string
  model: string
  modelDescription: string
  version: string
  queriedAt: string
  snapshot: string
  multipleFactors: string
  notCalculable: string
  metricUnavailable: string
  unavailable: string
  empty: string
  previousEmpty: string
  loading: string
  refreshing: string
  error: string
  previousPreserved: string
  retry: string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>

function Reading({ reading, locale, notCalculable, metricUnavailable, reasons }: Readonly<{
  reading: AnalysisReading | null
  locale: string
  notCalculable: string
  metricUnavailable: string
  reasons: Readonly<Record<AnalysisPresentationReason, string>>
}>) {
  if (!reading) return null
  if (reading.status === 'available') {
    return <p className={styles.value}>{formatAnalysisNumber(reading.value, locale)} {reading.unit}</p>
  }

  return <div className={styles.unavailable}>
    <p className={styles.value}>{reading.status === 'not-calculable' ? notCalculable : metricUnavailable}</p>
    <p>{reasons[reading.reason]}</p>
  </div>
}

function formatAnalysisNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)
}

function MetricCard({ id, title, reading, locale, labels, empty = false }: Readonly<{
  id: string
  title: string
  reading: AnalysisReading | null
  locale: string
  labels: Labels
  empty?: boolean
}>) {
  return <div className={styles.metric} role="group" aria-labelledby={id}>
    <h3 id={id}>{title}</h3>
    {empty ? null : reading
      ? <Reading reading={reading} locale={locale} notCalculable={labels.notCalculable}
        metricUnavailable={labels.metricUnavailable} reasons={labels.reasons} />
      : <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>}
  </div>
}

function FactorCard({ factor, labels }: Readonly<{ factor: AnalysisFactorResult | null; labels: Labels }>) {
  let value: string | null = null
  if (factor?.status === 'available') {
    if (factor.factors.length > 1) value = labels.multipleFactors
    else if (factor.factors.length === 1) value = `${factor.factors[0].intensity} ${factor.factors[0].unit}`
  }

  return <div className={styles.metric} role="group" aria-labelledby="analysis-factor-heading">
    <h3 id="analysis-factor-heading">{labels.factor}</h3>
    {factor?.status === 'unavailable'
      ? <div className={styles.unavailable}><p className={styles.value}>{labels.metricUnavailable}</p><p>{labels.reasons[factor.reason]}</p></div>
      : value === null
        ? <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>
        : <p className={styles.value}>{value}</p>}
  </div>
}

function CoverageCard({ data, locale, labels, empty = false }: Readonly<{
  data: Pick<AnalysisViewModel, 'energyCoverage' | 'emissionsCoverage'> | null
  locale: string
  labels: Labels
  empty?: boolean
}>) {
  return <div className={`${styles.metric} ${styles.coverage}`} role="group" aria-labelledby="analysis-coverage-heading">
    <h3 id="analysis-coverage-heading">{labels.coverage}</h3>
    <div className={styles.coverageMetrics}>
      <div role="group" aria-labelledby="analysis-energy-coverage-heading">
        <h4 id="analysis-energy-coverage-heading">{labels.energyCoverage}</h4>
        {empty ? null : data
          ? <Reading reading={data.energyCoverage} locale={locale} notCalculable={labels.notCalculable}
            metricUnavailable={labels.metricUnavailable} reasons={labels.reasons} />
          : <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>}
      </div>
      <div role="group" aria-labelledby="analysis-emissions-coverage-heading">
        <h4 id="analysis-emissions-coverage-heading">{labels.emissionsCoverage}</h4>
        {empty ? null : data
          ? <Reading reading={data.emissionsCoverage} locale={locale} notCalculable={labels.notCalculable}
            metricUnavailable={labels.metricUnavailable} reasons={labels.reasons} />
          : <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>}
      </div>
    </div>
  </div>
}

function UnavailableSlots({ labels }: Readonly<{ labels: Labels }>) {
  return <div className={styles.metrics}>
    <MetricCard id="analysis-energy" title={labels.energy} reading={null} locale="pt-BR" labels={labels} />
    <MetricCard id="analysis-emissions" title={labels.emissions} reading={null} locale="pt-BR" labels={labels} />
    <FactorCard factor={null} labels={labels} />
    <CoverageCard data={null} locale="pt-BR" labels={labels} />
  </div>
}

function EmptySlots({ labels }: Readonly<{ labels: Labels }>) {
  return <div className={styles.metrics}>
    <MetricCard id="analysis-energy" title={labels.energy} reading={null} locale="pt-BR" labels={labels} empty />
    <MetricCard id="analysis-emissions" title={labels.emissions} reading={null} locale="pt-BR" labels={labels} empty />
    <MetricCard id="analysis-factor-heading" title={labels.factor} reading={null} locale="pt-BR" labels={labels} empty />
    <CoverageCard data={null} locale="pt-BR" labels={labels} empty />
  </div>
}

function FactorProvenance({ factors, formatDate, labels }: Readonly<{
  factors: readonly AnalysisFactor[]
  formatDate: (value: string) => string
  labels: Labels
}>) {
  if (factors.length === 0) return null
  return <section className={styles.provenance} aria-labelledby="analysis-factors-heading">
    <h2 id="analysis-factors-heading">{labels.factorsHeading}</h2>
    <div className={styles.factorList}>
      {factors.map((factor, index) => <article className={styles.factor} key={`${factor.model}-${factor.version}-${index}`} role="group" aria-labelledby={`analysis-factor-${index}`}>
        <h3 id={`analysis-factor-${index}`}>{factor.model}</h3>
        <dl>
          <div><dt>{labels.region}</dt><dd>{factor.region}</dd></div>
          <div><dt>{labels.intensity}</dt><dd>{factor.intensity} {factor.unit}</dd></div>
          <div><dt>{labels.model}</dt><dd>{factor.model}</dd></div>
          <div><dt>{labels.version}</dt><dd>{factor.version}</dd></div>
          <div><dt>{labels.queriedAt}</dt><dd>{formatDate(factor.queriedAt)}</dd></div>
          <div><dt>{labels.modelDescription}</dt><dd>{factor.modelDescription}</dd></div>
          <div><dt>{labels.snapshot}</dt><dd><code>{factor.snapshot}</code></dd></div>
        </dl>
      </article>)}
    </div>
  </section>
}

function MethodologySection({ result, state, labels }: Readonly<{
  result: AnalysisMethodologyResult | null
  state: 'loading' | 'available' | 'unavailable' | 'error'
  labels: Labels
}>) {
  return <section className={styles.provenance} aria-labelledby="analysis-methodology-heading">
    <h2 id="analysis-methodology-heading">{labels.methodologyHeading}</h2>
    {state === 'loading' && <p role="status">{labels.loading}</p>}
    {state === 'error' && <p role="status">{labels.methodologyUnavailable}</p>}
    {state === 'unavailable' && !result && <p role="status">{labels.methodologyUnavailable}</p>}
    {result?.status === 'unavailable' && <div className={styles.unavailable}>
      <p>{labels.metricUnavailable}</p><p>{labels.reasons[result.reason]}</p>
    </div>}
    {result?.status === 'available' && result.entries.length === 0 && <p role="status">{labels.methodologyUnavailable}</p>}
    {result?.status === 'available' && result.entries.length > 0 && <div className={styles.factorList}>
      {result.entries.map((entry, index) => <article className={styles.factor} key={`${entry.model}-${entry.version}-${index}`}
        role="group" aria-labelledby={`analysis-methodology-${index}`}>
        <h3 id={`analysis-methodology-${index}`}>{entry.model}</h3>
        <dl>
          <div><dt>{labels.model}</dt><dd>{entry.model}</dd></div>
          <div><dt>{labels.version}</dt><dd>{entry.version}</dd></div>
          <div><dt>{labels.modelDescription}</dt><dd>{entry.description}</dd></div>
          <div><dt>{labels.snapshot}</dt><dd><code>{entry.snapshot}</code></dd></div>
        </dl>
      </article>)}
    </div>}
  </section>
}

export function EnvironmentalAnalysis({ data, status, locale, labels, onRetry, formatDate, seriesPage, seriesPageSize, seriesQuery, onSeriesQueryChange, onSeriesPaginationChange, contextContent, lastAttemptAt, lastSuccessAt, lastSuccessStatus }: Readonly<{
  data: AnalysisViewModel | null
  status: 'loading' | 'refreshing' | 'available' | 'empty' | 'unavailable' | 'error' | 'invalid-period' | 'invalid-granularity'
  locale: string
  labels: Labels
  onRetry: () => void
  formatDate: (value: string) => string
  seriesPage: number
  seriesPageSize: AnalysisSeriesPageSize
  seriesQuery: AnalysisSeriesQuery
  onSeriesQueryChange: (query: AnalysisSeriesQuery) => void
  onSeriesPaginationChange: (page: number | null, pageSize: AnalysisSeriesPageSize) => void
  contextContent: ReactNode
  lastAttemptAt: string | null
  lastSuccessAt: string | null
  lastSuccessStatus: 'available' | 'empty' | null
}>) {
  const preserveEmpty = data === null && lastSuccessStatus === 'empty' &&
    (status === 'refreshing' || status === 'error' || status === 'unavailable')
  const emptyResult = status === 'empty' || preserveEmpty
  const invalidContext = status === 'invalid-period' || status === 'invalid-granularity'
  const showData = (status === 'available' || status === 'refreshing' || status === 'error' || status === 'unavailable') && data !== null
  return <>
    <section className={styles.section} aria-labelledby="environmental-analysis-heading">
      <h2 id="environmental-analysis-heading" className={styles.sectionHeading}>{labels.heading}</h2>
      {status === 'loading' && <p role="status">{labels.loading}</p>}
      {status === 'refreshing' && <p role="status">{labels.refreshing}</p>}
      {status === 'empty' && <p role="status">{labels.empty}</p>}
      {preserveEmpty && <p role="status">{labels.previousEmpty}</p>}
      {status === 'unavailable' && <p role="status">{labels.unavailable}</p>}
      {status === 'unavailable' && data && <p role="status">{labels.previousPreserved}</p>}
      {status === 'error' && <div role="alert"><p>{labels.error}</p><ActionButton onClick={onRetry}>{labels.retry}</ActionButton></div>}
      {status === 'error' && data && <p role="status">{labels.previousPreserved}</p>}
      {((status === 'unavailable' || status === 'error') && data === null && !preserveEmpty) && <UnavailableSlots labels={labels} />}
      {(invalidContext || emptyResult) && <EmptySlots labels={labels} />}
      {showData && data && <div className={styles.metrics}>
        <MetricCard id="analysis-energy" title={labels.energy} reading={data.energy} locale={locale} labels={labels} />
        <MetricCard id="analysis-emissions" title={labels.emissions} reading={data.emissions} locale={locale} labels={labels} />
        <FactorCard factor={data.factor} labels={labels} />
        <CoverageCard data={data} locale={locale} labels={labels} />
      </div>}
    </section>
    <div className={styles.lowerGrid}>
      <div className={styles.contextColumn}>
        {showData && data?.factor.status === 'available' && <FactorProvenance factors={data.factor.factors}
          formatDate={formatDate} labels={labels} />}
        {!invalidContext && !emptyResult && <MethodologySection result={data?.methodology ?? null}
          state={data ? 'available' : status === 'error' || status === 'unavailable' ? status : 'loading'} labels={labels} />}
        {!invalidContext && <AnalysisComposition result={emptyResult ? { status: 'empty' } : data?.composition ?? { status: 'unavailable', reason: labels.composition.unavailable }}
          totals={data ? { energy: data.energy, emissions: data.emissions } : null}
          locale={locale} formatDate={formatDate} labels={labels.composition} />}
        {!invalidContext && <EnvironmentalFreshness lastAttemptAt={lastAttemptAt} lastSuccessAt={lastSuccessAt}
          formatDate={formatDate} labels={labels.freshness} />}
        {contextContent}
      </div>
      {!invalidContext && <AnalysisSeries series={data?.series ?? (emptyResult ? { status: 'available', points: [] } : { status: 'unavailable', reason: 'seriesUnavailable' })}
        state={emptyResult ? 'available' : status} locale={locale} formatDate={formatDate} labels={{
      heading: labels.seriesHeading, graph: labels.graph, table: labels.table, moment: labels.moment,
      energy: labels.tableEnergy, emissions: labels.tableEmissions, energyChart: labels.energyChart,
      emissionsChart: labels.emissionsChart, unavailable: labels.metricUnavailable,
      loading: labels.loading,
      notCalculable: labels.notCalculable, noPoints: labels.noPoints, reasons: labels.reasons,
      gapsNote: labels.gapsNote,
      pageSize: labels.pageSize, allRows: labels.allRows, previous: labels.previous, next: labels.next,
      pageChoice: labels.pageChoice, pageStatus: labels.pageStatus, rangeStatus: labels.rangeStatus,
      search: labels.search, searchPlaceholder: labels.searchPlaceholder, energyStatus: labels.energyStatus,
      from: labels.from, to: labels.to, timeZone: labels.timeZone, invalidDateRange: labels.invalidDateRange,
      energyUnit: labels.energyUnit, selectUnit: labels.selectUnit, energyMin: labels.energyMin,
      emissionsUnit: labels.emissionsUnit,
      energyMax: labels.energyMax, mixedUnits: labels.mixedUnits,
      emissionsMin: labels.emissionsMin, emissionsMax: labels.emissionsMax,
      invalidNumericRange: labels.invalidNumericRange, invalidUnit: labels.invalidUnit,
      clearFilters: labels.clearFilters,
      emissionsStatus: labels.emissionsStatus, allStatuses: labels.allStatuses, availableStatus: labels.availableStatus,
      unavailableStatus: labels.unavailableStatus, notCalculableStatus: labels.notCalculableStatus, noMatches: labels.noMatches,
    }} page={seriesPage} pageSize={seriesPageSize} query={seriesQuery} onQueryChange={onSeriesQueryChange}
      onPaginationChange={onSeriesPaginationChange} />}
    </div>
  </>
}
