import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'
import { EnvironmentalPersistenceModule } from '../../database/environmental-persistence.module'
import { ApplicationsRepository } from './applications.repository'
import { EnvironmentalAnalysisSummaryService } from './environmental-analysis-summary.service'
import { EnvironmentalAnalysisComparisonController } from './environmental-analysis-comparison.controller'
import { EnvironmentalAnalysisComparisonService } from './environmental-analysis-comparison.service'

// Read-only aggregation can be consumed without starting discovery or the scheduler.
@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity]), EnvironmentalPersistenceModule],
  controllers: [EnvironmentalAnalysisComparisonController],
  providers: [EnvironmentalAnalysisSummaryService, EnvironmentalAnalysisComparisonService, ApplicationsRepository],
  exports: [EnvironmentalAnalysisSummaryService, EnvironmentalAnalysisComparisonService, ApplicationsRepository],
})
export class EnvironmentalAnalysisSummaryModule {}
