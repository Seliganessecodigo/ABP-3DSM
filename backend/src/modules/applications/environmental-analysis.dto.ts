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

  @ApiProperty({ type: String, required: false })
  metric?: string
}

export class EnvironmentalAnalysisMeasureDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Null representa ausência de resultado; zero é um valor disponível.' })
  value!: number | null

  @ApiProperty({ type: String })
  unit!: string

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  reasons!: readonly EnvironmentalAnalysisReasonDto[]
}

export class EnvironmentalAnalysisCoverageDto {
  @ApiProperty({ type: Number, minimum: 0, maximum: 1, description: 'Fração do período com resultado utilizável.' })
  energy!: number

  @ApiProperty({ type: Number, minimum: 0, maximum: 1, description: 'Fração do período com resultado utilizável.' })
  emissions!: number
}

export class EnvironmentalAnalysisMethodologyDto {
  @ApiProperty({ type: String })
  key!: string

  @ApiProperty({ type: String })
  version!: string

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  parameters!: Record<string, number>
}

export class EnvironmentalAnalysisQueryRangeDto {
  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Início do intervalo de consultas feitas pelo GreenER; não representa vigência do fator.' })
  from!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Fim do intervalo de consultas feitas pelo GreenER; não representa vigência do fator.' })
  to!: string | null
}

export class EnvironmentalAnalysisFactorProvenanceDto {
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

  @ApiProperty({ type: String, nullable: true })
  version!: string | null

  @ApiProperty({ type: String, nullable: true })
  source!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Instante original de início da vigência, quando informado no snapshot.' })
  validFrom!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Instante original de fim da vigência, quando informado no snapshot.' })
  validUntil!: string | null

  @ApiProperty({ type: EnvironmentalAnalysisQueryRangeDto })
  queriedAt!: EnvironmentalAnalysisQueryRangeDto
}

export class EnvironmentalAnalysisProvenanceDto {
  @ApiProperty({ type: EnvironmentalAnalysisMethodologyDto, isArray: true })
  methodologies!: readonly EnvironmentalAnalysisMethodologyDto[]

  @ApiProperty({ type: EnvironmentalAnalysisFactorProvenanceDto, isArray: true })
  factors!: readonly EnvironmentalAnalysisFactorProvenanceDto[]

  @ApiProperty({ type: EnvironmentalAnalysisReasonDto, isArray: true })
  reasons!: readonly EnvironmentalAnalysisReasonDto[]
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

  @ApiProperty({ type: EnvironmentalAnalysisProvenanceDto })
  provenance!: EnvironmentalAnalysisProvenanceDto
}
