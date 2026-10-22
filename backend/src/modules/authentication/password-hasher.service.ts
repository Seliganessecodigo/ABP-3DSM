import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { createHmac } from 'node:crypto'

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(this.withPepper(password), {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    })
  }

  async verify(encodedHash: string, password: string): Promise<boolean> {
    const pepperedPassword = this.withPepper(password)
    try {
      return await argon2.verify(encodedHash, pepperedPassword)
    } catch {
      return false
    }
  }

  private withPepper(password: string): Buffer {
    const pepper = process.env.AUTH_PASSWORD_PEPPER
    if (
      !pepper ||
      Buffer.byteLength(pepper) < 32 ||
      (process.env.NODE_ENV === 'production' &&
        pepper.startsWith('local_only')) ||
      pepper === process.env.AUTH_JWT_SECRET
    ) {
      throw new InternalServerErrorException({
        code: 'PASSWORD_PEPPER_NOT_CONFIGURED',
        message: 'O serviço de autenticação não está configurado',
      })
    }
    return createHmac('sha256', pepper).update(password, 'utf8').digest()
  }
}
