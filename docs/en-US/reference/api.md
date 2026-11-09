# GreenER API reference

Baseline: `origin/develop`, commit `c343698`, checked on 2026-11-08. Environments may run another revision; merging does not prove deployment. Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

## Existing read routes

| Method and route | Result |
| --- | --- |
| GET /health | Service HTTP health response. |
| GET /applications | Persisted catalog array; `[]` is valid. |
| GET /applications/{id} | Known application with state, timestamps and location. |
| GET /applications/{id}/collections/latest | Most recent valid observation and operational context. |
| GET /applications/{id}/collections/{collectionId} | Observation scoped to its application; collectionId is a UUID. |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | Per-application environmental time series. |
| GET /applications/{id}/analysis/series/contributions?… | Bucket contributions and exclusions, with pagination. |
| GET /analysis/summary?from=…&to=… | Filterable aggregate environmental summary. |
| GET /applications/{id}/analysis?from=…&to=… | Persisted environmental result for an application and time range. |
| GET /monitoring/incidents | Integration incidents, with filters and pagination. |
| GET /openapi.json | Machine-readable contract. |

These reads use persisted data and trigger neither collection nor environmental calculation. Catalog search and pagination currently run in the frontend; no server pagination parameters are documented on these routes.

## Local requests

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Use an ID returned by the catalog for detail requests and URL-encode the path segment. Do not assume sequential IDs or UUID application IDs.

The application DTO includes `id`, `name`, `state`, `reason`, `lastObservationAt`, `isStale`, `isCalculable`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `updatedAt` and `location`. The detail screen uses the operational fields to explain state, freshness and calculability; see OpenAPI for types and nullability. City may be null; incomplete legacy records can have `location: null`.

## Errors and absence

| HTTP / code | Interpretation |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | Empty/invalid ID under route validation. An invalid collection UUID also yields 400. |
| 404 / APPLICATION_NOT_FOUND | Unknown application. |
| 404 / COLLECTION_NOT_FOUND | Observation not found for this application. |
| 503 / CATALOG_UNAVAILABLE | Catalog read failure. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Evidence read failure. |

Use structured codes and HTTP status; messages are not a translation contract. Never replace failures with an empty list or zero indicators.

## Integration boundaries

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

See [Operations](../operations) for URL, CORS and diagnosis, and [Methodology](../product/methodology) for intervals and metric interpretation.

## Query environmental analysis

`GET /applications/{id}/analysis` requires `from` and `to` as RFC 3339 timestamps with an explicit timezone. The start is inclusive, the end is exclusive, and both are normalized to UTC. The response contains `status` (`available` or `empty`), period, energy, emissions, separate coverage, and provenance (methodologies, queried factors, and reasons). A `null` value means no usable result; zero is a valid value.

| HTTP / code | Meaning |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Invalid timestamp, missing timezone, or `to` less than or equal to `from`. |
| 404 / APPLICATION_NOT_FOUND | Unknown application. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Failure while reading analysis or persisted results. |

At `/history`, select an application; `applicationId`, period and granularity retain URL context. The screen reuses the persisted detail series with filters, display timezone, events, numbered pages and bucket inspection. Contributions also support interactive pagination of 5, 10, 15, 20 or all items. Backend buckets remain UTC; changing display timezone does not regroup the series. The detail overlay compares the same application with the preceding equivalent window.

## Query environmental time series

`GET /applications/{id}/analysis/series` requires `from`, `to`, and `granularity` (`hour`, `day`, `month`, or `year`). The response contains `points`, `events`, totals, and coverage. UTC calendar buckets count only their overlap with the requested range and can be partial. Requests that would produce more than 10,000 points are rejected; the server does not truncate or change granularity.

`GET /applications/{id}/analysis/series/contributions` also requires `bucketStart`; optional `page` defaults to 1 and `pageSize` defaults to 10. Allowed sizes are `5`, `10`, `15`, `20`, and `all`; `all` is valid only on page 1. The response includes contributions and exclusions with saved methodology and factor snapshots.

## Query aggregate summary

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. At `/dashboard`, select 24 hours, 7, 30 or 90 days, state and region. The summary shows totals, coverage, state counts and emissions composition as bars or a donut. The table supports search, column filters, energy/CO₂e sorting and pagination. Table filters restrict rows without redefining summary totals. Open an application to investigate evidence. The dashboard calls `GET /analysis/summary` and refreshes periodically without reloading.

## Query monitoring incidents

`GET /monitoring/incidents` accepts `applicationId`, `source`, `integration`, `status`, `page`, and `limit`. Status is `OPEN`, `RECOVERING`, or `RESOLVED`; defaults are page 1 and limit 20. The response contains `items`, `total`, `page`, and `limit`. Use OpenAPI for current limits and enum values.

## API reference — JWT

| HTTP | URI | JWT / credential |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.

## API reference — POST /applications/{id}/analysis/recalculation-preview

At `/administration/calculations`, select an application and dates to compare original and preview. The UI end date includes the whole UTC day; the API receives `[from,to)`. Preview is public, uses the current model and current factors for historical regions, and saves or replaces no results. Limits: 30 days and 10,000 observations. Response fields are `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Factor failure preserves calculable energy while CO₂e remains unavailable. Percentages require matching units/coverage and a positive reference.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## API reference — /me/preferences

At `/methodology`, energy, emissions, coverage and analysis tabs provide examples and personal preferences. Any authenticated role can save its own tab using optimistic revisions; 409 means conflict. Thresholds affect presentation, not global settings, calculations or external notifications. Saved period/granularity only fill missing detail URL options. Recorded methodology remains at `/services/:id/methodology`, with `collectionId` when selected.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
