import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEventEntity } from './entities/application-event.entity'
import { CollectionEntity } from './entities/collection.entity'
import { MonitoringCycleEntity } from './entities/monitoring-cycle.entity'
import { CarbonRegionEntity } from './entities/carbon-region.entity'
import { CalculationConfigEntity } from './entities/calculation-config.entity'
import { RecalculationEntity } from './entities/recalculation.entity'
import { AuditLogEntity } from './entities/audit-log.entity'
import { ApplicationEventsRepository } from './repositories/application-events.repository'
import { CollectionsRepository } from './repositories/collections.repository'
import { MonitoringCyclesRepository } from './repositories/monitoring-cycles.repository'
import { CarbonRegionsRepository } from './repositories/carbon-regions.repository'
import { CalculationConfigsRepository } from './repositories/calculation-configs.repository'
import { RecalculationsRepository } from './repositories/recalculations.repository'
import { AuditLogsRepository } from './repositories/audit-logs.repository'
import { typeOrmOptions } from './typeorm.options'

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
  ],
})
export class DatabaseModule {}
