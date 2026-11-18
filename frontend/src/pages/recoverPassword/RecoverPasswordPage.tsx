import { useTranslation } from 'react-i18next'
import styles from './RecoverPasswordPage.module.css'

export function RecoverPasswordPage({ navigate }: Readonly<{ navigate: (url: string) => void }>) {
  const { t } = useTranslation('recoverPassword')
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="recovery-title">
      <div className={styles.icon} aria-hidden="true">↻</div>
      <p className={styles.eyebrow}>{t('eyebrow')}</p>
      <h1 id="recovery-title">{t('title')}</h1>
      <p className={styles.description}>{t('description')}</p>
      <button type="button" onClick={() => navigate('/login')}>{t('backToLogin')}</button>
    </section>
  </main>
}
