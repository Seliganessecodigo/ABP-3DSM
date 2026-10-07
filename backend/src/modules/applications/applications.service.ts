import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsRepository } from './applications.repository'

function toResponse(application: ApplicationEntity) {
  const { regionCode, country, region, city, latitude, longitude } = application
  const location =
    regionCode !== null &&
    country !== null &&
    region !== null &&
    latitude !== null &&
    longitude !== null
      ? { regionCode, country, region, city, latitude, longitude }
      : null

  return {
    id: application.id,
    name: application.name,
    location,
    state: application.state,
    firstSeenAt: application.firstSeenAt,
    lastCheckedAt: application.lastCheckedAt,
    removedAt: application.removedAt,
    updatedAt: application.updatedAt,
  }
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly applications: ApplicationsRepository) {}

  async list() {
    try {
      const applications = await this.applications.findAll()
      return applications.map(toResponse)
    } catch {
      throw new ServiceUnavailableException({
        code: 'CATALOG_UNAVAILABLE',
        message: 'Catálogo temporariamente indisponível',
      })
    }
  }

  async getById(id: string) {
    let application: ApplicationEntity | null
    try {
      application = await this.applications.findById(id)
    } catch {
      throw new ServiceUnavailableException({
        code: 'CATALOG_UNAVAILABLE',
        message: 'Catálogo temporariamente indisponível',
      })
    }

    if (!application) {
      throw new NotFoundException({
        code: 'APPLICATION_NOT_FOUND',
        message: 'Aplicação não encontrada',
      })
    }

    return toResponse(application)
  }
}
