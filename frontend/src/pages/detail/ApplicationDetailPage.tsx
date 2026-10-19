import styles from './ApplicationDetailPage.module.css'
import { ActionButton } from '../../components/ActionButton.tsx'
import { RequestFeedback } from '../../components/RequestFeedback.tsx'
import { OperationalEvidence, type OperationalEvidenceQuery, type MetricKey } from '../../components/OperationalEvidence.tsx'
import type { MetricStatus } from '../../features/applications/api.ts'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../utils/formatDate.ts'
import { reasonLabel, stateLabel } from '../../features/applications/presentation.ts'
import { useApplicationDetail } from './useApplicationDetail.ts'
import { PeriodSelector } from './PeriodSelector.tsx'
import { periodPresets, readPeriodSelection, urlWithPeriod } from '../../features/analysis/periodContext.ts'
import { unavailableAnalysisSource, type AnalysisSource } from '../../features/analysis/source.ts'
import { EnvironmentalAnalysis } from './EnvironmentalAnalysis.tsx'
import { getBrowserTimeZone, parseAnalysisSeriesPageSize, readAnalysisSeriesQuery, writeAnalysisSeriesQuery, type AnalysisSeriesPageSize, type AnalysisSeriesQuery } from './seriesQuery.ts'
import { useEnvironmentalAnalysis } from './useEnvironmentalAnalysis.ts'
import { AnalysisGranularity } from './AnalysisGranularity.tsx'

export function ApplicationDetailPage({ id, navigate, analysisSource = unavailableAnalysisSource }: Readonly<{
  id: string
  navigate: (url: string) => void
  analysisSource?: AnalysisSource
}>) {
  const { t: tDetail, i18n } = useTranslation('detail')
  const { t: tCommon } = useTranslation('common')
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const selectedCollectionId = new URLSearchParams(window.location.search).get('collectionId')
  const searchParams = new URLSearchParams(window.location.search)
  const [evidenceQuery, setEvidenceQuery] = useState(() => readEvidenceQuery(searchParams))
  const seriesPage = readPage(searchParams.get('seriesPage'))
  const seriesPageSize = readSeriesPageSize(searchParams.get('seriesSize'))
  const [seriesQuery, setSeriesQuery] = useState<AnalysisSeriesQuery>(() => readAnalysisSeriesQuery(searchParams))
  const displayTimeZone = seriesQuery.timeZone || getBrowserTimeZone()
  useEffect(() => {
    const syncQueries = () => {
      const params = new URLSearchParams(window.location.search)
      setEvidenceQuery(readEvidenceQuery(params))
      setSeriesQuery(readAnalysisSeriesQuery(params))
    }
    window.addEventListener('popstate', syncQueries)
    return () => window.removeEventListener('popstate', syncQueries)
  }, [])
  const selectedPeriod = readPeriodSelection(window.location.search)
  const analysisPeriod = searchParams.get('period') ?? '7d'
  const analysisGranularity = searchParams.get('granularity')
  const { application, loading, refreshing, notFound, error, lastAttemptAt, lastResponseAt, pollingIntervalMs, refreshCycle, retry,
    collection, collectionLoading, collectionNotFound, collectionError } = useApplicationDetail(id, selectedCollectionId)
  const environmentalAnalysis = useEnvironmentalAnalysis(id, analysisPeriod, analysisGranularity, analysisSource,
    application !== null && selectedPeriod !== null, refreshCycle)
  const granularityCapabilities = environmentalAnalysis.data?.granularity ?? { status: 'unavailable' as const }
  const unsupportedGranularity = analysisGranularity !== null && granularityCapabilities.status === 'available' &&
    !granularityCapabilities.options.some(({ value }) => value === analysisGranularity)
  const visibleCollection = collection && (!selectedCollectionId || collection.id === selectedCollectionId) ? collection : null
  const backUrl = `/${window.location.search}`
  const contextContent = application && <>
      <section className={styles['detail-card']}><h2>{tDetail('identity')}</h2><dl><div><dt>{tDetail('id')}</dt><dd>{application.id}</dd></div><div><dt>{tCommon('state.label')}</dt><dd>{stateLabel(application.state, tCommon)}</dd></div><div><dt>{tDetail('firstSeen')}</dt><dd>{formatDate(application.firstSeenAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div>{application.removedAt && <div><dt>{tDetail('removedAt')}</dt><dd>{formatDate(application.removedAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div>}</dl></section>
      <section className={styles['detail-card']}><h2>{tDetail('operationalCondition')}</h2><dl><div><dt>{tDetail('reason')}</dt><dd>{reasonLabel(application.reason, tCommon)}</dd></div><div><dt>{tCommon('date.lastCheck')}</dt><dd>{formatDate(application.lastCheckedAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div><div><dt>{tCommon('date.lastObservation')}</dt><dd>{formatDate(application.lastObservationAt, locale, tCommon('date.noObservation'), displayTimeZone)}</dd></div><div><dt>{tDetail('freshness')}</dt><dd>{application.state === 'REMOVED' ? tDetail('freshnessRemoved') : !application.lastObservationAt ? tCommon('date.noObservation') : application.isStale ? tCommon('freshness.stale') : tCommon('freshness.current')}</dd></div><div><dt>{tDetail('calculability')}</dt><dd>{application.isCalculable ? tCommon('calculability.available') : tCommon('calculability.unavailable')}</dd></div></dl></section>
    <OperationalEvidence evidence={visibleCollection} loading={collectionLoading} notFound={collectionNotFound}
      selected={selectedCollectionId !== null} error={collectionError} refreshing={refreshing} onRefresh={retry}
      calculability={application.isCalculable ? tCommon('calculability.available') : tCommon('calculability.unavailable')}
      formatDate={(value) => formatDate(value, locale, tCommon('date.noObservation'), displayTimeZone)}
      formatNumber={(value) => new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)}
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
      labels={{ heading: tDetail('evidenceHeading'), calculability: tDetail('evidenceCalculability'), refresh: tDetail('evidenceRefresh'), retry: tCommon('actions.retry'),
        loading: tDetail('evidenceLoading'), error: tDetail('evidenceError'), empty: tDetail('evidenceEmpty'),
        selectionUnavailable: tDetail('evidenceSelectionUnavailable'), stale: tDetail('evidenceStale'), current: tDetail('evidenceCurrent'),
        showingPrevious: tDetail('evidenceShowingPrevious'), interval: tDetail('evidenceInterval'), received: tDetail('evidenceReceived'),
        metric: tDetail('evidenceMetric'), value: tDetail('evidenceValue'), status: tDetail('evidenceStatus'),
        available: tDetail('evidenceAvailable'), zero: tDetail('evidenceZero'), missing: tDetail('evidenceMissing'),
        invalid: tDetail('evidenceInvalid'), noValue: tDetail('evidenceNoValue'), zeroNote: tDetail('evidenceZeroNote'),
        searchLabel: tDetail('evidenceSearchLabel'), searchPlaceholder: tDetail('evidenceSearchPlaceholder'),
        metricFilter: tDetail('evidenceMetricFilter'), allMetrics: tDetail('evidenceAllMetrics'),
        statusFilter: tDetail('evidenceStatusFilter'), allStatuses: tDetail('evidenceAllStatuses'),
        clearFilters: tDetail('evidenceClearFilters'), noMatches: tDetail('evidenceNoMatches'),
        filteredCount: (count, total) => tDetail('evidenceFilteredCount', { count, total }),
        metrics: { cpu: tDetail('metricCpu'), memory: tDetail('metricMemory'), disk: tDetail('metricDisk'), network: tDetail('metricNetwork') } }} />
    <section className={styles['detail-card']}><h2>{tDetail('location')}</h2>{application.location ? <dl><div><dt>{tDetail('regionCode')}</dt><dd>{application.location.regionCode}</dd></div><div><dt>{tCommon('location.country')}</dt><dd>{application.location.country}</dd></div><div><dt>{tCommon('location.region')}</dt><dd>{application.location.region}</dd></div><div><dt>{tCommon('location.city')}</dt><dd>{application.location.city ?? tCommon('location.cityUnknown')}</dd></div><div><dt>{tDetail('latitude')}</dt><dd>{application.location.latitude.toLocaleString(locale)}</dd></div><div><dt>{tDetail('longitude')}</dt><dd>{application.location.longitude.toLocaleString(locale)}</dd></div></dl> : <p>{tCommon('location.unknown')}</p>}</section>
  </>
  return <main className={`content ${styles['detail-content']}`} tabIndex={-1}>
    {!application && (<a className={styles['back-link']} href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>← {tDetail('back')}</a>)}
    {loading && <RequestFeedback state="loading">{tDetail('loading')}</RequestFeedback>}
    {notFound && <RequestFeedback state="empty"><h1>{tDetail('notFound')}</h1><p>{tDetail('notFoundHint')}</p></RequestFeedback>}
    {error && <RequestFeedback state="error"><h1>{tDetail('error')}</h1><p>{tDetail('errorHint')}</p><ActionButton onClick={retry} disabled={loading || refreshing}>{tCommon('actions.retry')}</ActionButton></RequestFeedback>}
    {application && <><div className={styles.detailTop}>
      <a className={styles['back-link']} href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>← {tDetail('back')}</a><div className={`page-heading ${styles['detail-heading']}`}><div><p className="eyebrow">{tDetail('eyebrow')}</p><h1>{application.name}</h1><p className="identifier">{application.id}</p><p className={styles.locationSummary}>{application.location ? `${application.location.city ?? tCommon('location.cityUnknown')} · ${application.location.region}, ${application.location.country}` : tCommon('location.unknown')}</p></div><span className={`state-badge state-${application.state.toLowerCase()}`}>{stateLabel(application.state, tCommon)}</span></div>
        <PeriodSelector className={styles.periodSelector} title={tDetail('periodTitle')} selected={selectedPeriod} invalidMessage={tDetail('periodInvalid')}
        options={periodPresets.map((value) => ({ value, label: tDetail(`periods.${value}`) }))}
        onSelect={(period) => {
          const next = new URL(urlWithPeriod(window.location.pathname, window.location.search, period), window.location.origin)
          next.searchParams.delete('seriesPage')
          navigate(`${next.pathname}?${next.searchParams.toString()}`)
        }} />
      </div>
      <EnvironmentalAnalysis data={selectedPeriod === null || unsupportedGranularity ? null : environmentalAnalysis.data}
        status={selectedPeriod === null ? 'invalid-period' : unsupportedGranularity ? 'invalid-granularity' : environmentalAnalysis.status}
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
          factor: tDetail('analysisFactor'), coverage: tDetail('analysisCoverage'),
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
            },
          },
          freshness: {
            heading: tDetail('analysisFreshnessHeading'),
            lastAttempt: tDetail('analysisLastAttempt'),
            lastSuccess: tDetail('analysisLastSuccess'),
            noAttempt: tDetail('analysisNoAttempt'),
            noSuccess: tDetail('analysisNoSuccess'),
          },
          seriesHeading: tDetail('analysisSeriesHeading'), moment: tDetail('analysisMoment'),
          tableEnergy: tDetail('analysisEnergy'), tableEmissions: tDetail('analysisEmissions'),
          graph: tDetail('analysisGraph'), table: tDetail('analysisTable'),
          energyChart: tDetail('analysisSeriesEnergyChart'), emissionsChart: tDetail('analysisSeriesEmissionsChart'),
          noPoints: tDetail('analysisSeriesNoPoints'),
          gapsNote: tDetail('analysisSeriesGapsNote'),
          pageSize: tDetail('analysisSeriesPageSize'), allRows: tDetail('analysisSeriesAllRows'),
          pageChoice: tDetail('analysisSeriesPageChoice'),
          pageStatus: (current: number, total: number) => tDetail('analysisSeriesPageStatus', { current, total }),
          search: tDetail('analysisSeriesSearch'), searchPlaceholder: tDetail('analysisSeriesSearchPlaceholder'),
          from: tDetail('analysisSeriesFrom'), to: tDetail('analysisSeriesTo'),
          timeZone: (zone: string) => tDetail('analysisSeriesTimeZone', { zone }),
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
              compositionUnavailable: tDetail('analysisReason.compositionUnavailable') } }} contextContent={<>
          <AnalysisGranularity capabilities={granularityCapabilities} requestedValue={analysisGranularity}
            onChange={(value) => {
              const next = new URL(window.location.href)
              next.searchParams.set('granularity', value)
              next.searchParams.delete('seriesPage')
              navigate(`${next.pathname}?${next.searchParams.toString()}`)
            }} labels={{ heading: tDetail('analysisGranularityHeading'), unavailable: tDetail('analysisGranularityUnavailable'),
              unsupported: tDetail('analysisGranularityUnsupported'), repair: tDetail('analysisGranularityRepair') }} />
          {contextContent}
        </>} />

    </>}
    <section className={styles['detail-card']}><h2>{tDetail('refreshHeading')}</h2><p>{tDetail('refreshStatus', {
      seconds: pollingIntervalMs / 1000,
      lastAttempt: formatDate(lastAttemptAt, locale, tCommon('date.noObservation'), displayTimeZone),
      lastResponse: formatDate(lastResponseAt, locale, tCommon('date.noObservation'), displayTimeZone),
    })}</p></section>
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
