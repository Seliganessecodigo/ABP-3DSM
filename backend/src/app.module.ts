import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { ApplicationsModule } from './modules/applications/applications.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { CarbonModule } from './modules/carbon/carbon.module'

@Module({
  imports: [DatabaseModule, ApplicationsModule, IntegrationsModule, CarbonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
