# Per iniziare

## Prerequisiti

- Docker Desktop con Docker Compose v2 disponibile come `docker compose`.
- Node.js 24 o successivo e npm per eseguire gli script dalla cartella principale.

## Avviare l'ambiente

Clona il repository e apri la sua cartella:

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Crea la configurazione locale partendo dal file di esempio:

```powershell
Copy-Item .env.example .env
```

Su macOS o Linux:

```sh
cp .env.example .env
```

Avvia frontend, API e PostgreSQL:

```sh
npm run dev
```

Compose installa le dipendenze nei container. Le migrazioni in sospeso vengono eseguite prima dell'avvio dell'API. L'API tenta di individuare le applicazioni all'avvio; se l'aggregatore non è disponibile, registra l'errore e continua ad avviarsi.

## Indirizzi locali

| Servizio | Indirizzo |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| Stato dell'API | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## Comandi utili

| Comando | Azione |
| --- | --- |
| `npm run dev:detached` | Avvia i servizi in background |
| `npm run dev:logs` | Segue i log dei servizi |
| `npm run dev:down` | Arresta i container mantenendo il volume dati |
| `docker compose up --build` | Ricostruisce le immagini |

Per ripetere l'individuazione senza riavviare l'API, esegui `docker compose exec api npm run applications:discover`.

## Problemi comuni

- Se Docker non viene trovato, avvia Docker Desktop e verifica `docker compose version`.
- Se una porta è occupata, modifica `FRONTEND_PORT`, `API_PORT` o `POSTGRES_PORT` in `.env`.
- Se l'API non diventa disponibile, consulta `npm run dev:logs`. Dipende da PostgreSQL ed esegue le migrazioni all'avvio.
- I valori di `.env.example` sono solo per lo sviluppo locale. Non condividere credenziali reali né il file `.env`.
