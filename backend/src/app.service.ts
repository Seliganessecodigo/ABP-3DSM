import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'GreenER API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }
}
