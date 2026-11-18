import { useTranslation } from 'react-i18next'
import { preferencePeriodKinds } from '../../features/preferences/period.ts'
import { draftPeriod, type PreferenceDraft, type PreferenceTab } from '../../features/preferences/api.ts'
export function PreferencePeriodFields({ tab, draft, onUpdate }: Readonly<{ tab: PreferenceTab; draft: PreferenceDraft; onUpdate: (patch: Partial<PreferenceDraft>) => void }>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const period = draftPeriod(tab, draft)
  function dateValue(value?: string) { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString().slice(0, 16) : '' }
  function updateDate(key: 'from' | 'to', value: string) {
    onUpdate({ evaluationPeriod: { ...period, [key]: value ? `${value}:00.000Z` : '' } })
  }
  return <>
    <label>{t('evaluationPeriod')}<select className="form-control form-control--large" aria-label={t('evaluationPeriod')} value={period.kind} onChange={event => {
      const kind = preferencePeriodKinds.find(item => item === event.target.value)
      if (kind) onUpdate({ evaluationPeriod: { kind } })
    }}>{preferencePeriodKinds.map(kind => <option key={kind} value={kind}>{t(`evaluationPeriod.${kind}`)}</option>)}</select></label>
    {period.kind === 'custom' && <>
      <label>{t('periodFrom')}<input className="form-control form-control--large" type="datetime-local" step="60" required value={dateValue(period.from)} onChange={event => updateDate('from', event.target.value)} /></label>
      <label>{t('periodTo')}<input className="form-control form-control--large" type="datetime-local" step="60" required value={dateValue(period.to)} onChange={event => updateDate('to', event.target.value)} /></label>
      <p>{t('periodBoundaries')}</p>
    </>}
  </>
}
