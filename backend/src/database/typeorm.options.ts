import type { TypeOrmModuleOptions } from '@nestjs/typeorm'

export function typeOrmOptions(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL must be configured before starting the API')
  }

  return {
    type: 'postgres',
    url,
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    retryAttempts: 10,
    retryDelay: 3000,
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }
}
