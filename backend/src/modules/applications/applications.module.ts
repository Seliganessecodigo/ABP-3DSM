import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";
import { CollectionEvidenceService } from "./collection-evidence.service";
import { EnvironmentalAnalysisController } from "./environmental-analysis.controller";
import { EnvironmentalAnalysisService } from "./environmental-analysis.service";
import { EnvironmentalAnalysisSummaryController } from "./environmental-analysis-summary.controller";
import { EnvironmentalAnalysisSummaryModule } from "./environmental-analysis-summary.module";
import { EnvironmentalAnalysisRankingController } from "./environmental-analysis-ranking.controller";
import { EnvironmentalAnalysisRankingService } from "./environmental-analysis-ranking.service";
import { IntegrationsModule } from "../../integrations/integrations.module";
import { DiscoveryService } from "./discovery.service";
import { RemovalService } from "./removal.service";
import { MetadataSyncService } from "./metadata-sync.service";
import { ReturnService } from "./return.service";
import { InitialCatalogSyncRunner } from "./initial-catalog-sync.runner";
import { StatusClassificationService } from "./status-classification.service";
import { MetricsStatusObservationService } from "./metrics-status-observation.service";
import { MonitoringCycleRunner } from "./monitoring-cycle.runner";
import { MonitoringScheduler } from "./monitoring-scheduler";
import {
  getMonitoringMetricsConcurrency,
  getMonitoringScheduleIntervalSeconds,
} from "../../config/monitoring-schedule.config";
import { MonitoringIncidentEntity } from "../../database/entities/monitoring-incident.entity";
import { MonitoringIncidentsRepository } from "../../database/repositories/monitoring-incidents.repository";
import { MonitoringIncidentsController } from "./monitoring-incidents.controller";
import { MonitoringIncidentsService } from "./monitoring-incidents.service";
import { MonitoringCycleLock } from "./monitoring-cycle.lock";
import { MonitoringSettingsRepository } from "../../database/repositories/monitoring-settings.repository";
import { MonitoringOperationsController } from "./monitoring-operations.controller";
import { MonitoringOperationsService } from "./monitoring-operations.service";
import { AuditModule } from "../../shared/audit/audit.module";

export function createMonitoringScheduler(
  runner: MonitoringCycleRunner,
  settings?: MonitoringSettingsRepository,
) {
  return new MonitoringScheduler(
    getMonitoringScheduleIntervalSeconds(),
    () => runner.run(),
    (skippedAt) => runner.recordDelayedCycle(skippedAt),
    settings ? () => settings.isPaused() : undefined,
  );
}

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, MonitoringIncidentEntity]),
    IntegrationsModule,
    EnvironmentalAnalysisSummaryModule,
    AuditModule,
  ],
  controllers: [
    ApplicationsController,
    EnvironmentalAnalysisController,
    EnvironmentalAnalysisSummaryController,
    EnvironmentalAnalysisRankingController,
    MonitoringIncidentsController,
    MonitoringOperationsController,
  ],
  providers: [
    ApplicationsService,
    CollectionEvidenceService,
    EnvironmentalAnalysisService,
    EnvironmentalAnalysisRankingService,
    DiscoveryService,
    RemovalService,
    MetadataSyncService,
    ReturnService,
    InitialCatalogSyncRunner,
    StatusClassificationService,
    MetricsStatusObservationService,
    MonitoringCycleRunner,
    MonitoringIncidentsRepository,
    MonitoringIncidentsService,
    MonitoringOperationsService,
    MonitoringCycleLock,
    {
      provide: MonitoringScheduler,
      useFactory: createMonitoringScheduler,
      inject: [MonitoringCycleRunner, MonitoringSettingsRepository],
    },
    {
      provide: "MONITORING_METRICS_CONCURRENCY",
      useFactory: getMonitoringMetricsConcurrency,
    },
  ],
})
export class ApplicationsModule {}
