import {
  calculateCarbonEmission,
  type CarbonFactorSnapshotInput,
} from './carbon-emission'
import { parseZonedTimestampNanoseconds } from './energy-calculation'
import { formatUtcTimestamp } from './persisted-environmental-period'

export interface CurrentRegionalFactor {
  readonly regionCode: string
  readonly country: string
  readonly region: string
  readonly city: string | null
  readonly intensity: number
  readonly unit: string
  readonly queriedAt: string
}

export interface RegionalSimulationMeasure {
  readonly value: number | null
  readonly unit: string
  readonly reasons: readonly { readonly code: string; readonly metric?: string }[]
}

export interface RegionalSimulationResult {
  readonly period: { readonly from: string; readonly to: string }
  readonly energy: RegionalSimulationMeasure
  readonly reference: {
    readonly emissions: RegionalSimulationMeasure
    readonly factorSnapshots: readonly Readonly<CarbonFactorSnapshotInput>[]
  }
  readonly destination: {
    readonly regionCode: string | null
    readonly intensity: number | null
    readonly unit: string
    readonly emissions: RegionalSimulationMeasure
    readonly queriedAt: string | null
  }
  readonly coverage: {
    readonly energy: number
    readonly reference: number
    readonly destination: number
  }
  readonly difference: {
    readonly absolute: RegionalSimulationMeasure
    readonly percent: RegionalSimulationMeasure
  }
}

interface RegionalSimulationInput {
  readonly from: string
  readonly to: string
  readonly destinationRegionCode: string
  readonly segments: readonly {
    readonly interval: { readonly from: string; readonly to: string }
    readonly energy: {
      readonly value: number | null
      readonly reasons: readonly { readonly code: string; readonly metric?: string }[]
    }
    readonly factorSnapshot: Readonly<CarbonFactorSnapshotInput> | null
  }[]
  readonly destinationFactor: CurrentRegionalFactor | null
  readonly destinationFailureCode?: string
}

export function calculateRegionalSimulation(
  input: RegionalSimulationInput,
): RegionalSimulationResult {
  const periodStart = parseZonedTimestampNanoseconds(input.from)
  const periodEnd = parseZonedTimestampNanoseconds(input.to)
  if (periodStart === null || periodEnd === null || periodEnd <= periodStart) {
    throw new Error('INVALID_ANALYSIS_PERIOD')
  }

  let energyTotal = 0
  let referenceTotal = 0
  let destinationTotal = 0
  let energyCovered = 0n
  let referenceCovered = 0n
  let destinationCovered = 0n
  const energyReasons: { code: string; metric?: string }[] = []
  const referenceReasons: { code: string; metric?: string }[] = []
  const destinationReasons: { code: string; metric?: string }[] = []
  const factors = new Map<string, Readonly<CarbonFactorSnapshotInput>>()

  for (const segment of input.segments) {
    const start = parseZonedTimestampNanoseconds(segment.interval.from)
    const end = parseZonedTimestampNanoseconds(segment.interval.to)
    if (start === null || end === null || end <= start || start < periodStart || end > periodEnd) {
      throw new Error('INVALID_ANALYSIS_SEGMENT')
    }
    const duration = end - start
    if (segment.energy.value === null || !Number.isFinite(segment.energy.value) || segment.energy.value < 0) {
      energyReasons.push(...segment.energy.reasons)
      continue
    }

    const nextEnergyTotal = energyTotal + segment.energy.value
    if (!Number.isFinite(nextEnergyTotal)) {
      energyReasons.push({ code: 'NON_FINITE_RESULT', metric: 'energy' })
      continue
    }
    energyTotal = nextEnergyTotal
    energyCovered += duration
    if (input.destinationFactor !== null) {
      const factor = input.destinationFactor
      if (!isValidDestinationFactor(factor)) {
        destinationReasons.push({ code: 'DESTINATION_FACTOR_INVALID' })
      } else {
        const emissions = segment.energy.value * factor.intensity
        if (Number.isFinite(emissions)) {
          const nextDestinationTotal = destinationTotal + emissions
          if (Number.isFinite(nextDestinationTotal)) {
            destinationTotal = nextDestinationTotal
            destinationCovered += duration
          } else {
            destinationReasons.push({ code: 'NON_FINITE_RESULT', metric: 'destination' })
          }
        } else {
          destinationReasons.push({ code: 'NON_FINITE_RESULT', metric: 'destination' })
        }
      }
    }

    const snapshot = segment.factorSnapshot
    if (snapshot === null) {
      referenceReasons.push({ code: 'PRESERVED_REFERENCE_FACTOR_UNAVAILABLE' })
      continue
    }
    const reference = calculateCarbonEmission({ energyKwh: segment.energy.value }, snapshot)
    if (reference.emissionsGramsCo2e === null) {
      referenceReasons.push(...reference.reasons.map(({ code }) => ({ code, metric: 'reference' })));
      continue
    }
    const nextReferenceTotal = referenceTotal + reference.emissionsGramsCo2e
    if (!Number.isFinite(nextReferenceTotal)) {
      referenceReasons.push({ code: 'NON_FINITE_RESULT', metric: 'reference' })
      continue
    }
    referenceTotal = nextReferenceTotal
    referenceCovered += duration
    factors.set(JSON.stringify(snapshot), snapshot)
  }

  const energyCoverage = Number(energyCovered) / Number(periodEnd - periodStart)
  const referenceCoverage = Number(referenceCovered) / Number(periodEnd - periodStart)
  const destinationCoverage = Number(destinationCovered) / Number(periodEnd - periodStart)
  const compatibleCoverage = energyCovered === referenceCovered && energyCovered > 0n
  const differenceReasons: { code: string }[] = []
  if (!compatibleCoverage) differenceReasons.push({ code: 'INCOMPATIBLE_COVERAGE' })
  if (input.destinationFactor === null) {
    differenceReasons.push({ code: input.destinationFailureCode ?? 'DESTINATION_FACTOR_UNAVAILABLE' })
  } else if (destinationCovered !== referenceCovered) {
    differenceReasons.push(...(destinationReasons.length > 0
      ? destinationReasons.map(({ code }) => ({ code }))
      : [{ code: 'INCOMPATIBLE_COVERAGE' }]))
  }
  const canCompare = compatibleCoverage && input.destinationFactor !== null && destinationCovered === referenceCovered
  const absoluteDifference = canCompare ? destinationTotal - referenceTotal : null
  const rawPercentDifference = canCompare && referenceTotal > 0
    ? absoluteDifference! / referenceTotal
    : null
  const percentDifference = rawPercentDifference !== null && Number.isFinite(rawPercentDifference)
    ? rawPercentDifference
    : null
  const percentReasons: { code: string; metric?: string }[] = [...differenceReasons]
  if (rawPercentDifference !== null && percentDifference === null) {
    percentReasons.push({ code: 'NON_FINITE_RESULT', metric: 'differencePercent' })
  }
  if (referenceTotal === 0 && compatibleCoverage && input.destinationFactor !== null && destinationCovered === referenceCovered) {
    percentReasons.push({ code: 'ZERO_REFERENCE' })
  }

  return {
    period: { from: formatUtcTimestamp(periodStart), to: formatUtcTimestamp(periodEnd) },
    energy: measure(
      energyCovered > 0n ? energyTotal : null,
      'kWh',
      energyCovered > 0n ? energyReasons : energyReasons.length > 0 ? energyReasons : [{ code: 'NO_CALCULABLE_ENERGY' }],
    ),
    reference: {
      emissions: measure(
        referenceCovered > 0n ? referenceTotal : null,
        'gCO2e',
        referenceCovered > 0n ? referenceReasons : referenceReasons.length > 0 ? referenceReasons : [{ code: 'NO_CALCULABLE_ENERGY' }],
      ),
      factorSnapshots: [...factors.values()],
    },
    destination: {
      regionCode: input.destinationRegionCode,
      intensity: input.destinationFactor?.intensity ?? null,
      unit: 'gCO2e/kWh',
      emissions: measure(
        destinationCovered > 0n ? destinationTotal : null,
        'gCO2e',
        energyCovered === 0n
          ? [{ code: 'NO_CALCULABLE_ENERGY' }]
          : input.destinationFactor === null
          ? [{ code: input.destinationFailureCode ?? 'DESTINATION_FACTOR_UNAVAILABLE' }]
          : destinationReasons,
      ),
      queriedAt: input.destinationFactor?.queriedAt ?? null,
    },
    coverage: {
      energy: energyCoverage,
      reference: referenceCoverage,
      destination: destinationCoverage,
    },
    difference: {
      absolute: measure(absoluteDifference, 'gCO2e', differenceReasons),
      percent: measure(
        percentDifference,
        'ratio',
        percentReasons,
      ),
    },
  }
}

function measure(
  value: number | null,
  unit: string,
  reasons: readonly { readonly code: string; readonly metric?: string }[],
): RegionalSimulationMeasure {
  const unique = new Map(reasons.map((reason) => [`${reason.code}:${reason.metric ?? ''}`, reason]))
  return { value, unit, reasons: [...unique.values()] }
}

function isValidDestinationFactor(factor: CurrentRegionalFactor): boolean {
  return Boolean(
    factor.regionCode.trim() &&
      factor.country.trim() &&
      factor.region.trim() &&
      (factor.city === null || typeof factor.city === 'string') &&
      Number.isFinite(factor.intensity) &&
      factor.intensity >= 0 &&
      factor.unit === 'gCO2e/kWh' &&
      parseZonedTimestampNanoseconds(factor.queriedAt) !== null,
  )
}
