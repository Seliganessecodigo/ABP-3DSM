import {
  createSign,
  generateKeyPairSync,
} from 'node:crypto'
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { AuthClock } from './clock'
import { GoogleOidcClient } from './google-oidc-client'
import {
  FetchGoogleOidcTransport,
  GoogleJwksResponse,
  GoogleOidcTransport,
  GoogleOidcTransportError,
} from './google-oidc-transport'

const fixedNow = new Date('2026-10-23T12:00:00.000Z')
const clock: AuthClock = { now: () => new Date(fixedNow) }

describe('GoogleOidcClient', () => {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const jwks: GoogleJwksResponse = {
    keys: [
      {
        ...pair.publicKey.export({ format: 'jwk' }),
        kid: 'google-test-key',
        alg: 'RS256',
        use: 'sig',
      },
    ],
  }
  const originalClientId = process.env.GOOGLE_CLIENT_ID
  const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'greener-test-client'
    process.env.GOOGLE_CLIENT_SECRET = 'greener-test-secret'
  })

  afterAll(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = originalClientId
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret
  })

  function client(transport: GoogleOidcTransport): GoogleOidcClient {
    return new GoogleOidcClient(transport, clock)
  }

  function validClaims(overrides: Record<string, unknown> = {}) {
    return {
      iss: 'https://accounts.google.com',
      aud: 'greener-test-client',
      sub: 'google-subject-1',
      email: 'Person@Example.test',
      email_verified: true,
      nonce: 'expected-nonce',
      exp: Math.floor(fixedNow.getTime() / 1000) + 300,
      ...overrides,
    }
  }

  function signedToken(
    claims: Record<string, unknown>,
    header: Record<string, unknown> = {
      alg: 'RS256',
      typ: 'JWT',
      kid: 'google-test-key',
    },
    corruptSignature = false,
  ): string {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedClaims = Buffer.from(JSON.stringify(claims)).toString('base64url')
    const signer = createSign('RSA-SHA256')
    signer.update(`${encodedHeader}.${encodedClaims}`)
    signer.end()
    const signature = signer.sign(pair.privateKey).toString('base64url')
    return `${encodedHeader}.${encodedClaims}.${corruptSignature ? 'bad' : signature}`
  }

  function validTransport(token: string): GoogleOidcTransport {
    return {
      exchangeCode: async () => ({ id_token: token }),
      getSigningKeys: async () => jwks,
    }
  }

  it('builds a global authorization URL with only openid and email scopes', () => {
    const url = client(validTransport('unused')).authorizationUrl({
      state: 'state',
      nonce: 'nonce',
      codeChallenge: 'a'.repeat(43),
      redirectUri: 'https://api.example.test/auth/sso/google/callback',
    })

    expect(url.origin).toBe('https://accounts.google.com')
    expect(url.searchParams.get('scope')).toBe('openid email')
    expect(url.searchParams.get('state')).toBe('state')
    expect(url.searchParams.get('nonce')).toBe('nonce')
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.has('hd')).toBe(false)
    expect(url.searchParams.has('profile')).toBe(false)
  })

  it('canonicalizes the issuer and normalizes verified Google email', async () => {
    const token = signedToken(
      validClaims({
        iss: 'accounts.google.com',
        aud: ['greener-test-client', 'other-client'],
        azp: 'greener-test-client',
      }),
    )
    const identity = await client(validTransport(token)).authenticateCode({
      code: 'authorization-code',
      codeVerifier: 'google-verifier',
      nonce: 'expected-nonce',
      redirectUri: 'https://api.example.test/auth/sso/google/callback',
    })

    expect(identity).toEqual({
      issuer: 'https://accounts.google.com',
      subject: 'google-subject-1',
      email: 'person@example.test',
    })
  })

  it('rejects invalid issuer, audience, authorized party, expiry, nonce, subject and email claims', async () => {
    const cases = [
      { iss: 'https://attacker.example' },
      { aud: 'another-client' },
      { aud: ['greener-test-client', 'another-client'] },
      { exp: Math.floor(fixedNow.getTime() / 1000) },
      { nonce: 'wrong-nonce' },
      { sub: '' },
      { email_verified: false },
      { email: 'not-an-email' },
    ]
    for (const claims of cases) {
      const token = signedToken(validClaims(claims))
      await expect(
        client(validTransport(token)).authenticateCode({
          code: 'authorization-code',
          codeVerifier: 'google-verifier',
          nonce: 'expected-nonce',
          redirectUri: 'https://api.example.test/auth/sso/google/callback',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException)
    }
  })

  it('rejects malformed token, unsupported algorithm, unknown key and invalid signature', async () => {
    const invalidTokens = [
      'not-a-jwt',
      signedToken(validClaims(), { alg: 'none', kid: 'google-test-key' }),
      signedToken(validClaims(), { alg: 'RS256', kid: 'unknown-key' }),
      signedToken(validClaims(), undefined, true),
    ]
    for (const token of invalidTokens) {
      await expect(
        client(validTransport(token)).authenticateCode({
          code: 'authorization-code',
          codeVerifier: 'google-verifier',
          nonce: 'expected-nonce',
          redirectUri: 'https://api.example.test/auth/sso/google/callback',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException)
    }
  })

  it('returns safe configuration and provider errors and rejects missing ID tokens', async () => {
    delete process.env.GOOGLE_CLIENT_SECRET
    await expect(
      client(validTransport('unused')).authenticateCode({
        code: 'authorization-code',
        codeVerifier: 'google-verifier',
        nonce: 'expected-nonce',
        redirectUri: 'https://api.example.test/auth/sso/google/callback',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException)

    process.env.GOOGLE_CLIENT_SECRET = 'greener-test-secret'
    const unavailable: GoogleOidcTransport = {
      exchangeCode: async () => {
        throw new GoogleOidcTransportError()
      },
      getSigningKeys: async () => jwks,
    }
    await expect(
      client(unavailable).authenticateCode({
        code: 'authorization-code',
        codeVerifier: 'google-verifier',
        nonce: 'expected-nonce',
        redirectUri: 'https://api.example.test/auth/sso/google/callback',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException)

    const emptyToken: GoogleOidcTransport = {
      exchangeCode: async () => ({}),
      getSigningKeys: async () => jwks,
    }
    await expect(
      client(emptyToken).authenticateCode({
        code: 'authorization-code',
        codeVerifier: 'google-verifier',
        nonce: 'expected-nonce',
        redirectUri: 'https://api.example.test/auth/sso/google/callback',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)

    const keyServiceUnavailable: GoogleOidcTransport = {
      exchangeCode: async () => ({ id_token: signedToken(validClaims()) }),
      getSigningKeys: async () => {
        throw new GoogleOidcTransportError()
      },
    }
    await expect(
      client(keyServiceUnavailable).authenticateCode({
        code: 'authorization-code',
        codeVerifier: 'google-verifier',
        nonce: 'expected-nonce',
        redirectUri: 'https://api.example.test/auth/sso/google/callback',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
  })
})

describe('FetchGoogleOidcTransport', () => {
  afterEach(() => jest.restoreAllMocks())

  it('exchanges authorization code and requests Google signing keys', async () => {
    const request = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id_token: 'signed-id-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ keys: [{ kid: 'google-key' }] }), {
          status: 200,
        }),
      )
    const transport = new FetchGoogleOidcTransport()

    await expect(
      transport.exchangeCode({
        code: 'auth-code',
        codeVerifier: 'pkce-verifier',
        redirectUri: 'https://api.example.test/callback',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      }),
    ).resolves.toEqual({ id_token: 'signed-id-token' })
    const body = request.mock.calls[0][1]?.body as URLSearchParams
    expect(request.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token')
    expect(request.mock.calls[0][1]?.method).toBe('POST')
    expect(body.get('code_verifier')).toBe('pkce-verifier')
    expect(body.get('grant_type')).toBe('authorization_code')
    await expect(transport.getSigningKeys()).resolves.toEqual({
      keys: [{ kid: 'google-key' }],
    })
    expect(request.mock.calls[1][0]).toBe('https://www.googleapis.com/oauth2/v3/certs')
  })

  it('maps HTTP, network and invalid JSON responses to a provider error', async () => {
    const transport = new FetchGoogleOidcTransport()
    const request = jest.spyOn(globalThis, 'fetch')
    request.mockResolvedValueOnce(new Response('', { status: 503 }))
    await expect(transport.getSigningKeys()).rejects.toBeInstanceOf(
      GoogleOidcTransportError,
    )
    request.mockRejectedValueOnce(new Error('offline'))
    await expect(transport.getSigningKeys()).rejects.toBeInstanceOf(
      GoogleOidcTransportError,
    )
    request.mockResolvedValueOnce(new Response('invalid json', { status: 200 }))
    await expect(transport.getSigningKeys()).rejects.toBeInstanceOf(
      GoogleOidcTransportError,
    )
  })
})
