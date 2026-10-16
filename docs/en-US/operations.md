# Operations and diagnosis

This guide describes existing mechanisms, not a production SLA. Use [Getting started](./getting-started) for installation and [API reference](./reference/api) for contracts.

## Configuration boundaries

| Setting | Responsibility |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Compose's published ports. |
| DATABASE_URL | Host/cloud backend; Compose's internal URL uses service `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Sources used only by the backend. |
| CORS_ORIGIN | Allowed frontend origin; match the address actually used. |
| VITE_API_URL | API URL embedded at frontend build time or supplied in development. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Backend scheduler interval; default 60 seconds. |
| MONITORING_METRICS_CONCURRENCY | Per-process concurrency; initial default 2, not a source-published quota. |

Both monitoring values must be positive integers. Current Compose does not automatically forward those two `.env` keys into the container; overriding them there requires explicit environment mapping. Example credentials are local-only, never shared-environment credentials.

## Check the local environment

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

Manual discovery is repeatable without duplicate identities. The scheduler starts after its first interval; overlap protection is per process, not distributed across replicas. UI polling and collection are independent clocks.

A responding `/health` does not prove a populated catalog, reachable source or calculable environmental indicator. Also check `/applications`, available evidence and cycle logs.

## Diagnose by symptom

| Symptom | Check |
| --- | --- |
| Containers fail to start | Docker, port conflicts, variables and migration logs. |
| UI loads but catalog fails | Build-time API URL, CORS, API response and database access. |
| Catalog returns empty | Initial discovery and aggregator connectivity; empty is not an HTTP error. |
| Old data remains visible | Observation time, current attempt failure and cycle summary. |
| Pipeline fails but API responds | Identify quality, package, deployment or smoke-test failure; a stage may deploy before a later stage fails. |

## Deployment and recovery

Staging runs from `develop` and depends on CI. Separate jobs package the API for Azure App Service and the frontend for Static Web Apps; a smoke test checks endpoints after API deployment. Record run, SHA, stage and diagnosis before rerunning.

The website uses VitePress and the Pages workflow with `DOCS_BASE=/ABP-3DSM/`. A successful local build does not prove publication completed.

These workflows demonstrate no automatic database restoration. Before rollback or destructive migration, check compatibility and a recoverable backup. Retention and restore drills remain [explicit dependencies](./product/decisions). `npm run dev:down` preserves the volume; deleting volumes removes the local database.
