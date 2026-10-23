import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { CarbonIntensityAdapter } from '../../integrations/carbon-intensity.adapter'
import { ApplicationsRepository } from './applications.repository'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import type { PersistedApplicationMetadataEvent } from '../../database/repositories/application-events.repository'
import { parseZonedTimestampNanoseconds, calculateObservationEnergy } from '../calculations/energy-calculation'
import { SIMPLIFIED_ENERGY_MODEL_V1 } from '../calculations/energy-model'
import { calculateCarbonEmission, type CarbonFactorSnapshotInput } from '../calculations/carbon-emission'
import type { PersistedEnvironmentalInterval } from '../calculations/persisted-environmental-period'
import { formatUtcTimestamp, summarizePersistedEnvironmentalPeriod } from '../calculations/persisted-environmental-period'
import { EnvironmentalAnalysisDto } from './environmental-analysis.dto'
import { EnvironmentalRecalculationPreviewDto } from './environmental-recalculation-preview.dto'
import {
  aggregatePersistedEnvironmentalSeriesBucket,
  aggregatePersistedEnvironmentalSeries,
  countEnvironmentalSeriesBuckets,
  getEnvironmentalSeriesBucket,
  type EnvironmentalSeriesGranularity,
} from '../calculations/persisted-environmental-series'
import {
  EnvironmentalAnalysisSeriesContributionsDto,
  EnvironmentalAnalysisSeriesDto,
} from './environmental-analysis-series.dto'
import { buildEnvironmentalAnalysisSeriesEvents } from '../calculations/persisted-environmental-series-events'

@Injectable()
export class EnvironmentalAnalysisService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
    private readonly applicationEvents: ApplicationEventsRepository,
    private readonly carbonIntensity: CarbonIntensityAdapter,
  ) {}

  async previewRecalculation(
    applicationId: string,
    from: string,
    to: string,
  ): Promise<EnvironmentalRecalculationPreviewDto> {
    if (!applicationId.trim())
      throw new BadRequestException({ code: "INVALID_APPLICATION_ID" });
    const start = parseZonedTimestampNanoseconds(from);
    const end = parseZonedTimestampNanoseconds(to);
    if (start === null || end === null || end <= start) {
      throw new BadRequestException({ code: "INVALID_ANALYSIS_PERIOD" });
    }
    if (end - start > 30n * 24n * 60n * 60n * 1_000_000_000n) {
      throw new BadRequestException({
        code: "RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED",
      });
    }

    try {
      const application = await this.applications.findById(applicationId);
      if (!application)
        throw new NotFoundException({ code: "APPLICATION_NOT_FOUND" });
      const collections = await this.collections.findForRecalculationPreview(
        applicationId,
        new Date(Number(start / 1_000_000n)),
        new Date(Number(end / 1_000_000n)),
      );
      if (collections.length > 10_000) {
        throw new BadRequestException({
          code: "RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED",
        });
      }
      const original = await this.getByPeriod(applicationId, from, to);
      if (collections.length === 0) {
        return { status: "empty", original, preview: original, warnings: [] };
      }

      const factorByRegion = new Map<
        string,
        Promise<CarbonFactorSnapshotInput | null>
      >();
      const failedRegions = new Set<string>();
      const missingHistoricalRegion = new Set<string>();
      const limitFactorConcurrency = createConcurrencyLimiter(5);
      const metadataHistory = collections.some(
        (collection) =>
          !collection.calculationEvidence?.carbon.factorSnapshot?.regionCode,
      )
        ? await this.applicationEvents.findMetadataHistory([applicationId])
        : [];
      const observations: PersistedEnvironmentalInterval[] = await Promise.all(
        collections.map(async (collection) => {
          const energy = calculateObservationEnergy(
            {
              id: collection.id,
              applicationId,
              intervalStart: collection.intervalStart.toISOString(),
              intervalEnd: collection.intervalEnd.toISOString(),
              collectedAt: collection.collectedAt.toISOString(),
              metrics: collection.metrics,
            },
            SIMPLIFIED_ENERGY_MODEL_V1,
          );
          const regionCode =
            collection.calculationEvidence?.carbon.factorSnapshot?.regionCode ??
            resolveRegionAtCollection(
              collection.collectedAt.toISOString(),
              application.regionCode,
              metadataHistory,
            );
          let factorSnapshot: CarbonFactorSnapshotInput | null = null;
          if (regionCode) {
            let factorRequest = factorByRegion.get(regionCode);
            if (!factorRequest) {
              factorRequest = limitFactorConcurrency(() =>
                this.carbonIntensity
                  .fetchIntensity(regionCode)
                  .then((factor) => {
                    const version = randomUUID();
                    return {
                      id: version,
                      version,
                      contractVersion: "0.1.0",
                      regionCode: factor.regionCode,
                      country: factor.country,
                      region: factor.region,
                      city: factor.city,
                      intensity: factor.intensity,
                      unit: factor.unit,
                      queriedAt: factor.queriedAt.toISOString(),
                      source: null,
                      validFrom: null,
                      validUntil: null,
                    };
                  }),
              ).catch(() => {
                failedRegions.add(regionCode);
                return null;
              });
              factorByRegion.set(regionCode, factorRequest);
            }
            factorSnapshot = await factorRequest;
          } else {
            missingHistoricalRegion.add(collection.id);
          }
          const carbon = calculateCarbonEmission(
            { energyKwh: energy.energyKwh },
            factorSnapshot,
          );
          return {
            id: collection.id,
            intervalStart: collection.intervalStart.toISOString(),
            intervalEnd: collection.intervalEnd.toISOString(),
            collectedAt: collection.collectedAt.toISOString(),
            energyKwh: energy.energyKwh?.toString() ?? null,
            carbonGrams: carbon.emissionsGramsCo2e?.toString() ?? null,
            calculationEvidence: {
              energy: {
                modelKey: energy.modelKey,
                modelVersion: energy.modelVersion,
                modelParameters: energy.modelParameters,
                reasons: energy.reasons,
              },
              carbon: {
                factorSnapshot: carbon.factorSnapshot,
                reasons: carbon.reasons,
              },
            },
          };
        }),
      );
      const preview = {
        applicationId,
        ...summarizePersistedEnvironmentalPeriod(from, to, observations),
      };
      const warnings: { code: string; regionCode: string | null }[] = [
        ...failedRegions,
      ]
        .sort()
        .map((regionCode) => ({
          code: "CARBON_FACTOR_UNAVAILABLE",
          regionCode,
        }));
      if (missingHistoricalRegion.size > 0) {
        warnings.push({
          code: "HISTORICAL_REGION_UNAVAILABLE",
          regionCode: null,
        });
      }
      return {
        status: warnings.length > 0 ? "partial" : preview.status,
        original,
        preview,
        warnings,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new ServiceUnavailableException({
        code: "APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE",
      });
    }
  }

  async getByPeriod(
    applicationId: string,
    from: string,
    to: string,
  ): Promise<EnvironmentalAnalysisDto> {
    if (!applicationId.trim()) {
      throw new BadRequestException({ code: 'INVALID_APPLICATION_ID' })
    }
    const start = parseZonedTimestampNanoseconds(from)
    const end = parseZonedTimestampNanoseconds(to)
    if (start === null || end === null || end <= start) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_PERIOD' })
    }

    try {
      const application = await this.applications.findById(applicationId)
      if (!application) {
        throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND' })
      }
      const observations = await this.collections.findEnvironmentalByApplicationAndPeriod(
        applicationId,
        start,
        end,
      )
      return {
        applicationId,
        ...summarizePersistedEnvironmentalPeriod(from, to, observations),
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException({
        code: 'APPLICATION_ANALYSIS_UNAVAILABLE',
      })
    }
  }

  async getSeriesByPeriod(
    applicationId: string,
    from: string,
    to: string,
    granularity: string,
  ): Promise<EnvironmentalAnalysisSeriesDto> {
    if (!applicationId.trim()) {
      throw new BadRequestException({ code: 'INVALID_APPLICATION_ID' })
    }
    const start = parseZonedTimestampNanoseconds(from)
    const end = parseZonedTimestampNanoseconds(to)
    if (start === null || end === null || end <= start) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_PERIOD' })
    }
    if (!['hour', 'day', 'month', 'year'].includes(granularity)) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_GRANULARITY' })
    }
    const selectedGranularity = granularity as EnvironmentalSeriesGranularity
    if (countEnvironmentalSeriesBuckets(from, to, selectedGranularity) > 10_000) {
      throw new BadRequestException({ code: 'ANALYSIS_SERIES_POINT_LIMIT_EXCEEDED' })
    }

    try {
      const application = await this.applications.findById(applicationId)
      if (!application) {
        throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND' })
      }
      const [observations, history, persistedEvents] = await Promise.all([
        this.collections.findEnvironmentalByApplicationAndPeriod(applicationId, start, end),
        this.collections.findEnvironmentalHistoryByCollectedAt(applicationId, start, end),
        this.applicationEvents.findAnalysisEventsByApplicationAndPeriod(applicationId, start, end),
      ])
      return {
        applicationId,
        ...aggregatePersistedEnvironmentalSeries(from, to, selectedGranularity, observations),
        events: buildEnvironmentalAnalysisSeriesEvents(from, to, history, persistedEvents),
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException({ code: 'APPLICATION_ANALYSIS_UNAVAILABLE' })
    }
  }

  async getSeriesContributions(
    applicationId: string,
    from: string,
    to: string,
    granularity: string,
    bucketStart: string,
    pageInput?: string,
    pageSizeInput?: string,
  ): Promise<EnvironmentalAnalysisSeriesContributionsDto> {
    if (!applicationId.trim()) throw new BadRequestException({ code: 'INVALID_APPLICATION_ID' })
    const start = parseZonedTimestampNanoseconds(from)
    const end = parseZonedTimestampNanoseconds(to)
    if (start === null || end === null || end <= start) throw new BadRequestException({ code: 'INVALID_ANALYSIS_PERIOD' })
    if (!['hour', 'day', 'month', 'year'].includes(granularity)) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_GRANULARITY' })
    }
    const selectedGranularity = granularity as EnvironmentalSeriesGranularity
    if (countEnvironmentalSeriesBuckets(from, to, selectedGranularity) > 10_000) {
      throw new BadRequestException({ code: 'ANALYSIS_SERIES_POINT_LIMIT_EXCEEDED' })
    }
    const bucket = getEnvironmentalSeriesBucket(from, to, selectedGranularity, bucketStart)
    if (!bucket) throw new BadRequestException({ code: 'INVALID_ANALYSIS_SERIES_BUCKET' })
    const page = parsePage(pageInput)
    const pageSize = parsePageSize(pageSizeInput)
    if (page === null || pageSize === null || (pageSize === 'all' && page !== 1)) {
      throw new BadRequestException({ code: 'INVALID_ANALYSIS_SERIES_PAGINATION' })
    }

    try {
      const application = await this.applications.findById(applicationId)
      if (!application) throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND' })
      const observations = await this.collections.findEnvironmentalByApplicationAndPeriod(
        applicationId,
        parseZonedTimestampNanoseconds(bucket.period.from)!,
        parseZonedTimestampNanoseconds(bucket.period.to)!,
      )
      const aggregate = aggregatePersistedEnvironmentalSeriesBucket(bucket, observations)
      const totalItems = aggregate.contributions.length
      const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))
      const offset = pageSize === 'all' ? 0 : (page - 1) * pageSize
      const contributions = pageSize === 'all'
        ? aggregate.contributions
        : aggregate.contributions.slice(offset, offset + pageSize)
      return {
        applicationId,
        period: { from: formatUtcTimestamp(start), to: formatUtcTimestamp(end) },
        granularity: selectedGranularity,
        bucket,
        totals: aggregate.totals,
        coverage: aggregate.coverage,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
        },
        contributions,
        exclusions: aggregate.exclusions,
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException({ code: 'APPLICATION_ANALYSIS_UNAVAILABLE' })
    }
  }
}

function resolveRegionAtCollection(
  collectedAt: string,
  currentRegion: string | null,
  history: readonly PersistedApplicationMetadataEvent[],
): string | null {
  const collectionTime = parseZonedTimestampNanoseconds(collectedAt)
  if (collectionTime === null) return null
  let regionCode = currentRegion
  for (const event of [...history].reverse()) {
    const eventTime = parseZonedTimestampNanoseconds(event.occurredAt)
    if (eventTime === null || eventTime <= collectionTime) continue
    const before = event.details?.before
    if (typeof before !== 'object' || before === null) continue
    const location = (before as Record<string, unknown>).location
    if (typeof location !== 'object' || location === null) continue
    const historicalRegion = (location as Record<string, unknown>).regionCode
    regionCode = typeof historicalRegion === 'string' && historicalRegion.length > 0
      ? historicalRegion
      : null
  }
  return regionCode
}

function createConcurrencyLimiter(maximum: number) {
  let active = 0
  const pending: (() => void)[] = []
  return async <T>(operation: () => Promise<T>): Promise<T> => {
    if (active >= maximum) {
      await new Promise<void>((resolve) => pending.push(resolve))
    }
    active++
    try {
      return await operation()
    } finally {
      active--
      pending.shift()?.()
    }
  }
}

function parsePage(value: string | undefined): number | null {
  if (value === undefined) return 1
  if (!/^[1-9]\d*$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : null
}

function parsePageSize(value: string | undefined): number | 'all' | null {
  if (value === undefined) return 10
  if (value === 'all') return value
  if (!['5', '10', '15', '20'].includes(value)) return null
  return Number(value) as 5 | 10 | 15 | 20
}
