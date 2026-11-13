import { Module } from '@nestjs/common'
import { AuthenticationModule } from '../authentication/authentication.module'
import { AuditModule } from '../../shared/audit/audit.module'
import { PreferencesController } from './preferences.controller'
import { PreferencesRepository } from './preferences.repository'
import { PreferencesService } from './preferences.service'
import { EnvironmentalAnalysisSummaryModule } from '../applications/environmental-analysis-summary.module'
import { PreferenceAlertsService } from './preference-alerts.service'

@Module({
  imports: [AuthenticationModule, AuditModule, EnvironmentalAnalysisSummaryModule],
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository, PreferenceAlertsService],
})
export class PreferencesModule {}
