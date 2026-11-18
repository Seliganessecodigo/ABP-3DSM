import './AppShell.css'
import '../styles/shared.css'
import foliageBackground from '../assets/foliage-background.svg'
import greenErMark from '../assets/green-er-mark.png'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightArrowLeft, faBars, faBookOpen, faChevronLeft, faEarthAmericas, faGear, faLayerGroup, faRankingStar, faTableCellsLarge, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector.tsx'
import { ThemeSelector } from './ThemeSelector.tsx'
import { useAuthentication } from '../app/useAuthentication.ts'
import { analysisNavigationUrl } from '../app/analysisNavigation.ts'

function layoutClasses(variant: 'default' | 'detail' | 'methodology', login: boolean, expanded: boolean) {
  const classes = ['app-layout']
  if (variant !== 'default') classes.push(`${variant}-layout`)
  if (login) classes.push('login-layout')
  if (!expanded) classes.push('sidebar-collapsed')
  return classes.join(' ')
}

function isMethodologyPath(pathname: string) {
  return pathname === '/methodology' || (pathname.startsWith('/services/') && pathname.endsWith('/methodology'))
}

function isDashboardPath(pathname: string) {
  return pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard/'
}

function isRegionalSimulationPath(pathname: string) {
  return pathname === '/regional-simulation' || pathname === '/regional-simulation/'
}

function isAdministrationPath(pathname: string) {
  return pathname.startsWith('/administration/calculations') || pathname === '/settings' || pathname === '/settings/'
}

function isComparisonPath(pathname: string) {
  return pathname === '/comparison' || pathname === '/comparison/'
}

function isApplicationsActive(methodology: boolean, dashboard: boolean, administration: boolean, comparison: boolean, simulation: boolean) {
  return !methodology && !dashboard && !administration && !comparison && !simulation
}

function activeNavigationProps(active: boolean): Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-current' | 'className'> {
  return { 'aria-current': active ? 'page' : undefined, className: active ? 'selected' : '' }
}

function AccountAccess({ login, navigate }: Readonly<{ login: boolean; navigate: (url: string) => void }>) {
  const { t } = useTranslation('common')
  const { user, signOut } = useAuthentication()
  if (user) return <div className="auth-account"><span><strong>{user.name}</strong><small>{t(`auth.role.${user.role}`)}</small></span><button type="button" onClick={() => { void signOut().then(() => navigate('/')) }}>{t('auth.signOut')}</button></div>
  if (login) return null
  return <a className="auth-login" href="/login" onClick={event => { event.preventDefault(); navigate('/login') }}>{t('auth.login')}</a>
}

export function AppShell({ children, navigate, variant = 'default', login = false }: Readonly<{ children: React.ReactNode; navigate: (url: string) => void; variant?: 'default' | 'detail' | 'methodology'; login?: boolean }>) {
  const { t } = useTranslation('common')
  const methodologyActive = isMethodologyPath(window.location.pathname)
  const dashboardActive = isDashboardPath(window.location.pathname)
  const comparisonActive = isComparisonPath(window.location.pathname)
  const administrationActive = isAdministrationPath(window.location.pathname)
  const regionalSimulationActive = isRegionalSimulationPath(window.location.pathname)
  const applicationsActive = isApplicationsActive(methodologyActive, dashboardActive, administrationActive, comparisonActive, regionalSimulationActive)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopExpanded, setDesktopExpanded] = useState(true)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const dashboardUrl = analysisNavigationUrl('/dashboard', window.location)
  const comparisonUrl = analysisNavigationUrl('/comparison', window.location)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    menuToggleRef.current?.focus()
  }, [setMobileMenuOpen])
  const navigateFromMenu = (url: string) => {
    const shouldFocusMain = mobileMenuOpen
    setMobileMenuOpen(false)
    navigate(url)
    if (shouldFocusMain) window.requestAnimationFrame(() => document.querySelector('main')?.focus())
  }

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [mobileMenuOpen])


  useEffect(() => {
    const desktopViewport = window.matchMedia('(min-width: 641px)')
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false)
    }
    desktopViewport.addEventListener('change', handleBreakpointChange)
    return () => desktopViewport.removeEventListener('change', handleBreakpointChange)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileMenu()
        return
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href]:not([aria-disabled="true"]), button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? []).filter((element) => element.getClientRects().length > 0)
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMobileMenu, mobileMenuOpen])

  return <div className={layoutClasses(variant, login, desktopExpanded)}>
    <aside id="shared-sidebar" ref={sidebarRef} role={mobileMenuOpen ? 'dialog' : undefined} aria-modal={mobileMenuOpen || undefined} aria-label={mobileMenuOpen ? t('nav.main') : undefined} className={`sidebar${mobileMenuOpen ? ' sidebar-open' : ''}`} onTransitionEnd={(event) => { if (mobileMenuOpen && event.propertyName === 'transform') closeButtonRef.current?.focus() }}>
      <img className="sidebar-foliage" src={foliageBackground} width={222} height={180} alt="" loading="lazy" decoding="async" />
      {mobileMenuOpen && <button ref={closeButtonRef} className="mobile-menu-close" type="button" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu}><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>}
      <div className="sidebar-brand-row">
        <a className="brand" href={dashboardUrl} onClick={(event) => { event.preventDefault(); navigateFromMenu(dashboardUrl) }}>
          <img className="brand-mark" src={greenErMark} width={32} height={32} alt="" />
          <span className="brand-name"><span className="brand-green">Green</span><span className="brand-er">ER</span></span>
        </a>
        <button className="sidebar-collapse-toggle" type="button" aria-label={t(desktopExpanded ? 'nav.collapse' : 'nav.expand')} aria-expanded={desktopExpanded} onClick={() => setDesktopExpanded((expanded) => !expanded)}>
          <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
        </button>
      </div>
      <nav aria-label={t('nav.main')}>
        <p className="nav-heading">{t('nav.monitoring')}</p>
        <a href={dashboardUrl} aria-label={t('nav.dashboard')} {...activeNavigationProps(dashboardActive)} onClick={(event) => { event.preventDefault(); navigateFromMenu(dashboardUrl) }}><FontAwesomeIcon className="nav-icon" icon={faTableCellsLarge} aria-hidden="true" /><span className="nav-label">{t('nav.dashboard')}</span></a>
        <a href="/applications" aria-label={t('nav.applications')} {...activeNavigationProps(applicationsActive)} onClick={(event) => { event.preventDefault(); navigateFromMenu('/applications') }}><FontAwesomeIcon className="nav-icon" icon={faLayerGroup} aria-hidden="true" /><span className="nav-label">{t('nav.applications')}</span></a>
        <p className="nav-heading">{t('nav.analysis')}</p>
        <button aria-label={t('nav.ranking')} disabled><FontAwesomeIcon className="nav-icon" icon={faRankingStar} aria-hidden="true" /><span className="nav-label">{t('nav.ranking')}</span></button>
        <a href={comparisonUrl} aria-label={t('nav.comparison')} {...activeNavigationProps(comparisonActive)} onClick={(event) => { event.preventDefault(); navigateFromMenu(comparisonUrl) }}><FontAwesomeIcon className="nav-icon" icon={faArrowRightArrowLeft} aria-hidden="true" /><span className="nav-label">{t('nav.comparison')}</span></a>
        <a href="/regional-simulation" aria-label={t('nav.regionalSimulation')} {...activeNavigationProps(regionalSimulationActive)} onClick={(event) => { event.preventDefault(); navigateFromMenu('/regional-simulation') }}><FontAwesomeIcon className="nav-icon" icon={faEarthAmericas} aria-hidden="true" /><span className="nav-label">{t('nav.regionalSimulation')}</span></a>
        <p className="nav-heading">{t('nav.system')}</p>
        <a href="/methodology" aria-label={t('nav.methodology')} {...activeNavigationProps(methodologyActive)} onClick={(event) => { event.preventDefault(); navigateFromMenu('/methodology') }}><FontAwesomeIcon className="nav-icon" icon={faBookOpen} aria-hidden="true" /><span className="nav-label">{t('nav.methodology')}</span></a>
        <a href="/settings" {...activeNavigationProps(administrationActive)} onClick={(event) => { event.preventDefault(); navigateFromMenu('/settings') }}><FontAwesomeIcon className="nav-icon" icon={faGear} aria-hidden="true" /><span className="nav-label">{t('nav.settings')}</span></a>
      </nav>
      <section className="sidebar-preferences" aria-labelledby="sidebar-preferences-heading">
        <p className="nav-heading" id="sidebar-preferences-heading">{t('nav.preferences')}</p>
        <LanguageSelector />
        <ThemeSelector />
        <AccountAccess login={login} navigate={navigate} />
      </section>
    </aside>
    {mobileMenuOpen && <button className="sidebar-backdrop" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu} />}
    <div className="workspace"><header className="topbar"><button ref={menuToggleRef} className="mobile-menu-toggle" type="button" aria-label={t('nav.openMenu')} aria-expanded={mobileMenuOpen} aria-controls="shared-sidebar" onClick={() => setMobileMenuOpen(true)}><FontAwesomeIcon icon={faBars} aria-hidden="true" /></button><a className="topbar-brand" href={dashboardUrl} aria-label={t('nav.dashboard')} onClick={(event) => { event.preventDefault(); navigate(dashboardUrl) }}><img src={greenErMark} width={28} height={28} alt="" /><span className="brand-wordmark"><span className="brand-green">Green</span><span className="brand-er">ER</span></span></a>{login && <div className="topbar-actions"><LanguageSelector /><a href="/applications" onClick={(event) => { event.preventDefault(); navigate('/applications') }}>{t('nav.applications')}</a></div>}</header>{children}</div>
  </div>
}
