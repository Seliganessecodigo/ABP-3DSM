import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureOpenApi } from './openapi'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' })
  configureOpenApi(app)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}

void bootstrap()
