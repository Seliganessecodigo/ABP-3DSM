export class IntegrationError extends Error {
  constructor(
    readonly code:
      | "INVALID_UPSTREAM_RESPONSE"
      | "UPSTREAM_UNAVAILABLE"
      | "UPSTREAM_TIMEOUT"
      | "REQUEST_CANCELLED",
    readonly status?: number,
    readonly httpAttempts = 1,
  ) {
    super(code);
  }
}
