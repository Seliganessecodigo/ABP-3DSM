import { INestApplicationContext } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { IntegrationError } from '../integrations/integration-error'
import { runCli } from './discover-applications'

describe('comando de descoberta inicial do catálogo', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    process.exitCode = undefined
  })

  it('executa a sincronização e fecha o contexto Nest', async () => {
    const runner = { run: jest.fn().mockResolvedValue(8) }
    const context = {
      get: jest.fn().mockReturnValue(runner),
      close: jest.fn().mockResolvedValue(undefined),
    }
    jest
      .spyOn(NestFactory, 'createApplicationContext')
      .mockResolvedValue(context as unknown as INestApplicationContext)

    await runCli()

    expect(runner.run).toHaveBeenCalledTimes(1)
    expect(context.close).toHaveBeenCalledTimes(1)
  })

  it('sinaliza falha da integração para o shell', async () => {
    const failure = new IntegrationError('UPSTREAM_UNAVAILABLE')
    const runner = { run: jest.fn().mockRejectedValue(failure) }
    const context = {
      get: jest.fn().mockReturnValue(runner),
      close: jest.fn().mockResolvedValue(undefined),
    }
    jest
      .spyOn(NestFactory, 'createApplicationContext')
      .mockResolvedValue(context as unknown as INestApplicationContext)
    const error = jest.spyOn(console, 'error').mockImplementation()

    await runCli()

    expect(context.close).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith(
      'Initial catalog synchronization failed: UPSTREAM_UNAVAILABLE',
    )
    expect(process.exitCode).toBe(1)
  })

  it('sinaliza falha inesperada com código seguro', async () => {
    const runner = { run: jest.fn().mockRejectedValue(new Error('private detail')) }
    const context = {
      get: jest.fn().mockReturnValue(runner),
      close: jest.fn().mockResolvedValue(undefined),
    }
    jest
      .spyOn(NestFactory, 'createApplicationContext')
      .mockResolvedValue(context as unknown as INestApplicationContext)
    const error = jest.spyOn(console, 'error').mockImplementation()

    await runCli()

    expect(error).toHaveBeenCalledWith(
      'Initial catalog synchronization failed: UNEXPECTED_ERROR',
    )
    expect(process.exitCode).toBe(1)
  })
})
