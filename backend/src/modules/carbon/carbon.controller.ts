import { Controller, Get, Param } from '@nestjs/common'
import {
  ApiBadGatewayResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CarbonIntensityDto, CarbonRegionsDto } from './carbon.dto'
import { CarbonService } from './carbon.service'

@ApiTags('carbon-intensity')
@Controller('carbon/regions')
export class CarbonController {
  constructor(private readonly carbon: CarbonService) {}

  @Get()
  @ApiOperation({ summary: 'Listar regiões e fatores de carbono atuais' })
  @ApiOkResponse({ type: CarbonRegionsDto })
  @ApiBadGatewayResponse({ description: 'Resposta inválida da origem' })
  @ApiServiceUnavailableResponse({ description: 'Origem indisponível' })
  listRegions() {
    return this.carbon.listRegions()
  }

  @Get(':code/intensity')
  @ApiOperation({ summary: 'Consultar fator de carbono atual por região' })
  @ApiParam({ name: 'code', schema: { type: 'string', minLength: 1 } })
  @ApiOkResponse({ type: CarbonIntensityDto })
  @ApiNotFoundResponse({ description: 'Região não encontrada' })
  @ApiBadGatewayResponse({ description: 'Resposta inválida da origem' })
  @ApiServiceUnavailableResponse({ description: 'Origem indisponível' })
  getIntensity(@Param('code') code: string) {
    return this.carbon.getIntensity(code)
  }
}
