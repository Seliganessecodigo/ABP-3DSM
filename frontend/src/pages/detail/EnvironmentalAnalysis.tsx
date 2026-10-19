import { ActionButton } from '../../components/ActionButton.tsx'
import type { AnalysisContributionsPage, AnalysisFactor, AnalysisFactorResult, AnalysisMethodology, AnalysisMethodologyResult, AnalysisPresentationReason, AnalysisReading, AnalysisSeriesEvent, AnalysisSeriesPoint, AnalysisViewModel } from '../../features/analysis/source.ts'
import { AnalysisSeries } from './AnalysisSeries.tsx'
import { AnalysisContributions } from './AnalysisContributions.tsx'
import { AnalysisComposition } from './AnalysisComposition.tsx'
import type { AnalysisCompositionLabels } from './AnalysisComposition.tsx'
import { EnvironmentalFreshness } from './EnvironmentalFreshness.tsx'
import type { EnvironmentalFreshnessLabels } from './EnvironmentalFreshness.tsx'
import type { AnalysisSeriesPageSize, AnalysisSeriesQuery } from './seriesQuery.ts'
import { useId, useState, type ReactNode, type SyntheticEvent } from 'react'
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
  calculationHeading: string
  calculationEstimate: string
  freshness: EnvironmentalFreshnessLabels
  seriesHeading: string
  metricToggle: string
  currentPeriod: string
  previousPeriod: string
  seriesEventsHeading: string
  seriesEventTypes: Readonly<Record<'status_changed' | 'removed' | 'returned' | 'region_changed' | 'methodology_changed' | 'factor_version_changed', string>>
  seriesEventBefore: string
  seriesEventAfter: string
  seriesEventStates: Readonly<{ available: string; unavailable: string }>
  inspectContributions: string
  contributionHeading: string
  contributionCollection: string
  contributionOriginalInterval: string
  contributionCountedInterval: string
  contributionCollectedAt: string
  contributionTotals: string
  contributionCoverage: string
  contributionOriginalValue: string
  contributionCountedValue: string
  contributionDurationRatio: string
  contributionReason: string
  contributionParameters: string
  contributionContractVersion: string
  contributionFactorId: string
  contributionCountry: string
  contributionCity: string
  contributionRegionCode: string
  contributionSource: string
  contributionValidFrom: string
  contributionValidUntil: string
  contributionExclusions: string
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
  let content: ReactNode = null
  if (!empty) {
    content = reading
      ? <Reading reading={reading} locale={locale} notCalculable={labels.notCalculable}
        metricUnavailable={labels.metricUnavailable} reasons={labels.reasons} />
      : <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>
  }

  return <fieldset className={styles.metric} aria-labelledby={id}>
    <h3 id={id}>{title}</h3>
    {content}
  </fieldset>
}

function FactorCard({ factor, labels }: Readonly<{ factor: AnalysisFactorResult | null; labels: Labels }>) {
  let value: string | null = null
  if (factor?.status === 'available') {
    if (factor.factors.length > 1) value = labels.multipleFactors
    else if (factor.factors.length === 1 && factor.factors[0].intensity !== null && factor.factors[0].unit !== null) {
      value = `${factor.factors[0].intensity} ${factor.factors[0].unit}`
    }
  }

  let content: ReactNode
  if (factor?.status === 'unavailable') {
    content = <div className={styles.unavailable}><p className={styles.value}>{labels.metricUnavailable}</p><p>{labels.reasons[factor.reason]}</p></div>
  } else if (value === null) {
    content = <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>
  } else {
    content = <p className={styles.value}>{value}</p>
  }

  return <fieldset className={styles.metric} aria-labelledby="analysis-factor-heading">
    <h3 id="analysis-factor-heading">{labels.factor}</h3>
    {content}
    {factor?.status === 'available' && factor.factors.length === 1 && <p className={styles.metricMetadata}>
      {[factor.factors[0].regionCode || factor.factors[0].region, factor.factors[0].source].filter(Boolean).join(' · ')}
    </p>}
  </fieldset>
}

function CoverageCard({ data, locale, labels, empty = false }: Readonly<{
  data: Pick<AnalysisViewModel, 'energyCoverage' | 'emissionsCoverage'> | null
  locale: string
  labels: Labels
  empty?: boolean
}>) {
  const energyContent = getCoverageContent(empty, data?.energyCoverage ?? null, locale, labels)
  const emissionsContent = getCoverageContent(empty, data?.emissionsCoverage ?? null, locale, labels)

  return <fieldset className={`${styles.metric} ${styles.coverage}`} aria-labelledby="analysis-coverage-heading">
    <h3 id="analysis-coverage-heading">{labels.coverage}</h3>
    <div className={styles.coverageMetrics}>
      <fieldset aria-labelledby="analysis-energy-coverage-heading">
        <h4 id="analysis-energy-coverage-heading">{labels.energyCoverage}</h4>
        {energyContent}
      </fieldset>
      <fieldset aria-labelledby="analysis-emissions-coverage-heading">
        <h4 id="analysis-emissions-coverage-heading">{labels.emissionsCoverage}</h4>
        {emissionsContent}
      </fieldset>
    </div>
  </fieldset>
}

function getCoverageContent(empty: boolean, reading: AnalysisReading | null, locale: string, labels: Labels) {
  if (empty) return null
  if (!reading) return <p className={styles.unavailableValue}>{labels.metricUnavailable}</p>
  if (reading.status === 'available' && reading.unit === 'fraction') {
    return <p className={styles.value}>{new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(reading.value)}</p>
  }
  return <Reading reading={reading} locale={locale} notCalculable={labels.notCalculable}
    metricUnavailable={labels.metricUnavailable} reasons={labels.reasons} />
}

function calculationValue(reading: AnalysisReading | null, locale: string, labels: Labels) {
  if (reading?.status === 'available') return `${formatAnalysisNumber(reading.value, locale)} ${reading.unit}`
  if (reading) return `${labels.metricUnavailable}: ${labels.reasons[reading.reason]}`
  return labels.metricUnavailable
}

function CalculationSummary({ data, locale, labels, children, detailsOpen, onDetailsToggle }: Readonly<{
  data: AnalysisViewModel | null; locale: string; labels: Labels; children: ReactNode; detailsOpen: boolean
  onDetailsToggle: (event: SyntheticEvent<HTMLDetailsElement>) => void
}>) {
  const factor = data?.factor.status === 'available' && data.factor.factors.length === 1 ? data.factor.factors[0] : null
  const factorValue = factor?.intensity !== null && factor?.unit !== null && factor
    ? `${factor.intensity} ${factor.unit}`
    : data?.factor.status === 'available' && data.factor.factors.length > 1
      ? labels.multipleFactors
      : data?.factor.status === 'unavailable'
        ? `${labels.metricUnavailable}: ${labels.reasons[data.factor.reason]}`
        : labels.metricUnavailable

  return <section className={styles.calculation} aria-label={labels.calculationHeading}>
    <header><h2>{labels.calculationHeading}</h2><details open={detailsOpen} onToggle={onDetailsToggle}
      className={styles.calculationDetails} id="analysis-details">
      <summary>{labels.calculationEstimate} · {labels.methodologyHeading} ↗</summary>
      <div className={styles.contextColumn}>{children}</div>
    </details></header>
    <div className={styles.formula}>
      <div><span>{labels.energy}</span><strong>{calculationValue(data?.energy ?? null, locale, labels)}</strong></div>
      <span aria-hidden="true" className={styles.operator}>×</span>
      <div><span>{labels.factor}</span><strong>{factorValue}</strong></div>
      <span aria-hidden="true" className={styles.operator}>=</span>
      <div><span>{labels.emissions}</span><strong>{calculationValue(data?.emissions ?? null, locale, labels)}</strong></div>
    </div>
  </section>
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
      {factors.map((factor) => <FactorEntry key={`${factor.version}-${factor.region}-${typeof factor.queriedAt === 'string' ? factor.queriedAt : `${factor.queriedAt.from}-${factor.queriedAt.to}`}`}
        factor={factor} formatDate={formatDate} labels={labels} />)}
    </div>
  </section>
}

function FactorEntry({ factor, formatDate, labels }: Readonly<{
  factor: AnalysisFactor
  formatDate: (value: string) => string
  labels: Labels
}>) {
  const headingId = useId()
  return <fieldset className={styles.factor} aria-labelledby={headingId}>
    <h3 id={headingId}>{factor.region || factor.version || labels.factor}</h3>
    <dl>
      {factor.region && <div><dt>{labels.region}</dt><dd>{factor.region}</dd></div>}
      {factor.intensity !== null && factor.unit !== null && <div><dt>{labels.intensity}</dt><dd>{factor.intensity} {factor.unit}</dd></div>}
      {factor.model && <div><dt>{labels.model}</dt><dd>{factor.model}</dd></div>}
      {factor.version && <div><dt>{labels.version}</dt><dd>{factor.version}</dd></div>}
      {(typeof factor.queriedAt === 'string' || factor.queriedAt.from !== null || factor.queriedAt.to !== null) && <div><dt>{labels.queriedAt}</dt><dd>{typeof factor.queriedAt === 'string' ? formatDate(factor.queriedAt) :
        [factor.queriedAt.from, factor.queriedAt.to].filter((value): value is string => value !== null).map(formatDate).join(' – ')}</dd></div>}
      {factor.modelDescription && <div><dt>{labels.modelDescription}</dt><dd>{factor.modelDescription}</dd></div>}
      {factor.snapshot && <div><dt>{labels.snapshot}</dt><dd><code>{factor.snapshot}</code></dd></div>}
    </dl>
  </fieldset>
}

function MethodologySection({ result, state, labels }: Readonly<{
  result: AnalysisMethodologyResult | null
  state: 'loading' | 'available' | 'unavailable' | 'error'
  labels: Labels
}>) {
  return <section className={styles.provenance} aria-labelledby="analysis-methodology-heading">
    <h2 id="analysis-methodology-heading">{labels.methodologyHeading}</h2>
    {state === 'loading' && <output>{labels.loading}</output>}
    {state === 'error' && <output>{labels.methodologyUnavailable}</output>}
    {state === 'unavailable' && !result && <output>{labels.methodologyUnavailable}</output>}
    {result?.status === 'unavailable' && <div className={styles.unavailable}>
      <p>{labels.metricUnavailable}</p><p>{labels.reasons[result.reason]}</p>
    </div>}
    {result?.status === 'available' && result.entries.length === 0 && <output>{labels.methodologyUnavailable}</output>}
    {result?.status === 'available' && result.entries.length > 0 && <div className={styles.factorList}>
      {result.entries.map((entry) => <MethodologyEntry key={`${entry.model}-${entry.version}-${entry.snapshot ?? ''}`}
        entry={entry} labels={labels} />)}
    </div>}
  </section>
}

function MethodologyEntry({ entry, labels }: Readonly<{
  entry: AnalysisMethodology
  labels: Labels
}>) {
  const headingId = useId()
  return <fieldset className={styles.factor} aria-labelledby={headingId}>
    <h3 id={headingId}>{entry.model}</h3>
    <dl>
      <div><dt>{labels.model}</dt><dd>{entry.model}</dd></div>
      <div><dt>{labels.version}</dt><dd>{entry.version}</dd></div>
      {entry.description && <div><dt>{labels.modelDescription}</dt><dd>{entry.description}</dd></div>}
      {entry.snapshot && <div><dt>{labels.snapshot}</dt><dd><code>{entry.snapshot}</code></dd></div>}
    </dl>
  </fieldset>
}

function getMethodologyState(data: AnalysisViewModel | null, status: 'loading' | 'refreshing' | 'available' | 'empty' | 'unavailable' | 'error' | 'invalid-period' | 'invalid-granularity') {
  if (data) return 'available' as const
  if (status === 'error' || status === 'unavailable') return status
  return 'loading' as const
}

export function EnvironmentalAnalysis({ data, status, locale, labels, onRetry, formatDate, seriesPage, seriesPageSize, seriesQuery, onSeriesQueryChange, onSeriesPaginationChange, onInspectContributions, contributions, comparisonPoints, contextContent, granularityContent, evidenceContent, lastAttemptAt, lastSuccessAt, lastSuccessStatus }: Readonly<{
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
  onInspectContributions?: (bucketStart: string, page?: number, pageSize?: number | 'all') => void
  contributions: Readonly<{ data: AnalysisContributionsPage | null; loading: boolean; error: boolean }> | null
  comparisonPoints: readonly AnalysisSeriesPoint[]
  contextContent: ReactNode
  granularityContent: ReactNode
  evidenceContent: ReactNode
  lastAttemptAt: string | null
  lastSuccessAt: string | null
  lastSuccessStatus: 'available' | 'empty' | null
}>) {
  const [contextOpen, setContextOpen] = useState(false)
  const inspectContributions = onInspectContributions
    ? (bucketStart: string) => {
        setContextOpen(true)
        onInspectContributions(bucketStart)
      }
    : undefined
  const preserveEmpty = data === null && lastSuccessStatus === 'empty' &&
    (status === 'refreshing' || status === 'error' || status === 'unavailable')
  const emptyResult = status === 'empty' || preserveEmpty
  const invalidContext = status === 'invalid-period' || status === 'invalid-granularity'
  const showData = (status === 'available' || status === 'refreshing' || status === 'error' || status === 'unavailable') && data !== null && !emptyResult
  return <div className={styles.analysisLayout}>
    <section className={styles.section} aria-labelledby="environmental-analysis-heading">
      <h2 id="environmental-analysis-heading" className={styles.sectionHeading}>{labels.heading}</h2>
      {status === 'loading' && <output>{labels.loading}</output>}
      {status === 'refreshing' && <output>{labels.refreshing}</output>}
      {status === 'empty' && <output>{labels.empty}</output>}
      {preserveEmpty && <output>{labels.previousEmpty}</output>}
      {status === 'unavailable' && <output>{labels.unavailable}</output>}
      {status === 'unavailable' && data && <output>{labels.previousPreserved}</output>}
      {status === 'error' && <div className={styles.analysisNotice} role="alert">
        <p>{labels.error}</p>
        {data && <output>{labels.previousPreserved}</output>}
        <ActionButton onClick={onRetry}>{labels.retry}</ActionButton>
      </div>}
      {((status === 'unavailable' || status === 'error') && data === null && !preserveEmpty) && <UnavailableSlots labels={labels} />}
      {(invalidContext || emptyResult) && <EmptySlots labels={labels} />}
      {showData && data && <div className={styles.metrics}>
        <MetricCard id="analysis-energy" title={labels.energy} reading={data.energy} locale={locale} labels={labels} />
        <MetricCard id="analysis-emissions" title={labels.emissions} reading={data.emissions} locale={locale} labels={labels} />
        <FactorCard factor={data.factor} labels={labels} />
        <CoverageCard data={data} locale={locale} labels={labels} />
      </div>}
      {data?.series.status === 'available' && (data.series.events?.length ?? 0) > 0 && <ol className={styles.events} aria-label={labels.seriesEventsHeading}>
        {data.series.events?.map((event: AnalysisSeriesEvent) => {
          const beforeState = event.details.before?.state
          const afterState = event.details.after?.state
          const stateText = (value: string) => value === 'AVAILABLE' ? labels.seriesEventStates.available : value === 'UNAVAILABLE' ? labels.seriesEventStates.unavailable : value
          return <li key={event.id}>
            <time dateTime={event.at}>{formatDate(event.at)}</time>
            <strong>{labels.seriesEventTypes[event.type]}</strong>
            {typeof beforeState === 'string' && <span>{labels.seriesEventBefore}: {stateText(beforeState)}</span>}
            {typeof afterState === 'string' && <span>{labels.seriesEventAfter}: {stateText(afterState)}</span>}
          </li>
        })}
      </ol>}
    </section>
    <div className={styles.summaryGrid}>
      <CalculationSummary data={data} locale={locale} labels={labels} detailsOpen={contextOpen}
        onDetailsToggle={(event) => setContextOpen(event.currentTarget.open)}>
        {!invalidContext && <AnalysisComposition result={emptyResult ? { status: 'empty' } : data?.composition ?? { status: 'unavailable', reason: labels.composition.unavailable }}
          totals={data ? { energy: data.energy, emissions: data.emissions } : null}
          locale={locale} formatDate={formatDate} labels={labels.composition} />}
        {showData && data?.factor.status === 'available' && <FactorProvenance factors={data.factor.factors}
          formatDate={formatDate} labels={labels} />}
        {!invalidContext && !emptyResult && <MethodologySection result={data?.methodology ?? null}
          state={getMethodologyState(data, status)} labels={labels} />}
        {!invalidContext && contributions && <AnalysisContributions data={contributions.data} loading={contributions.loading} error={contributions.error}
          locale={locale} formatDate={formatDate} labels={{ heading: labels.contributionHeading, loading: labels.loading, error: labels.error,
            collection: labels.contributionCollection, originalInterval: labels.contributionOriginalInterval,
            countedInterval: labels.contributionCountedInterval, collectedAt: labels.contributionCollectedAt,
            energy: labels.energy, emissions: labels.emissions, methodology: labels.model, factor: labels.factor,
            totals: labels.contributionTotals, coverage: labels.contributionCoverage,
            originalValue: labels.contributionOriginalValue, countedValue: labels.contributionCountedValue,
            durationRatio: labels.contributionDurationRatio, reason: labels.contributionReason,
            parameters: labels.contributionParameters, contractVersion: labels.contributionContractVersion,
            factorId: labels.contributionFactorId, country: labels.contributionCountry, city: labels.contributionCity,
            region: labels.region, regionCode: labels.contributionRegionCode, intensity: labels.intensity,
            source: labels.contributionSource, queriedAt: labels.queriedAt, validFrom: labels.contributionValidFrom,
            validUntil: labels.contributionValidUntil, exclusions: labels.contributionExclusions,
            reasons: { NO_OBSERVATION: labels.reasons.noObservation, CARBON_FACTOR_UNAVAILABLE: labels.reasons.factorUnavailable },
            pageStatus: labels.pageStatus }} />}
        {contextContent}
      </CalculationSummary>
      {!invalidContext && <EnvironmentalFreshness lastAttemptAt={lastAttemptAt} lastSuccessAt={lastSuccessAt}
        formatDate={formatDate} labels={labels.freshness} compact />}
    </div>
    <div className={styles.lowerGrid}>
      <div className={styles.seriesColumn}>
        {invalidContext && granularityContent}
        {!invalidContext && <AnalysisSeries series={data?.series ?? (emptyResult ? { status: 'available', points: [] } : { status: 'unavailable', reason: 'seriesUnavailable' })}
          state={emptyResult ? 'available' : status} locale={locale} formatDate={formatDate} comparisonPoints={comparisonPoints} labels={{
      heading: labels.seriesHeading, graph: labels.graph, table: labels.table, metricToggle: labels.metricToggle, moment: labels.moment,
      currentPeriod: labels.currentPeriod, previousPeriod: labels.previousPeriod,
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
      inspectContributions: labels.inspectContributions,
      emissionsStatus: labels.emissionsStatus, allStatuses: labels.allStatuses, availableStatus: labels.availableStatus,
      unavailableStatus: labels.unavailableStatus, notCalculableStatus: labels.notCalculableStatus, noMatches: labels.noMatches,
      }} page={seriesPage} pageSize={seriesPageSize} query={seriesQuery} onQueryChange={onSeriesQueryChange} controlContent={granularityContent}
      onPaginationChange={onSeriesPaginationChange} onInspectContributions={inspectContributions} />}
      </div>
      <div className={styles.evidenceColumn}>{evidenceContent}</div>
    </div>
  </div>
}
