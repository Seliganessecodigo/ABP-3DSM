import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnvironmentalPersistenceModule } from "./environmental-persistence.module";
import { MonitoringCycleEntity } from "./entities/monitoring-cycle.entity";
import { CarbonRegionEntity } from "./entities/carbon-region.entity";
import { CalculationConfigEntity } from "./entities/calculation-config.entity";
import { RecalculationEntity } from "./entities/recalculation.entity";
import { MonitoringIncidentEntity } from "./entities/monitoring-incident.entity";
import { MonitoringCyclesRepository } from "./repositories/monitoring-cycles.repository";
import { CarbonRegionsRepository } from "./repositories/carbon-regions.repository";
import { CalculationConfigsRepository } from "./repositories/calculation-configs.repository";
import { RecalculationsRepository } from "./repositories/recalculations.repository";
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
    EnvironmentalPersistenceModule,
    TypeOrmModule.forFeature([
      MonitoringCycleEntity,
      CarbonRegionEntity,
      CalculationConfigEntity,
      RecalculationEntity,
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
    MonitoringCyclesRepository,
    CarbonRegionsRepository,
    CalculationConfigsRepository,
    RecalculationsRepository,
    MonitoringIncidentsRepository,
  ],
  exports: [
    TypeOrmModule,
    EnvironmentalPersistenceModule,
    MonitoringCyclesRepository,
    CarbonRegionsRepository,
    CalculationConfigsRepository,
    RecalculationsRepository,
    MonitoringIncidentsRepository,
  ],
})
export class DatabaseModule {}
