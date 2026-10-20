import { ApiProperty } from '@nestjs/swagger'

export class EnvironmentalAnalysisSeriesQueryDto {
  @ApiProperty({ type: String, format: 'date-time', description: 'RFC 3339 com timezone explícito; normalizado para UTC.' })
  from!: string

  @ApiProperty({ type: String, format: 'date-time', description: 'RFC 3339 com timezone explícito; normalizado para UTC.' })
  to!: string

  @ApiProperty({ enum: ['hour', 'day', 'month', 'year'] })
  granularity!: string
}

export class EnvironmentalAnalysisSeriesContributionsQueryDto extends EnvironmentalAnalysisSeriesQueryDto {
  @ApiProperty({ type: String, format: 'date-time' })
  bucketStart!: string

  @ApiProperty({ type: String, required: false, default: '1' })
  page?: string

  @ApiProperty({ enum: ['5', '10', '15', '20', 'all'], required: false, default: '10' })
  pageSize?: string
}
