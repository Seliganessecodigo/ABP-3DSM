# Operations and diagnosis

This part of the documentation is for development and operations. It covers the local environment, contracts and checks. To learn how to use the product, read the user guide.

## Configuration {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## Automatic monitoring {#monitoring}

Monitoring starts after the first interval and prevents overlapping cycles per process. Interval and concurrency must be positive integers. Compose does not automatically forward `MONITORING_SCHEDULE_INTERVAL_SECONDS` and `MONITORING_METRICS_CONCURRENCY` from `.env` to the API; overrides need explicit mapping. `/health` checks HTTP response, not discovery or calculation. Check catalog, evidence and logs. Source failures do not confirm removal; incidents recover after three consecutive valid observations.

The first absence in a complete valid snapshot confirms removal. Each external call has a 30-second total deadline and at most three HTTP attempts including the initial one; only transient failures are retried.

## Sign in {#authentication}

Use Node.js 24+, npm and Docker Compose v2. Copy `.env.example` to `.env` and run `npm run dev`. Compose applies migrations and attempts discovery before API startup; source failure does not prevent startup. Configure SMTP for invitations and confirmations. Provision the first Admin with `organizations:create-invitation` in `backend/`, setting `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. There is no universal production Admin account.

First access on the website has two steps: open the invitation at `/setup-admin`, enter your name and email, then open the confirmation at `/confirm-email` to create your password. Next, sign in and set up the required Admin authenticator. Invalid, expired or used links explain how to request a replacement; tokens are removed from the URL and remain only in page memory. After a page reload, reopen the original email link. SMTP must deliver to a real mailbox; `.test` addresses are illustrative only. On Azure, the operator issues the first invitation from the configured backend console with `npm run organizations:create-invitation:prod`; the invited person completes registration on the website. `APP_BASE_URL` must point to the published frontend. `frontend/public/staticwebapp.config.json` enables direct access to hosted routes.

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

Register the exact `GOOGLE_CALLBACK_URL` in Google Cloud. Setting `VITE_GOOGLE_SSO_ENABLED=true` only enables the button; it neither configures the backend nor provisions accounts: linking requires an invitation. `GOOGLE_CLIENT_SECRET`, JWT, pepper and TOTP keys are backend secrets; use independent non-development values and retain versions needed for reading. Email confirmation and invitations require SMTP. Support runs `authentication:recover-admin-totp` only after independently verifying organizational authority; recovery revokes sessions and is audited.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## Diagnosis {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Deployment and recovery {#release}

Staging deploys from `develop` after CI: API to Azure App Service and frontend to Static Web Apps, with endpoint checks after the API. Documentation deploys to GitHub Pages with `DOCS_BASE=/ABP-3DSM/`. Identify the failing stage before retrying a deployment. This flow provides no automatic database restore. `npm run dev:down` preserves the volume; removing the volume deletes local data.

## Related reading {#related}

[Getting started](./getting-started) · [API reference](./reference/api)
