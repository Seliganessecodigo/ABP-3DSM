# Operazione e diagnosi

Meccanismi esistenti, senza SLA produzione. Installazione: [Per iniziare](./getting-started); contratto: [API](./reference/api).

## Configurazione

| Configurazione | Uso |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Porte pubblicate da Compose. |
| DATABASE_URL | Backend host/cloud; Compose usa servizio interno `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Fonti solo backend. |
| CORS_ORIGIN | Origine frontend autorizzata corrispondente all’accesso reale. |
| VITE_API_URL | URL nel build o ambiente sviluppo frontend. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Scheduler backend, default 60 secondi. |
| MONITORING_METRICS_CONCURRENCY | Per processo, default iniziale 2; non quota fonte. |

Monitoraggio: interi positivi. Compose non inoltra automaticamente queste due chiavi `.env`; override richiede mapping esplicito. Credenziali d’esempio solo locali.

## Verifica ambiente

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

Scoperta manuale ripetibile senza identità duplicate. Scheduler dopo primo intervallo; protezione sovrapposizione per processo, non fra repliche. Polling UI e raccolta indipendenti.

`/health` non prova catalogo popolato, fonte raggiungibile o calcolo possibile. Verificare `/applications`, evidenze e log cicli.

## Diagnosi

| Sintomo | Verificare |
| --- | --- |
| Container non partono | Docker, porte, variabili, migration. |
| UI aperta, catalogo fallisce | URL build, CORS, API, database. |
| Catalogo vuoto | Scoperta/aggregatore; vuoto non errore HTTP. |
| Dati vecchi | Ora osservazione, errore tentativo, riepilogo ciclo. |
| Pipeline fallita, API risponde | Qualità, pacchetto, deploy o smoke; pubblicazione può precedere errore successivo. |

## Pubblicazione e recupero

Staging da `develop`, con CI e job separati API (Azure App Service)/frontend (Static Web Apps). Smoke dopo deploy API. Registrare run, SHA, fase e diagnosi prima di ripetere.

Pages usa VitePress e `DOCS_BASE=/ABP-3DSM/`; build locale non prova pubblicazione. Workflows non dimostrano ripristino automatico database. Prima di rollback/migration distruttiva controllare compatibilità e backup ripristinabile. Conservazione/esercizi ripristino [pendenti](./product/decisions). `npm run dev:down` conserva volume; eliminarlo cancella database locale.
