import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { analysisNavigationUrl } from '../app/analysisNavigation.ts'
import styles from './Breadcrumbs.module.css'

export type BreadcrumbItem = Readonly<{
  label: string
  href?: string
  onNavigate?: () => void
  ariaLabel?: string
}>

export function Breadcrumbs({ items = [], navigate, className = '' }: Readonly<{
  items?: readonly BreadcrumbItem[]
  navigate: (url: string) => void
  className?: string
}>) {
  const { t } = useTranslation('common')
  const trail: readonly BreadcrumbItem[] = [{ label: t('nav.dashboard'), href: analysisNavigationUrl('/dashboard', window.location) }, ...items]
  return <nav className={`${styles.breadcrumbs} ${className}`} aria-label={t('nav.breadcrumb')}>
    <ol>{trail.map((item, index) => <li key={item.href ?? item.label}>
        {index > 0 && <FontAwesomeIcon icon={faChevronRight} className={styles.separator} aria-hidden="true" />}
        {index === trail.length - 1 ? <span aria-current="page">{index === 0 && <FontAwesomeIcon icon={faHouse} aria-hidden="true" />}{item.label}</span>
          : <a href={item.href} aria-label={item.ariaLabel ?? t('nav.breadcrumbGo', { page: item.label })} onClick={event => {
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !item.href) return
            event.preventDefault()
            if (item.onNavigate) item.onNavigate()
            else navigate(item.href)
          }}>{index === 0 && <FontAwesomeIcon icon={faHouse} aria-hidden="true" />}{item.label}</a>}
      </li>)}</ol>
  </nav>
}
