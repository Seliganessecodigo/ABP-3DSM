import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import { UserRole } from '../../database/entities/user.entity'
import { AUTH_CLOCK, AuthClock } from './clock'

export interface AccessClaims {
  sub: string
  org: string
  sid: string
  role: UserRole
  iat: number
  exp: number
}

const ACCESS_TOKEN_SECONDS = 15 * 60

@Injectable()
export class AccessTokenService {
  constructor(@Inject(AUTH_CLOCK) private readonly clock: AuthClock) {}

  sign(
    userId: string,
    organizationId: string,
    sessionId: string,
    role: UserRole,
  ): string {
    const now = Math.floor(this.clock.now().getTime() / 1000)
    const header = this.encode({ alg: 'HS256', typ: 'JWT' })
    const payload = this.encode({
      sub: userId,
      org: organizationId,
      sid: sessionId,
      role,
      iat: now,
      exp: now + ACCESS_TOKEN_SECONDS,
    })
    const input = `${header}.${payload}`
    return `${input}.${this.signature(input)}`
  }

  verify(token: string): AccessClaims {
    const [header, payload, signature, extra] = token.split('.')
    if (!header || !payload || !signature || extra !== undefined) {
      throw this.invalidToken()
    }
    const input = `${header}.${payload}`
    const expected = Buffer.from(this.signature(input))
    const received = Buffer.from(signature)
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw this.invalidToken()
    }

    try {
      const parsedHeader = JSON.parse(
        Buffer.from(header, 'base64url').toString('utf8'),
      ) as {
        alg?: string
        typ?: string
      }
      const claims = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as Partial<AccessClaims>
      if (
        parsedHeader.alg !== 'HS256' ||
        parsedHeader.typ !== 'JWT' ||
        !claims.sub ||
        !claims.org ||
        !claims.sid ||
        typeof claims.exp !== 'number' ||
        claims.exp <= Math.floor(this.clock.now().getTime() / 1000)
      ) {
        throw this.invalidToken()
      }
      return claims as AccessClaims
    } catch {
      throw this.invalidToken()
    }
  }

  newRefreshToken(): string {
    return randomBytes(48).toString('base64url')
  }

  assertConfigured(): void {
    this.secret()
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private signature(input: string): string {
    return createHmac('sha256', this.secret()).update(input).digest('base64url')
  }

  private encode(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url')
  }

  private secret(): string {
    const secret = process.env.AUTH_JWT_SECRET
    if (
      !secret ||
      Buffer.byteLength(secret) < 32 ||
      (process.env.NODE_ENV === 'production' &&
        secret.startsWith('local_only')) ||
      secret === process.env.AUTH_PASSWORD_PEPPER
    ) {
      throw new InternalServerErrorException({
        code: 'AUTHENTICATION_NOT_CONFIGURED',
        message: 'O serviço de autenticação não está configurado',
      })
    }
    return secret
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Autenticação inválida',
    })
  }
}
