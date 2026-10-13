import type { ApplicationState as State } from './catalog.ts'

export function stateLabel(state: State | 'ALL', t: (key: string) => string) { return t(`state.${state}`) }

export const stateIcons: Record<State, string> = { AVAILABLE: '\u2713', UNAVAILABLE: '\u00d7', NO_METRICS: '!', REMOVED: '\u25a1' }
