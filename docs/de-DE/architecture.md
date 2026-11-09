# Architektur

## Komponenten

Die lokale Umgebung verwendet Docker Compose für drei Dienste: Frontend, API und PostgreSQL.

| Bereich | Verantwortung | Technologien |
| --- | --- | --- |
| `frontend/` | Benutzeroberfläche, Navigation und Darstellung | React 19, TypeScript, Vite, i18next |
| `backend/` | API, Anwendungsfälle und externe Integrationen | NestJS, TypeScript, TypeORM |
| PostgreSQL | Speicherung von Anwendungen und Domänendaten | PostgreSQL 18 |

Das Frontend ruft ausschließlich die GreenER-API auf. Nur das Backend verbindet sich mit dem Metrics Aggregator und dem Carbon Intensity Service.

## Codeorganisation

- `frontend/src/pages/` enthält jede Seite zusammen mit Hooks, Übersetzungen und CSS Modules.
- `frontend/src/features/` verantwortet Domänenverträge, Validierung, HTTP-Zugriff, Cache und reine Regeln.
- `backend/src/modules/` gruppiert Endpunkte und Anwendungsfälle nach Domäne.
- `backend/src/integrations/` passt Antworten der Hilfs-APIs an und validiert sie.
- `backend/src/database/` enthält Entitäten, Migrationen und Repositories.

## Daten und Zuverlässigkeit

Das Backend integriert Datenquellen und speichert deren Daten. Es hält dokumentierte Verträge, Schemas und Einheiten ein. Fehler, fehlende Werte, ungültige Antworten, veraltete Daten und gültige Nullwerte sind unterschiedliche Zustände; die Benutzeroberfläche muss diese Unterscheidung erhalten.

Details stehen in den [Verträgen der externen APIs im Repository](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) und im [Leitfaden zur Frontend-Organisation](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md).

## Weiterführende Seiten

[Methodik und Daten](./product/methodology) · [API-Referenz](./reference/api) · [Betrieb und Diagnose](./operations)

## Architektur — c343698

React 19/TypeScript/Vite zeigt Daten; NestJS/TypeORM/PostgreSQL 18 integriert und speichert. Nur Backend ruft Hilfsquellen ab. Controller: Transport; Services: Anwendungsfälle; Adapter: Validierung; Repositories: Speicherung. Globale Guards und `PublicRoute`-Ausnahmen. Einstellungen pro Benutzer; Audit in `backend/src/shared/audit/`, bei Erfolg transaktional.

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
