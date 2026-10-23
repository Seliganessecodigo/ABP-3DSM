import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { DataSource } from 'typeorm'
import { ApplicationEntity } from './entities/application.entity'
import { ApplicationEventEntity } from './entities/application-event.entity'
import { CollectionEntity } from './entities/collection.entity'
import { UserEntity } from './entities/user.entity'
import { MonitoringCycleEntity } from './entities/monitoring-cycle.entity'
import { CarbonRegionEntity } from './entities/carbon-region.entity'
import { CalculationConfigEntity } from './entities/calculation-config.entity'
import { RecalculationEntity } from './entities/recalculation.entity'
import { AuditLogEntity } from './entities/audit-log.entity'
import { OrganizationEntity } from './entities/organization.entity'
import { AuthSessionEntity } from './entities/auth-session.entity'
import { AuthTokenEntity } from './entities/auth-token.entity'
import { ExternalIdentityEntity } from './entities/external-identity.entity'
import { SsoHandoffEntity } from './entities/sso-handoff.entity'
import { SsoInvitationEntity } from './entities/sso-invitation.entity'
import { SsoTransactionEntity } from './entities/sso-transaction.entity'

loadEnv({ path: resolve(__dirname, '../../../.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured to use database migrations')
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
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
    OrganizationEntity,
    AuthSessionEntity,
    AuthTokenEntity,
    ExternalIdentityEntity,
    SsoHandoffEntity,
    SsoInvitationEntity,
    SsoTransactionEntity,
  ],
  migrations: [resolve(__dirname, 'migrations/**/!(*.spec).{ts,js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
  migrationsRun: false,
})
