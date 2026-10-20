# Erste Schritte

## Voraussetzungen

- Docker Desktop mit Docker Compose v2 unter dem Befehl `docker compose`.
- Node.js 24 oder neuer und npm zum Ausführen der Root-Skripte.

## Umgebung starten

Repository klonen und in das Projektverzeichnis wechseln:

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Lokale Konfiguration aus der Beispieldatei erstellen:

```powershell
Copy-Item .env.example .env
```

Unter macOS oder Linux:

```sh
cp .env.example .env
```

Frontend, API und PostgreSQL starten:

```sh
npm run dev
```

Compose installiert die Abhängigkeiten in den Containern. Ausstehende Migrationen werden vor dem API-Start ausgeführt. Die API versucht beim Start, Anwendungen zu entdecken. Ist der Aggregator nicht erreichbar, protokolliert sie den Fehler und startet trotzdem.

## Lokale Adressen

| Dienst | Adresse |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| API-Healthcheck | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## Nützliche Befehle

| Befehl | Aktion |
| --- | --- |
| `npm run dev:detached` | Dienste im Hintergrund starten |
| `npm run dev:logs` | Dienstprotokolle verfolgen |
| `npm run dev:down` | Container stoppen und Datenvolume behalten |
| `docker compose up --build` | Images neu erstellen |

Um die Erkennung ohne API-Neustart erneut auszuführen: `docker compose exec api npm run applications:discover`.

## Häufige Probleme

- Wird Docker nicht gefunden, Docker Desktop starten und `docker compose version` prüfen.
- Ist ein Port belegt, `FRONTEND_PORT`, `API_PORT` oder `POSTGRES_PORT` in `.env` ändern.
- Wird die API nicht gesund, `npm run dev:logs` prüfen. Die API benötigt PostgreSQL und führt beim Start Migrationen aus.
- Werte in `.env.example` sind nur für die lokale Entwicklung bestimmt. Echte Zugangsdaten und die Datei `.env` nicht einchecken.
