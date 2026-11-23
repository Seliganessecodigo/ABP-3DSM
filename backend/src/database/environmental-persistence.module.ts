import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEventEntity } from './entities/application-event.entity'
import { CollectionEntity } from './entities/collection.entity'
import { ApplicationEventsRepository } from './repositories/application-events.repository'
import { CollectionsRepository } from './repositories/collections.repository'

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEventEntity, CollectionEntity])],
  providers: [ApplicationEventsRepository, CollectionsRepository],
  exports: [ApplicationEventsRepository, CollectionsRepository],
})
export class EnvironmentalPersistenceModule {}
