import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import {
  EnvironmentalAnalysisCoverageDto as EnvironmentalAnalysisSeriesCoverageDto,
  EnvironmentalAnalysisFactorSnapshotDto,
  EnvironmentalAnalysisMeasureDto,
  EnvironmentalAnalysisMethodologyDto,
  EnvironmentalAnalysisPeriodDto as EnvironmentalAnalysisSeriesPeriodDto,
  EnvironmentalAnalysisReasonDto,
} from './environmental-analysis.dto'

export class EnvironmentalAnalysisSeriesTotalsDto {
  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto
}

export class EnvironmentalAnalysisSeriesStatusSnapshotDto {
  @ApiProperty({ required: false, type: String })
  state?: string

  @ApiProperty({ required: false, type: String, nullable: true })
  reason?: string | null

  @ApiProperty({ required: false, type: Boolean })
  isStale?: boolean

  @ApiProperty({ required: false, type: Boolean })
  isCalculable?: boolean
}

export class EnvironmentalAnalysisSeriesRegionSnapshotDto {
  @ApiProperty({ required: false, type: String, nullable: true })
  regionCode?: string | null

  @ApiProperty({ required: false, type: String, nullable: true })
  country?: string | null

  @ApiProperty({ required: false, type: String, nullable: true })
  region?: string | null

  @ApiProperty({ required: false, type: String, nullable: true })
  city?: string | null

  @ApiProperty({ required: false, type: Number, nullable: true })
  latitude?: number | null

  @ApiProperty({ required: false, type: Number, nullable: true })
  longitude?: number | null
}

export class EnvironmentalAnalysisSeriesFactorVersionDto {
  @ApiProperty({ type: String, nullable: true })
  id!: string | null

  @ApiProperty({ type: String })
  version!: string
}

@ApiExtraModels(
  EnvironmentalAnalysisSeriesStatusSnapshotDto,
  EnvironmentalAnalysisSeriesRegionSnapshotDto,
  EnvironmentalAnalysisMethodologyDto,
  EnvironmentalAnalysisSeriesFactorVersionDto,
)
export class EnvironmentalAnalysisSeriesEventDetailsDto {
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(EnvironmentalAnalysisSeriesStatusSnapshotDto) },
      { $ref: getSchemaPath(EnvironmentalAnalysisSeriesRegionSnapshotDto) },
      { $ref: getSchemaPath(EnvironmentalAnalysisMethodologyDto) },
      { $ref: getSchemaPath(EnvironmentalAnalysisSeriesFactorVersionDto) },
    ],
    nullable: true,
  })
  before!: unknown

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(EnvironmentalAnalysisSeriesStatusSnapshotDto) },
      { $ref: getSchemaPath(EnvironmentalAnalysisSeriesRegionSnapshotDto) },
      { $ref: getSchemaPath(EnvironmentalAnalysisMethodologyDto) },
      { $ref: getSchemaPath(EnvironmentalAnalysisSeriesFactorVersionDto) },
    ],
    nullable: true,
  })
  after!: unknown
}

export class EnvironmentalAnalysisSeriesEventDto {
  @ApiProperty()
  id!: string

  @ApiProperty({ type: String, format: 'date-time' })
  at!: string

  @ApiProperty({ enum: [
    'status_changed', 'removed', 'returned', 'region_changed',
    'methodology_changed', 'factor_version_changed',
  ] })
  type!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesEventDetailsDto })
  details!: EnvironmentalAnalysisSeriesEventDetailsDto
}

export class EnvironmentalAnalysisSeriesPointDto {
  @ApiProperty({ type: String, format: 'date-time' })
  bucketStart!: string

  @ApiProperty({ type: String, format: 'date-time' })
  bucketEnd!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  period!: EnvironmentalAnalysisSeriesPeriodDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesCoverageDto })
  coverage!: EnvironmentalAnalysisSeriesCoverageDto
}

export class EnvironmentalAnalysisSeriesDto {
  @ApiProperty({ enum: ['available', 'empty'] })
  status!: 'available' | 'empty'

  @ApiProperty()
  applicationId!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  period!: EnvironmentalAnalysisSeriesPeriodDto

  @ApiProperty({ enum: ['hour', 'day', 'month', 'year'] })
  granularity!: 'hour' | 'day' | 'month' | 'year'

  @ApiProperty({ type: EnvironmentalAnalysisSeriesTotalsDto })
  totals!: EnvironmentalAnalysisSeriesTotalsDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesCoverageDto })
  coverage!: EnvironmentalAnalysisSeriesCoverageDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPointDto, isArray: true })
  points!: readonly EnvironmentalAnalysisSeriesPointDto[]

  @ApiProperty({ type: EnvironmentalAnalysisSeriesEventDto, isArray: true })
  events!: readonly EnvironmentalAnalysisSeriesEventDto[]
}

export class EnvironmentalAnalysisSeriesBucketDto {
  @ApiProperty({ type: String, format: 'date-time' })
  start!: string

  @ApiProperty({ type: String, format: 'date-time' })
  end!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  period!: EnvironmentalAnalysisSeriesPeriodDto
}

export class EnvironmentalAnalysisSeriesContributionMeasureDto extends EnvironmentalAnalysisMeasureDto {
  @ApiProperty({ type: Number, nullable: true })
  originalValue!: number | null
}

export class EnvironmentalAnalysisSeriesContributionDto {
  @ApiProperty()
  collectionId!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  originalInterval!: EnvironmentalAnalysisSeriesPeriodDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  countedInterval!: EnvironmentalAnalysisSeriesPeriodDto

  @ApiProperty({ type: String, format: 'date-time' })
  collectedAt!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesContributionMeasureDto })
  energy!: EnvironmentalAnalysisSeriesContributionMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesContributionMeasureDto })
  emissions!: EnvironmentalAnalysisSeriesContributionMeasureDto

  @ApiProperty({ type: Number, minimum: 0, maximum: 1 })
  durationRatio!: number

  @ApiProperty({ type: EnvironmentalAnalysisMethodologyDto, nullable: true })
  methodology!: EnvironmentalAnalysisMethodologyDto | null

  @ApiProperty({ type: EnvironmentalAnalysisFactorSnapshotDto, nullable: true })
  factorSnapshot!: EnvironmentalAnalysisFactorSnapshotDto | null
}

export class EnvironmentalAnalysisSeriesExclusionDto {
  @ApiProperty({ type: String, nullable: true })
  collectionId!: string | null

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  interval!: EnvironmentalAnalysisSeriesPeriodDto

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  energyReasons!: readonly EnvironmentalAnalysisReasonDto[]

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  emissionsReasons!: readonly EnvironmentalAnalysisReasonDto[]
}

export class EnvironmentalAnalysisSeriesPaginationDto {
  @ApiProperty({ type: Number, minimum: 1 })
  page!: number

  @ApiProperty({ oneOf: [{ type: 'integer' }, { type: 'string', enum: ['all'] }] })
  pageSize!: number | 'all'

  @ApiProperty({ type: Number, minimum: 0 })
  totalItems!: number

  @ApiProperty({ type: Number, minimum: 1 })
  totalPages!: number

  @ApiProperty({ type: Boolean })
  hasNextPage!: boolean
}

export class EnvironmentalAnalysisSeriesContributionsDto {
  @ApiProperty()
  applicationId!: string

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPeriodDto })
  period!: EnvironmentalAnalysisSeriesPeriodDto

  @ApiProperty({ enum: ['hour', 'day', 'month', 'year'] })
  granularity!: 'hour' | 'day' | 'month' | 'year'

  @ApiProperty({ type: EnvironmentalAnalysisSeriesBucketDto })
  bucket!: EnvironmentalAnalysisSeriesBucketDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesTotalsDto })
  totals!: EnvironmentalAnalysisSeriesTotalsDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesCoverageDto })
  coverage!: EnvironmentalAnalysisSeriesCoverageDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesPaginationDto })
  pagination!: EnvironmentalAnalysisSeriesPaginationDto

  @ApiProperty({ type: EnvironmentalAnalysisSeriesContributionDto, isArray: true })
  contributions!: readonly EnvironmentalAnalysisSeriesContributionDto[]

  @ApiProperty({ type: EnvironmentalAnalysisSeriesExclusionDto, isArray: true })
  exclusions!: readonly EnvironmentalAnalysisSeriesExclusionDto[]
}
