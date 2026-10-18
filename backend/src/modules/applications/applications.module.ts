import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationEntity } from "../../database/entities/application.entity";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsRepository } from "./applications.repository";
import { ApplicationsService } from "./applications.service";
import { CollectionEvidenceService } from "./collection-evidence.service";
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
import { MethodologyMetadataService } from "./methodology-metadata.service";

export function createMonitoringScheduler(runner: MonitoringCycleRunner) {
  return new MonitoringScheduler(
    getMonitoringScheduleIntervalSeconds(),
    () => runner.run(),
    (skippedAt) => runner.recordDelayedCycle(skippedAt),
  );
}

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, MonitoringIncidentEntity]),
    IntegrationsModule,
  ],
  controllers: [ApplicationsController, MonitoringIncidentsController],
  providers: [
    ApplicationsRepository,
    ApplicationsService,
    CollectionEvidenceService,
    MethodologyMetadataService,
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
    MonitoringCycleLock,
    {
      provide: MonitoringScheduler,
      useFactory: createMonitoringScheduler,
      inject: [MonitoringCycleRunner],
    },
    {
      provide: "MONITORING_METRICS_CONCURRENCY",
      useFactory: getMonitoringMetricsConcurrency,
    },
  ],
})
export class ApplicationsModule {}
