import { config as loadEnv } from 'dotenv'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from '../app.module'
import { OrganizationEntity } from '../database/entities/organization.entity'
import { UserEntity, UserRole } from '../database/entities/user.entity'
import { PasswordHasher } from '../modules/authentication/password-hasher.service'

loadEnv({ path: resolve(__dirname, '../../../.env') })

const organizationSlug = 'greener-teste'
const testEmail = 'login.teste@greener.test'

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('A conta de teste só pode ser criada com NODE_ENV=development')
  }

  const application = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  })
  try {
    const dataSource = application.get(DataSource)
    const organizations = dataSource.getRepository(OrganizationEntity)
    const users = dataSource.getRepository(UserEntity)
    const passwordHasher = application.get(PasswordHasher)
    const now = new Date()
    let organization = await organizations.findOneBy({ slug: organizationSlug })
    if (!organization) {
      organization = await organizations.save(
        organizations.create({
          name: 'Organização de teste GreenER',
          slug: organizationSlug,
          recoveryRepresentativeEmail: null,
        }),
      )
    }

    let user = await users.findOneBy({ email: testEmail })
    if (user && user.organizationId !== organization.id) {
      throw new Error('O e-mail reservado para teste já pertence a outra organização')
    }
    const password = randomBytes(24).toString('base64url')
    const passwordHash = await passwordHasher.hash(password)
    user = users.create({
      ...(user ? { id: user.id } : {}),
      name: 'Usuário de teste',
      email: testEmail,
      organizationId: organization.id,
      passwordHash,
      emailVerifiedAt: now,
      role: UserRole.VISITOR,
      isActive: true,
    })
    await users.save(user)

    console.log(`Organização: ${organizationSlug}`)
    console.log(`E-mail: ${testEmail}`)
    console.log(`Senha temporária: ${password}`)
    console.log('Papel: VISITOR')
  } finally {
    await application.close()
  }
}

if (require.main === module) {
  void main().catch(() => {
    console.error('Não foi possível criar a conta de teste.')
    process.exitCode = 1
  })
}
