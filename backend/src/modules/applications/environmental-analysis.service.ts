import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApplicationsRepository } from './applications.repository'
import { CollectionsRepository } from '../../database/repositories/collections.repository'
import { parseZonedTimestampNanoseconds } from '../calculations/energy-calculation'
import { aggregatePersistedEnvironmentalPeriod } from '../calculations/persisted-environmental-period'
import { EnvironmentalAnalysisDto } from './environmental-analysis.dto'

@Injectable()
export class EnvironmentalAnalysisService {
  constructor(
    private readonly applications: ApplicationsRepository,
    private readonly collections: CollectionsRepository,
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
}
