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
