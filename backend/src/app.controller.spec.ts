import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController
  const healthResponse = {
    service: 'GreenER API',
    status: 'ok',
    timestamp: '2026-10-06T00:00:00.000Z',
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: { getHealth: jest.fn().mockReturnValue(healthResponse) },
        },
      ],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  it('returns the health response from AppService', () => {
    expect(appController.getHealth()).toEqual(healthResponse)
  })
})
