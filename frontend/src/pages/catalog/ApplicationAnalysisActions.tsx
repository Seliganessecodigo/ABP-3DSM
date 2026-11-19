import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightArrowLeft, faEarthAmericas, faRankingStar } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { analysisNavigationUrl } from '../../app/analysisNavigation.ts'
import styles from './CatalogPage.module.css'

export function ApplicationAnalysisActions({ applicationId, onNavigate }: Readonly<{
  applicationId: string
  onNavigate: (url: string) => void
}>) {
  const { t } = useTranslation('common')
  const comparison = new URL(analysisNavigationUrl('/comparison', window.location), window.location.origin)
  comparison.searchParams.set('applicationIds', applicationId)
  const simulation = new URL(analysisNavigationUrl('/regional-simulation', window.location), window.location.origin)
  simulation.searchParams.set('applicationId', applicationId)
  const links = [
    { href: comparison.pathname + comparison.search, icon: faArrowRightArrowLeft, label: t('nav.comparison') },
    { href: simulation.pathname + simulation.search, icon: faEarthAmericas, label: t('nav.regionalSimulation') },
  ]
  const className = `${styles['detail-link']} ${styles.analysisAction}`
  return <>
    {links.map(({ href, icon, label }) => <a key={href} href={href} className={className} aria-label={label} title={label} onClick={event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      onNavigate(href)
    }}><FontAwesomeIcon icon={icon} aria-hidden="true" /><span className={styles['detail-link-text']}>{label}</span></a>)}
    <button type="button" className={className} disabled aria-label={t('nav.ranking')} title={t('nav.ranking')}>
      <FontAwesomeIcon icon={faRankingStar} aria-hidden="true" /><span className={styles['detail-link-text']}>{t('nav.ranking')}</span>
    </button>
  </>
}
