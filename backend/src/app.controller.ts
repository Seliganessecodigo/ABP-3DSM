import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { PublicRoute } from './modules/authentication/public-route.decorator'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @PublicRoute()
  @Get('health')
  getHealth() {
    return this.appService.getHealth()
  }
}
