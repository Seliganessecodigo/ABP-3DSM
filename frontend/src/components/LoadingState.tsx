import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './LoadingState.module.css'

export function LoadingState({ title, panelTitle, layout = 'content', compact = false }: Readonly<{
  title: ReactNode
  panelTitle?: ReactNode
  layout?: 'table' | 'dashboard' | 'detail' | 'content'
  compact?: boolean
}>) {
  const { t } = useTranslation('common')
  const spinner = <span className={styles.spinner} aria-hidden="true" />
  if (compact) return <span className={styles.inline} role="status">{spinner}{title}</span>
  return <div className={`${styles.loading} ${styles[layout]}`} data-loading-state={layout} aria-busy="true">
    <div className={styles.notice} role="status">
      <h2>{title}</h2>
      <p>{t('loading.description')}</p>
      <span className={styles.processing}>{spinner}{t('loading.processing')}</span>
    </div>
    <div className={styles.placeholders} data-loading-skeleton aria-hidden="true">
      {layout !== 'table' && <div className={styles.cards}>{Array.from({ length: layout === 'dashboard' ? 4 : 3 }, (_, index) =>
        <div className={styles.card} key={index}><span /><span /><span /></div>)}</div>}
      <div className={`${styles.panel} ${layout === 'table' ? styles.rows : ''}`}>
        {panelTitle && <h3>{panelTitle}</h3>}
        {Array.from({ length: layout === 'table' ? 6 : 3 }, (_, index) => <span key={index} />)}
      </div>
    </div>
  </div>
}
