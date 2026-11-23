export const GOOGLE_OIDC_TRANSPORT = Symbol('GOOGLE_OIDC_TRANSPORT')

export interface GoogleTokenResponse {
  id_token?: unknown
}

export interface GoogleJwksResponse {
  keys?: Array<JsonWebKey & { kid?: string; alg?: string; use?: string }>
}

export interface GoogleOidcTransport {
  exchangeCode(input: {
    code: string
    codeVerifier: string
    redirectUri: string
    clientId: string
    clientSecret: string
  }): Promise<GoogleTokenResponse>
  getSigningKeys(): Promise<GoogleJwksResponse>
}

export class GoogleOidcTransportError extends Error {}

export class FetchGoogleOidcTransport implements GoogleOidcTransport {
  async exchangeCode(input: {
    code: string
    codeVerifier: string
    redirectUri: string
    clientId: string
    clientSecret: string
  }): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      grant_type: 'authorization_code',
    })
    return this.requestJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }) as Promise<GoogleTokenResponse>
  }

  getSigningKeys(): Promise<GoogleJwksResponse> {
    return this.requestJson('https://www.googleapis.com/oauth2/v3/certs', {
      method: 'GET',
    }) as Promise<GoogleJwksResponse>
  }

  private async requestJson(url: string, init: RequestInit): Promise<unknown> {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) throw new GoogleOidcTransportError()
      return await response.json()
    } catch {
      throw new GoogleOidcTransportError()
    }
  }
}
