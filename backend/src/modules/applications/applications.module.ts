import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsController } from './applications.controller'
import { ApplicationsRepository } from './applications.repository'
import { ApplicationsService } from './applications.service'
import { IntegrationsModule } from '../../integrations/integrations.module'
import { DiscoveryService } from './discovery.service'
import { RemovalService } from './removal.service'
import { MetadataSyncService } from './metadata-sync.service'
import { ReturnService } from './return.service'
import { InitialCatalogSyncRunner } from './initial-catalog-sync.runner'
import { StatusClassificationService } from './status-classification.service'

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity]), IntegrationsModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsRepository,
    ApplicationsService,
    DiscoveryService,
    RemovalService,
    MetadataSyncService,
    ReturnService,
    InitialCatalogSyncRunner,
    StatusClassificationService,
  ],
})
export class ApplicationsModule {}
