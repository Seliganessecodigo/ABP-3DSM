import { useTranslation } from 'react-i18next'
import type { PreferenceTab } from './usePreferenceDraft.ts'
import styles from './Preferences.module.css'

export function MethodologyExplanation({ tab }: Readonly<{ tab: PreferenceTab }>) {
  const { t } = useTranslation('methodology', { keyPrefix: 'preferences' })
  const flow = tab === 'energy' || tab === 'emissions'
  return <section className={`${styles.card} ${styles.explanation}`} aria-labelledby="explanation-title">
    <p className={styles.step}>{t('stepUnderstand')}</p><h2 id="explanation-title">{t(`${tab}.title`)}</h2>
    {flow ? <>
      <div className={styles.flow}>{[0, 1, 2].map((index) => <div key={index}><div className={styles.flowBox}><h3>{t(`${tab}.flow${index}Title`)}</h3><p>{t(`${tab}.flow${index}Description`)}</p></div>{index < 2 && <span className={styles.arrow} aria-hidden="true">↓</span>}</div>)}</div>
      <h3>{t('needToKnow')}</h3><p>{t(`${tab}.explanation`)}</p>
    </> : <>
      <p className={styles.intro}>{t(`${tab}.explanation`)}</p>
      <div className={styles.explainerBoxes}><div className={styles.infoBox}><h3>{t(`${tab}.boxTitle`)}</h3><p>{t(`${tab}.boxDescription`)}</p></div>
        {tab === 'analysis' ? <div className={styles.infoBox}><h3>{t('analysis.secondTitle')}</h3><p>{t('analysis.secondDescription')}</p></div> : <div><h3>{t('coverage.secondTitle')}</h3><p>{t('coverage.secondDescription')}</p></div>}
      </div>
    </>}
    <p className={styles.explanationFoot}>{t(flow ? 'fixedNotice' : `${tab}.notice`)}</p>
  </section>
}
