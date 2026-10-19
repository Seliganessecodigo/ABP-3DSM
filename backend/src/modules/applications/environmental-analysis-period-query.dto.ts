import { ApiProperty } from '@nestjs/swagger'

export class EnvironmentalAnalysisPeriodQueryDto {
  @ApiProperty({ type: String, format: 'date-time', description: 'RFC 3339 com timezone explícito; normalizado para UTC.' })
  from!: string

  @ApiProperty({ type: String, format: 'date-time', description: 'RFC 3339 com timezone explícito; normalizado para UTC.' })
  to!: string
}
