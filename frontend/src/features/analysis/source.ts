export const analysisPresentationReasons = ['factorUnavailable', 'coverageUnavailable', 'methodologyUnavailable', 'seriesUnavailable', 'compositionUnavailable'] as const
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
  energy: AnalysisReading
  emissions: AnalysisReading
}>

export type AnalysisSeriesResult =
  | Readonly<{ status: 'available'; points: readonly AnalysisSeriesPoint[] }>
  | Readonly<{ status: 'unavailable'; reason: AnalysisPresentationReason }>

export type AnalysisGranularityOption = Readonly<{ value: string; label: string }>
export type AnalysisGranularityCapabilities =
  | Readonly<{ status: 'available'; options: readonly AnalysisGranularityOption[]; selectedValue: string | null }>
  | Readonly<{ status: 'unavailable' }>

export type AnalysisFactor = Readonly<{
  region: string
  intensity: string
  unit: string
  model: string
  modelDescription: string
  version: string
  queriedAt: string
  snapshot: string
}>

export type AnalysisFactorResult =
  | Readonly<{ status: 'available'; factors: readonly AnalysisFactor[] }>
  | Readonly<{ status: 'unavailable'; reason: AnalysisPresentationReason }>

export type AnalysisMethodology = Readonly<{
  model: string
  description: string
  version: string
  snapshot: string
}>

export type AnalysisMethodologyResult =
  | Readonly<{ status: 'available'; entries: readonly AnalysisMethodology[] }>
  | Readonly<{ status: 'unavailable'; reason: AnalysisPresentationReason }>

export type AnalysisContext = Readonly<{ period: string; granularity?: string }>

export type AnalysisSourceResult =
  | Readonly<{ status: 'available'; data: AnalysisViewModel }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'unavailable' }>

export interface AnalysisSource {
  load(applicationId: string, context: AnalysisContext, signal: AbortSignal): Promise<AnalysisSourceResult>
}

export const unavailableAnalysisSource: AnalysisSource = {
  load: () => Promise.resolve<AnalysisSourceResult>({ status: 'unavailable' }),
}
