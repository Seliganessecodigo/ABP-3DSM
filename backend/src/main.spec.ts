import { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { IntegrationError } from './integrations/integration-error'
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

  it('registra quantas aplicações foram encontradas após a sincronização', async () => {
    process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN = 'true'
    const runner = { run: jest.fn().mockResolvedValue(8) }
    const app = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockReturnValue(runner),
    }
    jest
      .spyOn(NestFactory, 'create')
      .mockResolvedValue(app as unknown as INestApplication)
    jest.spyOn(openapi, 'configureOpenApi').mockImplementation()
    const log = jest.spyOn(console, 'log').mockImplementation()

    await bootstrap()
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(log).toHaveBeenCalledWith(
      'Initial catalog synchronization discovered 8 application(s).',
    )
  })

  it('registra um código seguro quando a sincronização falha', async () => {
    process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN = 'true'
    const runner = { run: jest.fn().mockRejectedValue(new Error('private detail')) }
    const app = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockReturnValue(runner),
    }
    jest
      .spyOn(NestFactory, 'create')
      .mockResolvedValue(app as unknown as INestApplication)
    jest.spyOn(openapi, 'configureOpenApi').mockImplementation()
    const error = jest.spyOn(console, 'error').mockImplementation()

    await bootstrap()
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(error).toHaveBeenCalledWith(
      'Initial catalog synchronization failed: UNEXPECTED_ERROR',
    )
    expect(error).not.toHaveBeenCalledWith(expect.stringContaining('private detail'))
  })

  it('preserva o código conhecido de falha da integração', async () => {
    process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN = 'true'
    const runner = {
      run: jest.fn().mockRejectedValue(new IntegrationError('UPSTREAM_UNAVAILABLE')),
    }
    const app = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockReturnValue(runner),
    }
    jest
      .spyOn(NestFactory, 'create')
      .mockResolvedValue(app as unknown as INestApplication)
    jest.spyOn(openapi, 'configureOpenApi').mockImplementation()
    const error = jest.spyOn(console, 'error').mockImplementation()

    await bootstrap()
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(error).toHaveBeenCalledWith(
      'Initial catalog synchronization failed: UPSTREAM_UNAVAILABLE',
    )
  })

  it('não inicia a sincronização em segundo plano quando a configuração está desativada', async () => {
    delete process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN
    const app = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
    }
    jest
      .spyOn(NestFactory, 'create')
      .mockResolvedValue(app as unknown as INestApplication)
    jest.spyOn(openapi, 'configureOpenApi').mockImplementation()

    await bootstrap()

    expect(app.get).not.toHaveBeenCalled()
  })
})
