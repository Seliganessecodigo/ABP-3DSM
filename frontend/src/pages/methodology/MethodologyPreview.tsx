import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { stateIcons, stateLabel } from '../../features/applications/presentation.ts'
import type { ApplicationState } from '../../features/applications/catalog.ts'
import type { PreferenceDraft, PreferenceTab } from './usePreferenceDraft.ts'
import styles from './Preferences.module.css'

// Illustrative observations from the approved design, never substitutes for API data.
const applications: { name: string; state: ApplicationState; energy: number | null; emissions: number | null; coverage: number | null; us?: boolean }[] = [
  { name: 'app-checkout', state: 'AVAILABLE', energy: 9.4, emissions: 1.8, coverage: 79, us: true },
  { name: 'app-estoque', state: 'UNAVAILABLE', energy: null, emissions: null, coverage: null },
  { name: 'app-legado', state: 'REMOVED', energy: null, emissions: null, coverage: null },
  { name: 'app-pagamentos', state: 'AVAILABLE', energy: 8.6, emissions: 1.7, coverage: 92 },
  { name: 'app-relatorios', state: 'NO_METRICS', energy: null, emissions: null, coverage: null },
]

export function MethodologyPreview({ tab, drafts }: Readonly<{ tab: PreferenceTab; drafts: Record<PreferenceTab, PreferenceDraft> }>) {
  const { t, i18n } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const { t: common } = useTranslation('common')
  const { t: catalog } = useTranslation('catalog')
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value)
  const draft = drafts[tab]
  const numeric = draft.value.trim() !== '' && Number.isFinite(Number(draft.value)) ? Number(draft.value) : null
  const description = tab === 'analysis' ? `${t('days', { count: Number(draft.period) })} • ${t(draft.granularity)}`
    : numeric === null ? t('invalidValue') : tab === 'coverage' ? t('coveragePreview', { value: number(numeric) }) : t('limitPreview', { value: number(numeric), unit: tab === 'energy' ? 'kWh' : 'kg CO₂e' })
  return <section className={`${styles.card} ${styles.preview}`} aria-labelledby="preview-title">
    <p className={styles.step}>{t('stepPreview')}</p>
    <div className={styles.previewHeading}><h2 id="preview-title">{t(tab === 'analysis' ? 'analysisPreview' : tab === 'coverage' ? 'warningsPreview' : 'highlightsPreview')}</h2><span className={styles.badge}>{t('exampleData')}</span></div>
    <p className={styles.previewDescription}>{description}</p>
    {tab === 'analysis' ? <AnalysisPreview draft={draft} /> : <>
      <div className={styles.catalogPreview}><table><thead><tr><th scope="col">{catalog('app')} <span aria-hidden="true">↑</span></th><th scope="col">{common('location.country')}</th><th scope="col">{catalog('regionCode')}</th><th scope="col">{common('location.city')}</th><th scope="col">{common('state.label')}</th><th scope="col">{common('date.lastCheck')}</th><th scope="col">{catalog('actions')}</th></tr></thead>
        <tbody>{applications.map((application) => {
          const warnings: string[] = []
          for (const metric of ['energy', 'emissions', 'coverage'] as const) {
            const preference = drafts[metric]
            const threshold = preference.value.trim() === '' ? NaN : Number(preference.value)
            const value = application[metric]
            if (!preference.enabled || !Number.isFinite(threshold) || threshold < 0 || metric === 'coverage' && threshold > 100 || value === null) continue
            if (metric === 'coverage' ? value < threshold : value > threshold) warnings.push(t(`warning.${metric}`, { value: number(value), limit: number(threshold) }))
          }
          return <tr key={application.name} className={warnings.length ? styles.highlightRow : undefined}>
            <td data-label={catalog('app')}><strong>{application.name}</strong>{warnings.length > 0 && <div className={styles.rowWarnings}><b>{t('warningCount', { count: warnings.length })}</b>{warnings.map((warning) => <span key={warning}>{warning}</span>)}</div>}</td>
            <td data-label={common('location.country')}>{t(application.us ? 'us' : 'brazil')}</td><td data-label={catalog('regionCode')}>{application.us ? 'US-VA' : 'BR-SP'}</td><td data-label={common('location.city')}>{application.us ? common('location.cityUnknown') : t('saoPaulo')}</td>
            <td data-label={common('state.label')}><span className={`state-badge state-${application.state.toLowerCase()}`}><span aria-hidden="true">{stateIcons[application.state]}</span>{stateLabel(application.state, common)}</span></td>
            <td data-label={common('date.lastCheck')}>{new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date('2026-10-09T17:32:00Z'))}</td>
            <td data-label={catalog('actions')}><svg className={styles.eye} role="img" aria-label={t('exampleAction')} viewBox="0 0 20 20"><path d="M1.8 10s3-5.2 8.2-5.2 8.2 5.2 8.2 5.2-3 5.2-8.2 5.2S1.8 10 1.8 10Z"/><circle cx="10" cy="10" r="2.4"/></svg></td>
          </tr>
        })}</tbody></table></div>
      <p className={styles.previewCaption}>{t('combinedWarnings')}</p>
    </>}
    <p className={styles.previewFoot}>{t(tab === 'analysis' ? 'analysis.previewNotice' : tab === 'coverage' ? 'coverage.previewNotice' : 'limitNotice')}</p>
  </section>
}

function AnalysisPreview({ draft }: Readonly<{ draft: PreferenceDraft }>) {
  const { t, i18n } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const [metric, setMetric] = useState<'energy' | 'emissions'>('energy')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const locale = i18n.resolvedLanguage ?? 'pt-BR'
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
  const dates = Array.from({ length: 7 }, (_, index) => new Date(Date.UTC(2026, 9, 26 - Number(draft.period) + 1 + Math.round(index * (Number(draft.period) - 1) / 6))))
  const date = (value: Date) => new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(value)
  const unit = metric === 'energy' ? 'kWh' : 'kg CO₂e'
  return <div className={styles.chartBox}>
    <h3>{t('chartTitle', { count: Number(draft.period) })}</h3>
    <div className={styles.chartControls}><div role="group" aria-label={t('chartMetric')}>{(['energy', 'emissions'] as const).map((item) => <button key={item} aria-pressed={metric === item} onClick={() => setMetric(item)}>{item === 'emissions' ? 'CO₂e' : t('tabs.energy')}</button>)}</div><div role="group" aria-label={t('chartView')}>{(['chart', 'table'] as const).map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{t(item)}</button>)}</div></div>
    <div className={styles.legend}><span>— {t('currentPeriod')}</span><span>··· {t('previousPeriod')}</span></div>
    {view === 'chart' ? <svg className={styles.chart} viewBox="0 0 438 196" role="img" aria-label={t('chartDescription', { unit, period: t(draft.granularity) })}>
      {[8, 4, 0].map((value, index) => <text key={value} x="0" y={14 + index * 75}>{number(metric === 'energy' ? value : value / 4)}</text>)}
      {[0, 1, 2, 3, 4].map((value) => <line key={value} x1="34" x2="428" y1={value * 40 + 1} y2={value * 40 + 1} className={styles.gridLine} />)}
      <path className={styles.chartArea} d="M34 141 100 121 166 101 232 81 298 61 364 41 428 21 V161 H34Z" />
      <path className={styles.chartLine} d="M34 1V161H428" />
      <path className={styles.trendLine} d="M34 141 100 121 166 101 232 81 298 61 364 41 428 21" />
      {[34, 100, 166, 232, 298, 364, 428].map((x, index) => <circle key={x} cx={x} cy={141 - index * 20} r="4"><title>{date(dates[index])}: {number((index + 1) * (metric === 'energy' ? 1 : .25))} {unit}</title></circle>)}
      {[0, 3, 6].map((index) => <text key={index} x={index === 0 ? 28 : index === 3 ? 220 : 430} y="190" textAnchor={index === 6 ? 'end' : 'start'}>{date(dates[index])}</text>)}
    </svg> : <table className={styles.chartTable}><caption>{t('exampleData')} · {t(draft.granularity)}</caption><thead><tr><th>{t('date')}</th><th>{metric === 'energy' ? t('tabs.energy') : 'CO₂e'} ({unit})</th></tr></thead><tbody>{dates.map((day, index) => <tr key={day.toISOString()}><td>{date(day)}</td><td>{number((index + 1) * (metric === 'energy' ? 1 : .25))}</td></tr>)}</tbody></table>}
    <p className={styles.chartCaption}>{t(metric === 'energy' ? 'energyChartCaption' : 'emissionsChartCaption')}</p>
  </div>
}
