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

## Operazione e diagnosi — JWT / Google / SMTP

Node.js 24+, npm, Docker Compose v2. Copiare `.env.example` in `.env`; eseguire `npm run dev`. Compose applica migration e tenta scoperta; errore origine non impedisce avvio API. SMTP per inviti/conferme. Primo Admin: `organizations:create-invitation` in `backend/`, con `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Nessun Admin universale di produzione.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Dashboard e consultazioni ambientali pubblici. `/login`: e-mail/password o Google abilitato. Admin configura/conferma TOTP di sei cifre anche dopo Google; Analyst/Visitor non ottengono permessi amministrativi. Sessione frontend in memoria: reload richiede login. Backend verifica JWT, sessione, ruolo/stato attuali; 401 per credenziali assenti/invalide, 403 per ruolo insufficiente. Nuove rotte protette per default.

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


Registrare in Google Cloud la URI esatta `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` abilita solo il pulsante, non configura backend o account: collegamento tramite invito. `GOOGLE_CLIENT_SECRET`, JWT, pepper e chiavi TOTP sono segreti backend; usare valori indipendenti e conservare versioni necessarie. SMTP invia inviti/conferme. Supporto usa `authentication:recover-admin-totp` dopo verifica indipendente dell’autorità organizzativa; revoca sessioni e registra audit.
