import { BadRequestException, Injectable } from "@nestjs/common";
import {
  MonitoringIncidentEntity,
  MonitoringIntegration,
  MonitoringIncidentSource,
  MonitoringIncidentStatus,
} from "../../database/entities/monitoring-incident.entity";
import {
  MonitoringIncidentFilters,
  MonitoringIncidentsRepository,
} from "../../database/repositories/monitoring-incidents.repository";

export interface IncidentIdentity {
  source: string;
  applicationId: string | null;
  integration: MonitoringIntegration;
}

@Injectable()
export class MonitoringIncidentsService {
  constructor(private readonly incidents: MonitoringIncidentsRepository) {}

  async recordFailure(
    identity: IncidentIdentity,
    reason: string,
    cycleId: string,
    at: Date,
    httpAttempts = 1,
  ): Promise<boolean> {
    try {
      const incident = await this.incidents.findActive(
        identity.source,
        identity.applicationId,
        identity.integration,
      );
      if (!incident) {
        await this.incidents.create({
          ...identity,
          status: MonitoringIncidentStatus.OPEN,
          firstReason: reason,
          latestReason: reason,
          logicalFailureCount: 1,
          httpAttemptCount: httpAttempts,
          recoverySuccessCount: 0,
          openedAt: at,
          firstAttemptAt: at,
          latestAttemptAt: at,
          lastValidResponseAt: null,
          resolvedAt: null,
          lastCycleId: cycleId,
        });
        return true;
      }

      const isNewCycle = incident.lastCycleId !== cycleId;
      incident.latestReason = reason;
      incident.latestAttemptAt = at;
      incident.status = MonitoringIncidentStatus.OPEN;
      incident.recoverySuccessCount = 0;
      incident.lastCycleId = cycleId;
      if (isNewCycle) {
        incident.logicalFailureCount++;
        incident.httpAttemptCount += httpAttempts;
      }
      await this.incidents.save(incident);
      return true;
    } catch {
      this.logPersistenceFailure(identity, cycleId, "record-failure");
      return false;
    }
  }

  async recordSuccess(
    identity: IncidentIdentity,
    cycleId: string,
    at: Date,
  ): Promise<boolean> {
    try {
      const incident = await this.incidents.findActive(
        identity.source,
        identity.applicationId,
        identity.integration,
      );
      if (!incident || incident.lastCycleId === cycleId) return true;

      incident.recoverySuccessCount++;
      incident.lastValidResponseAt = at;
      incident.latestAttemptAt = at;
      incident.lastCycleId = cycleId;
      if (incident.recoverySuccessCount >= 3) {
        incident.status = MonitoringIncidentStatus.RESOLVED;
        incident.resolvedAt = at;
      } else {
        incident.status = MonitoringIncidentStatus.RECOVERING;
      }
      await this.incidents.save(incident);
      return true;
    } catch {
      this.logPersistenceFailure(identity, cycleId, "record-recovery");
      return false;
    }
  }

  async list(filters: MonitoringIncidentFilters) {
    this.validateFilters(filters);
    const result = await this.incidents.list(filters);
    return {
      ...result,
      page: filters.page,
      limit: filters.limit,
      items: result.items.map((incident) => this.toPublicRecord(incident)),
    };
  }

  private toPublicRecord(incident: MonitoringIncidentEntity) {
    return {
      id: incident.id,
      source: incident.source,
      applicationId: incident.applicationId,
      integration: incident.integration,
      status: incident.status,
      firstReason: incident.firstReason,
      latestReason: incident.latestReason,
      firstAttemptAt: incident.firstAttemptAt,
      latestAttemptAt: incident.latestAttemptAt,
      lastValidResponseAt: incident.lastValidResponseAt,
      logicalFailureCount: incident.logicalFailureCount,
      httpAttemptCount: incident.httpAttemptCount,
      openedAt: incident.openedAt,
      resolvedAt: incident.resolvedAt,
      cycleId: incident.lastCycleId,
    };
  }

  private validateFilters(filters: MonitoringIncidentFilters): void {
    if (!Number.isSafeInteger(filters.page) || filters.page < 1)
      throw new BadRequestException("page must be a positive integer");
    if (
      !Number.isSafeInteger(filters.limit) ||
      filters.limit < 1 ||
      filters.limit > 100
    )
      throw new BadRequestException("limit must be between 1 and 100");
    if (!Number.isSafeInteger((filters.page - 1) * filters.limit))
      throw new BadRequestException("page offset is too large");
    if (
      filters.status &&
      !Object.values(MonitoringIncidentStatus).includes(
        filters.status as MonitoringIncidentStatus,
      )
    )
      throw new BadRequestException("status is invalid");
    if (
      filters.integration &&
      !Object.values(MonitoringIntegration).includes(
        filters.integration as MonitoringIntegration,
      )
    )
      throw new BadRequestException("integration is invalid");
    if (
      filters.source &&
      !Object.values(MonitoringIncidentSource).includes(
        filters.source as MonitoringIncidentSource,
      )
    )
      throw new BadRequestException("source is invalid");
  }

  private logPersistenceFailure(
    identity: IncidentIdentity,
    cycleId: string,
    operation: string,
  ): void {
    console.error(
      JSON.stringify({
        event: "monitoring_persistence_failed",
        applicationId: identity.applicationId,
        source: identity.source,
        cycleId,
        operation,
        errorCode: "DATABASE_WRITE_FAILED",
      }),
    );
  }
}
