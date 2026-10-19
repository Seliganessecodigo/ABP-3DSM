export const analysisPresentationReasons = ['factorUnavailable', 'coverageUnavailable', 'methodologyUnavailable', 'seriesUnavailable', 'compositionUnavailable', 'noObservation'] as const
export type AnalysisPresentationReason = (typeof analysisPresentationReasons)[number]

export type AnalysisReading =
  | Readonly<{ status: 'available'; value: number; unit: string }>
  | Readonly<{ status: 'unavailable' | 'not-calculable'; reason: AnalysisPresentationReason }>

export type AnalysisViewModel = Readonly<{
  energy: AnalysisReading
  emissions: AnalysisReading
  energyCoverage: AnalysisReading
  emissionsCoverage: AnalysisReading
  factor: AnalysisFactorResult
  methodology: AnalysisMethodologyResult
  composition: AnalysisCompositionResult
  series: AnalysisSeriesResult
  granularity: AnalysisGranularityCapabilities
}>

export type AnalysisCompositionContribution = Readonly<{
  id: string
  label: string
  from: string
  to: string
  energy: AnalysisReading
  emissions: AnalysisReading
  source: string
}>

export type AnalysisCompositionExclusion = Readonly<{
  id: string
  label: string
  from: string
  to: string
  reason: string
}>

export type AnalysisCompositionResult =
  | Readonly<{
    status: 'available'
    contributions: readonly AnalysisCompositionContribution[]
    exclusions: readonly AnalysisCompositionExclusion[]
  }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'unavailable'; reason: string }>

export type AnalysisSeriesPoint = Readonly<{
  id: string
  timestamp: string
  bucketEnd?: string
  energy: AnalysisReading
  emissions: AnalysisReading
}>

export type AnalysisContributionsPage = Readonly<{
  bucket: Readonly<{ start: string; end: string; period: Readonly<{ from: string; to: string }> }>
  totals: Readonly<{ energy: AnalysisReading; emissions: AnalysisReading }>
  coverage: Readonly<{ energy: number; emissions: number }>
  pagination: Readonly<{ page: number; pageSize: number | 'all'; totalItems: number; totalPages: number; hasNextPage: boolean }>
  contributions: readonly Readonly<{
    collectionId: string
    originalInterval: Readonly<{ from: string; to: string }>
    countedInterval: Readonly<{ from: string; to: string }>
    collectedAt: string
    energy: Readonly<{ originalValue: number | null; value: number | null; unit: string; reasons: readonly Readonly<{ code: string; metric?: string }>[] }>
    emissions: Readonly<{ originalValue: number | null; value: number | null; unit: string; reasons: readonly Readonly<{ code: string; metric?: string }>[] }>
    durationRatio: number
    methodology: Readonly<{ key: string; version: string; parameters: Readonly<Record<string, number>> }> | null
    factorSnapshot: Readonly<{ id: string | null; contractVersion: string | null; regionCode: string | null; country: string | null;
      region: string | null; city: string | null; version: string; intensity: number | null; unit: string | null; source: string | null;
      validFrom: string | null; validUntil: string | null; queriedAt: string | null }> | null
  }>[]
  exclusions: readonly Readonly<{ collectionId: string | null; from: string; to: string;
    energyReasons: readonly Readonly<{ code: string; metric?: string }>[]; emissionsReasons: readonly Readonly<{ code: string; metric?: string }>[] }>[]
}>

export type AnalysisSeriesEvent = Readonly<{
  id: string
  at: string
  type: 'status_changed' | 'removed' | 'returned' | 'region_changed' | 'methodology_changed' | 'factor_version_changed'
  details: Readonly<{ before: Record<string, unknown> | null; after: Record<string, unknown> | null }>
}>

export type AnalysisSeriesResult =
  | Readonly<{ status: 'available'; points: readonly AnalysisSeriesPoint[]; events?: readonly AnalysisSeriesEvent[] }>
  | Readonly<{ status: 'unavailable'; reason: AnalysisPresentationReason }>

export type AnalysisGranularityOption = Readonly<{ value: string; label: string }>
export type AnalysisGranularityCapabilities =
  | Readonly<{ status: 'available'; options: readonly AnalysisGranularityOption[]; selectedValue: string | null }>
  | Readonly<{ status: 'unavailable' }>

export type AnalysisFactor = Readonly<{
  region: string
  intensity: string | number | null
  unit: string | null
  model?: string
  modelDescription?: string
  version?: string | null
  queriedAt: string | Readonly<{ from: string | null; to: string | null }>
  snapshot?: string
  contractVersion?: string | null
  regionCode?: string | null
  country?: string | null
  city?: string | null
  source?: string | null
  validFrom?: string | null
  validUntil?: string | null
}>

export type AnalysisFactorResult =
  | Readonly<{ status: 'available'; factors: readonly AnalysisFactor[] }>
  | Readonly<{ status: 'unavailable'; reason: AnalysisPresentationReason }>

export type AnalysisMethodology = Readonly<{
  model: string
  description?: string
  version: string
  snapshot?: string
  parameters?: Readonly<Record<string, number>>
}>

export type AnalysisMethodologyResult =
  | Readonly<{ status: 'available'; entries: readonly AnalysisMethodology[] }>
  | Readonly<{ status: 'unavailable'; reason: AnalysisPresentationReason }>

export type AnalysisContext = Readonly<{ period: string; granularity?: string; anchor?: string }>

export type AnalysisSourceResult =
  | Readonly<{ status: 'available'; data: AnalysisViewModel }>
  | Readonly<{ status: 'empty'; data?: AnalysisViewModel }>
  | Readonly<{ status: 'unavailable' }>

export interface AnalysisSource {
  load(applicationId: string, context: AnalysisContext, signal: AbortSignal): Promise<AnalysisSourceResult>
  loadComparisonSeries?(applicationId: string, context: AnalysisContext, signal: AbortSignal): Promise<readonly AnalysisSeriesPoint[]>
  loadContributions?(applicationId: string, context: AnalysisContext, bucketStart: string, page: number,
    pageSize: number | 'all', signal: AbortSignal): Promise<AnalysisContributionsPage>
}

type RecordValue = Record<string, unknown>

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertRecord(value: unknown, name: string): asserts value is RecordValue {
  if (!isRecord(value)) throw new Error(`Invalid ${name} response`)
}

function readMeasure(value: unknown, empty = false): AnalysisReading {
  assertRecord(value, 'analysis measure')
  if (typeof value.unit !== 'string' || !(value.value === null || (typeof value.value === 'number' && Number.isFinite(value.value)))) {
    throw new Error('Invalid analysis measure')
  }
  return value.value === null
    ? { status: 'not-calculable', reason: empty ? 'noObservation' : 'factorUnavailable' }
    : { status: 'available', value: value.value, unit: value.unit }
}

function readCoverage(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid analysis coverage')
  return value
}

function readSeries(value: unknown, applicationId: string) {
  assertRecord(value, 'analysis series')
  if (!['available', 'empty'].includes(String(value.status)) || value.applicationId !== applicationId ||
    !isRecord(value.totals) || !Array.isArray(value.points) || !Array.isArray(value.events)) throw new Error('Invalid analysis series response')
  const points = value.points.map((entry): AnalysisSeriesPoint => {
    assertRecord(entry, 'analysis point')
    if (typeof entry.bucketStart !== 'string' || !Number.isFinite(Date.parse(entry.bucketStart)) ||
      typeof entry.bucketEnd !== 'string' || !Number.isFinite(Date.parse(entry.bucketEnd))) throw new Error('Invalid analysis point')
    return { id: entry.bucketStart, timestamp: entry.bucketStart, bucketEnd: entry.bucketEnd,
      energy: readMeasure(entry.energy, value.status === 'empty'), emissions: readMeasure(entry.emissions, value.status === 'empty') }
  })
  const eventTypes = ['status_changed', 'removed', 'returned', 'region_changed', 'methodology_changed', 'factor_version_changed']
  const events = value.events.map((entry): AnalysisSeriesEvent => {
    assertRecord(entry, 'analysis series event')
    if (typeof entry.id !== 'string' || typeof entry.at !== 'string' || !Number.isFinite(Date.parse(entry.at)) ||
      !eventTypes.includes(String(entry.type)) || !isRecord(entry.details) ||
      !(entry.details.before === null || isRecord(entry.details.before)) || !(entry.details.after === null || isRecord(entry.details.after))) {
      throw new Error('Invalid analysis series event')
    }
    return { id: entry.id, at: entry.at, type: entry.type as AnalysisSeriesEvent['type'],
      details: { before: entry.details.before as Record<string, unknown> | null, after: entry.details.after as Record<string, unknown> | null } }
  })
  return { points, events }
}

function rangeFor(period: string, now: Date) {
  const duration = ({ '24h': 24, '7d': 168, '30d': 720, '90d': 2160 } as const)[period as '24h' | '7d' | '30d' | '90d']
  if (duration === undefined) throw new Error('Invalid analysis period')
  const to = now.toISOString()
  return { from: new Date(Date.parse(to) - duration * 60 * 60 * 1000).toISOString(), to }
}

function endpoint(applicationId: string, suffix: string, range: Readonly<{ from: string; to: string }>, granularity?: string) {
  const base = (import.meta.env.VITE_API_URL as string | undefined ?? '/api').replace(/\/+$/, '')
  const query = new URLSearchParams({ from: range.from, to: range.to })
  if (granularity) query.set('granularity', granularity)
  return `${base}/applications/${encodeURIComponent(applicationId)}/analysis${suffix}?${query}`
}

function readNullableNumber(value: unknown, name: string): number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`Invalid ${name}`)
  return value as number | null
}

function readReasonCodes(value: unknown, name: string) {
  if (!Array.isArray(value)) throw new Error(`Invalid ${name}`)
  return value.map((reason) => {
    assertRecord(reason, name)
    if (typeof reason.code !== 'string' || !(reason.metric === undefined || typeof reason.metric === 'string')) throw new Error(`Invalid ${name}`)
    return { code: reason.code, ...(reason.metric === undefined ? {} : { metric: reason.metric }) }
  })
}

function readContributionInterval(value: unknown, name: string) {
  assertRecord(value, name)
  if (typeof value.from !== 'string' || !Number.isFinite(Date.parse(value.from)) ||
    typeof value.to !== 'string' || !Number.isFinite(Date.parse(value.to))) throw new Error(`Invalid ${name}`)
  return { from: value.from, to: value.to }
}

function readContributionMeasure(value: unknown, name: string) {
  assertRecord(value, name)
  if (typeof value.unit !== 'string') throw new Error(`Invalid ${name}`)
  return { originalValue: readNullableNumber(value.originalValue, name), value: readNullableNumber(value.value, name),
    unit: value.unit, reasons: readReasonCodes(value.reasons, name) }
}

async function loadContributions(applicationId: string, context: AnalysisContext, bucketStart: string, page: number,
  pageSize: number | 'all', signal: AbortSignal): Promise<AnalysisContributionsPage> {
  const range = rangeFor(context.period, context.anchor ? new Date(context.anchor) : new Date())
  const query = new URLSearchParams({ ...range, granularity: context.granularity ?? 'hour', bucketStart,
    page: String(page), pageSize: String(pageSize) })
  const base = (import.meta.env.VITE_API_URL as string | undefined ?? '/api').replace(/\/+$/, '')
  const response = await getJson(`${base}/applications/${encodeURIComponent(applicationId)}/analysis/series/contributions?${query}`, signal)
  assertRecord(response, 'analysis contributions')
  if (response.applicationId !== applicationId || !isRecord(response.period) || response.period.from !== range.from || response.period.to !== range.to ||
    response.granularity !== (context.granularity ?? 'hour') || !isRecord(response.bucket) || response.bucket.start !== bucketStart ||
    typeof response.bucket.end !== 'string' || !isRecord(response.totals) || !isRecord(response.coverage) ||
    !isRecord(response.pagination) || !Array.isArray(response.contributions) || !Array.isArray(response.exclusions)) throw new Error('Invalid analysis contributions response')
  const readMeasure = (value: unknown, name: string) => {
    assertRecord(value, name)
    if (typeof value.unit !== 'string') throw new Error(`Invalid ${name}`)
    if (value.value === null) return { status: 'not-calculable' as const, reason: 'factorUnavailable' as const }
    return { status: 'available' as const, value: readNullableNumber(value.value, name) as number, unit: value.unit }
  }
  const coverageValue = (value: unknown, name: string) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid ${name}`)
    return value
  }
  const pagination = response.pagination
  if (typeof pagination.page !== 'number' || !Number.isInteger(pagination.page) || pagination.page < 1 ||
    !(pagination.pageSize === 'all' || (typeof pagination.pageSize === 'number' && Number.isInteger(pagination.pageSize) && pagination.pageSize > 0)) ||
    typeof pagination.totalItems !== 'number' || !Number.isInteger(pagination.totalItems) || pagination.totalItems < 0 ||
    typeof pagination.totalPages !== 'number' || !Number.isInteger(pagination.totalPages) || pagination.totalPages < 1 || typeof pagination.hasNextPage !== 'boolean') {
    throw new Error('Invalid analysis contributions pagination')
  }
  const readMethodology = (value: unknown) => {
    if (value === null) return null
    assertRecord(value, 'contribution methodology')
    if (typeof value.key !== 'string' || typeof value.version !== 'string' || !isRecord(value.parameters) ||
      !Object.values(value.parameters).every((parameter) => typeof parameter === 'number' && Number.isFinite(parameter))) throw new Error('Invalid contribution methodology')
    return { key: value.key, version: value.version, parameters: value.parameters as Record<string, number> }
  }
  const readFactor = (value: unknown) => {
    if (value === null) return null
    assertRecord(value, 'contribution factor')
    const nullableTextFields = ['id', 'contractVersion', 'regionCode', 'country', 'region', 'city', 'unit', 'source', 'validFrom', 'validUntil', 'queriedAt']
    if (!nullableTextFields.every((key) => value[key] === null || typeof value[key] === 'string') ||
      typeof value.version !== 'string' ||
      !(value.intensity === null || (typeof value.intensity === 'number' && Number.isFinite(value.intensity))) ||
      !['validFrom', 'validUntil', 'queriedAt'].every((key) => value[key] === null || Number.isFinite(Date.parse(value[key] as string)))) throw new Error('Invalid contribution factor')
    return { id: value.id as string | null, contractVersion: value.contractVersion as string | null,
      regionCode: value.regionCode as string | null, country: value.country as string | null, region: value.region as string | null,
      city: value.city as string | null, version: value.version, intensity: value.intensity as number | null,
      unit: value.unit as string | null, source: value.source as string | null, validFrom: value.validFrom as string | null,
      validUntil: value.validUntil as string | null, queriedAt: value.queriedAt as string | null }
  }
  return {
    bucket: { start: response.bucket.start as string, end: response.bucket.end, period: readContributionInterval(response.bucket.period, 'contribution bucket period') },
    totals: { energy: readMeasure(response.totals.energy, 'contribution energy totals'), emissions: readMeasure(response.totals.emissions, 'contribution emissions totals') },
    coverage: { energy: coverageValue(response.coverage.energy, 'energy coverage'), emissions: coverageValue(response.coverage.emissions, 'emissions coverage') },
    pagination: { page: pagination.page, pageSize: pagination.pageSize as number | 'all', totalItems: pagination.totalItems,
      totalPages: pagination.totalPages, hasNextPage: pagination.hasNextPage },
    contributions: response.contributions.map((value) => {
      assertRecord(value, 'contribution')
      if (typeof value.collectionId !== 'string' || typeof value.collectedAt !== 'string' || !Number.isFinite(Date.parse(value.collectedAt)) ||
        typeof value.durationRatio !== 'number' || !Number.isFinite(value.durationRatio) || value.durationRatio < 0 || value.durationRatio > 1) throw new Error('Invalid contribution')
      return { collectionId: value.collectionId, originalInterval: readContributionInterval(value.originalInterval, 'original interval'),
        countedInterval: readContributionInterval(value.countedInterval, 'counted interval'), collectedAt: value.collectedAt,
        energy: readContributionMeasure(value.energy, 'contribution energy'), emissions: readContributionMeasure(value.emissions, 'contribution emissions'),
        durationRatio: value.durationRatio, methodology: readMethodology(value.methodology), factorSnapshot: readFactor(value.factorSnapshot) }
    }),
    exclusions: response.exclusions.map((value) => {
      assertRecord(value, 'contribution exclusion')
      if (!(value.collectionId === null || typeof value.collectionId === 'string')) throw new Error('Invalid contribution exclusion')
      const interval = readContributionInterval(value.interval, 'exclusion interval')
      return { collectionId: value.collectionId, ...interval, energyReasons: readReasonCodes(value.energyReasons, 'energy exclusion reasons'),
        emissionsReasons: readReasonCodes(value.emissionsReasons, 'emissions exclusion reasons') }
    }),
  }
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Analysis request failed: ${response.status}`)
  return response.json() as Promise<unknown>
}

async function loadEnvironmentalAnalysis(applicationId: string, period: string, granularity: string | null, anchor: string | undefined, signal: AbortSignal): Promise<AnalysisSourceResult> {
  const range = rangeFor(period, anchor ? new Date(anchor) : new Date())
  const selectedGranularity = granularity ?? 'hour'
  const [summary, series] = await Promise.all([
    getJson(endpoint(applicationId, '', range), signal),
    getJson(endpoint(applicationId, '/series', range, selectedGranularity), signal).catch(() => null),
  ])
  assertRecord(summary, 'analysis')
  if (!['available', 'empty'].includes(String(summary.status)) || summary.applicationId !== applicationId ||
    !isRecord(summary.energy) || !isRecord(summary.emissions) || !isRecord(summary.coverage) || !isRecord(summary.provenance) ||
    !Array.isArray(summary.provenance.factors) || !Array.isArray(summary.provenance.methodologies)) throw new Error('Invalid analysis response')
  let seriesPoints: AnalysisSeriesPoint[] | null = null
  let seriesEvents: AnalysisSeriesEvent[] = []
  if (series !== null) {
    try {
      const parsed = readSeries(series, applicationId)
      seriesPoints = parsed.points
      seriesEvents = parsed.events
    } catch {
      seriesPoints = null
    }
  }

  const factors = summary.provenance.factors.flatMap((value): AnalysisFactor[] => {
    if (!isRecord(value)) throw new Error('Invalid factor provenance')
    const textFields = ['contractVersion', 'regionCode', 'country', 'region', 'city', 'unit', 'version', 'source']
    const isDateOrNull = (input: unknown) => input === null || (typeof input === 'string' && Number.isFinite(Date.parse(input)))
    if (!textFields.every((key) => value[key] === null || typeof value[key] === 'string') ||
      !(value.intensity === null || (typeof value.intensity === 'number' && Number.isFinite(value.intensity))) ||
      !isDateOrNull(value.validFrom) || !isDateOrNull(value.validUntil) ||
      !isRecord(value.queriedAt) || !(value.queriedAt.from === null || typeof value.queriedAt.from === 'string') ||
      !(value.queriedAt.to === null || typeof value.queriedAt.to === 'string') ||
      !isDateOrNull(value.queriedAt.from) || !isDateOrNull(value.queriedAt.to)) throw new Error('Invalid factor provenance')
    return [{ region: [value.regionCode, value.region, value.country, value.city].filter((item): item is string => typeof item === 'string' && item !== '').join(', '),
      intensity: value.intensity as number | null, unit: value.unit as string | null,
      version: value.version as string | null,
      queriedAt: { from: value.queriedAt.from as string | null, to: value.queriedAt.to as string | null },
      contractVersion: value.contractVersion as string | null, regionCode: value.regionCode as string | null,
      country: value.country as string | null, city: value.city as string | null, source: value.source as string | null,
      validFrom: value.validFrom as string | null, validUntil: value.validUntil as string | null }]
  })
  const methodologies = summary.provenance.methodologies.flatMap((value): AnalysisMethodology[] => {
    if (!isRecord(value) || typeof value.key !== 'string' || typeof value.version !== 'string' || !isRecord(value.parameters) ||
      !Object.values(value.parameters).every((parameter) => typeof parameter === 'number' && Number.isFinite(parameter))) throw new Error('Invalid methodology')
    return [{ model: value.key, version: value.version,
      parameters: Object.fromEntries(Object.entries(value.parameters).map(([key, parameter]) => [key, parameter as number])) }]
  })
  const data: AnalysisViewModel = {
    energy: readMeasure(summary.energy, summary.status === 'empty'), emissions: readMeasure(summary.emissions, summary.status === 'empty'),
    energyCoverage: { status: 'available', value: readCoverage(summary.coverage.energy), unit: 'fraction' },
    emissionsCoverage: { status: 'available', value: readCoverage(summary.coverage.emissions), unit: 'fraction' },
    factor: factors.length ? { status: 'available', factors } : { status: 'unavailable', reason: 'factorUnavailable' },
    methodology: methodologies.length ? { status: 'available', entries: methodologies } : { status: 'unavailable', reason: 'methodologyUnavailable' },
    composition: { status: 'unavailable', reason: 'compositionUnavailable' },
    series: seriesPoints === null ? { status: 'unavailable', reason: 'seriesUnavailable' } : { status: 'available', points: seriesPoints, events: seriesEvents },
    granularity: { status: 'available', options: ['hour', 'day', 'month', 'year'].map((value) => ({ value, label: value })), selectedValue: selectedGranularity },
  }
  return summary.status === 'empty' ? { status: 'empty', data } : { status: 'available', data }
}

async function loadComparisonSeries(applicationId: string, context: AnalysisContext, signal: AbortSignal): Promise<readonly AnalysisSeriesPoint[]> {
  const currentRange = rangeFor(context.period, context.anchor ? new Date(context.anchor) : new Date())
  const previousRange = rangeFor(context.period, new Date(currentRange.from))
  const response = await getJson(endpoint(applicationId, '/series', previousRange, context.granularity ?? 'hour'), signal)
  return readSeries(response, applicationId).points
}

export const environmentalAnalysisSource: AnalysisSource = {
  load: (applicationId, context, signal) => loadEnvironmentalAnalysis(applicationId, context.period, context.granularity ?? null, context.anchor, signal),
  loadComparisonSeries,
  loadContributions,
}

export const unavailableAnalysisSource: AnalysisSource = {
  load: () => Promise.resolve<AnalysisSourceResult>({ status: 'unavailable' }),
}
