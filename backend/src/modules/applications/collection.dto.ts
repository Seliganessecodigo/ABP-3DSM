import { ApiProperty } from '@nestjs/swagger'
import { ApplicationState } from '../../database/entities/application-state'
import { ApplicationStateReason } from '../../database/entities/application-state-reason'

export class MetricEvidenceDto {
  @ApiProperty({ type: Number, nullable: true })
  value!: number | null

  @ApiProperty({ type: String, nullable: true })
  unit!: string | null

  @ApiProperty({ enum: ['available', 'missing', 'invalid'] })
  status!: 'available' | 'missing' | 'invalid'
}

export class MetricsEvidenceDto {
  @ApiProperty({ type: MetricEvidenceDto })
  cpu!: MetricEvidenceDto

  @ApiProperty({ type: MetricEvidenceDto })
  memory!: MetricEvidenceDto

  @ApiProperty({ type: MetricEvidenceDto })
  disk!: MetricEvidenceDto

  @ApiProperty({ type: MetricEvidenceDto })
  network!: MetricEvidenceDto
}

export class CollectionEvidenceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty()
  applicationId!: string

  @ApiProperty({ type: String, format: 'date-time' })
  intervalStart!: Date

  @ApiProperty({ type: String, format: 'date-time' })
  intervalEnd!: Date

  @ApiProperty({ type: String, format: 'date-time' })
  collectedAt!: Date

  @ApiProperty({
    type: Number,
    description: 'Duração informada pela origem, em segundos.',
  })
  collectionIntervalSeconds!: number | null

  @ApiProperty({ type: Boolean })
  isStale!: boolean

  @ApiProperty({ enum: ApplicationState })
  state!: ApplicationState

  @ApiProperty({ enum: ApplicationStateReason })
  reason!: ApplicationStateReason

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastCheckedAt!: Date | null

  @ApiProperty({ type: MetricsEvidenceDto })
  metrics!: MetricsEvidenceDto
}
