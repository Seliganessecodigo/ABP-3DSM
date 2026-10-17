// Blocking bootstrap: apply the saved preference before the first paint.
(() => {
  let preference = 'system'
  try {
    const saved = localStorage.getItem('greener-theme')
    if (saved === 'light' || saved === 'dark') preference = saved
  } catch { /* Storage can be unavailable; follow the system. */ }
  const theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference
  document.documentElement.dataset.themePreference = preference
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
})()
