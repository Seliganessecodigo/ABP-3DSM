# Betrieb und Diagnose

Vorhandene Mechanismen, kein Produktions-SLA. Installation: [Erste Schritte](./getting-started); Vertrag: [API](./reference/api).

## Konfiguration

| Einstellung | Zweck |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Von Compose veröffentlichte Ports. |
| DATABASE_URL | Host-/Cloud-Backend; Compose nutzt intern `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Nur vom Backend genutzte Quellen. |
| CORS_ORIGIN | Erlaubter tatsächlicher Frontend-Ursprung. |
| VITE_API_URL | API-URL im Frontend-Build oder Entwicklungsumgebung. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Backend-Scheduler, Standard 60 Sekunden. |
| MONITORING_METRICS_CONCURRENCY | Pro Prozess, initial 2; keine Quellquote. |

Monitoringwerte müssen positive Ganzzahlen sein. Compose reicht diese zwei `.env`-Schlüssel nicht automatisch weiter; Überschreiben braucht explizite Umgebungszuordnung. Beispielzugänge nur lokal.

## Umgebung prüfen

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

Manuelle Erkennung ohne doppelte Identitäten wiederholbar. Scheduler nach erstem Intervall; Überschneidungsschutz nur pro Prozess, nicht zwischen Replikas. UI-Polling und Sammlung unabhängig.

`/health` beweist weder gefüllten Katalog noch erreichbare Quelle oder berechenbaren Indikator. `/applications`, Belege und Zykluslogs prüfen.

## Diagnose

| Symptom | Prüfung |
| --- | --- |
| Container starten nicht | Docker, Ports, Variablen, Migrationen. |
| UI erreichbar, Katalog fehlerhaft | Build-URL, CORS, API, Datenbank. |
| Leerer Katalog | Ersterkennung/Aggregator; leer ist kein HTTP-Fehler. |
| Alte Daten | Beobachtungszeit, aktueller Fehler, Zyklusübersicht. |
| Pipeline fehlerhaft, API erreichbar | Qualität, Paket, Deployment, Smoke-Test unterscheiden; Deployment kann späterem Fehler vorausgehen. |

## Veröffentlichung und Wiederherstellung

Staging aus `develop` mit CI und separaten API-Jobs (Azure App Service)/Frontend-Jobs (Static Web Apps). Smoke-Test nach API-Deployment. Vor Wiederholung Run, SHA, Schritt, Diagnose festhalten.

Pages nutzt VitePress und `DOCS_BASE=/ABP-3DSM/`; lokaler Build beweist kein Deployment. Automatische Datenbankwiederherstellung ist nicht nachgewiesen. Vor Rollback/destruktiver Migration Kompatibilität und wiederherstellbares Backup prüfen. Aufbewahrung/Restore-Übungen sind [offen](./product/decisions). `npm run dev:down` bewahrt Volumes; Löschen entfernt die lokale Datenbank.

## Betrieb und Diagnose — JWT / Google / SMTP

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

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


In Google Cloud exakt `GOOGLE_CALLBACK_URL` registrieren. `VITE_GOOGLE_SSO_ENABLED=true` aktiviert nur den Knopf, konfiguriert weder Backend noch Konten; Verknüpfung verlangt Einladung. `GOOGLE_CLIENT_SECRET`, JWT, Pepper und TOTP-Schlüssel bleiben Backend-Geheimnisse; unabhängige Werte und nötige frühere Versionen verwenden. SMTP versendet Einladungen/Bestätigungen. Support nutzt `authentication:recover-admin-totp` nach unabhängiger Prüfung der Organisationsbefugnis; Sitzungen werden widerrufen, Vorgang auditiert.
