import type { ReactNode } from 'react'

type FeedbackState = 'loading' | 'empty' | 'error'

export function RequestFeedback({ state, children }: Readonly<{ state: FeedbackState; children: ReactNode }>) {
  if (state === 'loading') return <output className="notice">{children}</output>
  if (state === 'empty') return <section className="empty-state">{children}</section>
  return <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div>{children}</div></div>
}
