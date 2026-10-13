export type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }
export type LocaleResource = { common: Record<string, string>; catalog: Record<string, string>; detail: Record<string, string> }
