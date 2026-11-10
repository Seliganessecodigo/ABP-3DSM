import './AppShell.css'
import '../styles/shared.css'
import foliageBackground from '../assets/foliage-background.svg'
import greenErMark from '../assets/green-er-mark.png'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  return pathname === '/dashboard' || pathname === '/dashboard/'
}

function isHistoryPath(pathname: string) {
  return pathname === '/history' || pathname === '/history/'
}

function isApplicationsActive(methodology: boolean, dashboard: boolean, administration: boolean, history: boolean) {
  return !methodology && !dashboard && !administration && !history
}

export function AppShell({ children, navigate, variant = 'default', login = false }: Readonly<{ children: React.ReactNode; navigate: (url: string) => void; variant?: 'default' | 'detail' | 'methodology'; login?: boolean }>) {
  const { t } = useTranslation('common')
  const { user, signOut } = useAuthentication()
  const methodologyActive = isMethodologyPath(window.location.pathname)
  const dashboardActive = isDashboardPath(window.location.pathname)
  const historyActive = isHistoryPath(window.location.pathname)
  const administrationActive = window.location.pathname.startsWith('/administration/calculations')
  const usersActive = window.location.pathname.startsWith('/administration/users')
  const applicationsActive = isApplicationsActive(methodologyActive, dashboardActive, administrationActive || usersActive, historyActive)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopExpanded, setDesktopExpanded] = useState(true)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const dashboardUrl = analysisNavigationUrl('/dashboard', window.location)
  const historyUrl = analysisNavigationUrl('/history', window.location)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
    menuToggleRef.current?.focus()
  }, [])
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
      {mobileMenuOpen && <button ref={closeButtonRef} className="mobile-menu-close" type="button" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu}>×</button>}
      <div className="sidebar-brand-row">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigateFromMenu('/') }}>
          <img className="brand-mark" src={greenErMark} width={32} height={32} alt="" />
          <span className="brand-name"><span className="brand-green">Green</span><span className="brand-er">ER</span></span>
        </a>
        <button className="sidebar-collapse-toggle" type="button" aria-label={t(desktopExpanded ? 'nav.collapse' : 'nav.expand')} aria-expanded={desktopExpanded} onClick={() => setDesktopExpanded((expanded) => !expanded)}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m9.5 3.5-4.5 4.5 4.5 4.5" /></svg>
        </button>
      </div>
      <nav aria-label={t('nav.main')}>
        <p className="nav-heading">{t('nav.monitoring')}</p>
        <a href={dashboardUrl} aria-label={t('nav.dashboard')} aria-current={dashboardActive ? 'page' : undefined} className={dashboardActive ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigateFromMenu(dashboardUrl) }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><rect x="3" y="3" width="5" height="5" rx=".5" /><rect x="12" y="3" width="5" height="5" rx=".5" /><rect x="3" y="12" width="5" height="5" rx=".5" /><rect x="12" y="12" width="5" height="5" rx=".5" /></svg><span className="nav-label">{t('nav.dashboard')}</span></a>
        <a href="/" aria-label={t('nav.applications')} aria-current={applicationsActive ? 'page' : undefined} className={applicationsActive ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigateFromMenu('/') }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m10 2.8 7 3.7-7 3.7-7-3.7 7-3.7Z" /><path d="m3 10 7 3.7 7-3.7M3 13.5l7 3.7 7-3.7" /></svg><span className="nav-label">{t('nav.applications')}</span></a>
        <a href={historyUrl} aria-label={t('nav.history')} aria-current={historyActive ? 'page' : undefined} className={historyActive ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigateFromMenu(historyUrl) }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3.3 7.4A7 7 0 1 1 3 11" /><path d="M3.2 3.8v3.8H7M10 6v4l2.8 1.7" /></svg><span className="nav-label">{t('nav.history')}</span></a>
        <p className="nav-heading">{t('nav.analysis')}</p>
        <button aria-label={t('nav.ranking')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3 17h14M5 15v-4h3v4M9 15V7h3v8M13 15V4h3v11" /></svg><span className="nav-label">{t('nav.ranking')}</span></button>
        <button aria-label={t('nav.comparison')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3 6h13l-2.5-2.5M17 14H4l2.5 2.5" /></svg><span className="nav-label">{t('nav.comparison')}</span></button>
        <button aria-label={t('nav.regionalSimulation')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3a11 11 0 0 1 0 14 11 11 0 0 1 0-14Z" /></svg><span className="nav-label">{t('nav.regionalSimulation')}</span></button>
        <p className="nav-heading">{t('nav.system')}</p>
        <a href="/methodology" aria-label={t('nav.methodology')} aria-current={methodologyActive ? 'page' : undefined} className={methodologyActive ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigateFromMenu('/methodology') }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><rect x="4" y="2.8" width="12" height="14.4" rx="1" /><path d="M7 6h6M7 9h6M7 12h4" /></svg><span className="nav-label">{t('nav.methodology')}</span></a>
        <a href="/administration/calculations" aria-current={administrationActive ? 'page' : undefined} className={administrationActive ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigateFromMenu('/administration/calculations') }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m8 2.8.5-1h3l.5 1 1.8 1 1.1-.1 1.5 2.6-.6.9v2l.6.9-1.5 2.6-1.1-.1-1.8 1-.5 1h-3l-.5-1-1.8-1-1.1.1-1.5-2.6.6-.9v-2l-.6-.9 1.5-2.6 1.1.1 1.8-1Z" transform="translate(0 1.2) scale(.95)" /><circle cx="10" cy="10" r="2.2" /></svg><span className="nav-label">{t('nav.settings')}</span></a>
        {user?.role === 'ADMIN' && <a href="/administration/users" aria-label={t('nav.users')} aria-current={usersActive ? 'page' : undefined} className={usersActive ? 'selected' : ''} onClick={(event) => { event.preventDefault(); navigateFromMenu('/administration/users') }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><circle cx="8" cy="6" r="3" /><path d="M2 17v-2a6 6 0 0 1 12 0v2M14 3a3 3 0 0 1 0 6M16 12a5 5 0 0 1 2 4v1" /></svg><span className="nav-label">{t('nav.users')}</span></a>}
      </nav>
      <section className="sidebar-preferences" aria-labelledby="sidebar-preferences-heading">
        <p className="nav-heading" id="sidebar-preferences-heading">{t('nav.preferences')}</p>
        <LanguageSelector />
        <ThemeSelector />
        {user ? <div className="auth-account"><span><strong>{user.name}</strong><small>{t(`auth.role.${user.role}`)}</small></span><button type="button" onClick={() => { void signOut().then(() => navigate('/')) }}>{t('auth.signOut')}</button></div> : !login && <a className="auth-login" href="/login" onClick={(event) => { event.preventDefault(); navigate('/login') }}>{t('auth.login')}</a>}
      </section>
    </aside>
    {mobileMenuOpen && <button className="sidebar-backdrop" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu} />}
    <div className="workspace"><header className="topbar"><button ref={menuToggleRef} className="mobile-menu-toggle" type="button" aria-label={t('nav.openMenu')} aria-expanded={mobileMenuOpen} aria-controls="shared-sidebar" onClick={() => setMobileMenuOpen(true)}>☰</button><img src={greenErMark} width={28} height={28} alt="" /><span className="brand-wordmark"><span className="brand-green">Green</span><span className="brand-er">ER</span></span>{login && <div className="topbar-actions"><LanguageSelector /><a href="/" onClick={(event) => { event.preventDefault(); navigate('/') }}>{t('nav.applications')}</a></div>}</header>{children}</div>
  </div>
}
