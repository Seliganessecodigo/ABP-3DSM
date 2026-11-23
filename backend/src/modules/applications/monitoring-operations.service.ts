import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository'
import { MonitoringCyclesRepository } from '../../database/repositories/monitoring-cycles.repository'
import { MonitoringIncidentsRepository } from '../../database/repositories/monitoring-incidents.repository'
import { MonitoringSettingsRepository } from '../../database/repositories/monitoring-settings.repository'
import { MonitoringIntegration } from '../../database/entities/monitoring-incident.entity'
import { AuthPrincipal } from '../authentication/authentication.service'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { MonitoringScheduler } from './monitoring-scheduler'
import { ApplicationsRepository } from './applications.repository'
import { MonitoringAuditQuery } from './monitoring-audit.query'

const auditSnapshotFields = ['paused', 'configurationVersion'] as const

@Injectable()
export class MonitoringOperationsService {
  constructor(
    private readonly database: DataSource,
    private readonly settings: MonitoringSettingsRepository,
    private readonly scheduler: MonitoringScheduler,
    private readonly cycles: MonitoringCyclesRepository,
    private readonly incidents: MonitoringIncidentsRepository,
    private readonly auditLogs: AuditLogsRepository,
    private readonly auditWriter: AuditWriter,
    private readonly applications: ApplicationsRepository,
  ) {}

  async health() {
    const [settings, latestCycle, incidents, applications, recentIncidents] = await Promise.all([
      this.settings.get(), this.cycles.latest(), this.incidents.healthByIntegration(), this.applications.monitoringHealth(), this.incidents.recentForHealth(),
    ])
    const sources = Object.values(MonitoringIntegration).map((integration) => {
      const row = incidents.find((item) => item.integration === integration)
      const openCount = Number(row?.openCount ?? 0)
      const recoveringCount = Number(row?.recoveringCount ?? 0)
      return {
        integration,
        status: openCount ? 'DEGRADED' : recoveringCount ? 'RECOVERING' : Number(row?.resolvedCount ?? 0) ? 'RECOVERED' : 'UNKNOWN',
        openIncidentCount: openCount,
        recoveringIncidentCount: recoveringCount,
        lastAttemptAt: row?.lastAttemptAt ?? null,
        lastSuccessAt: row?.lastValidResponseAt ?? null,
        lastFailureAt: row?.lastFailureAt ?? null,
      }
    })
    const schedulerRunning = this.scheduler.isActive
    const paused = settings?.paused ?? null
    return {
      state: paused === null || !schedulerRunning ? 'UNAVAILABLE' : paused ? 'PAUSED' : 'ACTIVE',
      paused,
      configurationVersion: settings?.configurationVersion ?? null,
      schedulerRunning: schedulerRunning && paused === false,
      intervalSeconds: this.scheduler.interval,
      latestCycle: latestCycle ? cycleDto(latestCycle, this.scheduler.interval) : null,
      sources,
      recentIncidents: recentIncidents.map((item) => ({
        id: item.id, source: item.source, applicationId: item.applicationId, integration: item.integration,
        status: item.status, firstReason: item.firstReason, latestReason: item.latestReason,
        firstAttemptAt: item.firstAttemptAt, latestAttemptAt: item.latestAttemptAt,
        lastValidResponseAt: item.lastValidResponseAt, logicalFailureCount: item.logicalFailureCount,
        httpAttemptCount: item.httpAttemptCount, openedAt: item.openedAt, resolvedAt: item.resolvedAt,
        cycleId: item.lastCycleId,
      })),
      knownApplications: applications.knownCount,
      staleApplications: applications.staleCount,
      delayedApplications: applications.delayedCount,
      lastObservationAt: applications.lastObservationAt,
    }
  }

  async listCycles(page: number, limit: number) {
    const result = await this.cycles.list(page, limit)
    return { ...result, items: result.items.map((cycle) => cycleDto(cycle, this.scheduler.interval)) }
  }

  async listAudit(organizationId: string, filters: MonitoringAuditQuery) {
    const result = await this.auditLogs.listChanges(organizationId, filters)
    return {
      ...result,
      items: result.items.map((item) => ({
        id: item.id, actor: item.actor, actorType: 'user' as const, actorLabel: item.actorLabel,
        action: item.action, entityType: item.entityType, entityId: item.entityId,
        before: item.before, after: item.after, reason: item.reason,
        outcome: item.outcome, createdAt: item.createdAt,
      })),
    }
  }

  async setPaused(principal: AuthPrincipal, paused: unknown, reason: unknown) {
    if (typeof paused !== 'boolean' || typeof reason !== 'string' || !reason.trim() || reason.length > 512) {
      throw new BadRequestException({ code: 'INVALID_MONITORING_CONTROL', message: 'Estado e motivo da alteração são obrigatórios' })
    }
    try {
      return await this.database.transaction(async (manager) => {
        const before = await this.settings.getForUpdate(manager)
        if (!before) throw new ServiceUnavailableException({ code: 'MONITORING_SETTINGS_UNAVAILABLE', message: 'Configuração do monitoramento indisponível' })
        if (before.paused === paused) return { paused, changed: false, updatedAt: before.updatedAt, configurationVersion: before.configurationVersion }
        const after = await this.settings.setPaused(paused, { actor: principal.userId, reason: reason.trim() }, manager)
        await this.auditWriter.record({
          actor: { type: 'user', userId: principal.userId },
          action: paused ? 'monitoring.paused' : 'monitoring.resumed',
          entityType: 'monitoring', entityId: 'global', outcome: 'success',
          before: { paused: before.paused, configurationVersion: before.configurationVersion },
          after: { paused: after.paused, configurationVersion: after.configurationVersion },
          allowedSnapshotFields: auditSnapshotFields, reason,
        }, manager)
        return { paused: after.paused, changed: true, updatedAt: after.updatedAt, configurationVersion: after.configurationVersion }
      })
    } catch (error) {
      await this.auditWriter.record({
        actor: { type: 'user', userId: principal.userId },
        action: paused ? 'monitoring.paused' : 'monitoring.resumed',
        entityType: 'monitoring', entityId: 'global', outcome: 'failed', reason,
      })
      throw error
    }
  }

  listAuditFromPrincipal(principal: AuthPrincipal, filters: MonitoringAuditQuery) {
    return this.listAudit(principal.organizationId, filters)
  }
}

function cycleDto(cycle: NonNullable<Awaited<ReturnType<MonitoringCyclesRepository['latest']>>>, intervalSeconds: number) {
  const durationMs = cycle.durationMs === null ? null : Number(cycle.durationMs)
  return {
    id: cycle.id, status: cycle.status, startedAt: cycle.startedAt, finishedAt: cycle.finishedAt,
    configurationVersion: cycle.details?.configurationVersion ?? null,
    durationMs,
    overrunMs: durationMs === null ? null : Math.max(0, durationMs - intervalSeconds * 1000),
    discoveredCount: cycle.discoveredCount, processedCount: cycle.processedCount,
    failedCount: cycle.failedCount, persistedCount: cycle.persistedCount,
  }
}
