import { Controller, Get, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { PublicRoute } from '../authentication/public-route.decorator'
import { EnvironmentalAnalysisComparisonDto } from './environmental-analysis-comparison.dto'
import { EnvironmentalAnalysisComparisonService } from './environmental-analysis-comparison.service'

@ApiTags('analysis')
@Controller('analysis/comparison')
export class EnvironmentalAnalysisComparisonController {
  constructor(
    private readonly comparison: EnvironmentalAnalysisComparisonService,
  ) {}

  @PublicRoute()
  @Get()
  @ApiOperation({ summary: 'Comparar aplicações no mesmo período' })
  @ApiQuery({ name: 'from', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: true, type: String, format: 'date-time' })
  @ApiQuery({
    name: 'applicationIds',
    required: true,
    type: String,
    isArray: true,
    style: 'form',
    explode: true,
    minItems: 2,
    maxItems: 5,
  })
  @ApiQuery({
    name: 'referenceApplicationId',
    required: true,
    type: String,
  })
  @ApiOkResponse({ type: EnvironmentalAnalysisComparisonDto })
  @ApiBadRequestResponse({ description: 'Seleção ou período inválido' })
  @ApiNotFoundResponse({ description: 'Aplicação não encontrada' })
  @ApiServiceUnavailableResponse({ description: 'Comparação indisponível' })
  getComparison(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<EnvironmentalAnalysisComparisonDto> {
    return this.comparison.compare({
      from: scalar(query.from),
      to: scalar(query.to),
      applicationIds: query.applicationIds,
      referenceApplicationId: scalar(query.referenceApplicationId),
    })
  }
}

function scalar(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}
