# API reference

This reference supports GreenER API integrations. The environment publishes complete types, optional fields and limits at `/openapi.json`; Swagger is at `/docs`. Catalog and history queries read persisted data. Recalculation preview and carbon routes may query the carbon intensity source.

## Public queries {#public}

| HTTP | URI | Access |
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
| GET | `/analysis/comparison` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |

## Periods and history {#queries}

`from` and `to` require RFC 3339 with an explicit timezone. `[from,to)` is normalized to UTC. Series accept `hour`, `day`, `month`, `year`, with up to 10,000 points; excess is rejected. Saved results are prorated by overlap. Conflicts use the latest `collectedAt`, then ascending lexical ID, without falling back to an earlier observation if the winner cannot support a metric.

| URI | Parameter |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/analysis/comparison` | `from`, `to`, `applicationIds` (2–5 IDs), `referenceApplicationId` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

`GET /analysis/comparison` requires 2–5 unique IDs and a selected reference. It returns energy, emissions, independent coverage, metrics and historical location snapshots for the same period. Differences are application minus reference; percentages require a positive reference. Missing values remain explicit, and the status is `empty`, `partial` or `complete`.

Source metrics have no measurement timestamp. The interval derives from receipt minus `collection_interval_seconds`. Factor query time does not establish validity; unpublished source and validity remain unknown. Energy, factor and emissions persist eight decimal places; coverage four. No intermediate rounding occurs. Energy and emissions retain separate coverage and original snapshots.

## Series and calculation explanation {#environmental-presentation}

In `/analysis/summary`, the optional `granularity` parameter includes `series.points` with the same period and filters as the totals. Each interval sums persisted application results and keeps independent coverage. Missing values remain `null`.

In `/applications/{id}/analysis`, `calculation.energyKwh` is the energy of segments with calculated emissions; `calculation.intensity` is the equivalent factor in gCO₂e/kWh, obtained by dividing those emissions by the corresponding energy. For zero or missing energy, the factor remains null. Historical results and factors are preserved.

## Sign in {#login}

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

| HTTP | URI | Access |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Protected operations {#protected}

| HTTP | URI | Access |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Administer accounts through the API {#accounts}

Only an active Admin in the same organization can list and create accounts or change roles. Creation accepts `name`, `email`, `role` and `reason`, without a password or automatic email verification. The account holder sets a password through the existing confirmation flow; confirmation delivery is requested separately. The management screen and password recovery remain separate deliveries.

Listing applies search and filters before sorting and pagination. The default is 10 items, with options 5, 10, 15, 20 and `all` for the complete filtered set. Translated labels must be mapped to enum codes and local dates to RFC 3339 with an offset. Missing values sort last in both directions; ties use the identifier.

Role changes require `expectedRole` and `reason`. A change revokes sessions and temporary TOTP credentials, preserves audit records and prevents removing your own access or the last active Admin with a confirmed email. Unconfirmed accounts do not replace that administrator. Assigning Admin retains the TOTP requirement.

## Compare with a recalculation preview {#preview}

At `/administration/calculations`, select an application and dates to compare original and preview. The UI end date includes the whole UTC day; the API receives `[from,to)`. Preview is public, uses the current model and current factors for historical regions, and saves or replaces no results. Limits: 30 days and 10,000 observations. Response fields are `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Factor failure preserves calculable energy while CO₂e remains unavailable. Percentages require matching units/coverage and a positive reference.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personalize analysis {#preferences}

In `/methodology`, configure per-application energy and emissions limits, coverage thresholds and analysis defaults. Choose the last 24 hours, 7, 30 or 90 days, the current UTC month or a custom interval with an inclusive start and exclusive end. The preview reads real data without saving and uses the same warning panel as applications and the Dashboard. Saving requires login and affects only your account; calculations, history and operational states remain intact. Warnings use each limit’s period independently of page filters. Analysis defaults fill only missing URL options on the Dashboard and detail pages. Partial data below a limit does not prove compliance; missing data never means zero.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled, period: {kind}}`; 0–100 |
| analysis | `{period: {kind}, granularity: "hour" / "day"}` |

```json
{ "period": { "kind": "custom", "from": "2026-11-01T00:00:00Z", "to": "2026-11-08T00:00:00Z" } }
```

```text
period.kind = 24h | 7d | 30d | 90d | month | custom
GET /me/preferences/alerts (JWT)
POST /me/preferences/alerts/preview (public, read-only)
{ energy, emissions, coverage } -> { configured, evaluatedAt, applications }
```

## Error handling {#errors}

Handle errors through HTTP status and structured codes; message text is not a translation contract. `null` means missing and must not become zero. An empty list is a valid response, distinct from query failure. Interpret the codes below in the context of each operation.

| HTTP | Code |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## HTTP contract {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Related reading {#related}

[Operations and diagnosis](../operations) · [Methodology and data](../product/methodology)
