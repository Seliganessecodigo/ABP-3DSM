# Architektur

Dieser Teil richtet sich an Entwicklung und Betrieb und beschreibt lokale Umgebung, Verträge und Prüfungen. Zur Produktnutzung lesen Sie das Benutzerhandbuch.

## Technische Dokumentation {#components}

React 19/TypeScript/Vite zeigt Daten; NestJS/TypeORM/PostgreSQL 18 integriert und speichert. Nur Backend ruft Hilfsquellen ab. Controller: Transport; Services: Anwendungsfälle; Adapter: Validierung; Repositories: Speicherung. Globale Guards und `PublicRoute`-Ausnahmen. Einstellungen pro Benutzer; Audit in `backend/src/shared/audit/`, bei Erfolg transaktional.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Anmelden {#security}

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.

## Zeiträume und Verlauf {#data}

`from` und `to` benötigen RFC 3339 mit expliziter Zeitzone. `[from,to)` wird UTC-normalisiert. Zeitreihe: `hour`, `day`, `month`, `year`, höchstens 10.000 Punkte; Überschreitung wird abgelehnt. Gespeicherte Werte werden nach Überlappung verteilt. Neuester `collectedAt` gewinnt, dann aufsteigende lexikalische ID; kein Rückgriff auf ältere Beobachtungen bei ungeeignetem Gewinner.

Quellmetriken haben keinen Messzeitpunkt. Intervall: Empfang minus `collection_interval_seconds`. Faktorabfrage beweist keine Gültigkeit; unveröffentlichte Quelle/Gültigkeit bleiben unbekannt. Energie/Faktor/Emissionen speichern acht Dezimalstellen, Abdeckung vier. Keine Zwischenrundung. Getrennte Abdeckungen und ursprüngliche Snapshots bleiben erhalten.

## Weiterführende Seiten {#related}

[API-Referenz](./reference/api) · [Erste Schritte](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
