import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { ApplicationsModule } from './modules/applications/applications.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { CarbonModule } from './modules/carbon/carbon.module'
import { AuthenticationModule } from './modules/authentication/authentication.module'
import { PreferencesModule } from './modules/preferences/preferences.module'

@Module({
  imports: [DatabaseModule, ApplicationsModule, IntegrationsModule, CarbonModule, AuthenticationModule, PreferencesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
