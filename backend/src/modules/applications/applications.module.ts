import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsController } from './applications.controller'
import { ApplicationsRepository } from './applications.repository'
import { ApplicationsService } from './applications.service'

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity])],
  controllers: [ApplicationsController],
  providers: [ApplicationsRepository, ApplicationsService],
})
export class ApplicationsModule {}
