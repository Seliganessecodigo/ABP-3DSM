export type PreviewMeasure = Readonly<{ value: number | null; unit: string; reasons: readonly Readonly<{ code: string; metric?: string }>[] }>
export type PreviewAnalysis = Readonly<{
  status: 'available' | 'empty'
  applicationId: string
  period: Readonly<{ from: string; to: string }>
  energy: PreviewMeasure
  emissions: PreviewMeasure
  coverage: Readonly<{ energy: number; emissions: number }>
  provenance: Readonly<{
    methodologies: readonly Readonly<{ key: string; version: string; parameters: Readonly<Record<string, number>> }>[]
    factors: readonly Readonly<{ regionCode: string | null; country: string | null; region: string | null; city: string | null;
      intensity: number | null; unit: string | null; version: string | null; contractVersion: string | null;
      source: string | null; validFrom: string | null; validUntil: string | null; queriedAt: Readonly<{ from: string | null; to: string | null }> }>[]
    reasons: readonly Readonly<{ code: string; metric?: string }>[]
  }>
}>
export type RecalculationPreview = Readonly<{
  status: 'available' | 'empty' | 'partial'
  original: PreviewAnalysis
  preview: PreviewAnalysis
  warnings: readonly Readonly<{ code: string; regionCode: string | null }>[]
}>

let apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
while (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1)

export class RecalculationPreviewError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string) { super(`Recalculation preview HTTP ${status}`); this.status = status; this.code = code }
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function date(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function nullableString(value: unknown): value is string | null { return value === null || typeof value === 'string' }
function readReasons(value: unknown) {
  if (!Array.isArray(value) || !value.every((item) => record(item) && typeof item.code === 'string' &&
    (item.metric === undefined || typeof item.metric === 'string'))) throw new Error('Invalid recalculation preview reasons')
  return value as readonly Readonly<{ code: string; metric?: string }>[]
}
function readAnalysis(value: unknown): PreviewAnalysis {
  if (!record(value) || !['available', 'empty'].includes(String(value.status)) || typeof value.applicationId !== 'string' ||
    !record(value.period) || !date(value.period.from) || !date(value.period.to) || !record(value.energy) || !record(value.emissions) ||
    !record(value.coverage) || !record(value.provenance) || !Array.isArray(value.provenance.methodologies) ||
    !Array.isArray(value.provenance.factors)) throw new Error('Invalid recalculation preview analysis')
  const measure = (raw: unknown): PreviewMeasure => {
    if (!record(raw) || typeof raw.unit !== 'string' || !(raw.value === null || typeof raw.value === 'number' && Number.isFinite(raw.value))) {
      throw new Error('Invalid recalculation preview measure')
    }
    return { value: raw.value as number | null, unit: raw.unit, reasons: readReasons(raw.reasons) }
  }
  const coverage = (raw: unknown) => {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0 || raw > 1) throw new Error('Invalid recalculation preview coverage')
    return raw
  }
  const methodologies = value.provenance.methodologies.map((item): PreviewAnalysis['provenance']['methodologies'][number] => {
    if (!record(item) || typeof item.key !== 'string' || typeof item.version !== 'string' || !record(item.parameters) ||
      !Object.values(item.parameters).every((parameter) => typeof parameter === 'number' && Number.isFinite(parameter))) {
      throw new Error('Invalid recalculation preview methodology')
    }
    return { key: item.key, version: item.version, parameters: item.parameters as Record<string, number> }
  })
  const factors = value.provenance.factors.map((item): PreviewAnalysis['provenance']['factors'][number] => {
    if (!record(item) || !['contractVersion', 'regionCode', 'country', 'region', 'city', 'unit', 'version', 'source'].every((key) => nullableString(item[key])) ||
      !(item.intensity === null || typeof item.intensity === 'number' && Number.isFinite(item.intensity)) ||
      !date(item.validFrom) && item.validFrom !== null || !date(item.validUntil) && item.validUntil !== null ||
      !record(item.queriedAt) || !nullableString(item.queriedAt.from) || !nullableString(item.queriedAt.to)) throw new Error('Invalid recalculation preview factor')
    return { contractVersion: item.contractVersion as string | null, regionCode: item.regionCode as string | null,
      country: item.country as string | null, region: item.region as string | null, city: item.city as string | null,
      intensity: item.intensity as number | null, unit: item.unit as string | null, version: item.version as string | null,
      source: item.source as string | null, validFrom: item.validFrom as string | null, validUntil: item.validUntil as string | null,
      queriedAt: { from: item.queriedAt.from as string | null, to: item.queriedAt.to as string | null } }
  })
  return { status: value.status as PreviewAnalysis['status'], applicationId: value.applicationId,
    period: { from: value.period.from, to: value.period.to }, energy: measure(value.energy), emissions: measure(value.emissions),
    coverage: { energy: coverage(value.coverage.energy), emissions: coverage(value.coverage.emissions) },
    provenance: { methodologies, factors, reasons: readReasons(value.provenance.reasons) } }
}

function readResponse(value: unknown, applicationId: string, from: string, to: string): RecalculationPreview {
  if (!record(value) || !['available', 'empty', 'partial'].includes(String(value.status)) || !Array.isArray(value.warnings)) {
    throw new Error('Invalid recalculation preview response')
  }
  const original = readAnalysis(value.original)
  const preview = readAnalysis(value.preview)
  if (original.applicationId !== applicationId || preview.applicationId !== applicationId ||
    original.period.from !== from || original.period.to !== to ||
    preview.period.from !== from || preview.period.to !== to) throw new Error('Mismatched recalculation preview context')
  const warnings = value.warnings.map((warning) => {
    if (!record(warning) || typeof warning.code !== 'string' || !nullableString(warning.regionCode)) throw new Error('Invalid recalculation preview warning')
    return { code: warning.code, regionCode: warning.regionCode }
  })
  return { status: value.status as RecalculationPreview['status'], original, preview, warnings }
}

export async function requestRecalculationPreview(applicationId: string, from: string, to: string, signal: AbortSignal): Promise<RecalculationPreview> {
  const response = await fetch(`${apiBase}/applications/${encodeURIComponent(applicationId)}/analysis/recalculation-preview`, {
    method: 'POST', signal, headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to }),
  })
  if (!response.ok) {
    let code = ''
    try { const payload: unknown = await response.json(); if (record(payload) && typeof payload.code === 'string') code = payload.code } catch { /* response without JSON */ }
    throw new RecalculationPreviewError(response.status, code)
  }
  return readResponse(await response.json() as unknown, applicationId, from, to)
}
