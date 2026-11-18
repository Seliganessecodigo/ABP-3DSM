import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MonitoringCycleStatus } from '../../database/entities/monitoring-cycle.entity'
import { MonitoringIntegration } from '../../database/entities/monitoring-incident.entity'
import { MonitoringIncidentDto } from './monitoring-incident.dto'
import { AuditSortColumn } from './monitoring-audit.query'

export class MonitoringControlInputDto {
  @ApiProperty({ description: 'true pausa novos ciclos; false retoma o agendamento' })
  paused!: boolean

  @ApiProperty({ maxLength: 512 })
  reason!: string
}

export class MonitoringCycleDto {
  @ApiPropertyOptional({ nullable: true, format: 'uuid', description: 'Versão do controle lida no início; null para ciclos anteriores ao versionamento ou descoberta inicial' }) configurationVersion!: string | null
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ enum: MonitoringCycleStatus }) status!: MonitoringCycleStatus
  @ApiProperty({ format: 'date-time' }) startedAt!: Date
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) finishedAt!: Date | null
  @ApiPropertyOptional({ nullable: true }) durationMs!: number | null
  @ApiPropertyOptional({ nullable: true }) overrunMs!: number | null
  @ApiProperty() discoveredCount!: number
  @ApiProperty() processedCount!: number
  @ApiProperty() failedCount!: number
  @ApiProperty() persistedCount!: number
}

export class MonitoringCyclePageDto {
  @ApiProperty({ type: [MonitoringCycleDto] }) items!: MonitoringCycleDto[]
  @ApiProperty() total!: number
  @ApiProperty() page!: number
  @ApiProperty() limit!: number
}

export class MonitoringSourceHealthDto {
  @ApiProperty({ enum: MonitoringIntegration }) integration!: MonitoringIntegration
  @ApiProperty({ enum: ['UNKNOWN', 'DEGRADED', 'RECOVERING', 'RECOVERED'] }) status!: string
  @ApiProperty() openIncidentCount!: number
  @ApiProperty() recoveringIncidentCount!: number
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) lastAttemptAt!: Date | null
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) lastSuccessAt!: Date | null
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) lastFailureAt!: Date | null
}

export class MonitoringHealthDto {
  @ApiPropertyOptional({ nullable: true, format: 'uuid', description: 'Versão atual de pausa/retomada; não altera intervalo ou metodologia' }) configurationVersion!: string | null
  @ApiProperty({ enum: ['ACTIVE', 'PAUSED', 'UNAVAILABLE'] }) state!: string
  @ApiPropertyOptional({ nullable: true }) paused!: boolean | null
  @ApiProperty() schedulerRunning!: boolean
  @ApiProperty() intervalSeconds!: number
  @ApiPropertyOptional({ type: MonitoringCycleDto, nullable: true }) latestCycle!: MonitoringCycleDto | null
  @ApiProperty({ type: [MonitoringSourceHealthDto] }) sources!: MonitoringSourceHealthDto[]
  @ApiProperty({ type: [MonitoringIncidentDto] }) recentIncidents!: MonitoringIncidentDto[]
  @ApiProperty() knownApplications!: number
  @ApiProperty() staleApplications!: number
  @ApiProperty() delayedApplications!: number
  @ApiPropertyOptional({ nullable: true, format: 'date-time' }) lastObservationAt!: Date | null
}

export class MonitoringControlResultDto {
  @ApiProperty() paused!: boolean
  @ApiProperty() changed!: boolean
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date
  @ApiProperty({ format: 'uuid', description: 'Revisão imutável; repetir o estado atual mantém a mesma revisão' }) configurationVersion!: string
}

export class MonitoringAuditQueryDto {
  @ApiPropertyOptional() search?: string
  @ApiPropertyOptional({ description: 'Trecho do identificador do evento' }) id?: string
  @ApiPropertyOptional() actor?: string
  @ApiPropertyOptional() actorLabel?: string
  @ApiPropertyOptional({ enum: ['user'] }) actorType?: 'user'
  @ApiPropertyOptional() action?: string
  @ApiPropertyOptional() entityType?: string
  @ApiPropertyOptional() entityId?: string
  @ApiPropertyOptional() reason?: string
  @ApiPropertyOptional({ description: 'Trecho do snapshot antes da ação' }) before?: string
  @ApiPropertyOptional({ description: 'Trecho do snapshot depois da ação' }) after?: string
  @ApiPropertyOptional({ enum: ['success', 'denied', 'failed'] }) outcome?: 'success' | 'denied' | 'failed'
  @ApiPropertyOptional({ format: 'date-time' }) createdAtFrom?: string
  @ApiPropertyOptional({ format: 'date-time' }) createdAtTo?: string
  @ApiPropertyOptional({ enum: ['id', 'actor', 'actorType', 'actorLabel', 'createdAt', 'action', 'entityType', 'entityId', 'reason', 'outcome'] as AuditSortColumn[] }) sortBy?: AuditSortColumn
  @ApiPropertyOptional({ enum: ['asc', 'desc'] }) sortDirection?: 'asc' | 'desc'
  @ApiPropertyOptional({ default: '1' }) page?: string
  @ApiPropertyOptional({ enum: ['5', '10', '15', '20', 'all'], default: '10' }) pageSize?: string
}

export class MonitoringAuditItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() actor!: string
  @ApiProperty({ enum: ['user'] }) actorType!: 'user'
  @ApiPropertyOptional({ nullable: true }) actorLabel!: string | null
  @ApiProperty() action!: string
  @ApiProperty() entityType!: string
  @ApiProperty() entityId!: string
  @ApiPropertyOptional({ nullable: true, type: Object }) before!: Record<string, unknown> | null
  @ApiPropertyOptional({ nullable: true, type: Object }) after!: Record<string, unknown> | null
  @ApiPropertyOptional({ nullable: true }) reason!: string | null
  @ApiProperty({ enum: ['success', 'denied', 'failed'] }) outcome!: string
  @ApiProperty({ format: 'date-time' }) createdAt!: Date
}

export class MonitoringAuditPaginationDto {
  @ApiProperty() page!: number
  @ApiProperty({ oneOf: [{ type: 'integer', enum: [5, 10, 15, 20] }, { type: 'string', enum: ['all'] }] }) pageSize!: 5 | 10 | 15 | 20 | 'all'
  @ApiProperty() totalItems!: number
  @ApiProperty() totalPages!: number
  @ApiProperty() hasNextPage!: boolean
}

export class MonitoringAuditPageDto {
  @ApiProperty({ type: [MonitoringAuditItemDto] }) items!: MonitoringAuditItemDto[]
  @ApiProperty({ type: MonitoringAuditPaginationDto }) pagination!: MonitoringAuditPaginationDto
}
