import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { ApplicationEntity } from './entities/application.entity'
import { ApplicationEventEntity } from './entities/application-event.entity'
import { CollectionEntity } from './entities/collection.entity'
import { UserEntity } from './entities/user.entity'

loadEnv({ path: resolve(__dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured to use database migrations')
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [ApplicationEntity, ApplicationEventEntity, CollectionEntity, UserEntity],
  migrations: [resolve(__dirname, 'migrations/**/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
  migrationsRun: false,
})
