# Betrieb und Diagnose

Dieser Teil richtet sich an Entwicklung und Betrieb und beschreibt lokale Umgebung, Verträge und Prüfungen. Zur Produktnutzung lesen Sie das Benutzerhandbuch.

## Konfiguration {#environment}

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

## Automatische Überwachung {#monitoring}

Überwachung startet nach dem ersten Intervall, ohne überlappende Zyklen je Prozess. Intervall/Parallelität sind positive Ganzzahlen. Compose übergibt `MONITORING_SCHEDULE_INTERVAL_SECONDS` und `MONITORING_METRICS_CONCURRENCY` nicht automatisch aus `.env`; explizite Zuordnung ist nötig. `/health` prüft HTTP, nicht Erkennung/Berechnung. Katalog, Nachweise und Logs prüfen. Quellfehler bestätigt keine Entfernung; Erholung nach drei gültigen Beobachtungen in Folge.

Das erste Fehlen in einem vollständigen gültigen Snapshot bestätigt die Entfernung. Jeder externe Aufruf hat insgesamt 30 Sekunden und höchstens drei HTTP-Versuche einschließlich des ersten; nur vorübergehende Fehler werden wiederholt.

## Anmelden {#authentication}

Node.js 24+, npm, Docker Compose v2. `.env.example` nach `.env` kopieren; `npm run dev`. Compose migriert und versucht Erkennung; Quellfehler verhindert API-Start nicht. SMTP für Einladungen/Bestätigungen konfigurieren. Erster Admin: `organizations:create-invitation` in `backend/`, mit `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Kein universelles Produktionskonto.

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

In Google Cloud exakt `GOOGLE_CALLBACK_URL` registrieren. `VITE_GOOGLE_SSO_ENABLED=true` aktiviert nur den Knopf, konfiguriert weder Backend noch Konten; Verknüpfung verlangt Einladung. `GOOGLE_CLIENT_SECRET`, JWT, Pepper und TOTP-Schlüssel bleiben Backend-Geheimnisse; unabhängige Werte und nötige frühere Versionen verwenden. SMTP versendet Einladungen/Bestätigungen. Support nutzt `authentication:recover-admin-totp` nach unabhängiger Prüfung der Organisationsbefugnis; Sitzungen werden widerrufen, Vorgang auditiert.

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

## Diagnose {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Bereitstellung und Wiederherstellung {#release}

Staging folgt `develop` nach CI: API in Azure App Service, Frontend in Static Web Apps, Endpoint-Prüfung nach API. Dokumentation: GitHub Pages mit `DOCS_BASE=/ABP-3DSM/`. Fehlgeschlagenen Schritt vor Wiederholung ermitteln. Keine automatische DB-Wiederherstellung. `npm run dev:down` erhält das Volume; Entfernen löscht lokale Daten.

## Weiterführende Seiten {#related}

[Erste Schritte](./getting-started) · [API-Referenz](./reference/api)
