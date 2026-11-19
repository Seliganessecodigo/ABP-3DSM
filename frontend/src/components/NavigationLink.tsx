import type { ReactNode } from 'react'

export function NavigationLink({ href, navigate, className, children }: Readonly<{
  href: string
  navigate: (url: string) => void
  className?: string
  children: ReactNode
}>) {
  return <a href={href} className={className} onClick={event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(href)
  }}>{children}</a>
}
