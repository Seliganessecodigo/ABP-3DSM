import { ApiProperty } from '@nestjs/swagger'

export class EnvironmentalAnalysisPeriodDto {
  @ApiProperty({ type: String, format: 'date-time', description: 'Período normalizado para UTC.' })
  from!: string

  @ApiProperty({ type: String, format: 'date-time', description: 'Limite final exclusivo, normalizado para UTC.' })
  to!: string
}

export class EnvironmentalAnalysisReasonDto {
  @ApiProperty({ type: String })
  code!: string

  @ApiProperty({ type: String, nullable: true })
  metric!: string | null
}

export class EnvironmentalAnalysisMeasureDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Null representa ausência de resultado; zero é um valor disponível.' })
  value!: number | null

  @ApiProperty({ type: String })
  unit!: string

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  reasons!: EnvironmentalAnalysisReasonDto[]
}

export class EnvironmentalAnalysisCoverageDto {
  @ApiProperty({ type: Number, minimum: 0, maximum: 1, description: 'Fração do período com resultado utilizável.' })
  energy!: number

  @ApiProperty({ type: Number, minimum: 0, maximum: 1, description: 'Fração do período com resultado utilizável.' })
  emissions!: number
}

export class EnvironmentalAnalysisIntervalDto {
  @ApiProperty({ type: String, format: 'date-time' })
  from!: string

  @ApiProperty({ type: String, format: 'date-time' })
  to!: string
}

export class EnvironmentalAnalysisMethodologyDto {
  @ApiProperty({ type: String })
  key!: string

  @ApiProperty({ type: String })
  version!: string

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  parameters!: Record<string, number>
}

export class EnvironmentalAnalysisFactorSnapshotDto {
  @ApiProperty({ type: String, nullable: true })
  id!: string | null

  @ApiProperty({ type: String, nullable: true })
  version!: string | null

  @ApiProperty({ type: String, nullable: true })
  contractVersion!: string | null

  @ApiProperty({ type: String, nullable: true })
  regionCode!: string | null

  @ApiProperty({ type: String, nullable: true })
  country!: string | null

  @ApiProperty({ type: String, nullable: true })
  region!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: Number, nullable: true })
  intensity!: number | null

  @ApiProperty({ type: String, nullable: true })
  unit!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  queriedAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  source!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  validFrom!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  validUntil!: string | null
}

export class EnvironmentalAnalysisContributionDto {
  @ApiProperty({ format: 'uuid' })
  collectionId!: string

  @ApiProperty({ type: EnvironmentalAnalysisIntervalDto })
  originalInterval!: EnvironmentalAnalysisIntervalDto

  @ApiProperty({ type: EnvironmentalAnalysisIntervalDto })
  countedInterval!: EnvironmentalAnalysisIntervalDto

  @ApiProperty({ type: String, format: 'date-time' })
  collectedAt!: string

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMethodologyDto, nullable: true })
  methodology!: EnvironmentalAnalysisMethodologyDto | null

  @ApiProperty({ type: EnvironmentalAnalysisFactorSnapshotDto, nullable: true })
  factorSnapshot!: EnvironmentalAnalysisFactorSnapshotDto | null
}

export class EnvironmentalAnalysisExclusionDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Null quando não há coleta que cubra o trecho.' })
  collectionId!: string | null

  @ApiProperty({ type: EnvironmentalAnalysisIntervalDto })
  interval!: EnvironmentalAnalysisIntervalDto

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  energyReasons!: EnvironmentalAnalysisReasonDto[]

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  emissionsReasons!: EnvironmentalAnalysisReasonDto[]
}

export class EnvironmentalAnalysisDto {
  @ApiProperty({ enum: ['available', 'empty'] })
  status!: 'available' | 'empty'

  @ApiProperty()
  applicationId!: string

  @ApiProperty({ type: EnvironmentalAnalysisPeriodDto })
  period!: EnvironmentalAnalysisPeriodDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto

  @ApiProperty({ type: EnvironmentalAnalysisCoverageDto })
  coverage!: EnvironmentalAnalysisCoverageDto

  @ApiProperty({ type: EnvironmentalAnalysisContributionDto, isArray: true })
  contributions!: EnvironmentalAnalysisContributionDto[]

  @ApiProperty({ type: EnvironmentalAnalysisExclusionDto, isArray: true })
  exclusions!: EnvironmentalAnalysisExclusionDto[]
}
