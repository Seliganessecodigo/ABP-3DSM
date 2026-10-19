import { Controller, Get, Param, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { EnvironmentalAnalysisDto } from './environmental-analysis.dto'
import { EnvironmentalAnalysisPeriodQueryDto } from './environmental-analysis-period-query.dto'
import { EnvironmentalAnalysisService } from './environmental-analysis.service'

@ApiTags('applications')
@Controller('applications/:id/analysis')
export class EnvironmentalAnalysisController {
  constructor(private readonly analysis: EnvironmentalAnalysisService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar resultados ambientais persistidos por período' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiQuery({ name: 'from', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: true, type: String, format: 'date-time' })
  @ApiOkResponse({ type: EnvironmentalAnalysisDto })
  @ApiBadRequestResponse({ description: 'ID ou período inválido' })
  @ApiNotFoundResponse({ description: 'Aplicação não encontrada' })
  @ApiServiceUnavailableResponse({ description: 'Análise ambiental indisponível' })
  getByPeriod(
    @Param('id') id: string,
    @Query() query: EnvironmentalAnalysisPeriodQueryDto,
  ): Promise<EnvironmentalAnalysisDto> {
    return this.analysis.getByPeriod(id, query.from, query.to)
  }
}
