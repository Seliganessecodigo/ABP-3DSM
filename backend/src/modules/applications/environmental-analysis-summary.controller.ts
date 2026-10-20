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

@ApiTags('analysis')
@Controller('analysis/summary')
export class EnvironmentalAnalysisSummaryController {
  constructor(private readonly summary: EnvironmentalAnalysisSummaryService) {}

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
  @ApiOkResponse({ type: EnvironmentalAnalysisSummaryDto })
  @ApiBadRequestResponse({ description: 'Período ou filtros inválidos' })
  @ApiServiceUnavailableResponse({
    description: 'Resumo ambiental indisponível',
  })
  getSummary(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<EnvironmentalAnalysisSummaryDto> {
    return this.summary.getSummary({
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
