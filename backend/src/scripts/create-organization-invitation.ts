import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { AuthenticationService } from '../modules/authentication/authentication.service'

loadEnv({ path: resolve(__dirname, '../../../.env') })

async function main(): Promise<void> {
  const slug = process.env.ORGANIZATION_SLUG
  const representativeEmail = process.env.ORGANIZATION_REPRESENTATIVE_EMAIL
  const name = process.env.ORGANIZATION_NAME
  if (!slug || !representativeEmail) {
    throw new Error(
      'Defina ORGANIZATION_SLUG e ORGANIZATION_REPRESENTATIVE_EMAIL no ambiente',
    )
  }

  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  try {
    const authentication = application.get(AuthenticationService)
    if (name) {
      await authentication.createOrganizationInvitation({
        name,
        slug,
        representativeEmail,
      })
    } else {
      await authentication.issueAdminInvitation(slug, representativeEmail)
    }
    console.log('Convite enviado por e-mail.')
  } finally {
    await application.close()
  }
}

if (require.main === module) {
  void main().catch(() => {
    console.error(
      'Não foi possível criar ou reenviar o convite da organização.',
    )
    process.exitCode = 1
  })
}
