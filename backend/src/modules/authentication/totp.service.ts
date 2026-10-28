import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP_SECONDS = 30

@Injectable()
export class TotpService {
  newSecret(): string {
    return encodeBase32(randomBytes(20))
  }

  generate(secret: string, epochMilliseconds: number): string {
    const counter = BigInt(Math.floor(epochMilliseconds / 1000 / STEP_SECONDS))
    const message = Buffer.alloc(8)
    message.writeBigUInt64BE(counter)
    const digest = createHmac('sha1', decodeBase32(secret))
      .update(message)
      .digest()
    const offset = digest[digest.length - 1] & 0x0f
    const binary =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)
    return String(binary % 1_000_000).padStart(6, '0')
  }

  verify(
    secret: string,
    code: string,
    epochMilliseconds: number,
  ): { valid: boolean; timeStep: number | null } {
    if (!/^\d{6}$/.test(code)) return { valid: false, timeStep: null }
    const current = Math.floor(epochMilliseconds / 1000 / STEP_SECONDS)
    for (const step of [current, current - 1, current + 1]) {
      const expected = this.generate(secret, step * STEP_SECONDS * 1000)
      const expectedBytes = Buffer.from(expected)
      const receivedBytes = Buffer.from(code)
      if (timingSafeEqual(expectedBytes, receivedBytes)) {
        return { valid: true, timeStep: step }
      }
    }
    return { valid: false, timeStep: null }
  }

  provisioningUri(secret: string, email: string): string {
    const label = encodeURIComponent(`GreenER:${email}`)
    const query = new URLSearchParams({
      secret,
      issuer: 'GreenER',
      algorithm: 'SHA1',
      digits: '6',
      period: String(STEP_SECONDS),
    })
    return `otpauth://totp/${label}?${query.toString()}`
  }

  encrypt(secret: string): { ciphertext: string; keyVersion: string } {
    const { version, key } = activeEncryptionKey()
    const nonce = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, nonce)
    const ciphertext = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ])
    return {
      ciphertext: Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString(
        'base64url',
      ),
      keyVersion: version,
    }
  }

  decrypt(ciphertext: string, version: string): string {
    const encodedKey = encryptionKeys()[version]
    if (!encodedKey) throw encryptionConfigurationError()
    const key = Buffer.from(encodedKey, 'base64')
    if (key.length !== 32) throw encryptionConfigurationError()
    const payload = Buffer.from(ciphertext, 'base64url')
    if (payload.length < 29) throw encryptionConfigurationError()
    const decipher = createDecipheriv('aes-256-gcm', key, payload.subarray(0, 12))
    decipher.setAuthTag(payload.subarray(12, 28))
    return Buffer.concat([
      decipher.update(payload.subarray(28)),
      decipher.final(),
    ]).toString('utf8')
  }
}

function encodeBase32(value: Buffer): string {
  let bits = 0
  let accumulator = 0
  let output = ''
  for (const byte of value) {
    accumulator = (accumulator << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32[(accumulator >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32[(accumulator << (5 - bits)) & 31]
  return output
}

function decodeBase32(value: string): Buffer {
  let bits = 0
  let accumulator = 0
  const output: number[] = []
  for (const character of value.replace(/=+$/, '').toUpperCase()) {
    const index = BASE32.indexOf(character)
    if (index < 0) throw new Error('Invalid TOTP secret')
    accumulator = (accumulator << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

function activeEncryptionKey(): { version: string; key: Buffer } {
  const version = process.env.AUTH_TOTP_ENCRYPTION_KEY_VERSION
  if (!version || !/^[a-zA-Z0-9_-]{1,32}$/.test(version)) {
    throw encryptionConfigurationError()
  }
  const encoded = version ? encryptionKeys()[version] : undefined
  if (typeof encoded !== 'string') throw encryptionConfigurationError()
  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32) throw encryptionConfigurationError()
  return { version, key }
}

function encryptionKeys(): Record<string, string> {
  try {
    const value = JSON.parse(process.env.AUTH_TOTP_ENCRYPTION_KEYS ?? '') as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw encryptionConfigurationError()
    }
    if (
      Object.values(value).some(
        (key) => typeof key !== 'string' || Buffer.from(key, 'base64').length !== 32,
      )
    ) {
      throw encryptionConfigurationError()
    }
    return value as Record<string, string>
  } catch {
    throw encryptionConfigurationError()
  }
}

function encryptionConfigurationError(): InternalServerErrorException {
  return new InternalServerErrorException({
    code: 'TOTP_ENCRYPTION_NOT_CONFIGURED',
    message: 'O serviço de autenticação não está configurado',
  })
}
