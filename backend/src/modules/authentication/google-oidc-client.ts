import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common'
import { createHash, createPublicKey, verify } from 'node:crypto'
import { AUTH_CLOCK, AuthClock } from './clock'
import {
  GOOGLE_OIDC_TRANSPORT,
  GoogleJwksResponse,
  GoogleOidcTransport,
  GoogleOidcTransportError,
} from './google-oidc-transport'

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_ISSUERS = new Set([
  'https://accounts.google.com',
  'accounts.google.com',
])

export interface GoogleIdentity {
  issuer: string
  subject: string
  email: string
}

@Injectable()
export class GoogleOidcClient {
  constructor(
    @Inject(GOOGLE_OIDC_TRANSPORT)
    private readonly transport: GoogleOidcTransport,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
  ) {}

  authorizationUrl(input: {
    state: string
    nonce: string
    codeChallenge: string
    redirectUri: string
  }): URL {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) throw googleNotConfigured()
    const url = new URL(AUTHORIZATION_ENDPOINT)
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: input.redirectUri,
      response_type: 'code',
      scope: 'openid email',
      state: input.state,
      nonce: input.nonce,
      code_challenge: input.codeChallenge,
      code_challenge_method: 'S256',
    }).toString()
    return url
  }

  async authenticateCode(input: {
    code: string
    codeVerifier: string
    nonce: string
    redirectUri: string
  }): Promise<GoogleIdentity> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) throw googleNotConfigured()

    let tokenResponse
    try {
      tokenResponse = await this.transport.exchangeCode({
        code: input.code,
        codeVerifier: input.codeVerifier,
        redirectUri: input.redirectUri,
        clientId,
        clientSecret,
      })
    } catch (error) {
      if (error instanceof GoogleOidcTransportError) throw googleUnavailable()
      throw error
    }
    if (
      !tokenResponse ||
      typeof tokenResponse !== 'object' ||
      typeof tokenResponse.id_token !== 'string'
    ) {
      throw invalidGoogleIdentity()
    }
    return this.verifyIdToken(tokenResponse.id_token, input.nonce, clientId)
  }

  private async verifyIdToken(
    token: string,
    expectedNonce: string,
    audience: string,
  ): Promise<GoogleIdentity> {
    if (token.length > 16_384) throw invalidGoogleIdentity()
    const [encodedHeader, encodedClaims, encodedSignature, extra] =
      token.split('.')
    if (!encodedHeader || !encodedClaims || !encodedSignature || extra) {
      throw invalidGoogleIdentity()
    }
    try {
      const header = JSON.parse(
        Buffer.from(encodedHeader, 'base64url').toString('utf8'),
      ) as { alg?: unknown; kid?: unknown }
      if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
        throw invalidGoogleIdentity()
      }
      const jwks = await this.transport.getSigningKeys()
      const jwk = signingKey(jwks, header.kid)
      if (!jwk) throw invalidGoogleIdentity()
      const publicKey = createPublicKey({
        key: jwk as unknown as import('node:crypto').JsonWebKey,
        format: 'jwk',
      })
      const validSignature = verify(
        'RSA-SHA256',
        Buffer.from(`${encodedHeader}.${encodedClaims}`),
        publicKey,
        Buffer.from(encodedSignature, 'base64url'),
      )
      if (!validSignature) throw invalidGoogleIdentity()

      const claims = JSON.parse(
        Buffer.from(encodedClaims, 'base64url').toString('utf8'),
      ) as Record<string, unknown>
      const now = Math.floor(this.clock.now().getTime() / 1000)
      const validAudience =
        claims.aud === audience ||
        (Array.isArray(claims.aud) && claims.aud.includes(audience))
      const validAuthorizedParty =
        !Array.isArray(claims.aud) || claims.aud.length <= 1 || claims.azp === audience
      if (
        typeof claims.iss !== 'string' ||
        !GOOGLE_ISSUERS.has(claims.iss) ||
        !validAudience ||
        !validAuthorizedParty ||
        typeof claims.exp !== 'number' ||
        claims.exp <= now ||
        claims.nonce !== expectedNonce ||
        typeof claims.sub !== 'string' ||
        !claims.sub ||
        claims.email_verified !== true ||
        typeof claims.email !== 'string' ||
        !isEmail(claims.email)
      ) {
        throw invalidGoogleIdentity()
      }
      return {
        issuer: 'https://accounts.google.com',
        subject: claims.sub,
        email: claims.email.trim().toLowerCase(),
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      if (error instanceof GoogleOidcTransportError) throw googleUnavailable()
      throw invalidGoogleIdentity()
    }
  }
}

function signingKey(jwks: GoogleJwksResponse, kid: string): JsonWebKey | null {
  if (!Array.isArray(jwks.keys)) return null
  return (
    jwks.keys.find(
      (key) =>
        key.kid === kid &&
        key.kty === 'RSA' &&
        key.alg === 'RS256' &&
        key.use === 'sig',
    ) ?? null
  )
}

function isEmail(email: string): boolean {
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function googleNotConfigured(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'SSO_NOT_CONFIGURED',
    message: 'O login Google não está configurado',
  })
}

function googleUnavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    code: 'SSO_PROVIDER_UNAVAILABLE',
    message: 'O provedor de identidade está indisponível',
  })
}

function invalidGoogleIdentity(): UnauthorizedException {
  return new UnauthorizedException({
    code: 'INVALID_SSO_IDENTITY',
    message: 'Não foi possível autenticar com esta conta Google',
  })
}

export function googlePkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}
