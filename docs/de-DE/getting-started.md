# Erste Schritte

Dieser Teil richtet sich an Entwicklung und Betrieb und beschreibt lokale Umgebung, Verträge und Prüfungen. Zur Produktnutzung lesen Sie das Benutzerhandbuch.

## Konfiguration {#requirements}

Node.js 24+, npm, Docker Compose v2. `.env.example` nach `.env` kopieren; `npm run dev`. Compose migriert und versucht Erkennung; Quellfehler verhindert API-Start nicht. SMTP für Einladungen/Bestätigungen konfigurieren. Erster Admin: `organizations:create-invitation` in `backend/`, mit `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Kein universelles Produktionskonto.

## Wo beginnen {#start}

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

| Funktion | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Konfiguration {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Weiterführende Seiten {#related}

[Benutzerhandbuch](./guide/monitoring) · [Betrieb und Diagnose](./operations)
