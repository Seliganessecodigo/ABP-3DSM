import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { Application } from '../../features/applications/api.ts'
import { ActionButton } from '../../components/ActionButton.tsx'
import { LoadingState } from '../../components/LoadingState.tsx'
import { formatDate } from '../../utils/formatDate.ts'
import { useMethodology } from './useMethodology.ts'
import styles from './MethodologyPage.module.css'

export function RecordedMethodology({ id, navigate }: Readonly<{ id: string | null; navigate: (url: string) => void }>) {
  const { t, i18n } = useTranslation('methodology')
  const { t: common } = useTranslation('common')
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const { application, collection, data, status, retry, applications } = useMethodology(id)
  const [selectedApplicationId, setSelectedApplicationId] = useState('')
  const params = new URLSearchParams(window.location.search)
  const backQuery = params.size ? `?${params.toString()}` : ''
  const backUrl = id ? `/services/${encodeURIComponent(id)}${backQuery}` : '/'
  const date = (value: string) => formatDate(value, locale, common('date.noObservation'))
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value)
  const energy = data?.energy
  const method = energy?.model
  const snapshot = data?.carbon?.factorSnapshot
  const referenceUrl = snapshot?.source && /^https?:\/\//i.test(snapshot.source) ? snapshot.source : null
  const isLoading = status === 'loading'
  return <section className={`content ${styles.page}`} tabIndex={-1}>
    <nav className={styles.breadcrumb} aria-label={common('nav.main')}>
      <a href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}>{common('nav.applications')}</a>
      {application && <><span aria-hidden="true">›</span><a href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>{application.name}</a></>}
      <span aria-hidden="true">›</span><span aria-current="page">{t('title')}</span>
    </nav>
    <header className="page-heading">
      <div><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1>
        <p>{t('description', { application: application?.name ?? '' })}</p></div>
      {id && <a className="button secondary" href={backUrl} onClick={(event) => { event.preventDefault(); navigate(backUrl) }}>{t('back')}</a>}
    </header>
    {!id && status === 'select-application' && <section className="empty-state">
      <h2>{t('chooseApplication')}</h2><p>{t('chooseApplicationDescription')}</p>
      <label htmlFor="methodology-application">{t('selectApplication')}</label>{' '}
      <select id="methodology-application" value={selectedApplicationId} onChange={(event) => setSelectedApplicationId(event.target.value)}>
        <option value="">{t('selectApplication')}</option>{applications.map((item: Application) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>{' '}
      <ActionButton disabled={!selectedApplicationId} onClick={() => navigate(`/services/${encodeURIComponent(selectedApplicationId)}/methodology`)}>{t('continue')}</ActionButton>
    </section>}
    {!id && status === 'catalog-empty' && <section className="empty-state"><h2>{t('catalogEmpty')}</h2><p>{t('catalogEmptyDescription')}</p></section>}
    {isLoading && <LoadingState title={t('loading')} />}
    {status === 'not-found' && <section className="empty-state"><h2>{t('notFound')}</h2><p>{t('notFoundDescription')}</p></section>}
    {status === 'no-collection' && <section className="empty-state"><h2>{t('noCollection')}</h2><p>{t('noCollectionDescription')}</p></section>}
    {status === 'no-result' && <section className="empty-state"><h2>{t('noResult')}</h2><p>{t('noResultDescription')}</p></section>}
    {status === 'unavailable' && <section className="empty-state"><h2>{t('unavailable')}</h2><p>{t('unavailableDescription')}</p></section>}
    {status === 'error' && <section className="empty-state" role="alert"><h2>{t('error')}</h2><p>{t('errorDescription')}</p><ActionButton onClick={retry}>{common('actions.retry')}</ActionButton></section>}
    {data && collection && <>
      <section className={styles.indicator} aria-labelledby="methodology-indicator-title">
        <div><p className={styles.kicker}>{t('indicator')}</p><h2 id="methodology-indicator-title">{t('energyEstimate')}</h2><p>{application?.name}</p></div>
        <p className={styles.value}>{!energy || energy.valueKwh === null ? t('notCalculable') : <><strong>{number(energy.valueKwh)}</strong> kWh</>}</p>
        <span className={styles.status}>{energy?.valueKwh !== null && energy ? t('estimated') : t('notCalculable')}</span>
      </section>
      {status === 'not-calculable' && <section className="empty-state"><h2>{t('notCalculable')}</h2><p>{t('notCalculableDescription')}</p></section>}
      {data.status === 'absent' && <section className="empty-state"><h2>{t('unavailable')}</h2><p>{t('unavailableDescription')}</p></section>}
      {method && <>
      <section className={styles.card} aria-labelledby="formula-heading">
        <header><div><p className={styles.kicker}>{t('calculation')}</p><h2 id="formula-heading">{t('formula')}</h2></div><span className={styles.tag}>{t('version')} {method.version}</span></header>
          {method.formula.status === 'available' && method.formula.expression ? <pre className={styles.formula}><code>{method.formula.expression}</code></pre> : <p className={styles.note}>{t('unavailableDescription')}</p>}
          <p className={styles.note}>{t('formulaNote')}</p>
          <div className={styles.grid}>
            <section><h3>{t('inputs')}</h3><dl>{Object.entries(method.formula.inputUnits ?? {}).map(([name, unit]) => <div key={name}><dt>{name}</dt><dd>{unit}</dd></div>)}</dl></section>
            <section><h3>{t('output')}</h3><dl><div><dt>{t('energyEstimate')}</dt><dd>{method.formula.outputUnit ?? t('unknown')}</dd></div></dl></section>
            {Object.keys(method.parameters).length > 0 && <section><h3>{t('parameters')}</h3><dl>{Object.entries(method.parameters).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{number(value)} {method.formula.inputUnits?.[name] ?? ''}</dd></div>)}</dl></section>}
            <section><h3>{t('configuration')}</h3><dl><div><dt>{t('version')}</dt><dd>{method.configVersion ?? t('unknown')}</dd></div>{method.configId && <div><dt>{t('identifier')}</dt><dd>{method.configId}</dd></div>}</dl></section>
          </div>
      </section>
      <section className={styles.card}>
        <h2>{t('validityAndSource')}</h2><dl className={styles.metadata}>
          {snapshot && <><div><dt>{t('version')}</dt><dd>{snapshot.version ?? t('unknown')}</dd></div><div><dt>{t('factor')}</dt><dd>{snapshot.intensity === null ? t('notProvided') : `${number(snapshot.intensity)} ${snapshot.unit ?? ''}`}</dd></div>
            {snapshot.source && <div><dt>{t('reference')}</dt><dd>{referenceUrl ? <a href={referenceUrl} target="_blank" rel="noopener noreferrer">{snapshot.source}</a> : snapshot.source}</dd></div>}
            <div><dt>{t('queriedAt')}</dt><dd>{snapshot.queriedAt ? date(snapshot.queriedAt) : t('notProvided')}</dd></div></>}
          {data.carbon && <><div><dt>{t('carbonEstimate')}</dt><dd>{data.carbon.valueGramsCo2e === null ? t('notProvided') : `${number(data.carbon.valueGramsCo2e)} gCO₂e`}</dd></div><div><dt>{t('carbonFormula')}</dt><dd>{data.carbon.formula.expression}</dd></div></>}
          <div><dt>{t('collectionPeriod')}</dt><dd>{date(collection.intervalStart)} – {date(collection.intervalEnd)}</dd></div>
        </dl>
      </section>
      <p className={styles.disclaimer}>{t('estimateNotice')}</p>
      </>}
    </>}
  </section>
}

