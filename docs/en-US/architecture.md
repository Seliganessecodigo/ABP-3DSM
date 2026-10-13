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
