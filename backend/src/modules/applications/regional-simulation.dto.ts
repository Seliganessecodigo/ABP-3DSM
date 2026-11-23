import { ApiProperty } from '@nestjs/swagger'

export class RegionalSimulationRequestDto {
  @ApiProperty({ type: String, format: 'date-time', description: 'RFC 3339 com fuso explícito.' })
  from!: string

  @ApiProperty({ type: String, format: 'date-time', description: 'Limite final exclusivo; RFC 3339 com fuso explícito.' })
  to!: string

  @ApiProperty({ type: String, minLength: 1, description: 'Código da região de destino retornado por GET /carbon/regions.' })
  destinationRegionCode!: string
}

export class RegionalSimulationMeasureDto {
  @ApiProperty({ type: Number, nullable: true })
  value!: number | null

  @ApiProperty()
  unit!: string

  @ApiProperty({ type: 'array', items: { type: 'object', properties: { code: { type: 'string' }, metric: { type: 'string' } } } })
  reasons!: readonly { readonly code: string; readonly metric?: string }[]
}

export class RegionalSimulationFactorDto {
  @ApiProperty({ type: String, nullable: true })
  id!: string | null

  @ApiProperty({ type: String, nullable: true })
  version!: string | null

  @ApiProperty()
  regionCode!: string | null

  @ApiProperty()
  country!: string | null

  @ApiProperty()
  region!: string | null

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: Number })
  intensity!: number | null

  @ApiProperty({ example: 'gCO2e/kWh' })
  unit!: string | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Horário da consulta GreenER; não representa vigência.' })
  queriedAt!: string | null
}

export class RegionalSimulationCoverageDto {
  @ApiProperty({ minimum: 0, maximum: 1 })
  energy!: number

  @ApiProperty({ minimum: 0, maximum: 1 })
  reference!: number

  @ApiProperty({ minimum: 0, maximum: 1 })
  destination!: number
}

export class RegionalSimulationDifferenceDto {
  @ApiProperty({ type: RegionalSimulationMeasureDto, description: 'Destino menos referência.' })
  absolute!: RegionalSimulationMeasureDto

  @ApiProperty({ type: RegionalSimulationMeasureDto, description: 'Variação relativa à referência; valor decimal (por exemplo, -0.5 equivale a -50%).' })
  percent!: RegionalSimulationMeasureDto
}

export class RegionalSimulationResultDto {
  @ApiProperty({ enum: ['available', 'partial', 'empty'] })
  status!: 'available' | 'partial' | 'empty'

  @ApiProperty()
  applicationId!: string

  @ApiProperty({ description: 'Código solicitado da região de destino, mesmo quando a consulta do fator falhar.' })
  destinationRegionCode!: string

  @ApiProperty({ type: Object })
  period!: { readonly from: string; readonly to: string }

  @ApiProperty({ type: RegionalSimulationMeasureDto })
  energy!: RegionalSimulationMeasureDto

  @ApiProperty({ type: RegionalSimulationMeasureDto })
  reference!: RegionalSimulationMeasureDto

  @ApiProperty({ type: RegionalSimulationFactorDto, isArray: true })
  referenceFactors!: readonly RegionalSimulationFactorDto[]

  @ApiProperty({ type: RegionalSimulationFactorDto, nullable: true })
  destinationFactor!: RegionalSimulationFactorDto | null

  @ApiProperty({ type: RegionalSimulationMeasureDto })
  destination!: RegionalSimulationMeasureDto

  @ApiProperty({ type: RegionalSimulationCoverageDto })
  coverage!: RegionalSimulationCoverageDto

  @ApiProperty({ type: RegionalSimulationDifferenceDto })
  difference!: RegionalSimulationDifferenceDto
}
