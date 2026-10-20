export type EnergyMetricName =
  | 'cpuPercent'
  | 'memoryGb'
  | 'diskGb'
  | 'networkGb'

export interface EnergyModelParameters {
  readonly cpuWattsAt100Percent: number
  readonly memoryWattsPerGb: number
  readonly diskWattsPerGb: number
  readonly networkWattsPerGb: number
}

export interface EnergyModelConfig extends EnergyModelParameters {
  readonly key: string
  readonly version: string
}

export const SIMPLIFIED_ENERGY_MODEL_V1: EnergyModelConfig = Object.freeze({
  key: 'simplified-energy',
  version: '1',
  cpuWattsAt100Percent: 100,
  memoryWattsPerGb: 0.375,
  diskWattsPerGb: 0.01,
  networkWattsPerGb: 0.02,
})
