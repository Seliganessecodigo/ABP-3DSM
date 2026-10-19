import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApplicationsRepository } from './applications.repository'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { ApplicationEventsRepository } from '../../database/repositories/application-events.repository'
import { parseZonedTimestampNanoseconds } from '../calculations/energy-calculation'
import { aggregatePersistedEnvironmentalPeriod, formatUtcTimestamp } from '../calculations/persisted-environmental-period'
import { EnvironmentalAnalysisDto } from './environmental-analysis.dto'
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
  ) {}

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
        ...aggregatePersistedEnvironmentalPeriod(from, to, observations),
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
