import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function configureOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder().setTitle('GreenER API').setVersion('1.0.0').build()
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config), {
    jsonDocumentUrl: 'openapi.json',
  })
}
