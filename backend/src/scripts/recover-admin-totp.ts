import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { TotpAuthenticationService } from '../modules/authentication/totp-authentication.service'

loadEnv({ path: resolve(__dirname, '../../../.env') })

async function main(): Promise<void> {
  const organizationSlug = process.env.ORGANIZATION_SLUG
  const adminEmail = process.env.ADMIN_EMAIL
  const representativeEmail = process.env.NEW_RECOVERY_REPRESENTATIVE_EMAIL
  const operatorId = process.env.SUPPORT_OPERATOR_ID
  const reason = process.env.SUPPORT_RECOVERY_REASON
  if (!organizationSlug || !adminEmail || !representativeEmail || !operatorId || !reason) {
    throw new Error('Os dados da recuperação de TOTP não foram informados')
  }

  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  try {
    await application.get(TotpAuthenticationService).recoverAdminTotp({
      organizationSlug,
      adminEmail,
      representativeEmail,
      operatorId,
      reason,
    })
    console.log('Recuperação concluída; sessões foram revogadas e a operação foi auditada.')
  } finally {
    await application.close()
  }
}

if (require.main === module) {
  void main().catch(() => {
    console.error('Não foi possível concluir a recuperação de TOTP.')
    process.exitCode = 1
  })
}
