import { ApiProperty } from '@nestjs/swagger'
import type { MethodologyMetadataReasonCode } from './methodology-metadata.service'

export class MethodologySourceDto {
  @ApiProperty({ type: String, nullable: true })
  reference!: string | null

  @ApiProperty({ type: Object, nullable: true })
  officialValidity!: Record<string, unknown> | null

  @ApiProperty({ type: String, format: 'date-time' })
  queriedAt!: string
}

export class MethodologyMetadataDto {
  @ApiProperty()
  key!: string

  @ApiProperty()
  version!: string

  @ApiProperty()
  formula!: string

  @ApiProperty({ type: Object })
  inputs!: Record<string, unknown>

  @ApiProperty({ type: Object })
  output!: Record<string, unknown>

  @ApiProperty({ type: Object })
  parameters!: Record<string, unknown>

  @ApiProperty({ type: [String] })
  assumptions!: string[]

  @ApiProperty({ type: Object })
  validity!: Record<string, unknown>

  @ApiProperty({ type: [String] })
  limitations!: string[]

  @ApiProperty({ type: MethodologySourceDto })
  source!: MethodologySourceDto
}

export class MethodologyConfigurationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  version!: string
}

export class MethodologyIndicatorDto {
  @ApiProperty({ type: Number, nullable: true })
  value!: number | null

  @ApiProperty()
  unit!: string
}

export class MethodologyMetadataResponseDto {
  @ApiProperty({ format: 'uuid' })
  collectionId!: string

  @ApiProperty()
  applicationId!: string

  @ApiProperty({ type: MethodologyIndicatorDto })
  indicator!: MethodologyIndicatorDto

  @ApiProperty({ enum: ['AVAILABLE', 'UNAVAILABLE'] })
  status!: 'AVAILABLE' | 'UNAVAILABLE'

  @ApiProperty({
    enum: [
      'RESULT_NOT_AVAILABLE',
      'METHODOLOGY_NOT_AVAILABLE',
      'MISSING_CONFIGURATION',
      'INCOMPLETE_METADATA',
    ],
    nullable: true,
  })
  reason!: MethodologyMetadataReasonCode | null

  @ApiProperty({ type: MethodologyMetadataDto, nullable: true })
  methodology!: MethodologyMetadataDto | null

  @ApiProperty({ type: MethodologyConfigurationDto, nullable: true })
  configuration!: MethodologyConfigurationDto | null
}
