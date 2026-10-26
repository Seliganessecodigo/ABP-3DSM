import { ApiProperty } from '@nestjs/swagger'

export class CarbonRegionDto {
  @ApiProperty()
  code!: string

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

  @ApiProperty({ type: Number, format: 'double' })
  intensity!: number

  @ApiProperty({ example: 'gCO2e/kWh' })
  unit!: 'gCO2e/kWh'

  @ApiProperty({ type: Number, format: 'double' })
  renewableSharePercent!: number
}

export class CarbonRegionsDto {
  @ApiProperty({ type: [CarbonRegionDto] })
  regions!: CarbonRegionDto[]

  @ApiProperty({ type: Number, minimum: 0 })
  total!: number
}

export class CarbonIntensityDto {
  @ApiProperty()
  regionCode!: string

  @ApiProperty()
  country!: string

  @ApiProperty()
  region!: string

  @ApiProperty({ type: String, nullable: true })
  city!: string | null

  @ApiProperty({ type: Number, format: 'double' })
  intensity!: number

  @ApiProperty({ example: 'gCO2e/kWh' })
  unit!: 'gCO2e/kWh'

  @ApiProperty({ type: Number, format: 'double' })
  renewableSharePercent!: number

  @ApiProperty({ type: String, format: 'date-time' })
  queriedAt!: Date
}
