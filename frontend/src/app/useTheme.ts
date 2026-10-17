import { useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

function preferenceOf(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    preferenceOf(document.documentElement.dataset.themePreference))

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference
      document.documentElement.dataset.themePreference = preference
      document.documentElement.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  function chooseTheme(next: ThemePreference) {
    setPreference(next)
    try { window.localStorage.setItem('greener-theme', next) }
    catch { /* Keep the choice in memory when persistence is blocked. */ }
  }

  return { preference, chooseTheme }
}
