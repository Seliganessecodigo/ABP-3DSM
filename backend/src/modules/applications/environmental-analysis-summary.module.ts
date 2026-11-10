import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { ApplicationsRepository } from './applications.repository'
import { EnvironmentalAnalysisSummaryService } from './environmental-analysis-summary.service'

// Read-only aggregation can be consumed without starting discovery or the scheduler.
@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity])],
  providers: [EnvironmentalAnalysisSummaryService, ApplicationsRepository],
  exports: [EnvironmentalAnalysisSummaryService, ApplicationsRepository],
})
export class EnvironmentalAnalysisSummaryModule {}
