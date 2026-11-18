# Operazione e diagnosi

Questa parte si rivolge a sviluppo e operazioni: ambiente locale, contratti e verifiche. Per usare il prodotto, consultate la guida all’uso.

## Configurazione {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## Monitoraggio automatico {#monitoring}

Monitoraggio dopo il primo intervallo, senza sovrapposizione per processo. Intervallo/concorrenza interi positivi. Compose non passa automaticamente `MONITORING_SCHEDULE_INTERVAL_SECONDS` e `MONITORING_METRICS_CONCURRENCY` da `.env`: serve mappatura esplicita. `/health` verifica HTTP, non scoperta/calcolo. Controllare catalogo, evidenze e log. Errori fonte non confermano rimozione; recupero dopo tre osservazioni valide consecutive.

La prima assenza in uno snapshot completo e valido conferma la rimozione. Ogni chiamata esterna ha scadenza totale di 30 secondi e massimo tre tentativi HTTP incluso il primo; solo errori temporanei vengono ritentati.

## Accedere {#authentication}

Node.js 24+, npm, Docker Compose v2. Copiare `.env.example` in `.env`; eseguire `npm run dev`. Compose applica migration e tenta scoperta; errore origine non impedisce avvio API. SMTP per inviti/conferme. Primo Admin: `organizations:create-invitation` in `backend/`, con `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Nessun Admin universale di produzione.

Il primo accesso al sito ha due passaggi: aprire l’invito su `/setup-admin`, inserire nome ed e-mail e poi aprire la conferma su `/confirm-email` per creare la password. Accedere quindi e configurare l’autenticatore obbligatorio dell’Admin. I link non validi, scaduti o usati spiegano come richiederne uno nuovo; i token vengono rimossi dall’URL e restano solo nella memoria della pagina. Dopo un ricaricamento, riaprire il link originale dell’e-mail. SMTP deve recapitare a una casella reale; gli indirizzi `.test` sono esempi. Su Azure, l’operatore emette il primo invito dalla console del backend configurato con `npm run organizations:create-invitation:prod`; la persona invitata completa la registrazione sul sito. `APP_BASE_URL` deve puntare al frontend pubblicato. `frontend/public/staticwebapp.config.json` consente l’accesso diretto alle rotte ospitate.

In **Utenti** (`/administration/users`), l’amministratore consulta gli account dell’organizzazione e invia inviti Google. **Collega il mio account Google** compila il modulo con i propri dati; conferma l’invio e apri il link con l’account Google dello stesso indirizzo email. La corrispondenza dell’email non collega automaticamente le identità. Gli account nuovi appaiono dopo l’accettazione; gli inviti in attesa non sono account. Un nuovo invio revoca l’invito precedente. Gli account esistenti mantengono nome, ruolo e password; TOTP resta obbligatorio per gli amministratori. Staging legge `VITE_GOOGLE_SSO_ENABLED` dalle variabili GitHub: imposta `true` solo dopo aver configurato credenziali e URL del backend. `GOOGLE_CALLBACK_URL` usa l’indirizzo pubblico dell’API seguito da `/auth/sso/google/callback`, mentre `SSO_RETURN_URL` usa quello del frontend seguito da `/sso/callback`.

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

Registrare in Google Cloud la URI esatta `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` abilita solo il pulsante, non configura backend o account: collegamento tramite invito. `GOOGLE_CLIENT_SECRET`, JWT, pepper e chiavi TOTP sono segreti backend; usare valori indipendenti e conservare versioni necessarie. SMTP invia inviti/conferme. Supporto usa `authentication:recover-admin-totp` dopo verifica indipendente dell’autorità organizzativa; revoca sessioni e registra audit.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## Diagnosi {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Pubblicazione e ripristino {#release}

Staging da `develop` dopo CI: API su Azure App Service, frontend su Static Web Apps, verifica endpoint dopo API. Documentazione su GitHub Pages con `DOCS_BASE=/ABP-3DSM/`. Identificare fase fallita prima di ripetere. Nessun ripristino automatico DB. `npm run dev:down` conserva volume; rimuoverlo elimina dati locali.

## Letture correlate {#related}

[Per iniziare](./getting-started) · [Riferimento API](./reference/api)

## Diagnosticare risposte lente {#response-performance}

Confronta il tempo al primo byte, la dimensione della risposta e il piano di esecuzione prima di attribuire la lentezza al database. Il Dashboard consulta `/analysis/summary` con `includeProvenance=false`: conserva valori, copertura e serie, mentre la risposta indica `provenanceIncluded=false` ed esclude gli elenchi di provenienza. La richiesta completa resta predefinita. La proiezione compatta non trasferisce i fattori di ogni raccolta; il calcolo ordina gli intervalli ed evita un secondo ordinamento nel database.
