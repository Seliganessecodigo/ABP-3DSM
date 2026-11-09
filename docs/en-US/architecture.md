# Architecture

## Components

The local environment uses Docker Compose to run three services: the frontend, API, and PostgreSQL.

| Area | Responsibility | Technologies |
| --- | --- | --- |
| `frontend/` | User interface, navigation, and presentation | React 19, TypeScript, Vite, i18next |
| `backend/` | API, use cases, and external integrations | NestJS, TypeScript, TypeORM |
| PostgreSQL | Application and domain data persistence | PostgreSQL 18 |

The frontend calls only the GreenER API. Only the backend connects to the Metrics Aggregator and Carbon Intensity Service.

## Code organization

- `frontend/src/pages/` keeps each screen with its hooks, translations, and CSS Modules.
- `frontend/src/features/` owns domain contracts, validation, HTTP access, cache, and pure rules.
- `backend/src/modules/` groups endpoints and use cases by domain.
- `backend/src/integrations/` adapts and validates responses from auxiliary APIs.
- `backend/src/database/` contains entities, migrations, and repositories.

## Data and reliability

The backend integrates with data sources and persists their data. It follows documented contracts, schemas, and units. Errors, missing values, invalid responses, stale data, and valid zero values are distinct states; screens must preserve that distinction.

See the [external API contracts in the repository](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) and the [frontend organization guide](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md) for implementation details.

## Further reading

[Methodology and data](./product/methodology) · [API reference](./reference/api) · [Operations and diagnosis](./operations)

## Architecture — c343698

React 19/TypeScript/Vite presents data; NestJS/TypeORM/PostgreSQL 18 integrates and persists it. Only the backend contacts auxiliary sources. Controllers handle transport, services coordinate use cases, adapters validate sources and repositories persist data. Global authentication/role guards protect routes; `PublicRoute` marks public exceptions. Preferences belong to the authenticated user; shared audit lives in `backend/src/shared/audit/` and joins successful mutation transactions.

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
