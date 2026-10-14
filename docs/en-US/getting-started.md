# Getting started

## Prerequisites

- Docker Desktop with Docker Compose v2 available as `docker compose`.
- Node.js 24 or later and npm to run the root scripts.

## Start the environment

Clone the repository and open its directory:

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Create a local configuration from the example:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```sh
cp .env.example .env
```

Start the frontend, API, and PostgreSQL:

```sh
npm run dev
```

Compose installs dependencies inside the containers. Pending migrations run before the API starts. The API attempts application discovery at startup; if the aggregator is unavailable, it logs the failure and continues starting.

## Local addresses

| Service | Address |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| API health check | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## Useful commands

| Command | Action |
| --- | --- |
| `npm run dev:detached` | Start services in the background |
| `npm run dev:logs` | Follow service logs |
| `npm run dev:down` | Stop containers and keep the data volume |
| `docker compose up --build` | Rebuild the images |

To repeat discovery without restarting the API, run `docker compose exec api npm run applications:discover`.

## Common issues

- If Docker is not found, start Docker Desktop and check `docker compose version`.
- If a port is already in use, update `FRONTEND_PORT`, `API_PORT`, or `POSTGRES_PORT` in `.env`.
- If the API does not become healthy, inspect `npm run dev:logs`. It depends on PostgreSQL and runs migrations at startup.
- Values in `.env.example` are for local development only. Do not commit real credentials or the `.env` file.
