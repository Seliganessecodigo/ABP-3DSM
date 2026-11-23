import { InternalServerErrorException } from '@nestjs/common'
import { PasswordHasher } from './password-hasher.service'

describe('PasswordHasher', () => {
  const originalEnvironment = {
    version: process.env.AUTH_PASSWORD_PEPPER_VERSION,
    keys: process.env.AUTH_PASSWORD_PEPPER_KEYS,
    legacy: process.env.AUTH_PASSWORD_PEPPER,
    jwtSecret: process.env.AUTH_JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  }
  const hasher = new PasswordHasher()

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.AUTH_JWT_SECRET = 'jwt-secret-that-is-different-and-long'
    process.env.AUTH_PASSWORD_PEPPER_VERSION = 'active'
    process.env.AUTH_PASSWORD_PEPPER_KEYS = JSON.stringify({
      active: 'active-pepper-that-is-long-enough-32',
      legacy: 'legacy-pepper-that-is-long-enough-32',
    })
    delete process.env.AUTH_PASSWORD_PEPPER
  })

  afterAll(() => {
    restoreEnvironment('AUTH_PASSWORD_PEPPER_VERSION', originalEnvironment.version)
    restoreEnvironment('AUTH_PASSWORD_PEPPER_KEYS', originalEnvironment.keys)
    restoreEnvironment('AUTH_PASSWORD_PEPPER', originalEnvironment.legacy)
    restoreEnvironment('AUTH_JWT_SECRET', originalEnvironment.jwtSecret)
    restoreEnvironment('NODE_ENV', originalEnvironment.nodeEnv)
  })

  it('hashes and verifies passwords with the active pepper', async () => {
    const encoded = await hasher.hash('correct horse battery staple')

    expect(encoded).toMatch(/^pepper\$active\$/)
    await expect(
      hasher.verify(encoded, 'correct horse battery staple'),
    ).resolves.toBe(true)
    await expect(hasher.verify(encoded, 'wrong password')).resolves.toBe(false)
  })

  it('upgrades a valid hash when its pepper version is no longer active', async () => {
    process.env.AUTH_PASSWORD_PEPPER_VERSION = 'legacy'
    process.env.AUTH_PASSWORD_PEPPER_KEYS = JSON.stringify({
      active: 'active-pepper-that-is-long-enough-32',
      legacy: 'legacy-pepper-that-is-long-enough-32',
    })
    const encoded = await hasher.hash('migrating password')
    process.env.AUTH_PASSWORD_PEPPER_VERSION = 'active'

    await expect(
      hasher.verifyWithUpgrade(encoded, 'migrating password'),
    ).resolves.toMatchObject({
      valid: true,
      upgradedHash: expect.stringMatching(/^pepper\$active\$/),
    })
  })

  it('rejects malformed pepper configuration without exposing its details', async () => {
    process.env.AUTH_PASSWORD_PEPPER_KEYS = '[]'

    await expect(hasher.hash('password')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    )
  })
})

function restoreEnvironment(
  key: string,
  value: string | undefined,
): void {
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}
