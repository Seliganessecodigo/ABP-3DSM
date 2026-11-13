# Per iniziare

Questa parte si rivolge a sviluppo e operazioni: ambiente locale, contratti e verifiche. Per usare il prodotto, consultate la guida all’uso.

## Configurazione {#requirements}

Node.js 24+, npm, Docker Compose v2. Copiare `.env.example` in `.env`; eseguire `npm run dev`. Compose applica migration e tenta scoperta; errore origine non impedisce avvio API. SMTP per inviti/conferme. Primo Admin: `organizations:create-invitation` in `backend/`, con `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Nessun Admin universale di produzione.

## Da dove iniziare {#start}

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

| Funzione | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Configurazione {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Letture correlate {#related}

[Guida all’uso](./guide/monitoring) · [Operazione e diagnosi](./operations)
