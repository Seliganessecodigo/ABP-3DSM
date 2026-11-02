import styles from './ApplicationDetailPage.module.css'
import { ActionButton } from '../../components/ActionButton.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { LoadingState } from '../../components/LoadingState.tsx'
import { OperationalEvidence, type OperationalEvidenceQuery, type MetricKey } from '../../components/OperationalEvidence.tsx'
import type { Application, CollectionEvidence, MetricStatus } from '../../features/applications/api.ts'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/formatDate.ts'
import { reasonLabel, stateLabel } from '../../features/applications/presentation.ts'
import { useApplicationDetail } from './useApplicationDetail.ts'
import { PeriodSelector } from './PeriodSelector.tsx'
import { periodPresets, readPeriodSelection, urlWithPeriod } from '../../features/analysis/periodContext.ts'
import { analysisRangeFor, environmentalAnalysisSource, type AnalysisGranularityCapabilities, type AnalysisSeriesEvent, type AnalysisSource } from '../../features/analysis/source.ts'
import { EnvironmentalAnalysis } from './EnvironmentalAnalysis.tsx'
import { parseAnalysisSeriesPageSize, readAnalysisSeriesQuery, writeAnalysisSeriesQuery, type AnalysisSeriesPageSize, type AnalysisSeriesQuery } from './seriesQuery.ts'
import { useEnvironmentalAnalysis } from './useEnvironmentalAnalysis.ts'
import { AnalysisGranularity } from './AnalysisGranularity.tsx'
import { formatNumber } from '../../utils/formatNumber.ts'
import { useAnalysisDefaults } from './useAnalysisDefaults.ts'

type EnvironmentalStatus = ReturnType<typeof useEnvironmentalAnalysis>['status'] | 'invalid-period' | 'invalid-granularity'

function analysisNow() {
  return new Date().toISOString()
}

function isUnsupportedGranularity(requestedValue: string | null, capabilities: AnalysisGranularityCapabilities) {
  if (requestedValue === null || capabilities.status === 'unavailable') return false
  return !capabilities.options.some(({ value }) => value === requestedValue)
}

function visibleCollection(collection: CollectionEvidence | null, selectedCollectionId: string | null) {
  if (collection === null) return null
  if (selectedCollectionId && collection.id !== selectedCollectionId) return null
  return collection
}

function environmentalStatus(period: string | null, unsupportedGranularity: boolean,
  sourceStatus: ReturnType<typeof useEnvironmentalAnalysis>['status']): EnvironmentalStatus {
  if (period === null) return 'invalid-period'
  if (unsupportedGranularity) return 'invalid-granularity'
  return sourceStatus
}

function freshnessLabel(application: Pick<Application, 'state' | 'lastObservationAt' | 'isStale'>,
  labels: Readonly<{ removed: string; noObservation: string; stale: string; current: string }>) {
  if (application.state === 'REMOVED') return labels.removed
  if (application.lastObservationAt === null) return labels.noObservation
  if (application.isStale) return labels.stale
  return labels.current
}

export function ApplicationDetailPage({ id, navigate, analysisSource = environmentalAnalysisSource, historyOnly = false,
  historyApplicationSelector }: Readonly<{
  id: string
  navigate: (url: string) => void
  analysisSource?: AnalysisSource
  historyOnly?: boolean
  historyApplicationSelector?: ReactNode
}>) {
  const { t: tDetail, i18n } = useTranslation('detail')
  const { t: tCommon } = useTranslation('common')
  const analysisDefaultsReady = useAnalysisDefaults()
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const selectedCollectionId = new URLSearchParams(window.location.search).get('collectionId')
  const searchParams = new URLSearchParams(window.location.search)
  const [inspectionBucket, setInspectionBucket] = useState(() => historyOnly ? searchParams.get('inspectionBucket') : null)
  const requestedInspection = useRef<string | null>(null)
  const [evidenceQuery, setEvidenceQuery] = useState(() => readEvidenceQuery(searchParams))
  const [analysisAnchor, setAnalysisAnchor] = useState(analysisNow)
  const seriesPage = readPage(searchParams.get('seriesPage'))
  const seriesPageSize = readSeriesPageSize(searchParams.get('seriesSize'))
  const [storedSeriesQuery, setSeriesQuery] = useState<AnalysisSeriesQuery>(() => readAnalysisSeriesQuery(searchParams))
  const seriesQuery = storedSeriesQuery
  const displayTimeZone = seriesQuery.timeZone
  useEffect(() => {
    const syncQueries = () => {
      const params = new URLSearchParams(window.location.search)
      setEvidenceQuery(readEvidenceQuery(params))
      const query = readAnalysisSeriesQuery(params)
      setSeriesQuery(query)
      setInspectionBucket(historyOnly ? params.get('inspectionBucket') : null)
      setAnalysisAnchor(analysisNow())
    }
    window.addEventListener('popstate', syncQueries)
    return () => window.removeEventListener('popstate', syncQueries)
  }, [historyOnly])
  const selectedPeriod = readPeriodSelection(window.location.search)
  const analysisPeriod = searchParams.get('period') ?? '7d'
  const analysisGranularity = searchParams.get('granularity')
  const { application, loading, refreshing, notFound, error, lastAttemptAt, lastResponseAt, pollingIntervalMs, refreshCycle, retry,
    collection, collectionLoading, collectionNotFound, collectionError } = useApplicationDetail(id, selectedCollectionId)
  const environmentalAnalysis = useEnvironmentalAnalysis(id, analysisPeriod, analysisGranularity, analysisSource,
    application !== null && selectedPeriod !== null && analysisDefaultsReady, refreshCycle, analysisAnchor)
  const { loadContributions } = environmentalAnalysis
  const inspectionRequestKey = JSON.stringify([id, analysisPeriod, analysisGranularity, analysisAnchor, inspectionBucket])
  useEffect(() => {
    if (!historyOnly || !inspectionBucket || !application || !loadContributions ||
      requestedInspection.current === inspectionRequestKey) return
    requestedInspection.current = inspectionRequestKey
    loadContributions(inspectionBucket)
  }, [application, historyOnly, inspectionBucket, inspectionRequestKey, loadContributions])
  const inspectHistoryInterval = (bucketStart: string, page = 1, pageSize: number | 'all' = 10) => {
    const params = new URLSearchParams(window.location.search)
    params.set('inspectionBucket', bucketStart)
    requestedInspection.current = JSON.stringify([id, analysisPeriod, analysisGranularity, analysisAnchor, bucketStart])
    setInspectionBucket(bucketStart)
    loadContributions?.(bucketStart, page, pageSize)
    navigate(`${window.location.pathname}?${params.toString()}`)
  }
  const closeHistoryInspection = () => {
    const params = new URLSearchParams(window.location.search)
    params.delete('inspectionBucket')
    window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`)
    setInspectionBucket(null)
  }
  const granularityCapabilities = environmentalAnalysis.data?.granularity ?? { status: 'unavailable' as const }
  const unsupportedGranularity = isUnsupportedGranularity(analysisGranularity, granularityCapabilities)
  const currentCollection = visibleCollection(collection, selectedCollectionId)
  const methodologyParams = new URLSearchParams(window.location.search)
  if (currentCollection) methodologyParams.set('collectionId', currentCollection.id)
  const methodologyQuery = methodologyParams.size ? `?${methodologyParams.toString()}` : ''
  const methodologyUrl = `/services/${encodeURIComponent(id)}/methodology${methodologyQuery}`
  const analysisData = selectedPeriod === null || unsupportedGranularity ? null : environmentalAnalysis.data
  const analysisBounds = selectedPeriod === null ? null : analysisRangeFor(analysisPeriod, new Date(analysisAnchor))
  const analysisState = environmentalStatus(selectedPeriod, unsupportedGranularity, environmentalAnalysis.status)
  const analysisPending = ['loading', 'refreshing'].includes(analysisState)
  const backUrl = `/${window.location.search}`
  const verificationTime = application?.lastCheckedAt && Number.isFinite(Date.parse(application.lastCheckedAt))
    ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone: displayTimeZone }).format(new Date(application.lastCheckedAt))
    : null
  const locationSummary = application?.location
    ? [application.location.country, application.location.regionCode, application.location.region,
      verificationTime && tDetail('verifiedAt', { time: verificationTime })].filter(Boolean).join(' \u00b7 ')
    : tCommon('location.unknown')
  const evidenceContent = !historyOnly && application && <OperationalEvidence evidence={currentCollection} loading={collectionLoading} notFound={collectionNotFound} compact
      selected={selectedCollectionId !== null} error={collectionError} refreshing={refreshing || analysisPending} onRefresh={retry}
      calculability={application.isCalculable ? tCommon('calculability.available') : tCommon('calculability.unavailable')}
      formatDate={(value) => formatDate(value, locale, tCommon('date.noObservation'), displayTimeZone)}
      formatNumber={(value) => formatNumber(value, locale)}
      locale={locale} query={evidenceQuery}
      onQueryChange={(query) => {
        const params = new URLSearchParams(window.location.search)
        const values: Record<string, string> = {
          evidenceSearch: query.search,
          evidenceMetric: query.metric,
          evidenceStatus: query.status,
          evidenceSort: query.sort.column === 'metric' && query.sort.direction === 'asc' ? '' : `${query.sort.column}:${query.sort.direction}`,
        }
        for (const [key, value] of Object.entries(values)) {
          if (value) params.set(key, value)
          else params.delete(key)
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
        setEvidenceQuery(query)
      }}
      labels={{ heading: tDetail('evidenceHeading'), title: tDetail('evidenceTitle'), calculability: tDetail('evidenceCalculability'), refresh: tDetail('evidenceRefresh'), retry: tCommon('actions.retry'),
        loading: tDetail('evidenceLoading'), error: tDetail('evidenceError'), empty: tDetail('evidenceEmpty'),
        selectionUnavailable: tDetail('evidenceSelectionUnavailable'), stale: tDetail('evidenceStale'), current: tDetail('evidenceCurrent'),
        showingPrevious: tDetail('evidenceShowingPrevious'), interval: tDetail('evidenceInterval'), received: tDetail('evidenceReceived'),
        metric: tDetail('evidenceMetric'), value: tDetail('evidenceValue'), status: tDetail('evidenceStatus'),
        available: tDetail('evidenceAvailable'), zero: tDetail('evidenceZero'), missing: tDetail('evidenceMissing'),
        invalid: tDetail('evidenceInvalid'), noValue: tDetail('evidenceNoValue'), zeroNote: tDetail('evidenceZeroNote'),
        searchLabel: tDetail('evidenceSearchLabel'), searchPlaceholder: tDetail('evidenceSearchPlaceholder'), filtersHeading: tDetail('evidenceFiltersHeading'),
        metricFilter: tDetail('evidenceMetricFilter'), allMetrics: tDetail('evidenceAllMetrics'),
        statusFilter: tDetail('evidenceStatusFilter'), allStatuses: tDetail('evidenceAllStatuses'),
        clearFilters: tDetail('evidenceClearFilters'), noMatches: tDetail('evidenceNoMatches'),
        filteredCount: (count, total) => tDetail('evidenceFilteredCount', { count, total }),
        metrics: { cpu: tDetail('metricCpu'), memory: tDetail('metricMemory'), disk: tDetail('metricDisk'), network: tDetail('metricNetwork') } }} />
  const contextContent = !historyOnly && application && <>
      <section className={styles['detail-card']}><h2>{tDetail('identity')}</h2><dl><div><dt>{tDetail('id')}</dt><dd>{application.id}</dd></div><div><dt>{tCommon('state.label')}</dt><dd>{stateLabel(application.state, tCommon)}</dd></div><div><dt>{tDetail('firstSeen')}</dt><dd>{formatDate(application.firstSeenAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div>{application.removedAt && <div><dt>{tDetail('removedAt')}</dt><dd>{formatDate(application.removedAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div>}</dl></section>
      <section className={styles['detail-card']}><h2>{tDetail('operationalCondition')}</h2><dl><div><dt>{tDetail('reason')}</dt><dd>{reasonLabel(application.reason, tCommon)}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div><div><dt>{tCommon('date.lastObservation')}</dt><dd>{formatDate(application.lastObservationAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div><div><dt>{tDetail('freshness')}</dt><dd>{freshnessLabel(application, { removed: tDetail('freshnessRemoved'), noObservation: tCommon('date.noObservation'), stale: tCommon('freshness.stale'), current: tCommon('freshness.current') })}</dd></div><div><dt>{tDetail('calculability')}</dt><dd>{application.isCalculable ? tCommon('calculability.available') : tCommon('calculability.unavailable')}</dd></div></dl></section>
    <section className={styles['detail-card']}><h2>{tDetail('location')}</h2>{application.location ? <dl><div><dt>{tDetail('regionCode')}</dt><dd>{application.location.regionCode}</dd></div><div><dt>{tCommon('location.country')}</dt><dd>{application.location.country}</dd></div><div><dt>{tCommon('location.region')}</dt><dd>{application.location.region}</dd></div><div><dt>{tCommon('location.city')}</dt><dd>{application.location.city ?? tCommon('location.cityUnknown')}</dd></div><div><dt>{tDetail('latitude')}</dt><dd>{application.location.latitude.toLocaleString(locale)}</dd></div><div><dt>{tDetail('longitude')}</dt><dd>{application.location.longitude.toLocaleString(locale)}</dd></div></dl> : <p>{tCommon('location.unknown')}</p>}</section>
    <a className="button secondary" href={methodologyUrl} onClick={(event) => { event.preventDefault(); navigate(methodologyUrl) }}>{tDetail('methodologyFullPage')}</a>
  </>
  const selectPeriod = (period: typeof periodPresets[number]) => {
    setAnalysisAnchor(analysisNow())
    const next = new URL(urlWithPeriod(window.location.pathname, window.location.search, period), window.location.origin)
    next.searchParams.delete('seriesPage')
    navigate(`${next.pathname}?${next.searchParams.toString()}`)
  }
  const periodSelector = <PeriodSelector compact select={historyOnly} className={styles.periodSelector}
    title={tDetail('periodTitle')} selected={selectedPeriod} invalidMessage={tDetail('periodInvalid')} busy={analysisPending}
    options={periodPresets.map((value) => ({ value, label: tDetail(`periods.${value}`) }))} onSelect={selectPeriod} />
  const granularityContent = <AnalysisGranularity compact select={historyOnly}
    capabilities={granularityCapabilities} requestedValue={analysisGranularity}
    onChange={(value) => {
      const next = new URL(window.location.href)
      next.searchParams.set('granularity', value)
      next.searchParams.delete('seriesPage')
      navigate(`${next.pathname}?${next.searchParams.toString()}`)
    }} labels={{ heading: tDetail('analysisGranularityHeading'), unavailable: tDetail('analysisGranularityUnavailable'),
      unsupported: tDetail('analysisGranularityUnsupported'), repair: tDetail('analysisGranularityRepair'), options: {
        hour: tDetail('analysisGranularityHour'), day: tDetail('analysisGranularityDay'),
        month: tDetail('analysisGranularityMonth'), year: tDetail('analysisGranularityYear'),
      } }} />
  return <main className={`content ${styles['detail-content']} ${historyOnly ? styles.historyContent : ''}`} data-application-loaded={Boolean(application)} tabIndex={-1}>
    {historyOnly && <header className={styles.historyHeader}>
      {inspectionBucket ? <>
        <div className={styles.historyInspectionHeading}>
          <div>
            <p className={styles.historyEyebrow}>{tCommon('nav.monitoring')}</p>
            <h1>{tDetail('historyInspectionHeading')}</h1>
            <p>{application?.name} · {formatDate(inspectionBucket, locale, tCommon('date.noObservation'), displayTimeZone)}</p>
          </div>
          <button type="button" className="button secondary" onClick={closeHistoryInspection}>
            {'\u2190'} {tDetail('historyInspectionBack')}
          </button>
        </div>
      </> : <>
        <div className={styles.historyHeading}>
          <p className={styles.historyEyebrow}>{tCommon('nav.monitoring')}</p>
          <h1>{tDetail('historyTitle')}</h1>
          <p>{tDetail('historyDescription')}</p>
        </div>
        <div className={styles.historyFilters}>
          {historyApplicationSelector}
          {periodSelector}
          {granularityContent}
          {analysisBounds && <>
            <div className={styles.historyRange}>
              <span>{tDetail('historyConsultedRange')}</span>
              <output>{formatDate(analysisBounds.from, locale, tCommon('date.noObservation'), displayTimeZone)} – {formatDate(analysisBounds.to, locale, tCommon('date.noObservation'), displayTimeZone)}</output>
            </div>
            <p className={styles.historyRangeNote}>
              {tDetail('analysisSeriesTimeZone', { zone: displayTimeZone })} · {tDetail('analysisSeriesRangeBounds', {
                from: formatDate(analysisBounds.from, locale, tCommon('date.noObservation'), displayTimeZone),
                to: formatDate(analysisBounds.to, locale, tCommon('date.noObservation'), displayTimeZone),
              })}
            </p>
          </>}
        </div>
      </>}
    </header>}
    {!application && (<a className={styles['back-link']} href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>{'\u2190'} {tDetail('back')}</a>)}
    {loading && <LoadingState title={tDetail('loading')} panelTitle={tDetail('analysisSeriesHeading')} layout="detail" />}
    {notFound && <RequestFeedback state="empty"><h1>{tDetail('notFound')}</h1><p>{tDetail('notFoundHint')}</p></RequestFeedback>}
    {error && <RequestFeedback state="error"><h1>{tDetail('error')}</h1><p>{tDetail('errorHint')}</p><ActionButton onClick={retry} disabled={loading || refreshing}>{tCommon('actions.retry')}</ActionButton></RequestFeedback>}
    {application && <>{!historyOnly && <div className={styles.breadcrumb}><a aria-label={tDetail('back')} href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>{tCommon('nav.applications')}</a><span aria-hidden="true">›</span><span aria-current="page">{application.name}</span></div>}{!historyOnly && <div className={styles.detailTop}>
      <div className={styles['detail-heading']}><div className={styles.titleLine}><h1>{application.name}</h1><span className={`state-badge state-${application.state.toLowerCase()}`}>{stateLabel(application.state, tCommon)}</span></div><p className={styles.locationSummary}>{locationSummary}</p></div>
        {periodSelector}
      </div>}
      <EnvironmentalAnalysis data={analysisData}
        historyMode={historyOnly}
        applicationName={application?.name ?? id}
        inspectionBucket={historyOnly ? inspectionBucket : null}
        status={analysisState}
        contributions={environmentalAnalysis.contributions}
        comparisonPoints={environmentalAnalysis.comparisonPoints}
        onInspectContributions={analysisSource.loadContributions ? inspectHistoryInterval : undefined}
        onContributionPaginationChange={(page, pageSize) => {
          const bucketStart = environmentalAnalysis.contributions?.data?.bucket.start
          if (bucketStart) environmentalAnalysis.loadContributions?.(bucketStart, page, pageSize)
        }}
        lastAttemptAt={environmentalAnalysis.lastAttemptAt} lastSuccessAt={environmentalAnalysis.lastSuccessAt}
        lastSuccessStatus={environmentalAnalysis.lastSuccessStatus}
        seriesPage={seriesPage} seriesPageSize={seriesPageSize}
        seriesQuery={seriesQuery}
        onSeriesQueryChange={(query) => {
          const params = new URLSearchParams(window.location.search)
          writeAnalysisSeriesQuery(params, query)
          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
          setSeriesQuery(query)
        }}
        onSeriesPaginationChange={(page, pageSize) => {
          const params = new URLSearchParams(window.location.search)
          if (page === null) params.delete('seriesPage')
          else {
            params.set('seriesPage', String(page))
            params.set('seriesSize', String(pageSize))
          }
          navigate(`${window.location.pathname}?${params.toString()}`)
        }}
        locale={locale} onRetry={environmentalAnalysis.retry}
        formatDate={(value) => formatDate(value, locale, tCommon('date.noObservation'), displayTimeZone)}
        labels={{ heading: tDetail('analysisHeading'), energy: tDetail('analysisEnergy'), emissions: tDetail('analysisEmissions'),
          historyContextHeading: tDetail('historyContextHeading'),
          historyContextSummary: (regions: string, versions: string) => tDetail('historyContextSummary', { regions, versions }),
          historyInspectionEndExclusive: tDetail('historyInspectionEndExclusive'),
          historyContributionsHeading: tDetail('historyContributionsHeading'),
          historyContributionsDescription: tDetail('historyContributionsDescription'),
          historyContributionDetails: tDetail('historyContributionDetails'),
          historyContributionOpen: tDetail('historyContributionOpen'),
          historyNoContributions: tDetail('historyNoContributions'),
          factor: tDetail('analysisFactor'), coverage: tDetail('analysisCoverage'),
          viewFactorDetails: tDetail('analysisViewFactorDetails'), validDataInPeriod: tDetail('analysisValidDataInPeriod'),
          energyCoverage: tDetail('analysisEnergyCoverage'), emissionsCoverage: tDetail('analysisEmissionsCoverage'),
          factorsHeading: tDetail('analysisFactorsHeading'), methodologyHeading: tDetail('analysisMethodologyHeading'),
          composition: {
            heading: tDetail('analysisCompositionHeading'),
            totalsHeading: tDetail('analysisCompositionTotalsHeading'),
            contributionsHeading: tDetail('analysisCompositionContributionsHeading'),
            exclusionsHeading: tDetail('analysisCompositionExclusionsHeading'),
            energy: tDetail('analysisEnergy'), emissions: tDetail('analysisEmissions'),
            interval: tDetail('analysisCompositionInterval'), source: tDetail('analysisCompositionSource'),
            reason: tDetail('analysisCompositionReason'), empty: tDetail('analysisCompositionEmpty'),
            unavailable: tDetail('analysisCompositionUnavailable'),
            notCalculable: tDetail('analysisNotCalculable'), metricUnavailable: tDetail('analysisMetricUnavailable'),
            reasons: {
              factorUnavailable: tDetail('analysisReason.factorUnavailable'),
              coverageUnavailable: tDetail('analysisReason.coverageUnavailable'),
              methodologyUnavailable: tDetail('analysisReason.methodologyUnavailable'),
              seriesUnavailable: tDetail('analysisReason.seriesUnavailable'),
              compositionUnavailable: tDetail('analysisReason.compositionUnavailable'),
              noObservation: tDetail('analysisReason.noObservation'),
            },
          },
          calculationHeading: tDetail('analysisCalculationHeading'), calculationEstimate: tDetail('analysisCalculationEstimate'), closeDetails: tDetail('analysisCloseDetails'),
          freshness: {
            heading: tDetail('analysisFreshnessHeading'),
            lastAttempt: tDetail('analysisLastAttempt'),
            lastSuccess: tDetail('analysisLastSuccess'),
            noAttempt: tDetail('analysisNoAttempt'),
            noSuccess: tDetail('analysisNoSuccess'),
          },
          seriesHeading: selectedPeriod ? `${tDetail('analysisSeriesHeading')} • ${tDetail('periods.' + selectedPeriod)}` : tDetail('analysisSeriesHeading'),
          historyIntervalsHeading: tDetail('analysisHistoryIntervals'),
          regionHeading: tDetail('analysisSeriesHeading'),
          metricToggle: tDetail('analysisMetricToggle'),
          compareMetrics: tDetail('analysisCompareMetrics'),
          focusEvent: tDetail('analysisSeriesFocusEvent'),
          currentPeriod: tDetail('analysisCurrentPeriod'), previousPeriod: tDetail('analysisPreviousPeriod'),
          tooltipCurrent: tDetail('analysisTooltipCurrent'), tooltipPrevious: tDetail('analysisTooltipPrevious'),
          seriesEventsHeading: tDetail('analysisSeriesEventsHeading'),
          seriesEventSummary: (event: AnalysisSeriesEvent) => {
            const eventState = (state: unknown) => {
              switch (state) {
                case 'AVAILABLE': case 'UNAVAILABLE': case 'NO_METRICS': case 'REMOVED': return stateLabel(state, tCommon)
                default: return ''
              }
            }
            const before = eventState(event.details.before?.state)
            const after = eventState(event.details.after?.state)
            return [tDetail(`analysisSeriesEvent.${event.type}`), formatDate(event.at, locale, tCommon('date.noObservation'), displayTimeZone),
              before && `${tDetail('analysisSeriesEventBefore')}: ${before}`, after && `${tDetail('analysisSeriesEventAfter')}: ${after}`].filter(Boolean).join(' · ')
          },
          inspectContributions: tDetail('analysisSeriesInspectContributions'),
          contributionHeading: tDetail('analysisContributionInspectionHeading'),
          contributionCollection: tDetail('analysisContributionCollection'),
          contributionOriginalInterval: tDetail('analysisContributionOriginalInterval'),
          contributionCountedInterval: tDetail('analysisContributionCountedInterval'),
          contributionCollectedAt: tDetail('analysisContributionCollectedAt'),
          contributionTotals: tDetail('analysisContributionTotals'),
          contributionCoverage: tDetail('analysisContributionCoverage'),
          contributionOriginalValue: tDetail('analysisContributionOriginalValue'),
          contributionCountedValue: tDetail('analysisContributionCountedValue'),
          contributionDurationRatio: tDetail('analysisContributionDurationRatio'),
          contributionReason: tDetail('analysisCompositionReason'),
          contributionParameters: tDetail('analysisContributionParameters'),
          contributionContractVersion: tDetail('analysisContributionContractVersion'),
          contributionFactorId: tDetail('analysisSnapshot'),
          contributionCountry: tCommon('location.country'),
          contributionCity: tCommon('location.city'),
          contributionRegionCode: tDetail('regionCode'),
          contributionSource: tDetail('analysisCompositionSource'),
          contributionValidFrom: tDetail('analysisContributionValidFrom'),
          contributionValidUntil: tDetail('analysisContributionValidUntil'),
          contributionExclusions: tDetail('analysisCompositionExclusionsHeading'),
          moment: tDetail('analysisMoment'),
          tableEnergy: tDetail('analysisEnergy'), tableEmissions: tDetail('analysisEmissions'),
          graph: tDetail('analysisGraph'), table: tDetail('analysisTable'),
          energyChart: tDetail('analysisSeriesEnergyChart'), emissionsChart: tDetail('analysisSeriesEmissionsChart'),
          noPoints: tDetail('analysisSeriesNoPoints'),
          gapsNote: tDetail('analysisSeriesGapsNote'),
          pageSize: tDetail('analysisSeriesPageSize'), allRows: tDetail('analysisSeriesAllRows'),
          pageChoice: tDetail('analysisSeriesPageChoice'),
          pageStatus: (current: number, total: number) => tDetail('analysisSeriesPageStatus', { current, total }),
          search: tDetail('analysisSeriesSearch'), searchPlaceholder: tDetail('analysisSeriesSearchPlaceholder'),
          columnFilters: tDetail('analysisSeriesColumnFilters'),
          from: tDetail('analysisSeriesFrom'), to: tDetail('analysisSeriesTo'),
          timeZone: (zone: string) => tDetail('analysisSeriesTimeZone', { zone }),
          rangeBounds: analysisBounds ? tDetail('analysisSeriesRangeBounds', {
            from: formatDate(analysisBounds.from, locale, tCommon('date.noObservation'), displayTimeZone),
            to: formatDate(analysisBounds.to, locale, tCommon('date.noObservation'), displayTimeZone),
          }) : '',
          invalidDateRange: tDetail('analysisSeriesInvalidDateRange'),
          energyUnit: tDetail('analysisSeriesEnergyUnit'), selectUnit: tDetail('analysisSeriesSelectUnit'),
          emissionsUnit: tDetail('analysisSeriesEmissionsUnit'),
          energyMin: tDetail('analysisSeriesEnergyMin'), energyMax: tDetail('analysisSeriesEnergyMax'),
          emissionsMin: tDetail('analysisSeriesEmissionsMin'), emissionsMax: tDetail('analysisSeriesEmissionsMax'),
          invalidNumericRange: tDetail('analysisSeriesInvalidNumericRange'), invalidUnit: tDetail('analysisSeriesInvalidUnit'),
          clearFilters: tDetail('analysisSeriesClearFilters'),
          mixedUnits: tDetail('analysisSeriesMixedUnits'),
          energyStatus: tDetail('analysisSeriesEnergyStatus'), emissionsStatus: tDetail('analysisSeriesEmissionsStatus'),
          allStatuses: tDetail('analysisSeriesAllStatuses'), availableStatus: tDetail('analysisAvailableStatus'),
          unavailableStatus: tDetail('analysisUnavailableStatus'), notCalculableStatus: tDetail('analysisNotCalculable'),
          noMatches: tDetail('analysisSeriesNoMatches'),
          previous: tDetail('analysisSeriesPrevious'), next: tDetail('analysisSeriesNext'),
          rangeStatus: (start: number, end: number, count: number) => tDetail('analysisSeriesRange', { start, end, count }),
          methodologyUnavailable: tDetail('analysisMethodologyUnavailable'),
          intensity: tDetail('analysisIntensity'), region: tDetail('analysisRegion'),
          model: tDetail('analysisModel'), modelDescription: tDetail('analysisModelDescription'), version: tDetail('analysisVersion'),
          queriedAt: tDetail('analysisQueriedAt'), snapshot: tDetail('analysisSnapshot'), multipleFactors: tDetail('analysisMultipleFactors'),
          notCalculable: tDetail('analysisNotCalculable'), metricUnavailable: tDetail('analysisMetricUnavailable'),
          unavailable: tDetail('analysisUnavailable'),
          empty: tDetail('analysisEmpty'),
          previousEmpty: tDetail('analysisPreviousEmpty'),
          loading: tDetail('analysisLoading'), refreshing: tDetail('analysisRefreshing'),
          error: tDetail('analysisError'), previousPreserved: tDetail('analysisPreviousPreserved'), retry: tCommon('actions.retry'),
          reasons: { factorUnavailable: tDetail('analysisReason.factorUnavailable'), coverageUnavailable: tDetail('analysisReason.coverageUnavailable'),
              methodologyUnavailable: tDetail('analysisReason.methodologyUnavailable'),
              seriesUnavailable: tDetail('analysisReason.seriesUnavailable'),
              compositionUnavailable: tDetail('analysisReason.compositionUnavailable'),
              noObservation: tDetail('analysisReason.noObservation') } }} evidenceContent={evidenceContent}
        granularityContent={historyOnly ? null : granularityContent} contextContent={<>
          {contextContent}
        <section className={styles['detail-card']}><h2>{tDetail('refreshHeading')}</h2><p>{tDetail('refreshStatus', {
          seconds: pollingIntervalMs / 1000,
          lastAttempt: formatDate(lastAttemptAt, locale, tCommon('date.noObservation'), displayTimeZone),
          lastResponse: formatDate(lastResponseAt, locale, tCommon('date.noObservation'), displayTimeZone),
        })}</p></section>
        </>} />

    </>}
  </main>
}

function readEvidenceQuery(params: URLSearchParams): OperationalEvidenceQuery {
  const metric = params.get('evidenceMetric')
  const status = params.get('evidenceStatus')
  const sort = params.get('evidenceSort')?.split(':')
  const metricKeys: MetricKey[] = ['cpu', 'memory', 'disk', 'network']
  const statuses: MetricStatus[] = ['available', 'missing', 'invalid']
  const validMetric = metricKeys.find((value) => value === metric) ?? ''
  const validStatus = statuses.find((value) => value === status) ?? ''
  const sortColumn = sort?.[0] === 'status' ? 'status' : 'metric'
  const sortDirection = sort?.[1] === 'desc' ? 'desc' : 'asc'
  return {
    search: params.get('evidenceSearch') ?? '',
    metric: validMetric,
    status: validStatus,
    sort: { column: sortColumn, direction: sortDirection },
  }
}

function readPage(value: string | null) {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

function readSeriesPageSize(value: string | null): AnalysisSeriesPageSize {
  return parseAnalysisSeriesPageSize(value)
}
