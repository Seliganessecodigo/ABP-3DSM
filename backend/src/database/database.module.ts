import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationEventEntity } from "./entities/application-event.entity";
import { CollectionEntity } from "./entities/collection.entity";
import { MonitoringCycleEntity } from "./entities/monitoring-cycle.entity";
import { CarbonRegionEntity } from "./entities/carbon-region.entity";
import { CalculationConfigEntity } from "./entities/calculation-config.entity";
import { RecalculationEntity } from "./entities/recalculation.entity";
import { AuditLogEntity } from "./entities/audit-log.entity";
import { MonitoringIncidentEntity } from "./entities/monitoring-incident.entity";
import { ApplicationEventsRepository } from "./repositories/application-events.repository";
import { CollectionsRepository } from "./repositories/collections.repository";
import { MonitoringCyclesRepository } from "./repositories/monitoring-cycles.repository";
import { CarbonRegionsRepository } from "./repositories/carbon-regions.repository";
import { CalculationConfigsRepository } from "./repositories/calculation-configs.repository";
import { RecalculationsRepository } from "./repositories/recalculations.repository";
import { AuditLogsRepository } from "./repositories/audit-logs.repository";
import { MonitoringIncidentsRepository } from "./repositories/monitoring-incidents.repository";
import { typeOrmOptions } from "./typeorm.options";
import { OrganizationEntity } from "./entities/organization.entity";
import { AuthSessionEntity } from "./entities/auth-session.entity";
import { AuthTokenEntity } from "./entities/auth-token.entity";
import { ExternalIdentityEntity } from "./entities/external-identity.entity";
import { SsoHandoffEntity } from "./entities/sso-handoff.entity";
import { SsoInvitationEntity } from "./entities/sso-invitation.entity";
import { SsoTransactionEntity } from "./entities/sso-transaction.entity";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions }),
    TypeOrmModule.forFeature([
      ApplicationEventEntity,
      CollectionEntity,
      MonitoringCycleEntity,
      CarbonRegionEntity,
      CalculationConfigEntity,
      RecalculationEntity,
      AuditLogEntity,
      MonitoringIncidentEntity,
      OrganizationEntity,
      AuthSessionEntity,
      AuthTokenEntity,
      ExternalIdentityEntity,
      SsoHandoffEntity,
      SsoInvitationEntity,
      SsoTransactionEntity,
    ]),
  ],
  providers: [
    ApplicationEventsRepository,
    CollectionsRepository,
    MonitoringCyclesRepository,
    CarbonRegionsRepository,
    CalculationConfigsRepository,
    RecalculationsRepository,
    AuditLogsRepository,
    MonitoringIncidentsRepository,
  ],
  exports: [
    TypeOrmModule,
    ApplicationEventsRepository,
    CollectionsRepository,
    MonitoringCyclesRepository,
    CarbonRegionsRepository,
    CalculationConfigsRepository,
    RecalculationsRepository,
    AuditLogsRepository,
    MonitoringIncidentsRepository,
  ],
})
export class DatabaseModule {}
