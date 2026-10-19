import './AppShell.css'
import '../styles/shared.css'
import foliageBackground from '../assets/foliage-background.svg'
import leafMark from '../assets/leaf-mark.svg'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector.tsx'
import { ThemeSelector } from './ThemeSelector.tsx'

export function AppShell({ children, navigate, variant = 'default' }: Readonly<{ children: React.ReactNode; navigate: (url: string) => void; variant?: 'default' | 'detail' }>) {
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

  return <div className={`app-layout${variant === 'detail' ? ' detail-layout' : ''}${desktopExpanded ? '' : ' sidebar-collapsed'}`}>
    <aside id="shared-sidebar" ref={sidebarRef} role={mobileMenuOpen ? 'dialog' : undefined} aria-modal={mobileMenuOpen || undefined} aria-label={mobileMenuOpen ? t('nav.main') : undefined} className={`sidebar${mobileMenuOpen ? ' sidebar-open' : ''}`} onTransitionEnd={(event) => { if (mobileMenuOpen && event.propertyName === 'transform') closeButtonRef.current?.focus() }}>
      <img className="sidebar-foliage" src={foliageBackground} width={222} height={180} alt="" />
      {mobileMenuOpen && <button ref={closeButtonRef} className="mobile-menu-close" type="button" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu}>×</button>}
      <div className="sidebar-brand-row">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigateFromMenu('/') }}>
          <span className="brand-name">GreenER</span><span className="brand-initial" aria-hidden="true">G</span>
        </a>
        <button className="sidebar-collapse-toggle" type="button" aria-label={t(desktopExpanded ? 'nav.collapse' : 'nav.expand')} aria-expanded={desktopExpanded} onClick={() => setDesktopExpanded((expanded) => !expanded)}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m9.5 3.5-4.5 4.5 4.5 4.5" /></svg>
        </button>
      </div>
      <img className="sidebar-leaf-mark" src={leafMark} width={32} height={22} alt="" />
      <nav aria-label={t('nav.main')}>
        <p className="nav-heading">{t('nav.monitoring')}</p>
        <button aria-label={t('nav.dashboard')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><rect x="3" y="3" width="5" height="5" rx=".5" /><rect x="12" y="3" width="5" height="5" rx=".5" /><rect x="3" y="12" width="5" height="5" rx=".5" /><rect x="12" y="12" width="5" height="5" rx=".5" /></svg><span className="nav-label">{t('nav.dashboard')}</span></button>
        <a href="/" aria-label={t('nav.applications')} aria-current="page" className="selected" onClick={(event) => { event.preventDefault(); navigateFromMenu('/') }}><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m10 2.8 7 3.7-7 3.7-7-3.7 7-3.7Z" /><path d="m3 10 7 3.7 7-3.7M3 13.5l7 3.7 7-3.7" /></svg><span className="nav-label">{t('nav.applications')}</span></a>
        <button aria-label={t('nav.history')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3.3 7.4A7 7 0 1 1 3 11" /><path d="M3.2 3.8v3.8H7M10 6v4l2.8 1.7" /></svg><span className="nav-label">{t('nav.history')}</span></button>
        <p className="nav-heading">{t('nav.analysis')}</p>
        <button aria-label={t('nav.ranking')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3 17h14M5 15v-4h3v4M9 15V7h3v8M13 15V4h3v11" /></svg><span className="nav-label">{t('nav.ranking')}</span></button>
        <button aria-label={t('nav.comparison')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M3 6h13l-2.5-2.5M17 14H4l2.5 2.5" /></svg><span className="nav-label">{t('nav.comparison')}</span></button>
        <button aria-label={t('nav.regionalSimulation')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3a11 11 0 0 1 0 14 11 11 0 0 1 0-14Z" /></svg><span className="nav-label">{t('nav.regionalSimulation')}</span></button>
        <p className="nav-heading">{t('nav.system')}</p>
        <button aria-label={t('nav.methodology')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><rect x="4" y="2.8" width="12" height="14.4" rx="1" /><path d="M7 6h6M7 9h6M7 12h4" /></svg><span className="nav-label">{t('nav.methodology')}</span></button>
        <button aria-label={t('nav.settings')} disabled><svg className="nav-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m8 2.8.5-1h3l.5 1 1.8 1 1.1-.1 1.5 2.6-.6.9v2l.6.9-1.5 2.6-1.1-.1-1.8 1-.5 1h-3l-.5-1-1.8-1-1.1.1-1.5-2.6.6-.9v-2l-.6-.9 1.5-2.6 1.1.1 1.8-1Z" transform="translate(0 1.2) scale(.95)" /><circle cx="10" cy="10" r="2.2" /></svg><span className="nav-label">{t('nav.settings')}</span></button>
      </nav>
      <section className="sidebar-preferences" aria-labelledby="sidebar-preferences-heading">
        <p className="nav-heading" id="sidebar-preferences-heading">{t('nav.preferences')}</p>
        <LanguageSelector />
        <ThemeSelector />
      </section>
    </aside>
    {mobileMenuOpen && <button className="sidebar-backdrop" aria-label={t('nav.closeMenu')} onClick={closeMobileMenu} />}
    <div className="workspace"><header className="topbar"><button ref={menuToggleRef} className="mobile-menu-toggle" type="button" aria-label={t('nav.openMenu')} aria-expanded={mobileMenuOpen} aria-controls="shared-sidebar" onClick={() => setMobileMenuOpen(true)}>☰</button><span>GreenER</span></header>{children}</div>
  </div>
}
