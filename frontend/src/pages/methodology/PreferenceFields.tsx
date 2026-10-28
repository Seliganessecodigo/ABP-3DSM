import { useTranslation } from 'react-i18next'
import type { PreferenceDraft, PreferenceTab } from './usePreferenceDraft.ts'
import styles from './Preferences.module.css'

export function PreferenceFields({ tab, draft, dirty, disabled, onUpdate }: Readonly<{
  tab: PreferenceTab; draft: PreferenceDraft; dirty: boolean; disabled: boolean; onUpdate: (patch: Partial<PreferenceDraft>) => void
}>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const unit = tab === 'energy' ? 'kWh' : 'kg CO₂e'
  return <fieldset disabled={disabled} className={styles.formFields}>
    {(tab === 'energy' || tab === 'emissions') && <>
      <label>{t('scope')}<select><option>{t('perApplication')}</option></select></label>
      <div className={styles.fields}><label>{t('limitEditing')}<input type="number" min="0" step="any" required value={draft.value} onChange={(event) => onUpdate({ value: event.target.value })} /></label><label>{t('unit')}<select defaultValue={unit} key={unit}><option>{unit}</option></select></label></div>
      <label>{t('referencePeriod')}<select><option>{t('monthly')}</option></select></label>
      <label className={styles.toggle}><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => onUpdate({ enabled: event.target.checked })} /><span aria-hidden="true" />{t('highlight')}</label>
    </>}
    {tab === 'coverage' && <>
      <label>{t('referenceEditing')}<div className={styles.coverageField}><div><input type="number" min="0" max="100" step="any" required value={draft.value} onChange={(event) => onUpdate({ value: event.target.value })} /><span>%</span></div>{dirty && <span className={styles.badge}>{t('editing')}</span>}</div></label>
      <label className={styles.toggle}><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => onUpdate({ enabled: event.target.checked })} /><span aria-hidden="true" />{t('coverageToggle')}</label>
      <p className={styles.formNote}>{t('coverageNote')}</p>
    </>}
    {tab === 'analysis' && <>
      <label>{t('periodEditing')}<select value={draft.period} onChange={(event) => onUpdate({ period: event.target.value === '7' ? '7' : '30' })}><option value="7">{t('days', { count: 7 })}</option><option value="30">{t('days', { count: 30 })}</option></select></label>
      <label>{t('granularityEditing')}<select value={draft.granularity} onChange={(event) => onUpdate({ granularity: event.target.value === 'hour' ? 'hour' : 'day' })}><option value="hour">{t('hour')}</option><option value="day">{t('day')}</option></select></label>
      <p className={styles.editNote}>{dirty && <span className={styles.badge}>{t('editing')}</span>}{t('previewFollows')}</p>
    </>}
  </fieldset>
}
