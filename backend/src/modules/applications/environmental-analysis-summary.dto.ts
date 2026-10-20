import { ApiProperty } from '@nestjs/swagger'
import {
  EnvironmentalAnalysisCoverageDto,
  EnvironmentalAnalysisMeasureDto,
  EnvironmentalAnalysisPeriodDto,
  EnvironmentalAnalysisProvenanceDto,
} from './environmental-analysis.dto'

export class EnvironmentalAnalysisSummaryApplicationDto {
  @ApiProperty()
  applicationId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ enum: ['AVAILABLE', 'UNAVAILABLE', 'NO_METRICS', 'REMOVED'] })
  state!: string

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisCoverageDto })
  coverage!: EnvironmentalAnalysisCoverageDto
}

export class EnvironmentalAnalysisSummaryTotalsDto {
  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto
}

export class EnvironmentalAnalysisSummaryStatesDto {
  @ApiProperty({ type: Number, minimum: 0 })
  AVAILABLE!: number

  @ApiProperty({ type: Number, minimum: 0 })
  UNAVAILABLE!: number

  @ApiProperty({ type: Number, minimum: 0 })
  NO_METRICS!: number

  @ApiProperty({ type: Number, minimum: 0 })
  REMOVED!: number
}

export class EnvironmentalAnalysisSummaryDto {
  @ApiProperty({ enum: ['available', 'empty'] })
  status!: 'available' | 'empty'

  @ApiProperty({ type: EnvironmentalAnalysisPeriodDto })
  period!: EnvironmentalAnalysisPeriodDto

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dataAsOf!: string | null

  @ApiProperty({ type: EnvironmentalAnalysisSummaryTotalsDto })
  totals!: EnvironmentalAnalysisSummaryTotalsDto

  @ApiProperty({ type: EnvironmentalAnalysisCoverageDto })
  coverage!: EnvironmentalAnalysisCoverageDto

  @ApiProperty({ type: EnvironmentalAnalysisSummaryStatesDto })
  states!: EnvironmentalAnalysisSummaryStatesDto

  @ApiProperty({
    type: EnvironmentalAnalysisSummaryApplicationDto,
    isArray: true,
  })
  applications!: readonly EnvironmentalAnalysisSummaryApplicationDto[]

  @ApiProperty({ type: EnvironmentalAnalysisProvenanceDto })
  provenance!: EnvironmentalAnalysisProvenanceDto
}
