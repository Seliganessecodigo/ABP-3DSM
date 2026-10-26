import type { ReactNode } from 'react'
import { LoadingState } from './LoadingState.tsx'

type FeedbackState = 'loading' | 'empty' | 'error'

export function RequestFeedback({ state, children }: Readonly<{ state: FeedbackState; children: ReactNode }>) {
  if (state === 'loading') return <LoadingState title={children} />
  if (state === 'empty') return <section className="empty-state">{children}</section>
  return <div className="error-box" role="alert"><span className="error-icon" aria-hidden="true">!</span><div>{children}</div></div>
}
