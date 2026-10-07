import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsController } from './applications.controller'
import { ApplicationsRepository } from './applications.repository'
import { ApplicationsService } from './applications.service'
import { IntegrationsModule } from '../../integrations/integrations.module'
import { DiscoveryService } from './discovery.service'
import { RemovalService } from './removal.service'

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity]), IntegrationsModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsRepository,
    ApplicationsService,
    DiscoveryService,
    RemovalService,
  ],
})
export class ApplicationsModule {}
