import { IntegrationError } from "./integration-error";

const TOTAL_DEADLINE_MS = 30_000;
const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = TOTAL_DEADLINE_MS / MAX_ATTEMPTS;

export async function fetchJsonWithRetry(
  url: URL,
  signal?: AbortSignal,
): Promise<unknown> {
  const deadline = Date.now() + TOTAL_DEADLINE_MS;
  let attempts = 0;
  let lastError: IntegrationError | undefined;

  while (attempts < MAX_ATTEMPTS && Date.now() < deadline) {
    if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");
    attempts++;
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = setTimeout(
      () => controller.abort(new Error("request timeout")),
      Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now()),
    );
    let response: Response;

    try {
      response = await fetch(url, { signal: controller.signal });
    } catch {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortFromCaller);
      if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");
      lastError = new IntegrationError(
        controller.signal.aborted ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
        undefined,
        attempts,
      );
      if (attempts >= MAX_ATTEMPTS || Date.now() >= deadline) throw lastError;
      const delay = retryBackoff(attempts);
      if (delay >= deadline - Date.now()) throw lastError;
      await wait(delay, signal);
      continue;
    }

    if (!response.ok) {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortFromCaller);
      controller.abort();
      if (response.body) {
        try {
          void response.body.cancel().catch(() => undefined);
        } catch {
          // Discarding an error body must not extend the logical-call deadline.
        }
      }
      lastError = new IntegrationError(
        "UPSTREAM_UNAVAILABLE",
        response.status,
        attempts,
      );
      if (!isRetryableStatus(response.status) || attempts >= MAX_ATTEMPTS)
        throw lastError;
      const delay = getRetryDelay(response, attempts, Date.now());
      if (delay >= deadline - Date.now()) throw lastError;
      await wait(delay, signal);
      continue;
    }

    try {
      return await response.json();
    } catch {
      if (signal?.aborted) throw new IntegrationError("REQUEST_CANCELLED");
      if (controller.signal.aborted) {
        lastError = new IntegrationError(
          "UPSTREAM_TIMEOUT",
          undefined,
          attempts,
        );
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abortFromCaller);
        if (attempts >= MAX_ATTEMPTS || Date.now() >= deadline) throw lastError;
        const delay = retryBackoff(attempts);
        if (delay >= deadline - Date.now()) throw lastError;
        await wait(delay, signal);
        continue;
      }
      throw new IntegrationError(
        "INVALID_UPSTREAM_RESPONSE",
        undefined,
        attempts,
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  throw (
    lastError ?? new IntegrationError("UPSTREAM_TIMEOUT", undefined, attempts)
  );
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
  return Math.round(base * (0.5 + Math.random()));
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
