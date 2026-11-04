import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getApplications, type Application } from '../../features/applications/api.ts'
import { requestRecalculationPreview, RecalculationPreviewError, type PreviewMeasure, type RecalculationPreview } from '../../features/analysis/recalculationPreview.ts'
import styles from './RecalculationPreviewPage.module.css'

const day = 24 * 60 * 60 * 1000

function selectedPeriod(from: string, to: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return null
  const start = Date.parse(`${from}T00:00:00.000Z`)
  const endStart = Date.parse(`${to}T00:00:00.000Z`)
  if (!Number.isFinite(start) || !Number.isFinite(endStart) || new Date(start).toISOString().slice(0, 10) !== from || new Date(endStart).toISOString().slice(0, 10) !== to) return null
  const end = endStart + day
  if (endStart < start || end - start > 30 * day) return null
  return { from: new Date(start).toISOString(), to: new Date(end).toISOString() }
}

function difference(original: PreviewMeasure, preview: PreviewMeasure, originalCoverage: number, previewCoverage: number) {
  if (original.value === null || preview.value === null) return { value: null, reason: 'differenceMissing' }
  if (original.unit !== preview.unit) return { value: null, reason: 'differenceUnit' }
  if (originalCoverage !== previewCoverage) return { value: null, reason: 'differenceCoverage' }
  if (original.value <= 0) return { value: null, reason: 'differenceReference' }
  return { value: (preview.value - original.value) / original.value, reason: null }
}

export function RecalculationPreviewPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('recalculationPreview')
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsState, setApplicationsState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [applicationId, setApplicationId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [result, setResult] = useState<RecalculationPreview | null>(null)
  const [pending, setPending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const resultHeading = useRef<HTMLHeadingElement | null>(null)
  const generateButton = useRef<HTMLButtonElement | null>(null)
  const hadResult = useRef(false)
  const period = useMemo(() => selectedPeriod(from, to), [from, to])
  const generationHint = applicationsState !== 'ready' || applications.length === 0 ? null :
    !applicationId ? 'selectApplicationHint' : !from || !to ? 'selectPeriodHint' : !period ? 'periodInvalid' : null

  useEffect(() => {
    if (result) {
      hadResult.current = true
      resultHeading.current?.focus()
    } else if (hadResult.current) {
      hadResult.current = false
      generateButton.current?.focus()
    }
  }, [result])

  useEffect(() => {
    const request = new AbortController()
    void getApplications(request.signal).then((items) => {
      if (request.signal.aborted) return
      setApplications(items)
      setApplicationsState('ready')
    }).catch(() => {
      if (request.signal.aborted) return
      setApplicationsState('error')
    })
    return () => request.abort()
  }, [])

  function clearPreviousRequest() {
    controller.current?.abort()
    controller.current = null
    setPending(false)
    setResult(null)
    setRequestError('')
  }

  async function generatePreview() {
    if (!applicationId || !period || pending) return
    const request = new AbortController()
    controller.current = request
    setPending(true)
    setRequestError('')
    setResult(null)
    try {
      const response = await requestRecalculationPreview(applicationId, period.from, period.to, request.signal)
      if (!request.signal.aborted && controller.current === request) setResult(response)
    } catch (error) {
      if (request.signal.aborted || controller.current !== request) return
      if (error instanceof RecalculationPreviewError && error.status === 400) {
        setRequestError(error.code === 'RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED' ? 'observationLimit' :
          error.code === 'INVALID_ANALYSIS_PERIOD' || error.code === 'RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED' ? 'invalidRequest' : 'requestFailed')
      } else setRequestError('requestFailed')
    } finally {
      if (controller.current === request) {
        controller.current = null
        setPending(false)
      }
    }
  }

  function formatNumber(value: number, maximumFractionDigits = 6) {
    return new Intl.NumberFormat(i18n.resolvedLanguage ?? 'pt-BR', { maximumFractionDigits }).format(value)
  }

  function warningMessage(code: string, regionCode: string | null) {
    const key = code === 'CARBON_FACTOR_UNAVAILABLE' ? regionCode ? 'carbonFactorWarning' : 'carbonFactorReason' :
      code === 'HISTORICAL_REGION_UNAVAILABLE' ? 'historicalRegionWarning' : 'unknownWarning'
    return t(key, regionCode ? { region: regionCode } : undefined)
  }

  function reasonMessage(reason: { code: string; metric?: string }) {
    const known = reason.code === 'CARBON_FACTOR_UNAVAILABLE' ? 'carbonFactorReason' :
      reason.code === 'ENERGY_UNAVAILABLE' ? 'energyReason' : null
    return `${known ? t(known) : reason.code}${reason.metric ? ` (${reason.metric})` : ''}`
  }

  function renderMeasure(label: string, key: 'energy' | 'emissions') {
    if (!result) return null
    const original = result.original[key]
    const preview = result.preview[key]
    const change = difference(original, preview, result.original.coverage[key], result.preview.coverage[key])
    const formatMeasure = (measure: PreviewMeasure) => measure.value === null ? t('unavailable') : `${formatNumber(measure.value)} ${measure.unit}`
    return <section className={styles.measure} aria-label={label} key={key}>
      <h3>{label}</h3>
      <div className={styles.measureValues}>
        <p><span>{t('original')}</span><strong>{formatMeasure(original)}</strong></p>
        <p><span>{t('preview')}</span><strong>{formatMeasure(preview)}</strong></p>
      </div>
      <p className={styles.coverage}>{t('coverage')}: {formatNumber(result.original.coverage[key] * 100, 2)}% / {formatNumber(result.preview.coverage[key] * 100, 2)}%</p>
      {change.reason ? <p className={styles.difference}>{t(change.reason)}</p> : <p className={styles.difference}>{t('difference')}: {new Intl.NumberFormat(i18n.resolvedLanguage ?? 'pt-BR', { style: 'percent', signDisplay: 'always', maximumFractionDigits: 2 }).format(change.value!)}</p>}
      {original.reasons.length > 0 && <p className={styles.reasons}>{t('original')}: {original.reasons.map(reasonMessage).join(' ')}</p>}
      {preview.reasons.length > 0 && <p className={styles.reasons}>{t('preview')}: {preview.reasons.map(reasonMessage).join(' ')}</p>}
    </section>
  }

  return <main className={styles.page} tabIndex={-1}>
    <header className={styles.heading}><h1>{t('title')}</h1><p>{t('subtitle')}</p></header>
    <nav className={styles.tabs} aria-label={t('administration')}>
      {[['health', 'health'], ['monitoring', 'monitoring'], ['calculations', 'calculations'], ['audit', 'audit'], ['access', 'access']].map(([key, label]) => key === 'calculations'
        ? <a key={key} href="/administration/calculations" aria-current="page">{t(label)}</a>
        : <span key={key} aria-disabled="true" title={t('navigationUnavailable')}>{t(label)}<small>{t('navigationUnavailable')}</small></span>)}
    </nav>
    {result ? <section className={styles.resultPage} aria-labelledby="preview-title">
      <h2 id="preview-title" ref={resultHeading} tabIndex={-1}>{t('resultTitle')}</h2>
      <p>{t('preserved')}</p>
      <p>{t('application')}: {applications.find((item) => item.id === result.original.applicationId)?.name ?? result.original.applicationId}</p>
      <p>{t('from')}: {new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'pt-BR').format(new Date(result.original.period.from))} · {t('to')}: {new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'pt-BR').format(new Date(Date.parse(result.original.period.to) - 1))}</p>
      <p>{t('noSave')}</p>
      <p role="status">{t(result.status === 'partial' ? 'statusPartial' : result.status === 'empty' ? 'statusEmpty' : 'statusAvailable')}</p>
      {result.warnings.length > 0 && <div role="status" className={styles.warning}>{result.warnings.map((warning) => warningMessage(warning.code, warning.regionCode)).join(' ')}</div>}
      <div className={styles.measureGrid}>{renderMeasure(t('energy'), 'energy')}{renderMeasure(t('emissions'), 'emissions')}</div>
      <section className={styles.provenance} aria-label={t('methodAndFactors')}>
        <h3>{t('methodAndFactors')}</h3>
        {result.preview.provenance.methodologies.map((method) => <p key={`${method.key}-${method.version}`}>{t('method')}: {method.key} v{method.version} · {JSON.stringify(method.parameters)}</p>)}
        {result.preview.provenance.factors.map((factor, index) => <p key={`${factor.regionCode}-${factor.version}-${index}`}>{t('factor')}: {[factor.regionCode, factor.country, factor.region, factor.city, factor.version, factor.contractVersion, factor.source, factor.intensity === null ? null : `${formatNumber(factor.intensity)} ${factor.unit ?? ''}`, factor.validFrom, factor.validUntil, factor.queriedAt.from, factor.queriedAt.to].filter(Boolean).join(' · ') || t('unavailable')}</p>)}
        {result.preview.provenance.methodologies.length === 0 && result.preview.provenance.factors.length === 0 && <p>{t('provenanceUnavailable')}</p>}
      </section>
      <button className={styles.secondaryButton} type="button" onClick={() => { clearPreviousRequest(); }}>{t('back')}</button>
    </section> : <>
      <section className={styles.banner} aria-label={t('calculations')}>● {t('calculations')} · {t('preserved')}</section>
      <section className={styles.card} aria-labelledby="estimation-model-title">
        <h2 id="estimation-model-title">{t('modelTitle')}</h2>
        <p>{t('energyFormula')}</p>
        <p>{t('emissionsFormula')}</p>
      </section>
      <section className={styles.card}><h2>{t('parametersTitle')}</h2><p>{t('configurationNote')}</p></section>
      <section className={styles.card}><h2>{t('recalculateTitle')}</h2><p>{t('recalculateDescription')}</p>
        {applicationsState === 'loading' && <p role="status">{t('loadingApplications')}</p>}
        {applicationsState === 'error' && <p role="alert">{t('applicationsFailed')}</p>}
        {applicationsState === 'ready' && applications.length === 0 && <p role="status">{t('noApplications')}</p>}
        <form onSubmit={(event) => { event.preventDefault(); void generatePreview() }}>
          <label>{t('application')}<select value={applicationId} onChange={(event) => { clearPreviousRequest(); setApplicationId(event.target.value) }}>
            <option value="">{t('selectApplication')}</option>{applications.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>
          <div className={styles.dateFields}>
            <label>{t('from')}<input type="date" value={from} max={to || undefined} onChange={(event) => { clearPreviousRequest(); setFrom(event.target.value) }} /></label>
            <label>{t('to')}<input type="date" value={to} min={from || undefined} onChange={(event) => { clearPreviousRequest(); setTo(event.target.value) }} /></label>
          </div>
          {requestError && <p role="alert">{t(requestError)}</p>}
          <p className={styles.note}>{t('noSave')}</p>
          <div className={styles.actions}>
            <button ref={generateButton} className={styles.primaryButton} type="submit" aria-describedby={generationHint && !pending ? 'generate-preview-hint' : undefined} disabled={!applicationId || !period || pending || applicationsState !== 'ready'}>{pending ? t('processing') : t('generate')}</button>
            <button className={styles.secondaryButton} type="button" onClick={() => navigate('/methodology')}>{t('methodology')}</button>
          </div>
          {generationHint && !pending && <p id="generate-preview-hint" className={styles.formHint} role="status">{t(generationHint)}</p>}
          {pending && <p role="status" aria-live="polite">{t('processing')}</p>}
        </form>
      </section>
    </>}
  </main>
}
