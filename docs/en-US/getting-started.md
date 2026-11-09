# Getting started

This part of the documentation is for development and operations. It covers the local environment, contracts and checks. To learn how to use the product, read the user guide.

## Configuration {#requirements}

Use Node.js 24+, npm and Docker Compose v2. Copy `.env.example` to `.env` and run `npm run dev`. Compose applies migrations and attempts discovery before API startup; source failure does not prevent startup. Configure SMTP for invitations and confirmations. Provision the first Admin with `organizations:create-invitation` in `backend/`, setting `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. There is no universal production Admin account.

## Where to start {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| Feature | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Configuration {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Related reading {#related}

[User guide](./guide/monitoring) · [Operations and diagnosis](./operations)
