# Bien démarrer

## Prérequis

- Docker Desktop avec Docker Compose v2 accessible via `docker compose`.
- Node.js 24 ou supérieur et npm pour exécuter les scripts à la racine.

## Démarrer l’environnement

Clonez le dépôt et ouvrez son dossier :

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Créez la configuration locale à partir du fichier d’exemple :

```powershell
Copy-Item .env.example .env
```

Sur macOS ou Linux :

```sh
cp .env.example .env
```

Démarrez le frontend, l’API et PostgreSQL :

```sh
npm run dev
```

Compose installe les dépendances dans les conteneurs. Les migrations en attente sont exécutées avant le démarrage de l’API. L’API tente de découvrir les applications au démarrage ; si l’agrégateur est indisponible, elle journalise l’échec et continue de démarrer.

## Adresses locales

| Service | Adresse |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| Santé de l’API | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## Commandes utiles

| Commande | Action |
| --- | --- |
| `npm run dev:detached` | Démarre les services en arrière-plan |
| `npm run dev:logs` | Suit les journaux des services |
| `npm run dev:down` | Arrête les conteneurs et conserve le volume de données |
| `docker compose up --build` | Reconstruit les images |

Pour relancer la découverte sans redémarrer l’API, exécutez `docker compose exec api npm run applications:discover`.

## Problèmes courants

- Si Docker est introuvable, démarrez Docker Desktop et vérifiez `docker compose version`.
- Si un port est déjà utilisé, modifiez `FRONTEND_PORT`, `API_PORT` ou `POSTGRES_PORT` dans `.env`.
- Si l’API n’est pas saine, consultez `npm run dev:logs`. Elle dépend de PostgreSQL et applique les migrations au démarrage.
- Les valeurs de `.env.example` sont réservées au développement local. Ne partagez pas de véritables identifiants ni le fichier `.env`.
