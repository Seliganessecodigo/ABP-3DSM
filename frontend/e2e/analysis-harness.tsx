import { createRoot } from 'react-dom/client'
import '../src/index.css'
import '../src/i18n.ts'
import { AppShell } from '../src/components/AppShell.tsx'
import { useRoute } from '../src/app/useRoute.ts'
import type { AnalysisCompositionResult, AnalysisFactor, AnalysisGranularityCapabilities, AnalysisMethodology, AnalysisSeriesPoint, AnalysisSource, AnalysisSourceResult } from '../src/features/analysis/source.ts'
import { ApplicationDetailPage } from '../src/pages/detail/ApplicationDetailPage.tsx'

function availableForEnergy(value: number, factors?: readonly AnalysisFactor[], methodology?: readonly AnalysisMethodology[], series?: readonly AnalysisSeriesPoint[], composition: AnalysisCompositionResult = { status: 'unavailable', reason: 'Composição não fornecida pela fonte controlada' }, granularity: AnalysisGranularityCapabilities = { status: 'unavailable' }): AnalysisSourceResult {
  return {
    status: 'available',
    data: {
      energy: { status: 'available', value, unit: 'kWh' },
      emissions: { status: 'not-calculable', reason: 'factorUnavailable' },
      energyCoverage: { status: 'available', value: 0, unit: '%' },
      emissionsCoverage: { status: 'unavailable', reason: 'coverageUnavailable' },
      factor: factors ? { status: 'available', factors } : { status: 'unavailable', reason: 'factorUnavailable' },
      methodology: methodology ? { status: 'available', entries: methodology } : { status: 'unavailable', reason: 'methodologyUnavailable' },
      composition,
      granularity,
      series: series ? { status: 'available', points: series } : { status: 'unavailable', reason: 'seriesUnavailable' },
    },
  }
}

const fixture = new URLSearchParams(window.location.search).get('fixture')
const provenanceFactors = [
  {
    region: 'BR-SP', intensity: '0.42', unit: 'kg CO₂e/kWh', model: 'Modelo Alpha', version: 'v-alpha-original',
    queriedAt: '2026-10-17T17:32:00.000Z', modelDescription: 'Descrição integral recebida para Modelo Alpha', snapshot: 'snapshot-alpha-raw-91',
  },
  {
    region: 'BR-RJ', intensity: '0.18', unit: 'kg CO₂e/kWh', model: 'Modelo Beta', version: 'v-beta-original',
    queriedAt: '2026-10-16T11:15:00.000Z', modelDescription: 'Descrição integral recebida para Modelo Beta', snapshot: 'snapshot-beta-raw-27',
  },
]
const energyMethodology = [
  {
    model: 'Modelo de estimativa energética',
    description: 'Método original fornecido pela fonte de energia',
    version: 'v-energy-original-7',
    snapshot: 'energy-source-snapshot-raw-12',
  },
]
const compositionResult: AnalysisCompositionResult = {
  status: 'available',
  contributions: [{
    id: 'composition-sp-1', label: 'Contribuição do centro de dados SP',
    from: '2026-10-17T13:00:00.000Z', to: '2026-10-17T14:00:00.000Z',
    energy: { status: 'available', value: 0.000001, unit: 'kWh' },
    emissions: { status: 'not-calculable', reason: 'factorUnavailable' },
    source: 'Snapshot original do agregador SP',
  }],
  exclusions: [{
    id: 'composition-exclusion-1', label: 'Segmento sem observação',
    from: '2026-10-17T14:00:00.000Z', to: '2026-10-17T15:00:00.000Z',
    reason: 'A origem não confirmou uma observação neste intervalo',
  }],
}
const designReviewComposition: AnalysisCompositionResult = {
  status: 'available',
  contributions: [{
    id: 'design-review-zero', label: 'Contribui\u00e7\u00e3o sem consumo',
    from: '2026-10-17T13:00:00.000Z', to: '2026-10-17T14:00:00.000Z',
    energy: { status: 'available', value: 0, unit: 'kWh' },
    emissions: { status: 'available', value: 0, unit: 'kg CO\u2082e' },
    source: 'Snapshot controlado de revis\u00e3o visual',
  }],
  exclusions: [{
    id: 'design-review-exclusion', label: 'Intervalo sem observa\u00e7\u00e3o',
    from: '2026-10-17T14:00:00.000Z', to: '2026-10-17T15:00:00.000Z',
    reason: 'A fonte n\u00e3o confirmou observa\u00e7\u00f5es neste intervalo',
  }],
}
const seriesPoints: readonly AnalysisSeriesPoint[] = [
  {
    id: 'series-point-one',
    timestamp: '2026-10-17T17:00:00.000Z',
    energy: { status: 'available', value: 12, unit: 'kWh' },
    emissions: { status: 'available', value: 2, unit: 'kg CO₂e' },
  },
  {
    id: 'series-point-two',
    timestamp: '2026-10-17T18:00:00.000Z',
    energy: { status: 'available', value: 30, unit: 'kWh' },
    emissions: { status: 'available', value: 5, unit: 'kg CO₂e' },
  },
]
const granularityOptions = [
  { value: 'source-window-a', label: 'Janela A da fonte' },
  { value: 'source-window-b', label: 'Janela B da fonte' },
]
const designReviewSeries: readonly AnalysisSeriesPoint[] = [
  {
    id: 'design-review-zero', timestamp: '2026-10-17T13:00:00.000Z',
    energy: { status: 'available', value: 0, unit: 'kWh' },
    emissions: { status: 'available', value: 0, unit: 'kg CO\u2082e' },
  },
  {
    id: 'design-review-gap', timestamp: '2026-10-17T14:00:00.000Z',
    energy: { status: 'unavailable', reason: 'coverageUnavailable' },
    emissions: { status: 'unavailable', reason: 'coverageUnavailable' },
  },
  {
    id: 'design-review-after-gap', timestamp: '2026-10-17T16:00:00.000Z',
    energy: { status: 'available', value: 3.5, unit: 'kWh' },
    emissions: { status: 'available', value: 0.42, unit: 'kg CO\u2082e' },
  },
]
const precisionPoints: readonly AnalysisSeriesPoint[] = [
  {
    id: 'precision-point-one', timestamp: '2026-10-17T17:00:00.000Z',
    energy: { status: 'available', value: 0.000001, unit: 'kWh' },
    emissions: { status: 'available', value: 0.00000004, unit: 'kg CO₂e' },
  },
]
const paginationPoints = Array.from({ length: 12 }, (_, index): AnalysisSeriesPoint & { id: string } => ({
  id: `snapshot-${index + 1}`,
  timestamp: new Date(Date.UTC(2026, 9, 17, 8, index * 15)).toISOString(),
  energy: { status: 'available', value: index + 1, unit: 'kWh' },
  emissions: { status: 'available', value: index + 1, unit: 'kg CO₂e' },
}))
const filterPoints: readonly AnalysisSeriesPoint[] = [
  { id: 'filter-1', timestamp: '2026-10-17T08:00:00.000Z', energy: { status: 'available', value: 1, unit: 'kWh' }, emissions: { status: 'available', value: 0.1, unit: 'kg CO₂e' } },
  { id: 'filter-2', timestamp: '2026-10-17T09:00:00.000Z', energy: { status: 'unavailable', reason: 'coverageUnavailable' }, emissions: { status: 'not-calculable', reason: 'factorUnavailable' } },
  { id: 'filter-3', timestamp: '2026-10-17T10:00:00.000Z', energy: { status: 'available', value: 3, unit: 'kWh' }, emissions: { status: 'unavailable', reason: 'coverageUnavailable' } },
  { id: 'filter-4', timestamp: '2026-10-17T11:00:00.000Z', energy: { status: 'not-calculable', reason: 'factorUnavailable' }, emissions: { status: 'available', value: 0.4, unit: 'kg CO₂e' } },
  { id: 'filter-5', timestamp: '2026-10-17T12:00:00.000Z', energy: { status: 'available', value: 5, unit: 'kWh' }, emissions: { status: 'available', value: 0.5, unit: 'kg CO₂e' } },
  { id: 'filter-6', timestamp: '2026-10-17T13:00:00.000Z', energy: { status: 'available', value: 6, unit: 'kWh' }, emissions: { status: 'available', value: 0.6, unit: 'kg CO₂e' } },
]
const dateFilterPoints: readonly AnalysisSeriesPoint[] = [
  { id: 'date-before', timestamp: '2026-10-17T12:59:00.000Z', energy: { status: 'available', value: 1, unit: 'kWh' }, emissions: { status: 'available', value: 0.1, unit: 'kg CO₂e' } },
  { id: 'date-start', timestamp: '2026-10-17T13:00:00.000Z', energy: { status: 'available', value: 2, unit: 'kWh' }, emissions: { status: 'available', value: 0.2, unit: 'kg CO₂e' } },
  { id: 'date-middle-no-emissions', timestamp: '2026-10-17T13:30:00.000Z', energy: { status: 'available', value: 3, unit: 'kWh' }, emissions: { status: 'not-calculable', reason: 'factorUnavailable' } },
  { id: 'date-middle', timestamp: '2026-10-17T14:00:00.000Z', energy: { status: 'available', value: 4, unit: 'kWh' }, emissions: { status: 'available', value: 0.4, unit: 'kg CO₂e' } },
  { id: 'date-end', timestamp: '2026-10-17T15:00:00.000Z', energy: { status: 'available', value: 5, unit: 'kWh' }, emissions: { status: 'available', value: 0.5, unit: 'kg CO₂e' } },
  { id: 'date-after', timestamp: '2026-10-17T15:00:01.000Z', energy: { status: 'available', value: 6, unit: 'kWh' }, emissions: { status: 'available', value: 0.6, unit: 'kg CO₂e' } },
]
const numericPoints: readonly AnalysisSeriesPoint[] = [
  { id: 'numeric-big', timestamp: '2026-10-17T15:00:00.000Z', energy: { status: 'available', value: 10, unit: 'kWh' }, emissions: { status: 'available', value: 10, unit: 'kg CO₂e' } },
  { id: 'numeric-tie-z', timestamp: '2026-10-17T11:00:00.000Z', energy: { status: 'available', value: 2, unit: 'kWh' }, emissions: { status: 'available', value: 0.5, unit: 'kg CO₂e' } },
  { id: 'numeric-tie-a', timestamp: '2026-10-17T13:00:00.000Z', energy: { status: 'available', value: 2, unit: 'kWh' }, emissions: { status: 'available', value: 0.5, unit: 'kg CO₂e' } },
  { id: 'numeric-tiny', timestamp: '2026-10-17T09:00:00.000Z', energy: { status: 'available', value: 0.000001, unit: 'kWh' }, emissions: { status: 'available', value: 0.00000004, unit: 'kg CO₂e' } },
  { id: 'numeric-missing', timestamp: '2026-10-17T17:00:00.000Z', energy: { status: 'unavailable', reason: 'coverageUnavailable' }, emissions: { status: 'unavailable', reason: 'coverageUnavailable' } },
]
const mixedEnergyUnitsPoints: readonly AnalysisSeriesPoint[] = [
  { id: 'mixed-energy-kwh', timestamp: '2026-10-17T13:00:00.000Z', energy: { status: 'available', value: 1, unit: 'kWh' }, emissions: { status: 'available', value: 0.5, unit: 'kg CO₂e' } },
  { id: 'mixed-energy-wh', timestamp: '2026-10-17T14:00:00.000Z', energy: { status: 'available', value: 1000, unit: 'Wh' }, emissions: { status: 'available', value: 0.6, unit: 'kg CO₂e' } },
]
const mixedEmissionsUnitsPoints: readonly AnalysisSeriesPoint[] = [
  { id: 'mixed-emissions-kg', timestamp: '2026-10-17T13:00:00.000Z', energy: { status: 'available', value: 1, unit: 'kWh' }, emissions: { status: 'available', value: 0.5, unit: 'kg CO₂e' } },
  { id: 'mixed-emissions-g', timestamp: '2026-10-17T14:00:00.000Z', energy: { status: 'available', value: 2, unit: 'kWh' }, emissions: { status: 'available', value: 500, unit: 'g CO₂e' } },
]
let resolveStaleSevenDay: (() => void) | undefined
let refreshSnapshotDelivered = false
let unavailableSnapshotDelivered = false
let emptySequenceCalls = 0
let paginationRefreshCalls = 0
let delayedPaginationCalls = 0
const source: AnalysisSource = {
  load: (_applicationId, context, _signal) => {
    if (fixture === 'series-page-loading-refresh') {
      delayedPaginationCalls += 1
      if (delayedPaginationCalls === 1) return new Promise((resolve) => {
        window.setTimeout(() => resolve(availableForEnergy(120, undefined, undefined, paginationPoints)), 1_000)
      })
      return Promise.resolve(availableForEnergy(3, undefined, undefined, paginationPoints.slice(0, 3)))
    }
    if (fixture === 'series-refresh-shrink') {
      paginationRefreshCalls += 1
      return Promise.resolve(availableForEnergy(120, undefined, undefined,
        paginationRefreshCalls === 1 ? paginationPoints : paginationPoints.slice(0, 3)))
    }
    if (fixture === 'design-review') return Promise.resolve(availableForEnergy(
      3.5, provenanceFactors, energyMethodology, designReviewSeries, designReviewComposition,
      { status: 'available', options: granularityOptions, selectedValue: context.granularity ?? 'source-window-a' },
    ))
    if (fixture === 'series-empty') return Promise.resolve(availableForEnergy(0, undefined, undefined, []))
    if (fixture === 'refresh-error') {
      if (!refreshSnapshotDelivered) {
        refreshSnapshotDelivered = true
        return Promise.resolve(availableForEnergy(42))
      }
      return Promise.reject(new Error('Controlled environmental source failure'))
    }
    if (fixture === 'refresh-unavailable') {
      if (!unavailableSnapshotDelivered) {
        unavailableSnapshotDelivered = true
        return Promise.resolve(availableForEnergy(35))
      }
      return Promise.resolve({ status: 'unavailable' })
    }
    if (fixture === 'empty-then-unavailable') {
      emptySequenceCalls += 1
      if (emptySequenceCalls === 1) return Promise.resolve(availableForEnergy(42))
      if (emptySequenceCalls === 2) return Promise.resolve({ status: 'empty' })
      return Promise.resolve({ status: 'unavailable' })
    }
    if (fixture === 'provenance') return Promise.resolve(availableForEnergy(42, provenanceFactors, undefined, seriesPoints))
    if (fixture === 'granularity-controlled') return Promise.resolve(availableForEnergy(
      context.granularity === 'source-window-b' ? 20 : 10, undefined, undefined, undefined, undefined,
      { status: 'available', options: granularityOptions, selectedValue: context.granularity ?? 'source-window-a' },
    ))
    if (fixture === 'granularity-unsupported') return Promise.resolve(availableForEnergy(
      context.granularity === 'source-window-a' ? 10 : 99, undefined, undefined, undefined, undefined,
      { status: 'available', options: granularityOptions, selectedValue: 'source-window-a' },
    ))
    if (fixture === 'energy-without-carbon-factor') return Promise.resolve(availableForEnergy(0, undefined, energyMethodology))
    if (fixture === 'composition-data') return Promise.resolve(availableForEnergy(0, undefined, undefined, undefined, compositionResult))
    if (fixture === 'composition-empty') return Promise.resolve(availableForEnergy(0, undefined, undefined, undefined, { status: 'empty' }))
    if (fixture === 'composition-unavailable') return Promise.resolve(availableForEnergy(0, undefined, undefined, undefined, { status: 'unavailable', reason: 'A fonte de composição não respondeu para este período' }))
    if (fixture === 'series-table') return Promise.resolve(availableForEnergy(84, undefined, undefined, seriesPoints))
    if (fixture === 'series-precision') return Promise.resolve(availableForEnergy(0.000001, undefined, undefined, precisionPoints))
    if (fixture === 'series-pagination') return Promise.resolve(availableForEnergy(120, undefined, undefined, paginationPoints))
    if (fixture === 'series-filters') return Promise.resolve(availableForEnergy(120, undefined, undefined, filterPoints))
    if (fixture === 'series-dates') return Promise.resolve(availableForEnergy(120, undefined, undefined, dateFilterPoints))
    if (fixture === 'series-numeric') return Promise.resolve(availableForEnergy(120, undefined, undefined, numericPoints))
    if (fixture === 'series-mixed-units') return Promise.resolve(availableForEnergy(0, undefined, undefined, mixedEnergyUnitsPoints))
    if (fixture === 'series-mixed-emissions') return Promise.resolve(availableForEnergy(0, undefined, undefined, mixedEmissionsUnitsPoints))
    if (fixture === 'stale-period-response' && context.period === '7d') {
      return new Promise((resolve) => { resolveStaleSevenDay = () => resolve(availableForEnergy(7)) })
    }
    if (fixture === 'stale-period-response' && context.period === '30d') {
      window.setTimeout(() => resolveStaleSevenDay?.(), 0)
      return Promise.resolve(availableForEnergy(30))
    }
    return Promise.resolve(availableForEnergy(0))
  },
}

export function Harness() {
  const { navigate } = useRoute()
  const id = new URLSearchParams(window.location.search).get('applicationId') ?? 'svc-0142'
  return <AppShell navigate={navigate}>
    <ApplicationDetailPage id={id} navigate={navigate} analysisSource={source} />
  </AppShell>
}

createRoot(document.getElementById('root')!).render(<Harness />)
