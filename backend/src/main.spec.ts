import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as openapi from './openapi'
import { bootstrap } from './main'

describe('inicialização da API', () => {
  const previousSyncSetting = process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN

  afterEach(() => {
    jest.restoreAllMocks()
    if (previousSyncSetting === undefined) {
      delete process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN
    } else {
      process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN = previousSyncSetting
    }
  })

  it('começa a escutar antes de iniciar a sincronização não bloqueante', async () => {
    process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN = 'true'
    const events: string[] = []
    const pendingSync = new Promise<number>(() => undefined)
    const runner = {
      run: jest.fn(() => {
        events.push('sync')
        return pendingSync
      }),
    }
    const app = {
      enableCors: jest.fn(),
      listen: jest.fn(async () => {
        events.push('listen')
      }),
      get: jest.fn().mockReturnValue(runner),
    }
    jest
      .spyOn(NestFactory, 'create')
      .mockResolvedValue(app as unknown as INestApplication)
    jest.spyOn(openapi, 'configureOpenApi').mockImplementation()

    await expect(bootstrap()).resolves.toBeUndefined()
    await Promise.resolve()

    expect(events).toEqual(['listen', 'sync'])
    expect(runner.run).toHaveBeenCalledWith()
  })
})
