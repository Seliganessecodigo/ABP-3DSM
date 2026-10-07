import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { InitialCatalogSyncRunner } from '../modules/applications/initial-catalog-sync.runner'
import { IntegrationError } from '../integrations/integration-error'

export async function main(): Promise<void> {
  const context = await NestFactory.createApplicationContext(AppModule)
  try {
    const count = await context
      .get(InitialCatalogSyncRunner, { strict: false })
      .run()
    console.log(`Initial catalog synchronization discovered ${count} application(s).`)
  } finally {
    await context.close()
  }
}

export async function runCli(): Promise<void> {
  try {
    await main()
  } catch (error) {
    const code =
      error instanceof IntegrationError ? error.code : 'UNEXPECTED_ERROR'
    console.error(`Initial catalog synchronization failed: ${code}`)
    process.exitCode = 1
  }
}
