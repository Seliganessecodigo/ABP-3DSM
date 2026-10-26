import {
  type EnergyMetricName,
  type EnergyModelConfig,
  type EnergyModelParameters,
  SIMPLIFIED_ENERGY_MODEL_V1,
} from './energy-model'

export interface EnergyObservationInput {
  readonly id: string
  readonly applicationId: string
  readonly intervalStart: string
  readonly intervalEnd: string
  readonly collectedAt: string
  readonly metrics: Readonly<Record<string, unknown>>
}

export type EnergyCalculationReasonCode =
  | 'INVALID_OBSERVATION_ID'
  | 'INVALID_APPLICATION_ID'
  | 'INVALID_TIMESTAMP'
  | 'INVALID_INTERVAL'
  | 'INVALID_MODEL'
  | 'METRIC_MISSING'
  | 'METRIC_INVALID'
  | 'METRIC_OUT_OF_RANGE'
  | 'NON_FINITE_RESULT'

export interface EnergyCalculationReason {
  readonly code: EnergyCalculationReasonCode
  readonly metric?: EnergyMetricName
}

export interface EnergyCalculationResult {
  readonly observationId: string
  readonly applicationId: string
  readonly averagePowerW: number | null
  readonly energyKwh: number | null
  readonly durationSeconds: number | null
  readonly modelKey: string
  readonly modelVersion: string
  readonly modelParameters: Readonly<EnergyModelParameters>
  readonly powerContributionsW: Readonly<
    Record<EnergyMetricName, number | null>
  >
  readonly reasons: readonly EnergyCalculationReason[]
}

const ISO_TIMESTAMP_WITH_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/

const METRIC_NAMES: readonly EnergyMetricName[] = [
  'cpuPercent',
  'memoryGb',
  'diskGb',
  'networkGb',
]

export function parseZonedTimestampNanoseconds(value: unknown): bigint | null {
  if (typeof value !== 'string') return null

  const match = ISO_TIMESTAMP_WITH_OFFSET.exec(value)
  if (!match) return null

  const [, yearText, monthText, dayText, hourText, minuteText, secondText,
    fractionText = '', timezone, offsetSign, offsetHourText, offsetMinuteText] =
    match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)
  const offsetHour = Number(offsetHourText ?? 0)
  const offsetMinute = Number(offsetMinuteText ?? 0)

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return null
  }

  const localDate = new Date(0)
  localDate.setUTCFullYear(year, month - 1, day)
  localDate.setUTCHours(hour, minute, second, 0)
  if (
    localDate.getUTCFullYear() !== year ||
    localDate.getUTCMonth() !== month - 1 ||
    localDate.getUTCDate() !== day
  ) {
    return null
  }

  const offsetSeconds =
    (offsetSign === '-' ? -1 : 1) * (offsetHour * 3600 + offsetMinute * 60)
  const localNanoseconds =
    BigInt(localDate.getTime()) * 1_000_000n +
    BigInt(fractionText.padEnd(9, '0') || '0')
  const offsetNanoseconds = BigInt(offsetSeconds) * 1_000_000_000n

  return timezone === 'Z'
    ? localNanoseconds
    : localNanoseconds - offsetNanoseconds
}

function validModel(model: EnergyModelConfig): boolean {
  return (
    typeof model.key === 'string' &&
    model.key.trim().length > 0 &&
    typeof model.version === 'string' &&
    model.version.trim().length > 0 &&
    Number.isFinite(model.cpuWattsAt100Percent) &&
    model.cpuWattsAt100Percent >= 0 &&
    Number.isFinite(model.memoryWattsPerGb) &&
    model.memoryWattsPerGb >= 0 &&
    Number.isFinite(model.diskWattsPerGb) &&
    model.diskWattsPerGb >= 0 &&
    Number.isFinite(model.networkWattsPerGb) &&
    model.networkWattsPerGb >= 0
  )
}

function calculateMetricContribution(
  metric: EnergyMetricName,
  value: unknown,
  model: EnergyModelConfig,
): { contributionW: number | null; reason: EnergyCalculationReason | null } {
  if (value === null || value === undefined) {
    return {
      contributionW: null,
      reason: { code: 'METRIC_MISSING', metric },
    }
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      contributionW: null,
      reason: { code: 'METRIC_INVALID', metric },
    }
  }

  if (
    value < 0 ||
    (metric === 'cpuPercent' && value > 100)
  ) {
    return {
      contributionW: null,
      reason: { code: 'METRIC_OUT_OF_RANGE', metric },
    }
  }

  const coefficient = {
    cpuPercent: model.cpuWattsAt100Percent / 100,
    memoryGb: model.memoryWattsPerGb,
    diskGb: model.diskWattsPerGb,
    networkGb: model.networkWattsPerGb,
  }[metric]
  const contributionW = value * coefficient
  if (!Number.isFinite(contributionW)) {
    return {
      contributionW: null,
      reason: { code: 'NON_FINITE_RESULT', metric },
    }
  }

  return { contributionW, reason: null }
}

export function calculateObservationEnergy(
  observation: EnergyObservationInput,
  model: EnergyModelConfig = SIMPLIFIED_ENERGY_MODEL_V1,
): EnergyCalculationResult {
  const modelSnapshot = Object.freeze({
    key: model.key,
    version: model.version,
    cpuWattsAt100Percent: model.cpuWattsAt100Percent,
    memoryWattsPerGb: model.memoryWattsPerGb,
    diskWattsPerGb: model.diskWattsPerGb,
    networkWattsPerGb: model.networkWattsPerGb,
  })
  const reasons: EnergyCalculationReason[] = []
  if (typeof observation.id !== 'string' || !observation.id.trim()) {
    reasons.push({ code: 'INVALID_OBSERVATION_ID' })
  }
  if (
    typeof observation.applicationId !== 'string' ||
    !observation.applicationId.trim()
  ) {
    reasons.push({ code: 'INVALID_APPLICATION_ID' })
  }
  if (!validModel(modelSnapshot)) reasons.push({ code: 'INVALID_MODEL' })

  const intervalStart = parseZonedTimestampNanoseconds(observation.intervalStart)
  const intervalEnd = parseZonedTimestampNanoseconds(observation.intervalEnd)
  const collectedAt = parseZonedTimestampNanoseconds(observation.collectedAt)
  if (intervalStart === null || intervalEnd === null || collectedAt === null) {
    reasons.push({ code: 'INVALID_TIMESTAMP' })
  }

  const durationSeconds =
    intervalStart !== null && intervalEnd !== null
      ? Number(intervalEnd - intervalStart) / 1_000_000_000
      : null
  if (durationSeconds !== null && durationSeconds <= 0) {
    reasons.push({ code: 'INVALID_INTERVAL' })
  }

  const contributions: Record<EnergyMetricName, number | null> = {
    cpuPercent: null,
    memoryGb: null,
    diskGb: null,
    networkGb: null,
  }
  if (validModel(modelSnapshot)) {
    for (const metric of METRIC_NAMES) {
      const contribution = calculateMetricContribution(
        metric,
        observation.metrics[metric],
        modelSnapshot,
      )
      contributions[metric] = contribution.contributionW
      if (contribution.reason) reasons.push(contribution.reason)
    }
  }

  const hasInvalidMetric = reasons.some((reason) =>
    ['METRIC_MISSING', 'METRIC_INVALID', 'METRIC_OUT_OF_RANGE'].includes(
      reason.code,
    ),
  )
  const averagePowerW = METRIC_NAMES.every(
    (metric) => contributions[metric] !== null,
  )
    ? METRIC_NAMES.reduce(
        (sum, metric) => sum + (contributions[metric] ?? 0),
        0,
      )
    : null
  const energyKwh =
    averagePowerW !== null && durationSeconds !== null && durationSeconds > 0
      ? averagePowerW * (durationSeconds / 3_600_000)
      : null
  if (
    (averagePowerW !== null && !Number.isFinite(averagePowerW)) ||
    (energyKwh !== null && !Number.isFinite(energyKwh))
  ) {
    reasons.push({ code: 'NON_FINITE_RESULT' })
  }

  const valid =
    reasons.length === 0 &&
    !hasInvalidMetric &&
    durationSeconds !== null &&
    durationSeconds > 0 &&
    averagePowerW !== null &&
    energyKwh !== null &&
    Number.isFinite(averagePowerW) &&
    Number.isFinite(energyKwh)

  return {
    observationId: observation.id,
    applicationId: observation.applicationId,
    averagePowerW: valid ? averagePowerW : null,
    energyKwh: valid ? energyKwh : null,
    durationSeconds,
    modelKey: modelSnapshot.key,
    modelVersion: modelSnapshot.version,
    modelParameters: Object.freeze({
      cpuWattsAt100Percent: modelSnapshot.cpuWattsAt100Percent,
      memoryWattsPerGb: modelSnapshot.memoryWattsPerGb,
      diskWattsPerGb: modelSnapshot.diskWattsPerGb,
      networkWattsPerGb: modelSnapshot.networkWattsPerGb,
    }),
    powerContributionsW: contributions,
    reasons,
  }
}
