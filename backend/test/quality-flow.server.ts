import * as process from 'node:process'
import { createQualityFixture } from './quality-fixture'
import { createServer } from 'node:http'
import { AuthenticationService } from '../src/modules/authentication/authentication.service'
import { PasswordHasher } from '../src/modules/authentication/password-hasher.service'
import { OrganizationEntity } from '../src/database/entities/organization.entity'
import { UserEntity, UserRole } from '../src/database/entities/user.entity'

async function main() {
  process.env.AUTH_PASSWORD_PEPPER = 'quality-onboarding-test-only-pepper-32-bytes'
  process.env.AUTH_TOTP_ENCRYPTION_KEY_VERSION = 'quality-test'
  process.env.AUTH_TOTP_ENCRYPTION_KEYS = JSON.stringify({ 'quality-test': Buffer.alloc(32, 7).toString('base64') })
  const fixture = await createQualityFixture(4301, true)
  const organization = await fixture.database.getRepository(OrganizationEntity).save({ name: 'Preferences fixture', slug: 'preferences-fixture' })
  await fixture.database.getRepository(UserEntity).save({ organizationId: organization.id, name: 'Analista de teste', email: 'preferences@example.test', role: UserRole.ANALYST, emailVerifiedAt: new Date(), passwordHash: await fixture.app.get(PasswordHasher).hash('Fixture-preferences-2026') })
  // Only this isolated test process exposes its in-memory mailbox on loopback.
  const mailbox = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(fixture.emails))
  })
  await new Promise<void>((resolve) => mailbox.listen(4302, '127.0.0.1', resolve))
  await fixture.app.get(AuthenticationService).createOrganizationInvitation({
    name: 'Onboarding fixture', slug: 'onboarding-fixture', representativeEmail: 'representative@example.test',
  })
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => { mailbox.close(); void fixture.close().then(() => process.exit(0)) })
  }
  process.stdout.write(`Quality fixture ready: ${fixture.url}\n`)
}

void main().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exit(1) })
