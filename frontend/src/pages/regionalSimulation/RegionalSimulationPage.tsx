import { CardIcon } from '../../components/CardIcon.tsx'
import { faDatabase, faEarthAmericas, faLeaf } from '@fortawesome/free-solid-svg-icons'
import { Breadcrumbs } from '../../components/Breadcrumbs.tsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplicationCatalog } from '../../features/applications/useApplicationCatalog.ts'
import { selectCatalog, type CatalogSortColumn } from '../../features/applications/catalog.ts'
import { getCarbonRegions, postRegionalSimulation, type CarbonRegion, type RegionalSimulationResult, type SimulationFactor, type SimulationMeasure } from '../../features/analysis/regionalSimulation.ts'
import { PageHelp } from '../../components/PageHelp.tsx'
import styles from './RegionalSimulationPage.module.css'

type Period = '24h' | '7d' | '30d'
const periods: readonly Period[] = ['24h', '7d', '30d']
const periodMs: Record<Period, number> = { '24h': 86_400_000, '7d': 604_800_000, '30d': 2_592_000_000 }
type Selection = 'application' | 'region' | null

function periodFromUrl(search: string): string {
  return new URLSearchParams(search).get('period') ?? '7d'
}

function contextKey(search: string) {
  const params = new URLSearchParams(search)
  return JSON.stringify(['applicationId', 'destinationRegionCode', 'period'].map((key) => params.get(key)))
}

function localeTag(locale: string | undefined) { return locale ?? 'pt-BR' }
function normalized(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase() }
function factorLocation(factor: SimulationFactor) {
  return [factor.regionCode, factor.region, factor.country].filter(Boolean).join(' · ')
}

function measureText(measure: SimulationMeasure | undefined, locale: string, digits = 2) {
  if (!measure || measure.value === null) return null
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(measure.value)
  return `${formatted} ${measure.unit}`
}

function missingMeasureText(measure: SimulationMeasure | undefined, translate: (key: string) => string) {
  if (!measure || measure.value !== null) return null
  const code = measure.reasons[0]?.code
  if (code === 'NO_OBSERVATION' || code === 'NO_CALCULABLE_ENERGY') return translate('noCalculableEnergy')
  if (code === 'DESTINATION_FACTOR_UNAVAILABLE' || code === 'DESTINATION_FACTOR_INVALID' || code === 'DESTINATION_REGION_NOT_FOUND') return translate('destinationFactorUnavailable')
  if (code === 'ZERO_REFERENCE') return translate('zeroReference')
  return translate('valueUnavailable')
}

function coverageText(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value)
}

function formatTimestamp(value: string | null | undefined, locale: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return null
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(new Date(value))
}

function SearchDialog({
  kind, onClose, onSelect, applications, regions, selectedId,
}: Readonly<{
  kind: Exclude<Selection, null>
  onClose: () => void
  onSelect: (id: string) => void
  applications: ReturnType<typeof useApplicationCatalog>['applications']
  regions: readonly CarbonRegion[]
  selectedId: string
}>) {
  const { t } = useTranslation('regionalSimulation')
  const { t: tc } = useTranslation('common')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ column: CatalogSortColumn; direction: 'asc' | 'desc' }>({ column: 'name', direction: 'asc' })
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])
  const term = normalized(search.trim())
  const appResults = selectCatalog(applications, { search: term, state: 'ALL', regionCode: '', page: 1, pageSize: 'all', sort },
  { locale: 'pt-BR', timeZone: 'UTC', stateLabels: { AVAILABLE: 'Disponível', UNAVAILABLE: 'Indisponível', NO_METRICS: 'Sem métricas', REMOVED: 'Removida' } })
  const regionMatches = regions.filter((region) => !term || normalized([
    region.code, region.country, region.region, region.city,
  ].filter(Boolean).join(' ')).includes(term))
  const choose = (id: string) => { onSelect(id); onClose() }
  const app = kind === 'application'
  const appItems = appResults.items.map((item) => <button key={item.id} type="button"
    className={`${styles.selectionItem} ${styles.applicationItem}${item.id === selectedId ? ` ${styles.selectedItem}` : ''}`}
    aria-pressed={item.id === selectedId} onClick={() => choose(item.id)}>
    <span className={styles.applicationIdentity}><strong>{item.name}</strong>
      <span className={styles.selectionMeta}><span>{item.id}</span><span aria-hidden="true">·</span><span>{item.location ? `${item.location.regionCode} · ${item.location.country}` : t('locationUnavailable')}</span></span>
    </span>
    <span className={`${styles.selectionStatus} ${styles[`state${item.state}`]}`}>{tc(`state.${item.state}`)}</span>
    {item.id === selectedId && <svg className={styles.selectionCheck} viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>}
  </button>)
  const regionItems = regionMatches.map((item) => <button key={item.code} type="button"
    className={`${styles.selectionItem}${item.code === selectedId ? ` ${styles.selectedItem}` : ''}`}
    aria-pressed={item.code === selectedId} onClick={() => choose(item.code)}>
    <strong>{item.code} · {item.region}</strong><span>{item.country}{item.city ? ` · ${item.city}` : ''}</span>
  </button>)
  const sortOptions = (['name', 'country', 'regionCode', 'city'] as const).flatMap((column) =>
    (['asc', 'desc'] as const).map((direction) => <option key={`${column}:${direction}`} value={`${column}:${direction}`}>
      {t(column)} · {t(direction)}
    </option>))

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="selection-dialog-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} onKeyDown={(event) => { if (event.key === 'Escape' && event.target === event.currentTarget) onClose() }}>
    <div className={styles.dialogHeader}>
      <h2 id="selection-dialog-title">{t(app ? 'chooseApplication' : 'chooseRegion')}</h2>
      <button className={styles.iconButton} type="button" onClick={onClose} aria-label={t('close')}>×</button>
    </div>
    <label className={styles.searchLabel}>{t('searchAll')}
      <input autoFocus className="form-control" type="search" placeholder={t('searchPlaceholder')} value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
    </label>
    {app && <div className={styles.catalogToolbar}>
      <label>{t('sortBy')}<select className="form-control" aria-label={t('sortBy')} value={`${sort.column}:${sort.direction}`} onChange={(event) => {
        const [column, direction] = event.currentTarget.value.split(':') as [CatalogSortColumn, 'asc' | 'desc']
        setSort({ column, direction })
      }}>{sortOptions}</select></label>
      <span className={styles.resultCount} role="status">{t('applicationCount', { count: appResults.total })}</span>
    </div>}
    <div className={`${styles.selectionList}${app ? ` ${styles.applicationList}` : ''}`}>
      {app ? appItems : regionItems}
      {app && appResults.total === 0 && <p className={styles.dialogEmpty}>{t('noApplicationsMatch')}</p>}
      {!app && regionMatches.length === 0 && <p className={styles.dialogEmpty}>{t('noRegionsMatch')}</p>}
      {!app && regions.length === 0 && regionMatches.length === 0 && <p className={styles.dialogEmpty}>{t('regionsEmpty')}</p>}
    </div>
    <div className={styles.dialogFooter}>{!app && <span>{t('regionCount', { count: regionMatches.length })}</span>}<button type="button" className="button secondary" onClick={onClose}>{t('cancel')}</button></div>
  </dialog>
}

function ClearConfirmation({ onCancel, onConfirm }: Readonly<{ onCancel: () => void; onConfirm: () => void }>) {
  const { t } = useTranslation('regionalSimulation')
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])
  return <dialog ref={dialogRef} className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="clear-dialog-title" onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <h2 id="clear-dialog-title">{t('clearTitle')}</h2><p>{t('clearExplanation')}</p>
    <div className={styles.dialogActions}><button type="button" autoFocus className="button secondary" onClick={onCancel}>{t('cancel')}</button><button type="button" className="button" onClick={onConfirm}>{t('confirmClear')}</button></div>
  </dialog>
}

function FactorLine({ factor, locale }: Readonly<{ factor: SimulationFactor; locale: string }>) {
  const { t } = useTranslation('regionalSimulation')
  return <li><span>{factorLocation(factor) || t('factorLocationUnavailable')}</span><span>{factor.intensity === null || !factor.unit ? t('factorUnavailable') : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(factor.intensity)} ${factor.unit}`}</span>{factor.version && <small>{factor.version}</small>}</li>
}

function ResultCards({ result, applicationName, locale, pending }: Readonly<{
  result: RegionalSimulationResult
  applicationName: string
  locale: string
  pending: boolean
}>) {
  const { t } = useTranslation('regionalSimulation')
  const queriedAt = formatTimestamp(result.destinationFactor?.queriedAt, locale)
  const energy = measureText(result.energy, locale)
  const energyUnavailable = missingMeasureText(result.energy, t)
  const reference = measureText(result.reference, locale)
  const referenceUnavailable = missingMeasureText(result.reference, t)
  const destination = measureText(result.destination, locale)
  const destinationUnavailable = missingMeasureText(result.destination, t)
  const difference = measureText(result.difference.absolute, locale)
  const percent = result.difference.percent.value
  const percentText = percent === null ? null : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(Math.abs(percent))
  const lower = percent !== null && percent < 0
  const higher = percent !== null && percent > 0
  const location = result.destinationFactor ? factorLocation(result.destinationFactor) : result.destinationRegionCode

  return <section aria-label={t('results')} className={styles.resultSection}>
    {pending && <p className={styles.pendingNotice} role="status">{t('pendingResult')}</p>}
    <div className={styles.resultGrid}>
      <article data-help="simulation-original" className={styles.resultCard} aria-label={t('originalResult')}>
        <div className={styles.cardHeading}><h2><CardIcon icon={faDatabase} size="small" inline />{t('originalResult')}</h2><span className={styles.preserved}>{t('preserved')}</span></div>
        <p className={styles.fieldLabel}>{t('application')}</p><strong className={styles.emphasis}>{applicationName}</strong>
        <dl className={styles.values}>
          <div><dt>{t('energyForPeriod')}</dt><dd>{energy ?? energyUnavailable}</dd></div>
          <div><dt>{t('referenceEmissions')}</dt><dd>{reference ?? referenceUnavailable}</dd></div>
        </dl>
        <p className={styles.coverage}>{t('coverageSummary', { energy: coverageText(result.coverage.energy, locale), reference: coverageText(result.coverage.reference, locale) })}</p>
        <p className={styles.muted}>{t('historicalFactorsPreserved')}</p>
      </article>
      <article data-help="simulation-factor" className={styles.resultCard} aria-label={t('destinationFactorTitle')}>
        <h2><CardIcon icon={faEarthAmericas} size="small" inline />{t('destinationFactorTitle')}</h2>
        <strong className={styles.emphasis}>{location}</strong>
        <p className={styles.fieldLabel}>{t('carbonIntensity')}</p>
        {result.destinationFactor?.intensity !== null && result.destinationFactor?.unit
          ? <p className={styles.factorValue}>{new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(result.destinationFactor.intensity)} <small>{result.destinationFactor.unit}</small></p>
          : <p className={styles.factorUnavailable}>{t('factorUnavailable')}</p>}
        {result.destinationFactor?.version && <p className={styles.muted}>{t('factorVersion', { version: result.destinationFactor.version })}</p>}
        <div className={styles.provenance}>
          <p>{t('factorSource')}: {t('greenerBackend')}</p>
          <p>{t('queriedAt')}: {queriedAt ?? t('timestampUnavailable')}</p>
          <p className={styles.muted}>{t('queryNotValidity')}</p>
          <button type="button" className={styles.textButton} popoverTarget="factor-details">{t('factorDetails')}</button>
          <div id="factor-details" popover="auto" className={styles.factorDetails}>
            <h3>{t('factorDetails')}</h3>
            <p>{t('currentFactorAppliedToHistory')}</p>
            <ul>{result.referenceFactors.length ? result.referenceFactors.map((factor, index) => <FactorLine key={`${factor.id ?? factor.regionCode ?? 'factor'}-${index}`} factor={factor} locale={locale} />) : <li>{t('referenceFactorsUnavailable')}</li>}</ul>
            {result.destinationFactor && <ul><FactorLine factor={result.destinationFactor} locale={locale} /></ul>}
          </div>
        </div>
      </article>
      <article data-help="simulation-scenario" className={`${styles.resultCard} ${styles.scenarioCard}`} aria-label={t('scenarioResult')}>
        <h2><CardIcon icon={faLeaf} size="small" inline />{t('scenarioResult')}</h2><p className={styles.muted}>{t('scenarioEmissions')}</p>
        <p className={styles.resultValue}>{destination ?? destinationUnavailable}</p>
        {percentText && (lower || higher) && <span className={lower ? styles.positiveDelta : styles.negativeDelta}>{t(lower ? 'percentBelow' : 'percentAbove', { percent: percentText })}</span>}
        {percent === 0 && <span className={styles.neutralDelta}>{t('noDifference')}</span>}
        {percent === null && <span className={styles.neutralDelta}>{t('percentUnavailable')}</span>}
        <strong className={styles.deltaText}>{difference ? t('absoluteDifference', { value: difference }) : t('differenceUnavailable')}</strong>
        <div className={styles.scenarioEnergy}><span>{t('energyPreserved')}</span><strong>{energy ?? energyUnavailable}</strong></div>
        <p className={styles.muted}>{t('separatePreview')}</p>
      </article>
    </div>
  </section>
}

export function RegionalSimulationPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('regionalSimulation')
  const { applications, loading: applicationsLoading, error: applicationsError, retry: retryApplications } = useApplicationCatalog()
  const [search, setSearch] = useState(window.location.search)
  const [regions, setRegions] = useState<readonly CarbonRegion[]>([])
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [regionsError, setRegionsError] = useState(false)
  const [regionAttempt, setRegionAttempt] = useState(0)
  const [dialog, setDialog] = useState<Selection>(null)
  const [result, setResult] = useState<RegionalSimulationResult | null>(null)
  const [resultContext, setResultContext] = useState<string | null>(null)
  const [resultApplicationName, setResultApplicationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [pageNotice, setPageNotice] = useState('')
  const controllerRef = useRef<AbortController | null>(null)
  const current = useMemo(() => new URLSearchParams(search), [search])
  const applicationId = current.get('applicationId') ?? ''
  const destinationRegionCode = current.get('destinationRegionCode') ?? ''
  const period = periodFromUrl(search)
  const validPeriod = periods.includes(period as Period)
  const selectedApplication = applications.find((application) => application.id === applicationId)
  const selectedRegion = regions.find((region) => region.code === destinationRegionCode)
  const locale = localeTag(i18n.resolvedLanguage)
  const pending = result !== null && resultContext !== contextKey(search)
  const canSimulate = Boolean(applicationId && selectedApplication && destinationRegionCode && selectedRegion && validPeriod && !loading && !applicationsLoading && !regionsLoading)

  useEffect(() => {
    const onPopState = () => { setSearch(window.location.search); setPageNotice('') }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void getCarbonRegions(controller.signal).then((loaded) => {
      setRegions(loaded)
      setRegionsError(false)
    }).catch(() => {
      if (!controller.signal.aborted) setRegionsError(true)
    }).finally(() => {
      if (!controller.signal.aborted) setRegionsLoading(false)
    })
    return () => controller.abort()
  }, [regionAttempt])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const updateParameter = (key: string, value: string) => {
    controllerRef.current?.abort()
    setLoading(false)
    setError(false)
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    const next = params.toString()
    const url = `${window.location.pathname}${next ? `?${next}` : ''}`
    window.history.pushState({}, '', url)
    setSearch(window.location.search)
    setPageNotice('')
  }

  const retryRegions = () => {
    setRegionsLoading(true)
    setRegionsError(false)
    setRegionAttempt((attempt) => attempt + 1)
  }

  const simulate = async () => {
    if (!canSimulate) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setError(false)
    setPageNotice('')
    const to = new Date()
    const from = new Date(to.getTime() - periodMs[period as Period])
    const submittedContext = contextKey(search)
    try {
      const data = await postRegionalSimulation(applicationId, {
        from: from.toISOString(), to: to.toISOString(), destinationRegionCode,
      }, controller.signal)
      if (!controller.signal.aborted) {
        setResult(data)
        setResultContext(submittedContext)
        setResultApplicationName(selectedApplication?.name ?? applicationId)
      }
    } catch {
      if (!controller.signal.aborted) setError(true)
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const clear = () => {
    controllerRef.current?.abort()
    setResult(null)
    setResultContext(null)
    setResultApplicationName('')
    setError(false)
    setLoading(false)
    const params = new URLSearchParams(window.location.search)
    for (const key of ['applicationId', 'destinationRegionCode', 'period']) params.delete(key)
    const next = params.toString()
    window.history.pushState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`)
    setSearch(window.location.search)
    setShowClearDialog(false)
  }

  return <main className={`content ${styles.page}`}>
    <header className={`page-heading ${styles.header}`}>
      <div><Breadcrumbs navigate={navigate} items={[{ label: t('title') }]} /><p className="eyebrow">{t('sectionLabel')}</p><div className="heading-title"><h1>{t('title')}</h1><PageHelp steps={[
        { title: t('simulationParameters'), description: t('helpParameters'), target: '[data-help="simulation-parameters"]' },
        { title: t('originalResult'), description: t('helpOriginal'), target: '[data-help="simulation-original"]' },
        { title: t('destinationFactorTitle'), description: t('helpFactor'), target: '[data-help="simulation-factor"]' },
        { title: t('scenarioResult'), description: t('helpScenario'), target: '[data-help="simulation-scenario"]' },
      ]} /></div><p className={styles.subtitle}>{t('subtitle')}</p></div>
      <button className="button secondary" type="button" disabled={!applicationId && !destinationRegionCode && !result && period === '7d'} onClick={() => setShowClearDialog(true)}>{t('clearScenario')}</button>
    </header>

    <section data-help="simulation-parameters" className={styles.controls} aria-label={t('simulationParameters')}>
      <div className={styles.controlGroup}>
        <span className={styles.fieldLabel}>{t('application')}</span>
        <button className={`form-control ${styles.selectButton}`} type="button" aria-label={t('application')} aria-haspopup="dialog" onClick={() => setDialog('application')} disabled={applicationsLoading && applications.length === 0}>
          <span>{selectedApplication?.name ?? (applicationsLoading ? t('loadingApplications') : applicationId || t('chooseApplication'))}</span>
        </button>
      </div>
      <label className={styles.controlGroup}><span className={styles.fieldLabel}>{t('period')}</span>
        <select className="form-control" aria-label={t('periodAccessibleLabel')} value={period} onChange={(event) => updateParameter('period', event.currentTarget.value)}>
          {!validPeriod && <option value={period}>{t('invalidPeriod', { period })}</option>}
          <option value="24h">{t('last24Hours')}</option><option value="7d">{t('last7Days')}</option><option value="30d">{t('last30Days')}</option>
        </select>
      </label>
      <div className={styles.controlGroup}>
        <span className={styles.fieldLabel}>{t('destinationRegion')}</span>
        <button className={`form-control ${styles.selectButton}`} type="button" aria-label={t('destinationRegion')} aria-haspopup="dialog" onClick={() => setDialog('region')} disabled={regionsLoading || regionsError || regions.length === 0}>
          <span>{selectedRegion ? `${selectedRegion.code} · ${selectedRegion.country}` : regionsLoading ? t('loadingRegions') : destinationRegionCode || t('chooseRegion')}</span>
        </button>
      </div>
      <button type="button" className={`button ${styles.submit}`} onClick={() => void simulate()} disabled={!canSimulate}>{loading ? t('simulating') : t('simulate')}</button>
    </section>

    {!validPeriod && <p className={styles.validation} role="alert">{t('invalidPeriodMessage', { period })}</p>}
    {applicationId && !applicationsLoading && !selectedApplication && <p className={styles.validation} role="alert">{t('applicationUnavailable')}</p>}
    {destinationRegionCode && !regionsLoading && !regionsError && !selectedRegion && <p className={styles.validation} role="alert">{t('regionUnavailable')}</p>}
    {applicationsError && <p className={styles.inlineError} role="alert">{t('applicationsUnavailable')} <button type="button" className={styles.textButton} onClick={retryApplications}>{t('retry')}</button></p>}
    {regionsError && <p className={styles.inlineError} role="alert">{t('regionsUnavailable')} <button type="button" className={styles.textButton} onClick={retryRegions}>{t('retry')}</button></p>}
    {regions.length === 0 && !regionsLoading && !regionsError && <p className={styles.inlineNotice} role="status">{t('regionsEmpty')}</p>}
    <p className={styles.disclaimer}>{t('disclaimer')}</p>

    {loading && <div className={styles.statePanel} role="status"><span className={styles.progress} /><strong>{t('loadingResult')}</strong><p>{t('loadingExplanation')}</p><button type="button" className={styles.textButton} onClick={() => { controllerRef.current?.abort(); setLoading(false) }}>{t('cancel')}</button></div>}
    {error && !loading && <div className={styles.statePanel} role="alert"><strong>{t('requestFailed')}</strong><p>{t('contextPreserved')}</p><button type="button" className="button secondary" onClick={() => void simulate()}>{t('retry')}</button></div>}
    {pageNotice && <p className={styles.inlineNotice} role="status">{pageNotice}</p>}
    {result?.status === 'empty' && !pending && !loading && <div className={styles.statePanel} role="status"><strong>{t('emptyTitle')}</strong><p>{t('emptyExplanation')}</p><button type="button" className="button secondary" onClick={() => updateParameter('period', '30d')}>{t('changePeriod')}</button></div>}
    {result?.status === 'partial' && !pending && !loading && <p className={styles.inlineNotice} role="status"><strong>{t('partialResult')}.</strong> {t('partialExplanation')}</p>}
    {result?.status === 'available' && !pending && !loading && <p className={styles.srOnly} role="status">{t('availableResult')}</p>}
    {result && result.status !== 'empty' && !loading && <ResultCards result={result} applicationName={resultApplicationName} locale={locale} pending={pending} />}

    {showClearDialog && <ClearConfirmation onCancel={() => setShowClearDialog(false)} onConfirm={clear} />}
    {dialog && <SearchDialog kind={dialog} onClose={() => setDialog(null)} onSelect={(value) => updateParameter(dialog === 'application' ? 'applicationId' : 'destinationRegionCode', value)} applications={applications} regions={regions} selectedId={dialog === 'application' ? applicationId : destinationRegionCode} />}
  </main>
}
