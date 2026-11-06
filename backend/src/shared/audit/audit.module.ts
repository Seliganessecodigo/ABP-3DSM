import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLogEntity } from '../../database/entities/audit-log.entity'
import { UserEntity } from '../../database/entities/user.entity'
import { AuditLogsRepository } from '../../database/repositories/audit-logs.repository'
import { AuditWriter } from './audit-writer'

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, UserEntity])],
  providers: [AuditLogsRepository, AuditWriter],
  exports: [AuditWriter],
})
export class AuditModule {}
