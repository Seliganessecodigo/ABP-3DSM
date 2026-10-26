import { randomInt } from "node:crypto";
import { IntegrationError } from "./integration-error";

const TOTAL_DEADLINE_MS = 30_000;
const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = TOTAL_DEADLINE_MS / MAX_ATTEMPTS;

class RetriableAttempt extends Error {
  constructor(
    readonly integrationError: IntegrationError,
    readonly delayMs: number,
  ) {
    super(integrationError.message);
  }
}

export function fetchJsonWithRetry(
  url: URL,
  signal?: AbortSignal,
): Promise<unknown> {
  return fetchAttemptWithRetry(url, signal, Date.now() + TOTAL_DEADLINE_MS, 1);
}

async function fetchAttemptWithRetry(
  url: URL,
  signal: AbortSignal | undefined,
  deadline: number,
  attempt: number,
): Promise<unknown> {
  if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");

  try {
    return await fetchJsonAttempt(url, signal, deadline, attempt);
  } catch (error) {
    if (!(error instanceof RetriableAttempt)) throw error;
    const remainingMs = deadline - Date.now();
    if (attempt >= MAX_ATTEMPTS || error.delayMs >= remainingMs) {
      throw error.integrationError;
    }
    await wait(error.delayMs, signal);
    return fetchAttemptWithRetry(url, signal, deadline, attempt + 1);
  }
}

async function fetchJsonAttempt(
  url: URL,
  signal: AbortSignal | undefined,
  deadline: number,
  attempt: number,
): Promise<unknown> {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new Error("request timeout")),
    Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now()),
  );

  try {
    const response = await fetchResponse(url, controller, signal, attempt);
    if (!response.ok) throw responseFailure(response, attempt);
    return await readJson(response, controller, signal, attempt);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

async function fetchResponse(
  url: URL,
  controller: AbortController,
  signal: AbortSignal | undefined,
  attempt: number,
): Promise<Response> {
  try {
    return await fetch(url, { signal: controller.signal });
  } catch {
    if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");
    const error = new IntegrationError(
      controller.signal.aborted ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      undefined,
      attempt,
    );
    throw new RetriableAttempt(error, retryBackoff(attempt));
  }
}

function responseFailure(response: Response, attempt: number): Error {
  void response.body?.cancel().catch(() => undefined);
  const error = new IntegrationError(
    "UPSTREAM_UNAVAILABLE",
    response.status,
    attempt,
  );
  if (!isRetryableStatus(response.status)) return error;
  return new RetriableAttempt(
    error,
    getRetryDelay(response, attempt, Date.now()),
  );
}

async function readJson(
  response: Response,
  controller: AbortController,
  signal: AbortSignal | undefined,
  attempt: number,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");
    if (controller.signal.aborted) {
      const error = new IntegrationError(
        "UPSTREAM_TIMEOUT",
        undefined,
        attempt,
      );
      throw new RetriableAttempt(error, retryBackoff(attempt));
    }
    throw new IntegrationError("INVALID_UPSTREAM_RESPONSE", undefined, attempt);
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function getRetryDelay(
  response: Response,
  attempt: number,
  now: number,
): number {
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      const delay = Number.isFinite(seconds)
        ? seconds * 1000
        : Date.parse(retryAfter) - now;
      if (Number.isFinite(delay) && delay >= 0) return delay;
    }
  }
  return retryBackoff(attempt);
}

function retryBackoff(attempt: number): number {
  const base = 200 * 2 ** (attempt - 1);
  return randomInt(Math.ceil(base / 2), Math.floor(base * 1.5) + 1);
}

function wait(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new IntegrationError("REQUEST_CANCELLED"));
      return;
    }
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, delayMs);
    const cancel = () => {
      clearTimeout(timeout);
      reject(new IntegrationError("REQUEST_CANCELLED"));
    };
    signal?.addEventListener("abort", cancel, { once: true });
  });
}
