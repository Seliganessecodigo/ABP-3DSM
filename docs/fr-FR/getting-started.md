# Démarrage

Cette partie s’adresse au développement et à l’exploitation. Elle décrit environnement local, contrats et vérifications. Pour apprendre à utiliser le produit, consultez le guide d’utilisation.

## Configuration {#requirements}

Node.js 24+, npm, Docker Compose v2. Copier `.env.example` vers `.env` ; lancer `npm run dev`. Compose applique les migrations et tente la découverte ; une panne de source n’empêche pas le démarrage. Configurer SMTP pour invitations/confirmations. Premier Admin : script `organizations:create-invitation` dans `backend/`, avec `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Aucun Admin universel de production.

## Par où commencer {#start}

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

| Fonction | URI |
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

## Lectures associées {#related}

[Guide d’utilisation](./guide/monitoring) · [Exploitation et diagnostic](./operations)
