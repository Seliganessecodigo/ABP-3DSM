import { ApiProperty } from '@nestjs/swagger'
import { ApplicationState } from '../../database/entities/application-state'

export class ApplicationLocationDto {
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

export class ApplicationDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ type: ApplicationLocationDto, nullable: true })
  location!: ApplicationLocationDto | null

  @ApiProperty({ enum: ApplicationState })
  state!: ApplicationState

  @ApiProperty({ type: String, format: 'date-time' })
  firstSeenAt!: Date

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastCheckedAt!: Date | null

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  removedAt!: Date | null

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date
}
