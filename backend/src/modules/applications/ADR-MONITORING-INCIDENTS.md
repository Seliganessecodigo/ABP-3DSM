# ADR: Persistent monitoring incidents

## Status

Accepted for issue #243.

## Context

The monitoring pipeline calls a service catalog, per-application metrics, and a carbon-intensity integration. Failures must remain distinguishable from empty data and must not erase the latest valid observations. Startup synchronization and scheduled collection currently have separate paths, while cycle-level failures can conflate persistence errors with upstream failures. The product needs a public incident history and a deterministic recovery rule.

## Decision

- Persist incidents independently from cycle summaries and application observations.
- Identify catalog failures globally and metrics/carbon-factor failures per application and integration.
- Open on the first failed logical operation; update the same active incident on later failures and preserve both first and latest safe reasons.
- Close only after three valid, persisted successes in distinct cycles for that same integration. Recovery counters are independent between integrations.
- Preserve the original last-valid observation timestamp when a later metrics response is missing or invalid, marking it stale only when that observation predates the failed check. Use the timeout-specific application state reason for timeout evidence.
- Apply a 30-second total deadline and at most three HTTP attempts per logical call to both external integrations. Retry only transient network errors, timeout, 408, 429, and 5xx, honoring `Retry-After` within the deadline.
- Do not wait indefinitely while discarding an HTTP error response body; response cleanup must not extend the logical-call deadline.
- Use bounded exponential backoff with jitter, always constrained by the total deadline.
- Share the incident policy across startup and scheduled runners. Keep valid metrics when carbon lookup fails and preserve prior carbon snapshots.
- Expose current and closed records through a public read-only paginated/filterable endpoint. Do not expose internal diagnostics or add a retention policy in this change.
- Treat persistence failures as persistence failures: log safely, do not fabricate source incidents, and do not advance recovery without committed state.
- Keep the existing process-local scheduler lock for the current single-instance deployment; skip overlapping ticks and let an active cycle finish.

## Consequences

- The backend gains a dedicated incident persistence model, migration, repository/service behavior, and a public API contract.
- Existing collection and startup flows must share policy and represent partial metrics/carbon outcomes independently.
- Cycle failure counts represent failed logical operations and can exceed the number of applications processed; metric observation counts remain separate from carbon snapshots and HTTP attempts.
- Running multiple backend instances without distributed coordination can still run concurrent cycles. That deployment change requires a separate lock design.
- Incident history is retained without an expiry policy until a separate product/operations decision defines retention.

## Alternatives considered

- Deriving incidents from cycle logs was rejected because cycles are not an integration-specific durable incident lifecycle and cannot express independent recovery cleanly.
- Resolving on one successful response was rejected because intermittent success can clear an outage prematurely.
- Retrying all 4xx responses was rejected because invalid requests and payload/contract issues are not generally transient.
- Cancelling a cycle at the scheduler interval was rejected because it would discard valid work; overlapping starts are skipped instead.
