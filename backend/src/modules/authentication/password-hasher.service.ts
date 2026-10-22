import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { createHmac } from 'node:crypto'

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const { version, secret } = currentPepper()
    const encoded = await argon2.hash(this.withPepper(password, secret), {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    })
    return `pepper$${version}$${encoded}`
  }

  async verify(encodedHash: string, password: string): Promise<boolean> {
    return (await this.verifyWithUpgrade(encodedHash, password)).valid
  }

  async verifyWithUpgrade(
    encodedHash: string,
    password: string,
  ): Promise<{ valid: boolean; upgradedHash?: string }> {
    const activePepper = currentPepper()
    const configured = pepperKeys()
    const versioned = /^pepper\$([^$]+)\$(.+)$/.exec(encodedHash)
    const storedVersion = versioned?.[1] ?? 'legacy'
    const underlyingHash = versioned?.[2] ?? encodedHash
    const secret = configured[storedVersion]
    if (!secret) return { valid: false }
    try {
      const valid = await argon2.verify(
        underlyingHash,
        this.withPepper(password, secret),
      )
      if (!valid) return { valid: false }
      if (storedVersion === activePepper.version) return { valid: true }
      return { valid: true, upgradedHash: await this.hash(password) }
    } catch {
      return { valid: false }
    }
  }

  private withPepper(password: string, pepper: string): Buffer {
    return createHmac('sha256', pepper).update(password, 'utf8').digest()
  }
}

function currentPepper(): { version: string; secret: string } {
  const version = process.env.AUTH_PASSWORD_PEPPER_VERSION ?? 'legacy'
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(version)) {
    throw new InternalServerErrorException({
      code: 'PASSWORD_PEPPER_NOT_CONFIGURED',
      message: 'O serviço de autenticação não está configurado',
    })
  }
  const secret = pepperKeys()[version]
  if (!secret) {
    throw new InternalServerErrorException({
      code: 'PASSWORD_PEPPER_NOT_CONFIGURED',
      message: 'O serviço de autenticação não está configurado',
    })
  }
  return { version, secret }
}

function pepperKeys(): Record<string, string> {
  const json = process.env.AUTH_PASSWORD_PEPPER_KEYS
  const legacyPepper = process.env.AUTH_PASSWORD_PEPPER
  let configured: Record<string, string>
  if (json) {
    try {
      const parsed = JSON.parse(json) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid pepper keys')
      }
      configured = parsed as Record<string, string>
    } catch {
      throw new InternalServerErrorException({
        code: 'PASSWORD_PEPPER_NOT_CONFIGURED',
        message: 'O serviço de autenticação não está configurado',
      })
    }
  } else {
    configured = legacyPepper ? { legacy: legacyPepper } : {}
  }
  for (const value of Object.values(configured)) {
    if (
      typeof value !== 'string' ||
      Buffer.byteLength(value) < 32 ||
      (process.env.NODE_ENV === 'production' &&
        value.startsWith('local_only')) ||
      value === process.env.AUTH_JWT_SECRET
    ) {
      throw new InternalServerErrorException({
        code: 'PASSWORD_PEPPER_NOT_CONFIGURED',
        message: 'O serviço de autenticação não está configurado',
      })
    }
  }
  return configured
}
