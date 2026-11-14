import { ApiProperty } from '@nestjs/swagger'
import { ApplicationState } from '../../database/entities/application-state'
import {
  EnvironmentalAnalysisCoverageDto,
  EnvironmentalAnalysisMeasureDto,
  EnvironmentalAnalysisPeriodDto,
  EnvironmentalAnalysisReasonDto,
} from './environmental-analysis.dto'

export class EnvironmentalComparisonLocationDto {
  @ApiProperty()
  regionCode!: string

  @ApiProperty()
  country!: string

  @ApiProperty()
  region!: string

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: Number, format: 'double' })
  latitude!: number

  @ApiProperty({ type: Number, format: 'double' })
  longitude!: number
}

export class EnvironmentalComparisonLocationSnapshotDto {
  @ApiProperty({ type: String, format: 'date-time' })
  from!: string

  @ApiProperty({ type: String, format: 'date-time' })
  to!: string

  @ApiProperty({ type: EnvironmentalComparisonLocationDto, nullable: true })
  location!: EnvironmentalComparisonLocationDto | null

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  reasons!: readonly EnvironmentalAnalysisReasonDto[]
}

export class EnvironmentalComparisonMetricDto {
  @ApiProperty({ type: Number, nullable: true })
  value!: number | null

  @ApiProperty({ type: String, nullable: true })
  unit!: string | null

  @ApiProperty({ enum: ['available', 'missing', 'invalid'] })
  status!: 'available' | 'missing' | 'invalid'

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  collectedAt!: string | null

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  reasons!: readonly EnvironmentalAnalysisReasonDto[]
}

export class EnvironmentalComparisonMetricsDto {
  @ApiProperty({ type: EnvironmentalComparisonMetricDto })
  cpu!: EnvironmentalComparisonMetricDto

  @ApiProperty({ type: EnvironmentalComparisonMetricDto })
  memory!: EnvironmentalComparisonMetricDto

  @ApiProperty({ type: EnvironmentalComparisonMetricDto })
  disk!: EnvironmentalComparisonMetricDto

  @ApiProperty({ type: EnvironmentalComparisonMetricDto })
  network!: EnvironmentalComparisonMetricDto
}

export class EnvironmentalComparisonDifferenceDto {
  @ApiProperty({ type: Number, nullable: true })
  absolute!: number | null

  @ApiProperty({ type: String, nullable: true })
  unit!: string | null

  @ApiProperty({ type: Number, nullable: true })
  percentage!: number | null

  @ApiProperty({ type: String, nullable: true })
  reason!: string | null
}

export class EnvironmentalComparisonMetricDifferencesDto {
  @ApiProperty({ type: EnvironmentalComparisonDifferenceDto })
  cpu!: EnvironmentalComparisonDifferenceDto

  @ApiProperty({ type: EnvironmentalComparisonDifferenceDto })
  memory!: EnvironmentalComparisonDifferenceDto

  @ApiProperty({ type: EnvironmentalComparisonDifferenceDto })
  disk!: EnvironmentalComparisonDifferenceDto

  @ApiProperty({ type: EnvironmentalComparisonDifferenceDto })
  network!: EnvironmentalComparisonDifferenceDto
}

export class EnvironmentalComparisonCoverageDifferencesDto {
  @ApiProperty({ type: Number, nullable: true })
  energyPercentagePoints!: number | null

  @ApiProperty({ type: Number, nullable: true })
  emissionsPercentagePoints!: number | null
}

export class EnvironmentalComparisonDifferencesDto {
  @ApiProperty({ type: EnvironmentalComparisonDifferenceDto })
  energy!: EnvironmentalComparisonDifferenceDto

  @ApiProperty({ type: EnvironmentalComparisonDifferenceDto })
  emissions!: EnvironmentalComparisonDifferenceDto

  @ApiProperty({ type: EnvironmentalComparisonMetricDifferencesDto })
  metrics!: EnvironmentalComparisonMetricDifferencesDto

  @ApiProperty({ type: EnvironmentalComparisonCoverageDifferencesDto })
  coverage!: EnvironmentalComparisonCoverageDifferencesDto
}

export class EnvironmentalAnalysisComparisonApplicationDto {
  @ApiProperty()
  applicationId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ enum: ApplicationState })
  state!: ApplicationState

  @ApiProperty({
    type: EnvironmentalComparisonLocationSnapshotDto,
    isArray: true,
  })
  locations!: readonly EnvironmentalComparisonLocationSnapshotDto[]

  @ApiProperty({ type: EnvironmentalComparisonMetricsDto })
  metrics!: EnvironmentalComparisonMetricsDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisCoverageDto })
  coverage!: EnvironmentalAnalysisCoverageDto

  @ApiProperty({ type: EnvironmentalComparisonDifferencesDto })
  differences!: EnvironmentalComparisonDifferencesDto
}

export class EnvironmentalAnalysisComparisonDto {
  @ApiProperty({ enum: ['empty', 'partial', 'complete'] })
  status!: 'empty' | 'partial' | 'complete'

  @ApiProperty({ type: EnvironmentalAnalysisPeriodDto })
  period!: EnvironmentalAnalysisPeriodDto

  @ApiProperty()
  referenceApplicationId!: string

  @ApiProperty({
    type: EnvironmentalAnalysisComparisonApplicationDto,
    isArray: true,
  })
  applications!: readonly EnvironmentalAnalysisComparisonApplicationDto[]
}
