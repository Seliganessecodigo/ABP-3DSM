import type { ApplicationState as State } from './catalog.ts'

export function stateLabel(state: State | 'ALL', t: (key: string) => string) { return t(`state.${state}`) }
