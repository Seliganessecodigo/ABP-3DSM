import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { CarbonIntensityAdapter } from '../../integrations/carbon-intensity.adapter'
import { IntegrationError } from '../../integrations/integration-error'

@Injectable()
export class CarbonService {
  constructor(private readonly adapter: CarbonIntensityAdapter) {}

  async listRegions() {
    try {
      return await this.adapter.fetchRegions()
    } catch (error) {
      throw this.toHttpException(error)
    }
  }

  async getIntensity(regionCode: string) {
    try {
      return await this.adapter.fetchIntensity(regionCode)
    } catch (error) {
      throw this.toHttpException(error, true)
    }
  }

  private toHttpException(error: unknown, regionLookup = false): Error {
    if (error instanceof IntegrationError) {
      if (regionLookup && error.status === 404) {
        return new NotFoundException({
          code: 'REGION_NOT_FOUND',
          message: 'Região não encontrada',
        })
      }
      if (error.code === 'INVALID_UPSTREAM_RESPONSE') {
        return new BadGatewayException({
          code: 'INVALID_UPSTREAM_RESPONSE',
          message: 'A origem retornou dados de região inválidos',
        })
      }
      return new ServiceUnavailableException({
        code: error.code,
        message: 'Serviço de intensidade de carbono indisponível',
      })
    }

    return new ServiceUnavailableException({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'Serviço de intensidade de carbono indisponível',
    })
  }
}
