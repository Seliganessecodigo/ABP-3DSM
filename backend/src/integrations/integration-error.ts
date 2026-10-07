export class IntegrationError extends Error {
  constructor(
    readonly code: 'INVALID_UPSTREAM_RESPONSE' | 'UPSTREAM_UNAVAILABLE',
    readonly status?: number,
  ) {
    super(code)
  }
}
