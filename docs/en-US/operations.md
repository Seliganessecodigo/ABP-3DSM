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

## Operations and diagnosis — JWT / Google / SMTP

Use Node.js 24+, npm and Docker Compose v2. Copy `.env.example` to `.env` and run `npm run dev`. Compose applies migrations and attempts discovery before API startup; source failure does not prevent startup. Configure SMTP for invitations and confirmations. Provision the first Admin with `organizations:create-invitation` in `backend/`, setting `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. There is no universal production Admin account.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


Register the exact `GOOGLE_CALLBACK_URL` in Google Cloud. Setting `VITE_GOOGLE_SSO_ENABLED=true` only enables the button; it neither configures the backend nor provisions accounts: linking requires an invitation. `GOOGLE_CLIENT_SECRET`, JWT, pepper and TOTP keys are backend secrets; use independent non-development values and retain versions needed for reading. Email confirmation and invitations require SMTP. Support runs `authentication:recover-admin-totp` only after independently verifying organizational authority; recovery revokes sessions and is audited.
