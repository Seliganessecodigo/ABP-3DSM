import type { ApplicationState as State } from './catalog.ts'
import type { ApplicationStateReason } from './api.ts'

export function stateLabel(state: State | 'ALL', t: (key: string) => string) { return t(`state.${state}`) }
export function reasonLabel(reason: ApplicationStateReason, t: (key: string) => string) { return t(`reason.${reason}`) }

export const stateIcons: Record<State, string> = { AVAILABLE: '\u2713', UNAVAILABLE: '\u00d7', NO_METRICS: '!', REMOVED: '\u25a1' }
