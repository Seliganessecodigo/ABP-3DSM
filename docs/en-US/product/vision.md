# Product vision and scope

GreenER addresses three questions: which applications are monitored, what evidence supports their consumption, and how to interpret estimated energy and emissions. Discovery, metrics, regional context and history support investigation and prioritization.

## Audiences

| Audience | Need |
| --- | --- |
| Infrastructure management | Identify applications and track changes in the environment. |
| Operational and environmental analysis | Investigate periods, compare compatible results and understand gaps. |
| Development and assessment team | Reproduce the environment and demonstrate acceptance criteria. |

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

## Scope and availability

Baseline: `origin/develop`, commit `c343698`, checked on 2026-11-08. Environments may run another revision; merging does not prove deployment.

| Capability | Documented position |
| --- | --- |
| Catalog, search, filters, pagination, navigation and twelve languages | Implemented in the interface. |
| Discovery, lifecycle events, periodic collection, incidents and persistence | Implemented in the backend. |
| Operational status, source metrics, collection evidence and methodology | Available through the API and application detail; a dedicated page explains the recorded model, formula, parameters and factor without recalculation. Failures, missing data and stale data remain distinct. |
| Per-application environmental analysis, time series and contribution inspection | Available in the API and integrated into application detail. |
| `/dashboard` · `GET /analysis/summary` | At `/dashboard`, select 24 hours, 7, 30 or 90 days, state and region. The summary shows totals, coverage, state counts and emissions composition as bars or a donut. The table supports search, column filters, energy/CO₂e sorting and pagination. Table filters restrict rows without redefining summary totals. Open an application to investigate evidence. The dashboard calls `GET /analysis/summary` and refreshes periodically without reloading. |
| Light/dark theme | Available as an interface preference. |

## Journeys and value

1. Find an application and open its detail to confirm identity, location and status.
2. Investigate a change by distinguishing the latest attempt, last valid observation and missing data.
3. In application detail, select a period and granularity, interpret the series and coverage, and inspect a bucket's contributions without turning gaps into zero.

The [user guide](../guide/monitoring) covers existing behavior; [epics](../roadmap) describe expected capabilities.

## Product boundaries

Environmental estimates are neither direct electricity measurements nor proof of savings caused by an action. Efficiency per transaction requires workload data. The detail series compares one application with the immediately preceding window of equal duration; this does not provide cross-application or dashboard-level period comparison. A map is optional.

## Assessing outcomes

At reviews, check whether people can locate an application, distinguish zero from missing data, and trace a result to its period, unit and evidence. Record evaluated tasks, difficulties, feedback and changes in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) and [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Time, satisfaction and performance targets need a baseline and approval; this documentation sets no arbitrary numbers.

## User guide

At `/history`, select an application; `applicationId`, period and granularity retain URL context. The screen reuses the persisted detail series with filters, display timezone, events, numbered pages and bucket inspection. Contributions also support interactive pagination of 5, 10, 15, 20 or all items. Backend buckets remain UTC; changing display timezone does not regroup the series. The detail overlay compares the same application with the preceding equivalent window.

At `/administration/calculations`, select an application and dates to compare original and preview. The UI end date includes the whole UTC day; the API receives `[from,to)`. Preview is public, uses the current model and current factors for historical regions, and saves or replaces no results. Limits: 30 days and 10,000 observations. Response fields are `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Factor failure preserves calculable energy while CO₂e remains unavailable. Percentages require matching units/coverage and a positive reference.

At `/methodology`, energy, emissions, coverage and analysis tabs provide examples and personal preferences. Any authenticated role can save its own tab using optimistic revisions; 409 means conflict. Thresholds affect presentation, not global settings, calculations or external notifications. Saved period/granularity only fill missing detail URL options. Recorded methodology remains at `/services/:id/methodology`, with `collectionId` when selected.

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.
