import { useTranslation } from 'react-i18next'
import type { PreferenceDraft, PreferenceTab } from './usePreferenceDraft.ts'
import styles from './Preferences.module.css'
import { PreferencePeriodFields } from './PreferencePeriodFields.tsx'

export function PreferenceFields({ tab, draft, dirty, disabled, onUpdate }: Readonly<{
  tab: PreferenceTab; draft: PreferenceDraft; dirty: boolean; disabled: boolean; onUpdate: (patch: Partial<PreferenceDraft>) => void
}>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const unit = tab === 'energy' ? 'kWh' : 'kg CO₂e'
  return <fieldset disabled={disabled} className={styles.formFields}>
    {(tab === 'energy' || tab === 'emissions') && <>
      <label>{t('scope')}<select className="form-control form-control--large"><option>{t('perApplication')}</option></select></label>
      <div className={styles.fields}><label>{t('limitEditing')}<input className="form-control form-control--large" type="number" min="0" step="any" required value={draft.value} onChange={(event) => onUpdate({ value: event.target.value })} /></label><label>{t('unit')}<select className="form-control form-control--large" defaultValue={unit} key={unit}><option>{unit}</option></select></label></div>
      <label className={styles.toggle}><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => onUpdate({ enabled: event.target.checked })} /><span aria-hidden="true" />{t('highlight')}</label>
    </>}
    {tab === 'coverage' && <>
      <label>{t('referenceEditing')}<div className={styles.coverageField}><div><input className="form-control form-control--large" type="number" min="0" max="100" step="any" required value={draft.value} onChange={(event) => onUpdate({ value: event.target.value })} /><span>%</span></div>{dirty && <span className={styles.badge}>{t('editing')}</span>}</div></label>
      <label className={styles.toggle}><input type="checkbox" role="switch" checked={draft.enabled} onChange={(event) => onUpdate({ enabled: event.target.checked })} /><span aria-hidden="true" />{t('coverageToggle')}</label>
      <p className={styles.formNote}>{t('coverageNote')}</p>
    </>}
    {tab === 'analysis' && <>
      <label>{t('granularityEditing')}<select className="form-control form-control--large" value={draft.granularity} onChange={(event) => onUpdate({ granularity: event.target.value === 'hour' ? 'hour' : 'day' })}><option value="hour">{t('hour')}</option><option value="day">{t('day')}</option></select></label>
      <p className={styles.editNote}>{dirty && <span className={styles.badge}>{t('editing')}</span>}{t('previewFollows')}</p>
    </>}
    <PreferencePeriodFields tab={tab} draft={draft} onUpdate={onUpdate} />
  </fieldset>
}
