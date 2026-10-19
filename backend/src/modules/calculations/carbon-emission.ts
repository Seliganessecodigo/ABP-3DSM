export interface CarbonEmissionEnergyInput {
  readonly energyKwh: number | null
}

export interface CarbonFactorSnapshotInput {
  readonly id: string | null
  readonly version: string | null
  readonly contractVersion: string | null
  readonly regionCode: string | null
  readonly country: string | null
  readonly region: string | null
  readonly city: string | null
  readonly intensity: number | null
  readonly unit: string | null
  readonly queriedAt: string | null
  readonly source: string | null
  readonly validFrom: string | null
  readonly validUntil: string | null
}

export type CarbonEmissionReasonCode =
  | 'ENERGY_UNAVAILABLE'
  | 'INVALID_ENERGY'
  | 'CARBON_FACTOR_UNAVAILABLE'
  | 'INVALID_FACTOR'
  | 'INVALID_SNAPSHOT'
  | 'UNSUPPORTED_UNIT'
  | 'NON_FINITE_RESULT'

export interface CarbonEmissionReason {
  readonly code: CarbonEmissionReasonCode
}

export interface CarbonEmissionResult {
  readonly energyKwh: number | null
  readonly factorSnapshot: Readonly<CarbonFactorSnapshotInput> | null
  readonly emissionsGramsCo2e: number | null
  readonly emissionsKilogramsCo2e: number | null
  readonly reasons: readonly CarbonEmissionReason[]
}

function isNonBlank(value: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidZonedTimestamp(value: string | null): value is string {
  if (!isNonBlank(value)) return false

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    )
  if (!match || !Number.isFinite(Date.parse(value))) return false

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth =
    month === 2 ? (isLeapYear ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59
  )
}

function hasRequiredSnapshotMetadata(
  factor: CarbonFactorSnapshotInput,
): boolean {
  return (
    isNonBlank(factor.id) &&
    isNonBlank(factor.version) &&
    isNonBlank(factor.contractVersion) &&
    isNonBlank(factor.regionCode) &&
    isValidZonedTimestamp(factor.queriedAt)
  )
}

export function calculateCarbonEmission(
  energy: CarbonEmissionEnergyInput,
  factor: CarbonFactorSnapshotInput | null,
): CarbonEmissionResult {
  const factorSnapshot = factor ? Object.freeze({ ...factor }) : null
  const reasons: CarbonEmissionReason[] = []

  if (energy.energyKwh === null) reasons.push({ code: 'ENERGY_UNAVAILABLE' })
  else if (!Number.isFinite(energy.energyKwh) || energy.energyKwh < 0)
    reasons.push({ code: 'INVALID_ENERGY' })

  if (factor === null) {
    reasons.push({ code: 'CARBON_FACTOR_UNAVAILABLE' })
  } else {
    if (!hasRequiredSnapshotMetadata(factor) || factor.unit === null)
      reasons.push({ code: 'INVALID_SNAPSHOT' })
    if (
      factor.intensity === null ||
      !Number.isFinite(factor.intensity) ||
      factor.intensity < 0
    ) {
      reasons.push({ code: 'INVALID_FACTOR' })
    }
    if (factor.unit !== null && factor.unit !== 'gCO2e/kWh')
      reasons.push({ code: 'UNSUPPORTED_UNIT' })
  }

  if (reasons.length > 0 || energy.energyKwh === null || factor === null) {
    return {
      energyKwh: energy.energyKwh,
      factorSnapshot,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons,
    }
  }

  const emissionsGramsCo2e = energy.energyKwh * factor.intensity!
  const emissionsKilogramsCo2e = emissionsGramsCo2e / 1000
  if (
    !Number.isFinite(emissionsGramsCo2e) ||
    !Number.isFinite(emissionsKilogramsCo2e)
  ) {
    return {
      energyKwh: energy.energyKwh,
      factorSnapshot,
      emissionsGramsCo2e: null,
      emissionsKilogramsCo2e: null,
      reasons: [{ code: 'NON_FINITE_RESULT' }],
    }
  }

  return {
    energyKwh: energy.energyKwh,
    factorSnapshot,
    emissionsGramsCo2e,
    emissionsKilogramsCo2e,
    reasons: [],
  }
}
