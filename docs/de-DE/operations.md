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
