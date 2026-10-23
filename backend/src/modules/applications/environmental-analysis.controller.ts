import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBody,
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
import {
  EnvironmentalRecalculationPreviewDto,
  EnvironmentalRecalculationPreviewRequestDto,
} from './environmental-recalculation-preview.dto'
import {
  EnvironmentalAnalysisSeriesContributionsDto,
  EnvironmentalAnalysisSeriesDto,
} from './environmental-analysis-series.dto'
import {
  EnvironmentalAnalysisSeriesContributionsQueryDto,
  EnvironmentalAnalysisSeriesQueryDto,
} from './environmental-analysis-series-query.dto'

@ApiTags('applications')
@Controller('applications/:id/analysis')
export class EnvironmentalAnalysisController {
  constructor(private readonly analysis: EnvironmentalAnalysisService) {}

  @Post('recalculation-preview')
  @HttpCode(200)
  @ApiOperation({ summary: 'Gerar prévia ambiental sem alterar o histórico' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiBody({ type: EnvironmentalRecalculationPreviewRequestDto })
  @ApiOkResponse({ type: EnvironmentalRecalculationPreviewDto })
  @ApiBadRequestResponse({ description: 'ID ou período inválido' })
  @ApiNotFoundResponse({ description: 'Aplicação não encontrada' })
  @ApiServiceUnavailableResponse({ description: 'Prévia ambiental indisponível' })
  previewRecalculation(
    @Param("id") id: string,
    @Body() request: EnvironmentalRecalculationPreviewRequestDto,
  ): Promise<EnvironmentalRecalculationPreviewDto> {
    return this.analysis.previewRecalculation(id, request.from, request.to)
  }

  @Get('series')
  @ApiOperation({ summary: 'Consultar série ambiental persistida por granularidade' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiQuery({ name: 'from', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'granularity', required: true, enum: ['hour', 'day', 'month', 'year'] })
  @ApiOkResponse({ type: EnvironmentalAnalysisSeriesDto })
  @ApiBadRequestResponse({ description: 'ID, período, granularidade ou limite de pontos inválido' })
  @ApiNotFoundResponse({ description: 'Aplicação não encontrada' })
  @ApiServiceUnavailableResponse({ description: 'Série ambiental indisponível' })
  getSeriesByPeriod(
    @Param('id') id: string,
    @Query() query: EnvironmentalAnalysisSeriesQueryDto,
  ): Promise<EnvironmentalAnalysisSeriesDto> {
    return this.analysis.getSeriesByPeriod(id, query.from, query.to, query.granularity)
  }

  @Get('series/contributions')
  @ApiOperation({ summary: 'Consultar contribuições persistidas de um bucket da série ambiental' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiQuery({ name: 'from', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'granularity', required: true, enum: ['hour', 'day', 'month', 'year'] })
  @ApiQuery({ name: 'bucketStart', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: 'pageSize', required: false, enum: ['5', '10', '15', '20', 'all'] })
  @ApiOkResponse({ type: EnvironmentalAnalysisSeriesContributionsDto })
  @ApiBadRequestResponse({ description: 'Contexto, bucket ou paginação inválidos' })
  @ApiNotFoundResponse({ description: 'Aplicação não encontrada' })
  @ApiServiceUnavailableResponse({ description: 'Contribuições ambientais indisponíveis' })
  getSeriesContributions(
    @Param('id') id: string,
    @Query() query: EnvironmentalAnalysisSeriesContributionsQueryDto,
  ): Promise<EnvironmentalAnalysisSeriesContributionsDto> {
    return this.analysis.getSeriesContributions(
      id,
      query.from,
      query.to,
      query.granularity,
      query.bucketStart,
      query.page,
      query.pageSize,
    )
  }

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
