# GreenER API reference

Routes below were checked against `develop` source on 2026-10-23 (commit `1633ca2`). Local Swagger is at `http://localhost:3000/docs` and the schema at `/openapi.json`. Use the target environment's OpenAPI for complete DTOs.

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

Only the backend calls auxiliary sources. Source contracts and units are in the [versioned reference](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). This page does not publish future energy, authentication or administration endpoints. JWT-protected administration is an [EP06](../backlog/ep06) requirement, not an assumed available API.

See [Operations](../operations) for URL, CORS and diagnosis, and [Methodology](../product/methodology) for intervals and metric interpretation.

## Query environmental analysis

`GET /applications/{id}/analysis` requires `from` and `to` as RFC 3339 timestamps with an explicit timezone. The start is inclusive, the end is exclusive, and both are normalized to UTC. The response contains `status` (`available` or `empty`), period, energy, emissions, separate coverage, and provenance (methodologies, queried factors, and reasons). A `null` value means no usable result; zero is a valid value.

| HTTP / code | Meaning |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Invalid timestamp, missing timezone, or `to` less than or equal to `from`. |
| 404 / APPLICATION_NOT_FOUND | Unknown application. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Failure while reading analysis or persisted results. |

Per-application summary and series are integrated into the detail screen. The bucket contribution query is also used there; the current frontend requests its first page, while interactive pagination is still pending.

## Query environmental time series

`GET /applications/{id}/analysis/series` requires `from`, `to`, and `granularity` (`hour`, `day`, `month`, or `year`). The response contains `points`, `events`, totals, and coverage. UTC calendar buckets count only their overlap with the requested range and can be partial. Requests that would produce more than 10,000 points are rejected; the server does not truncate or change granularity.

`GET /applications/{id}/analysis/series/contributions` also requires `bucketStart`; optional `page` defaults to 1 and `pageSize` defaults to 10. Allowed sizes are `5`, `10`, `15`, `20`, and `all`; `all` is valid only on page 1. The response includes contributions and exclusions with saved methodology and factor snapshots.

## Query aggregate summary

`GET /analysis/summary` requires `from` and `to`; repeatable optional filters are `states`, `regionCodes`, and `applicationIds`. The response includes totals, coverage, counts by operational state, applications, `dataAsOf`, and provenance. This endpoint exists, but there is no dedicated aggregate dashboard in the interface yet.

## Query monitoring incidents

`GET /monitoring/incidents` accepts `applicationId`, `source`, `integration`, `status`, `page`, and `limit`. Status is `OPEN`, `RECOVERING`, or `RESOLVED`; defaults are page 1 and limit 20. The response contains `items`, `total`, `page`, and `limit`. Use OpenAPI for current limits and enum values.
