import { Module } from '@nestjs/common'
import { IntegrationsModule } from '../../integrations/integrations.module'
import { CarbonController } from './carbon.controller'
import { CarbonService } from './carbon.service'

@Module({
  imports: [IntegrationsModule],
  controllers: [CarbonController],
  providers: [CarbonService],
})
export class CarbonModule {}
