import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApplicationsRepository } from './applications.repository'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import {
  ApplicationEventsRepository,
  PersistedApplicationMetadataEvent,
} from '../../database/repositories/application-events.repository'
import { ApplicationState } from '../../database/entities/application-state'
import { parseZonedTimestampNanoseconds } from '../calculations/energy-calculation'
import {
  formatUtcTimestamp,
  summarizePersistedEnvironmentalPeriod,
} from '../calculations/persisted-environmental-period'
import type { EnvironmentalAnalysisSummaryDto } from './environmental-analysis-summary.dto'

export interface EnvironmentalAnalysisSummaryFilters {
  readonly from?: string
  readonly to?: string
  readonly states?: string | readonly string[]
  readonly regionCodes?: string | readonly string[]
  readonly applicationIds?: string | readonly string[]
}

const stateValues = Object.values(ApplicationState)
@Injectable()
export class EnvironmentalAnalysisSummaryService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
    private readonly applicationEvents: ApplicationEventsRepository,
  ) {}

  async getSummary(
    filters: EnvironmentalAnalysisSummaryFilters,
  ): Promise<EnvironmentalAnalysisSummaryDto> {
    const start =
      typeof filters.from === 'string'
        ? parseZonedTimestampNanoseconds(filters.from)
        : null
    const end =
      typeof filters.to === 'string'
        ? parseZonedTimestampNanoseconds(filters.to)
        : null
    if (start === null || end === null || end <= start) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_PERIOD' })
    }

    const states = parseValues(filters.states, 'INVALID_ANALYSIS_STATE_FILTER')
    const regionCodes = parseValues(
      filters.regionCodes,
      'INVALID_ANALYSIS_REGION_FILTER',
    )
    const applicationIds = parseValues(
      filters.applicationIds,
      'INVALID_ANALYSIS_APPLICATION_FILTER',
    )
    if (
      states?.some((state) => !stateValues.includes(state as ApplicationState))
    ) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_STATE_FILTER' })
    }

    try {
      const allApplications = await this.applications.findAll()
      const selectedApplications = allApplications
        .filter(
          (application) =>
            (!states || states.includes(application.state)) &&
            (!applicationIds || applicationIds.includes(application.id)),
        )
        .sort((left, right) => left.id.localeCompare(right.id))
      const ids = selectedApplications.map(({ id }) => id)
      const [rows, history] = await Promise.all([
        this.collections.findEnvironmentalByApplicationsAndPeriod(
          ids,
          start,
          end,
        ),
        this.applicationEvents.findMetadataHistory(ids),
      ])
      const historyByApplication = groupBy(
        history,
        (event) => event.applicationId,
      )
      const rowsByApplication = groupBy(rows, (row) => row.applicationId)
      const filteredApplications = regionCodes
        ? selectedApplications.filter((application) =>
            (rowsByApplication.get(application.id) ?? []).some((row) => {
              const regionAtCollection = getRegionAt(
                row.collectedAt,
                historyByApplication.get(application.id) ?? [],
                application.regionCode,
              )
              return (
                regionAtCollection !== null &&
                regionCodes.includes(regionAtCollection)
              )
            }),
          )
        : selectedApplications

      const periodFrom = formatUtcTimestamp(start)
      const periodTo = formatUtcTimestamp(end)
      const duration = Number(end - start)
      const statesCount: EnvironmentalAnalysisSummaryDto['states'] = {
        AVAILABLE: 0,
        UNAVAILABLE: 0,
        NO_METRICS: 0,
        REMOVED: 0,
      }
      let energyTotal = 0
      let emissionsTotal = 0
      let energyCovered = 0
      let emissionsCovered = 0
      let hasEnergy = false
      let hasEmissions = false
      let latestCollectedAt: bigint | null = null
      const applications =
        [] as EnvironmentalAnalysisSummaryDto['applications'][number][]
      const energyReasons = new Map<string, { code: string; metric?: string }>()
      const emissionsReasons = new Map<
        string,
        { code: string; metric?: string }
      >()
      const provenanceReasons = new Map<
        string,
        { code: string; metric?: string }
      >()
      const methodologies = new Map<
        string,
        {
          key: string
          version: string
          parameters: Readonly<Record<string, number>>
        }
      >()
      const factors = new Map<
        string,
        EnvironmentalAnalysisSummaryDto['provenance']['factors'][number]
      >()

      for (const application of filteredApplications) {
        statesCount[application.state] += 1
        const observations = (
          rowsByApplication.get(application.id) ?? []
        ).filter((row) => {
          if (!regionCodes) return true
          const regionAtCollection = getRegionAt(
            row.collectedAt,
            historyByApplication.get(application.id) ?? [],
            application.regionCode,
          )
          return (
            regionAtCollection !== null &&
            regionCodes.includes(regionAtCollection)
          )
        })
        for (const row of observations) {
          const collectedAt = parseZonedTimestampNanoseconds(row.collectedAt)
          if (
            collectedAt !== null &&
            (latestCollectedAt === null || collectedAt > latestCollectedAt)
          ) {
            latestCollectedAt = collectedAt
          }
        }
        const summary = summarizePersistedEnvironmentalPeriod(
          periodFrom,
          periodTo,
          observations,
        )
        const { energy, emissions, coverage } = summary
        if (energy.value !== null) {
          hasEnergy = true
          energyTotal += energy.value
        }
        if (emissions.value !== null) {
          hasEmissions = true
          emissionsTotal += emissions.value
        }
        energyCovered += coverage.energy * duration
        emissionsCovered += coverage.emissions * duration
        addReasons(energyReasons, energy.reasons)
        addReasons(emissionsReasons, emissions.reasons)
        addReasons(provenanceReasons, summary.provenance.reasons)
        for (const methodology of summary.provenance.methodologies) {
          methodologies.set(
            JSON.stringify([
              methodology.key,
              methodology.version,
              Object.entries(methodology.parameters).sort(([left], [right]) =>
                left.localeCompare(right),
              ),
            ]),
            methodology,
          )
        }
        for (const factor of summary.provenance.factors) {
          const key = JSON.stringify([
            factor.contractVersion,
            factor.regionCode,
            factor.country,
            factor.region,
            factor.city,
            factor.intensity,
            factor.unit,
            factor.version,
            factor.source,
            factor.validFrom,
            factor.validUntil,
          ])
          const current = factors.get(key)
          factors.set(
            key,
            current
              ? {
                  ...current,
                  queriedAt: {
                    from: earlier(
                      current.queriedAt.from,
                      factor.queriedAt.from,
                    ),
                    to: later(current.queriedAt.to, factor.queriedAt.to),
                  },
                }
              : factor,
          )
        }
        if (energy.value !== null || emissions.value !== null) {
          applications.push({
            applicationId: application.id,
            name: application.name,
            state: application.state,
            energy,
            emissions,
            coverage,
          })
        }
      }

      const scopeDuration = duration * filteredApplications.length
      return {
        status: hasEnergy || hasEmissions ? 'available' : 'empty',
        period: { from: periodFrom, to: periodTo },
        dataAsOf:
          latestCollectedAt === null
            ? null
            : formatUtcTimestamp(latestCollectedAt),
        totals: {
          energy: {
            value: hasEnergy ? energyTotal : null,
            unit: 'kWh',
            reasons: [...energyReasons.values()],
          },
          emissions: {
            value: hasEmissions ? emissionsTotal : null,
            unit: 'gCO2e',
            reasons: [...emissionsReasons.values()],
          },
        },
        coverage: {
          energy: scopeDuration === 0 ? 0 : energyCovered / scopeDuration,
          emissions: scopeDuration === 0 ? 0 : emissionsCovered / scopeDuration,
        },
        states: statesCount,
        applications,
        provenance: {
          methodologies: [...methodologies.values()],
          factors: [...factors.values()],
          reasons: [...provenanceReasons.values()],
        },
      }
    } catch {
      throw new ServiceUnavailableException({
        code: 'ANALYSIS_SUMMARY_UNAVAILABLE',
      })
    }
  }
}

function parseValues(
  input: string | readonly string[] | undefined,
  code: string,
): string[] | undefined {
  if (input === undefined) return undefined
  const values = (Array.isArray(input) ? input : [input]).map((value) =>
    value.trim(),
  )
  if (values.length === 0 || values.some((value) => value.length === 0)) {
    throw new BadRequestException({ code })
  }
  return [...new Set(values)]
}

function groupBy<T>(
  values: readonly T[],
  key: (value: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const value of values) {
    const valueKey = key(value)
    const group = grouped.get(valueKey) ?? []
    group.push(value)
    grouped.set(valueKey, group)
  }
  return grouped
}

function getRegionAt(
  collectedAt: string,
  events: readonly PersistedApplicationMetadataEvent[],
  currentRegion: string | null,
): string | null {
  const collectionTime = parseZonedTimestampNanoseconds(collectedAt)
  if (collectionTime === null) return null
  let region = currentRegion
  for (const event of [...events].reverse()) {
    const eventTime = parseZonedTimestampNanoseconds(event.occurredAt)
    if (eventTime === null || eventTime <= collectionTime) continue
    region = regionFromDetails(event.details, 'before')
  }
  return region
}

function regionFromDetails(
  details: Record<string, unknown> | null,
  side: 'before' | 'after',
): string | null {
  if (!details) return null
  const snapshot = details[side]
  if (typeof snapshot !== 'object' || snapshot === null) return null
  const location = (snapshot as Record<string, unknown>).location
  if (typeof location !== 'object' || location === null) return null
  const regionCode = (location as Record<string, unknown>).regionCode
  return typeof regionCode === 'string' && regionCode.length > 0
    ? regionCode
    : null
}

function addReasons(
  target: Map<string, { code: string; metric?: string }>,
  reasons: readonly { code: string; metric?: string }[],
): void {
  for (const reason of reasons)
    target.set(`${reason.code}:${reason.metric ?? ''}`, reason)
}

function earlier(left: string | null, right: string | null): string | null {
  if (left === null) return right
  if (right === null) return left
  return left < right ? left : right
}

function later(left: string | null, right: string | null): string | null {
  if (left === null) return right
  if (right === null) return left
  return left > right ? left : right
}
