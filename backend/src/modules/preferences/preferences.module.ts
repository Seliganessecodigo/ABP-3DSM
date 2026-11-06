import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthenticationModule } from '../authentication/authentication.module'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository'
import { AuditWriter } from '../../shared/audit/audit-writer'
import { PreferencesController } from './preferences.controller'
import { PreferencesRepository } from './preferences.repository'
import { PreferencesService } from './preferences.service'

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([AuditLogEntity, UserEntity]),
  ],
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository, AuditLogsRepository, AuditWriter],
})
export class PreferencesModule {}
