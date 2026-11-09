import { Controller, Get, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { EnvironmentalAnalysisSummaryDto } from './environmental-analysis-summary.dto'
import { EnvironmentalAnalysisSummaryService } from './environmental-analysis-summary.service'
import { PublicRoute } from '../authentication/public-route.decorator'

@ApiTags('analysis')
@Controller('analysis/summary')
export class EnvironmentalAnalysisSummaryController {
  constructor(private readonly summary: EnvironmentalAnalysisSummaryService) {}

  @PublicRoute()
  @Get()
  @ApiOperation({ summary: 'Consultar resumo ambiental agregado por período' })
  @ApiQuery({ name: 'from', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: true, type: String, format: 'date-time' })
  @ApiQuery({
    name: 'states',
    required: false,
    enum: ['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'],
    isArray: true,
    style: 'form',
    explode: true,
  })
  @ApiQuery({
    name: 'regionCodes',
    required: false,
    type: String,
    isArray: true,
    style: 'form',
    explode: true,
  })
  @ApiQuery({
    name: 'applicationIds',
    required: false,
    type: String,
    isArray: true,
    style: 'form',
    explode: true,
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'month', 'year'],
    description:
      'Inclui série UTC no mesmo escopo; limite de 10.000 intervalos.',
  })
  @ApiOkResponse({ type: EnvironmentalAnalysisSummaryDto })
  @ApiBadRequestResponse({ description: 'Período ou filtros inválidos' })
  @ApiServiceUnavailableResponse({
    description: 'Resumo ambiental indisponível',
  })
  getSummary(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<EnvironmentalAnalysisSummaryDto> {
    return this.summary.getSummary({
      granularity:
        query.granularity === undefined
          ? undefined
          : (scalar(query.granularity) ?? 'invalid'),
      from: scalar(query.from),
      to: scalar(query.to),
      states: query.states,
      regionCodes: query.regionCodes,
      applicationIds: query.applicationIds,
    })
  }
}

function scalar(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}
