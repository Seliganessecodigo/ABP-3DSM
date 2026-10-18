# GreenER API reference

Routes below were checked against `develop` source on 2026-10-15. Local Swagger is at `http://localhost:3000/docs` and the schema at `/openapi.json`. Use the target environment's OpenAPI for complete DTOs.

## Existing read routes

| Method and route | Result |
| --- | --- |
| GET /health | Service HTTP health response. |
| GET /applications | Persisted catalog array; `[]` is valid. |
| GET /applications/{id} | Known application with state, timestamps and location. |
| GET /applications/{id}/collections/latest | Most recent valid observation and operational context. |
| GET /applications/{id}/collections/{collectionId} | Observation scoped to its application; collectionId is a UUID. |
| GET /applications/{id}/collections/{collectionId}/methodology | Applied methodology with version, formula, units, parameters and snapshot. |
| GET /openapi.json | Machine-readable contract. |

These reads use persisted data and trigger neither collection nor environmental calculation. Catalog search and pagination currently run in the frontend; no server pagination parameters are documented on these routes.

## Local requests

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Use an ID returned by the catalog for detail requests and URL-encode the path segment. Do not assume sequential IDs or UUID application IDs.

The application DTO includes `id`, `name`, `state`, `firstSeenAt`, `lastCheckedAt`, `removedAt` and `location`. The backend also exposes reason, freshness and calculability; the current UI does not consume every field. City may be null; incomplete legacy records can have `location: null`.

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
