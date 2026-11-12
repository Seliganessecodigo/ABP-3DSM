import { useTranslation } from 'react-i18next'
import type { PreferenceDraft, PreferenceTab } from './usePreferenceDraft.ts'
import { PersonalAlertsPanel } from '../../components/PersonalAlerts.tsx'
import { EnvironmentalSeries } from '../../components/EnvironmentalSeries.tsx'
import { useAlertPreview, useAnalysisPreview } from './useRealPreviews.ts'
import styles from './Preferences.module.css'

export function MethodologyPreview({ tab, drafts, savedTabs }: Readonly<{ tab: PreferenceTab; drafts: Record<PreferenceTab, PreferenceDraft>; savedTabs: readonly PreferenceTab[] }>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  return <section className={`${styles.card} ${styles.preview}`} aria-labelledby="preview-title">
    <p className={styles.step}>{t('stepPreview')}</p>
    <div className={styles.previewHeading}><h2 id="preview-title">{t(tab === 'analysis' ? 'analysisPreview' : 'warningsPreview')}</h2><span className={styles.badge}>{t('realData')}</span></div>
    {tab === 'analysis' && <p className={styles.previewDescription}>{t('analysis.previewNotice')}</p>}
    {tab === 'analysis' ? <AnalysisPreview draft={drafts.analysis} /> : <AlertPreview drafts={drafts} includedTabs={[...savedTabs, tab]} />}
    <p className={styles.previewFoot}>{t('previewReadOnly')}</p>
  </section>
}
function AlertPreview({ drafts, includedTabs }: Readonly<{ drafts: Record<PreferenceTab, PreferenceDraft>; includedTabs: readonly PreferenceTab[] }>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const state = useAlertPreview(drafts, includedTabs)
  return state.valid ? <PersonalAlertsPanel state={state} preview /> : <p>{t('invalidValue')}</p>
}
function AnalysisPreview({ draft }: Readonly<{ draft: PreferenceDraft }>) {
  const { t, i18n } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const state = useAnalysisPreview(draft)
  if (!state.valid) return <p>{t('invalidValue')}</p>
  if (state.loading) return <output>{t('alertsLoading')}</output>
  if (state.error) return <p role="alert">{t('alertsUnavailable')}</p>
  return <EnvironmentalSeries series={state.data?.series} locale={i18n.resolvedLanguage ?? 'pt-BR'} />
}
