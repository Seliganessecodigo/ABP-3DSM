import './AppShell.css'
import '../styles/shared.css'
import foliageBackground from '../assets/foliage-background.svg'
import leafMark from '../assets/leaf-mark.svg'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector.tsx'

export function AppShell({ children, navigate }: Readonly<{ children: React.ReactNode; navigate: (url: string) => void }>) {
  const { t } = useTranslation('common')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopExpanded, setDesktopExpanded] = useState(true)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
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

  return <div className={`app-layout${desktopExpanded ? '' : ' sidebar-collapsed'}`}>
    <aside id="shared-sidebar" ref={sidebarRef} role={mobileMenuOpen ? 'dialog' : undefined} aria-modal={mobileMenuOpen || undefined} aria-label={mobileMenuOpen ? t('nav.main') : undefined} className={`sidebar${mobileMenuOpen ? ' sidebar-open' : ''}`} onTransitionEnd={(event) => { if (mobileMenuOpen && event.propertyName === 'transform') closeButtonRef.current?.focus() }}>
      <img className="sidebar-foliage" src={foliageBackground} width={222} height={180} alt="" />
      {mobileMenuOpen && <button ref={closeButtonRef} className="mobile-menu-close" type="button" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu}>×</button>}
      <div className="sidebar-brand-row">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigateFromMenu('/') }}>
          <span className="brand-name">GreenER</span><span className="brand-initial" aria-hidden="true">G</span><small>{t('app.tagline')}</small>
        </a>
        <button className="sidebar-collapse-toggle" type="button" aria-label={t(desktopExpanded ? 'nav.collapse' : 'nav.expand')} aria-expanded={desktopExpanded} onClick={() => setDesktopExpanded((expanded) => !expanded)}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m9.5 3.5-4.5 4.5 4.5 4.5" /></svg>
        </button>
      </div>
      <img className="sidebar-leaf-mark" src={leafMark} width={32} height={22} alt="" />
      <nav aria-label={t('nav.main')}>
        <p className="nav-heading">{t('nav.monitoring')}</p>
        <button aria-label={t('nav.dashboard')} disabled><span aria-hidden="true">▦</span> <span className="nav-label">{t('nav.dashboard')}</span></button>
        <a href="/" aria-label={t('nav.applications')} aria-current="page" className="selected" onClick={(event) => { event.preventDefault(); navigateFromMenu('/') }}>◉ <span className="nav-label">{t('nav.applications')}</span></a>
        <button aria-label={t('nav.history')} disabled><span aria-hidden="true">◷</span> <span className="nav-label">{t('nav.history')}</span></button>
        <p className="nav-heading">{t('nav.analysis')}</p>
        <button aria-label={t('nav.ranking')} disabled><span aria-hidden="true">♧</span> <span className="nav-label">{t('nav.ranking')}</span></button>
        <button aria-label={t('nav.comparison')} disabled><span aria-hidden="true">⇄</span> <span className="nav-label">{t('nav.comparison')}</span></button>
        <button aria-label={t('nav.regionalSimulation')} disabled><span aria-hidden="true">◎</span> <span className="nav-label">{t('nav.regionalSimulation')}</span></button>
        <p className="nav-heading">{t('nav.system')}</p>
        <button aria-label={t('nav.methodology')} disabled><span aria-hidden="true">▤</span> <span className="nav-label">{t('nav.methodology')}</span></button>
        <button aria-label={t('nav.settings')} disabled><span aria-hidden="true">⚙</span> <span className="nav-label">{t('nav.settings')}</span></button>
      </nav>
      <section className="sidebar-preferences" aria-labelledby="sidebar-preferences-heading"><p className="nav-heading" id="sidebar-preferences-heading">{t('nav.preferences')}</p><LanguageSelector /></section>
    </aside>
    {mobileMenuOpen && <button className="sidebar-backdrop" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu} />}
    <div className="workspace"><header className="topbar"><button ref={menuToggleRef} className="mobile-menu-toggle" type="button" aria-label={t('nav.openMenu')} aria-expanded={mobileMenuOpen} aria-controls="shared-sidebar" onClick={() => setMobileMenuOpen(true)}>☰</button><span>{t('topbar')}</span><div className="topbar-actions"><span className="avatar" aria-label={t('account')}>ER</span></div></header>{children}</div>
  </div>
}
