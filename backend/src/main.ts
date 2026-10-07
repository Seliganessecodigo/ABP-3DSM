import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { IntegrationError } from './integrations/integration-error'
import { InitialCatalogSyncRunner } from './modules/applications/initial-catalog-sync.runner'
import { configureOpenApi } from './openapi'

export async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' })
  configureOpenApi(app)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')

  if (process.env.INITIAL_CATALOG_SYNC_AFTER_LISTEN === 'true') {
    void Promise.resolve()
      .then(() =>
        app
          .get(InitialCatalogSyncRunner, { strict: false })
          .run(),
      )
      .then((count) => {
        console.log(
          `Initial catalog synchronization discovered ${count} application(s).`,
        )
      })
      .catch((error: unknown) => {
        const code =
          error instanceof IntegrationError
            ? error.code
            : 'UNEXPECTED_ERROR'
        console.error(`Initial catalog synchronization failed: ${code}`)
      })
  }
}

if (require.main === module) {
  void bootstrap()
}
