import { useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

function preferenceOf(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    preferenceOf(document.documentElement.dataset.themePreference))
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const systemTheme = systemDark ? 'dark' : 'light'
  const theme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.themePreference = preference
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [preference, theme])

  function chooseTheme(next: ThemePreference) {
    setPreference(next)
    try { window.localStorage.setItem('greener-theme', next) }
    catch { /* Keep the choice in memory when persistence is blocked. */ }
  }

  return { theme, chooseTheme }
}
