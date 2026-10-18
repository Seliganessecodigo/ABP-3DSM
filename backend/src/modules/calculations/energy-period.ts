import { calculateObservationEnergy, EnergyObservationInput, EnergyCalculationReason, parseZonedTimestampNanoseconds } from './energy-calculation'
import { EnergyModelConfig, EnergyModelParameters } from './energy-model'

export interface EnergyPeriodInput {
  applicationId: string
  periodStart: string
  periodEnd: string
  observations: readonly EnergyObservationInput[]
  model?: EnergyModelConfig
}

export interface EnergyPeriodExclusion {
  observationId: string | null
  intervalStart?: string
  intervalEnd?: string
  reasons: readonly (EnergyCalculationReason | { code: 'APPLICATION_MISMATCH' | 'NO_OBSERVATION' })[]
}

export interface EnergyPeriodContribution {
  observationId: string
  intervalStart: string
  intervalEnd: string
  durationSeconds: number
  energyKwh: number
  modelKey: string
  modelVersion: string
  modelParameters: Readonly<EnergyModelParameters>
}

export interface EnergyPeriodResult {
  readonly energyKwh: number | null
  readonly validDurationSeconds: number
  readonly periodDurationSeconds: number
  readonly coverage: number
  readonly exclusions: readonly EnergyPeriodExclusion[]
  readonly contributions: readonly EnergyPeriodContribution[]
  readonly reasons: readonly EnergyCalculationReason[]
}

export class EnergyPeriodInputError extends Error {
  constructor(readonly code: 'INVALID_PERIOD' | 'INVALID_APPLICATION_ID' | 'CONFLICTING_OBSERVATION_ID') {
    super(code)
  }
}

function sameObservation(first: EnergyObservationInput, second: EnergyObservationInput): boolean {
  return first.applicationId === second.applicationId && first.intervalStart === second.intervalStart &&
    first.intervalEnd === second.intervalEnd && first.collectedAt === second.collectedAt &&
    ['cpuPercent', 'memoryGb', 'diskGb', 'networkGb']
      .every((metric) => Object.is(first.metrics[metric], second.metrics[metric]))
}

function compareTime(first: bigint, second: bigint): number {
  return first < second ? -1 : first > second ? 1 : 0
}

function toTimestamp(nanoseconds: bigint): string {
  if (nanoseconds % 1000000n === 0n) {
    return new Date(Number(nanoseconds / 1000000n)).toISOString()
  }
  let seconds = nanoseconds / 1000000000n
  let fraction = nanoseconds % 1000000000n
  if (fraction < 0n) {
    seconds -= 1n
    fraction += 1000000000n
  }
  const digits = fraction.toString().padStart(9, '0').replace(/0+$/, '')
  return new Date(Number(seconds) * 1000).toISOString().replace('.000Z', `.${digits}Z`)
}

export function aggregateApplicationEnergyPeriod(input: EnergyPeriodInput): EnergyPeriodResult {
  if (typeof input.applicationId !== 'string' || !input.applicationId.trim()) {
    throw new EnergyPeriodInputError('INVALID_APPLICATION_ID')
  }
  const periodStart = parseZonedTimestampNanoseconds(input.periodStart)
  const periodEnd = parseZonedTimestampNanoseconds(input.periodEnd)
  if (periodStart === null || periodEnd === null || periodEnd <= periodStart) {
    throw new EnergyPeriodInputError('INVALID_PERIOD')
  }
  const periodDurationNanoseconds = periodEnd - periodStart
  const periodDurationSeconds = Number(periodDurationNanoseconds) / 1e9
  const exclusions: EnergyPeriodExclusion[] = []
  const observations = input.observations.filter((observation) => {
    if (observation.applicationId === input.applicationId) return true
    exclusions.push({ observationId: observation.id, reasons: [{ code: 'APPLICATION_MISMATCH' }] })
    return false
  })
  const uniqueObservations = new Map<string, EnergyObservationInput>()
  for (const observation of observations) {
    const previous = uniqueObservations.get(observation.id)
    if (previous && !sameObservation(previous, observation)) {
      throw new EnergyPeriodInputError('CONFLICTING_OBSERVATION_ID')
    }
    uniqueObservations.set(observation.id, observation)
  }
  const intervals = [...uniqueObservations.values()].flatMap((observation) => {
    const result = calculateObservationEnergy(observation, input.model)
    const start = parseZonedTimestampNanoseconds(observation.intervalStart)
    const end = parseZonedTimestampNanoseconds(observation.intervalEnd)
    const receivedAt = parseZonedTimestampNanoseconds(observation.collectedAt)
    if (start === null || end === null || receivedAt === null || end <= start) {
      exclusions.push({ observationId: observation.id, reasons: result.reasons })
      return []
    }
    const clippedStart = periodStart > start ? periodStart : start
    const clippedEnd = periodEnd < end ? periodEnd : end
    return clippedEnd > clippedStart
      ? [{ observation, result, start: clippedStart, end: clippedEnd, receivedAt }]
      : []
  })
  const boundaries = [...new Set([periodStart, periodEnd, ...intervals.flatMap(({ start, end }) => [start, end])])]
    .sort(compareTime)
  let energyKwh = 0
  let validDurationNanoseconds = 0n
  const contributions: EnergyPeriodContribution[] = []
  for (let index = 1; index < boundaries.length; index += 1) {
    const start = boundaries[index - 1]
    const end = boundaries[index]
    const winner = intervals.filter((interval) => interval.start <= start && interval.end >= end)
      .sort((a, b) => compareTime(b.receivedAt, a.receivedAt) ||
        (a.observation.id < b.observation.id ? -1 : a.observation.id > b.observation.id ? 1 : 0))[0]
    const slice = { intervalStart: toTimestamp(start), intervalEnd: toTimestamp(end) }
    if (!winner) {
      exclusions.push({ observationId: null, ...slice, reasons: [{ code: 'NO_OBSERVATION' }] })
      continue
    }
    if (winner.result.averagePowerW === null) {
      exclusions.push({ observationId: winner.observation.id, ...slice, reasons: winner.result.reasons })
      continue
    }
    const seconds = Number(end - start) / 1e9
    validDurationNanoseconds += end - start
    const sliceEnergy = winner.result.averagePowerW * (seconds / 3600000)
    energyKwh += sliceEnergy
    contributions.push({ observationId: winner.observation.id, ...slice, durationSeconds: seconds,
      energyKwh: sliceEnergy, modelKey: winner.result.modelKey, modelVersion: winner.result.modelVersion,
      modelParameters: winner.result.modelParameters })
  }
  return {
    energyKwh: validDurationNanoseconds > 0n && Number.isFinite(energyKwh) ? energyKwh : null,
    validDurationSeconds: Number(validDurationNanoseconds) / 1e9,
    periodDurationSeconds,
    coverage: Number(validDurationNanoseconds) / Number(periodDurationNanoseconds),
    exclusions,
    contributions,
    reasons: Number.isFinite(energyKwh) ? [] : [{ code: 'NON_FINITE_RESULT' }],
  }
}
