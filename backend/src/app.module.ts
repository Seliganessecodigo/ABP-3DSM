import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './database/database.module'
import { ApplicationsModule } from './modules/applications/applications.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { AuthenticationModule } from './modules/authentication/authentication.module'

@Module({
  imports: [DatabaseModule, ApplicationsModule, IntegrationsModule, AuthenticationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
