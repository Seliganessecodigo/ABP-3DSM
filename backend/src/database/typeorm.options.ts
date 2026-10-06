import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ApplicationEntity } from './entities/application.entity'
import { ApplicationEventEntity } from './entities/application-event.entity'
import { CollectionEntity } from './entities/collection.entity'
import { UserEntity } from './entities/user.entity'
import { MonitoringCycleEntity } from './entities/monitoring-cycle.entity'
import { CarbonRegionEntity } from './entities/carbon-region.entity'
import { CalculationConfigEntity } from './entities/calculation-config.entity'
import { RecalculationEntity } from './entities/recalculation.entity'
import { AuditLogEntity } from './entities/audit-log.entity'

export function typeOrmOptions(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL must be configured before starting the API')
  }

  return {
    type: 'postgres',
    url,
    entities: [
      ApplicationEntity,
      ApplicationEventEntity,
      CollectionEntity,
      UserEntity,
      MonitoringCycleEntity,
      CarbonRegionEntity,
      CalculationConfigEntity,
      RecalculationEntity,
      AuditLogEntity,
    ],
    synchronize: false,
    migrationsRun: false,
    retryAttempts: 10,
    retryDelay: 3000,
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }
}
