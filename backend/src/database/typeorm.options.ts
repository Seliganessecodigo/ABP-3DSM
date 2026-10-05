import type { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ApplicationEntity } from './entities/application.entity'
import { ApplicationEventEntity } from './entities/application-event.entity'
import { CollectionEntity } from './entities/collection.entity'
import { UserEntity } from './entities/user.entity'

export function typeOrmOptions(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL must be configured before starting the API')
  }

  return {
    type: 'postgres',
    url,
    entities: [ApplicationEntity, ApplicationEventEntity, CollectionEntity, UserEntity],
    synchronize: false,
    migrationsRun: false,
    retryAttempts: 10,
    retryDelay: 3000,
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }
}
