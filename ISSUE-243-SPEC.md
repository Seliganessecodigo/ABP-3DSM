# Issue #243 — Monitoring failure and recovery

## Problem Statement

Operators and public dashboard consumers cannot distinguish failures in GreenER's external monitoring integrations from valid empty or stale data, and the backend does not retain a queryable history of those failures. Collection retries, recovery, and persistence errors also need consistent semantics across startup and scheduled collection cycles.

## Solution

Persist safe, integration-specific incidents and expose their current state and complete paginated history through a public read-only API. Apply bounded retries and timeouts to both external integrations, preserve previously valid observations when a source fails, and resolve each incident only after three consecutive valid observations in distinct cycles.

## User Stories

1. As a dashboard consumer, I want to distinguish an unavailable source from an application with no metrics, so that missing data is not mistaken for zero.
2. As a dashboard consumer, I want to see which source or application integration failed and a safe reason, so that I can understand the scope without seeing internal diagnostics.
3. As an operator, I want each failure to create or update a persisted incident, so that a restart does not erase active failure state.
4. As an operator, I want incidents for the service catalog, application metrics, and carbon factor to have separate identities, so that one integration's recovery does not hide another's failure.
5. As an operator, I want an incident to retain its first and latest safe reason and timestamps, so that reason changes remain understandable over the incident's lifetime.
6. As an operator, I want transient external failures retried within a bounded deadline, so that short disruptions can recover without allowing a call to stall collection indefinitely.
7. As a dashboard consumer, I want valid previously collected data to remain visible during a source failure, so that an outage does not erase the last known useful state.
8. As an operator, I want recovery to require three consecutive valid observations in distinct cycles, so that a single intermittent success does not clear an active incident.
9. As an operator, I want metrics and carbon-factor incidents to recover independently, so that a continuing carbon outage does not keep a recovered metrics incident open.
10. As an operator, I want startup and scheduled collection to share the same retry and incident rules, so that behavior is consistent after deployment and during normal operation.
11. As a public API consumer, I want to query current and closed incidents with filters and pagination, so that I can inspect relevant operational history.
12. As an operator, I want a failed database write kept distinct from an external-source failure, so that incident history reports the actual cause.
13. As an operator, I want overlapping scheduled ticks skipped while a cycle is still running, so that work is not duplicated within the supported single backend instance.
14. As an operator, I want shutdown cancellation recorded distinctly from an upstream failure, so that planned process termination does not create false source incidents.

## Implementation Decisions

- Add dedicated persistent incident records. Keep one active incident per incident identity and integration; subsequent failures update that record. A new incident may open after the previous incident for that identity has resolved.
- Use one global identity for the metrics aggregator's `/services` catalog operation. Use separate per-application identities for `/metrics/{id}` and the carbon-factor integration. Metrics and carbon factor remain separate even for the same application.
- Open an incident on the first logical operation failure, after retry attempts are exhausted where applicable. Preserve the first safe reason and update the latest safe reason and timestamp on subsequent failures.
- A recovery success must be valid against the external contract, successfully processed, and persisted. Require three consecutive successes in distinct cycles. A failure resets only the matching integration's recovery sequence. The incident is recovering after the first or second success and resolved after the third.
- Keep the last valid observation and its original timestamp when a later metrics response is missing or invalid. Mark that observation stale when the failed check is newer; a first-ever missing response with no valid observation is not labeled stale. Expose upstream timeouts as the timeout-specific application state reason.
- Apply a 30-second total deadline to each logical external call, including retry waits, with at most three HTTP attempts total. Retry only temporary network errors, timeouts, HTTP 408, HTTP 429, and 5xx responses. Do not retry other 4xx responses or invalid payloads. Honor `Retry-After` for 429 only within the total deadline.
- Use bounded exponential backoff with jitter between retry attempts; every wait remains inside the 30-second total deadline.
- Discard HTTP error response bodies without awaiting an unbounded stream cancellation, so cleanup cannot bypass the logical-call deadline.
- Apply the same retry policy to the metrics aggregator and carbon-intensity service. Keep HTTP attempt counts distinct from logical failed-operation counts.
- Share the incident, retry, and recovery policies between initial catalog synchronization and scheduled monitoring. A valid, persisted startup observation counts as one recovery success.
- Persist valid metrics observations even when the carbon-factor request fails. Preserve prior carbon-factor snapshots, report the application as not calculable when the factor is unavailable, and track the carbon incident independently.
- Reuse the existing bounded per-application worker concurrency setting for the complete metrics and carbon-factor work; do not introduce another concurrency setting.
- Retain the existing in-process cycle lock for the supported single-backend-instance deployment. Let an active cycle finish, skip overlapping scheduler ticks, and surface delay through existing freshness fields and incident timestamps. Do not add a scheduler-health endpoint.
- On shutdown, abort in-flight HTTP requests and finish the cycle as `FAILED` with detail code `CYCLE_CANCELLED`, retaining counts already persisted. Cancellation does not create an upstream incident.
- Keep cycle counters explicit: `processedCount` counts eligible applications processed; `failedCount` counts logical failed operations after retries, including required persistence failures, and can exceed processed applications; `persistedCount` counts newly inserted metric observations only. Carbon snapshots and HTTP attempts do not increment `persistedCount`. Use `SUCCEEDED` when there are no failures, `PARTIAL` when useful data was persisted and at least one operation failed, and `FAILED` when no useful result was produced or a global failure occurred.
- Do not reconcile catalog removals from an invalid or incomplete `/services` response. A `/metrics/{id}` 404 is not evidence that the application was removed. A carbon-factor 404 means the factor is unavailable; do not substitute a value.
- Classify safe reasons by category, including timeout, rate limited, upstream unavailable, missing metrics, factor unavailable, invalid response, and upstream rejection. Never expose or persist raw payloads, secrets, internal URLs, stack traces, or unsanitized error text in the public incident contract.
- If incident or observation persistence fails, emit a safe structured log with application/source, cycle, operation, and error code. Do not create an upstream incident, queue pending records in memory, or advance recovery without successful persistence. Preserve the last successfully persisted state.
- Add public read-only `GET /monitoring/incidents`, supporting `applicationId`, `source`, `integration`, and `status` filters plus `page` and `limit`. Default to page 1 and limit 20, cap limit at 100, and return newest incidents first. Include safe identity/scope, integration, reason, first/latest attempt, last valid response, logical failure and HTTP attempt counts, opened/closed timestamps, state, and cycle identifier where applicable. Support the complete persisted history; no retention policy is introduced here.

## Testing Decisions

- Prefer behavior-level tests that exercise observable incident state, persisted observations, cycle summaries, and HTTP responses rather than internal helper calls.
- Use the highest practical seam: run the collection runner against isolated PostgreSQL with controlled external adapters to cover opening, updates, recovery, partial failures, startup behavior, persistence failures, and shutdown cancellation.
- Test HTTP adapter retry/deadline behavior for retryable and non-retryable outcomes, attempt limits, `Retry-After`, and cancellation.
- Test the public endpoint contract for filters, pagination, ordering, safe fields, and invalid query values.
- Follow existing database-runner integration coverage such as `monitoring-cycle.runner.database.spec.ts` and existing controller contract tests.

## Out of Scope

- Frontend incident and alert presentation (tracked separately by issue #244).
- External notifications or manual incident creation, updates, and resolution.
- Distributed locks or coordination across multiple backend instances; the deployment covered here runs one instance.
- Incident retention, archival, or cleanup policy.
- Scheduler health endpoint or separate scheduler-lag API.
- Energy and CO₂e calculation policy changes or substitute carbon factors.
- External provider quotas or broader operational load policy.

## Further Notes

- Frontend catalog polling and backend collection scheduling are separate 60-second intervals. The per-call 30-second deadline applies to each logical integration call; total cycle time may exceed a scheduler interval when processing multiple applications. The scheduler skips overlapping starts and exposes freshness using existing timestamps and stale state.
- Failure, missing data, and stale observations must never be represented as zero.
- The current external contract treats `/services` as the authoritative complete catalog snapshot. Only a valid complete snapshot can establish removals.
