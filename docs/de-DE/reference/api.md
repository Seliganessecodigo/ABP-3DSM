# GreenER-API-Referenz

Routen im `develop`-Code am 15.10.2026 geprüft. Lokal Swagger: `http://localhost:3000/docs`; Schema: `/openapi.json`. Vollständige DTOs im OpenAPI der Zielumgebung.

## Vorhandene Lesezugriffe

| Methode und Route | Ergebnis |
| --- | --- |
| GET /health | HTTP-Gesundheitsantwort. |
| GET /applications | Gespeichertes Array; `[]` ist gültig. |
| GET /applications/{id} | Anwendung, Zustand, Zeitpunkte, Standort. |
| GET /applications/{id}/collections/latest | Letzte gültige Beobachtung und Kontext. |
| GET /applications/{id}/collections/{collectionId} | Beobachtung dieser Anwendung; collectionId UUID. |
| GET /applications/{id}/collections/{collectionId}/methodology | Angewandte Methodik mit Version, Formel, Einheiten, Parametern und Snapshot. |
| GET /openapi.json | Maschinenlesbarer Vertrag. |

Lesezugriffe lösen keine Sammlung/Berechnung aus. Suche/Seitennavigation derzeit im Frontend; keine dokumentierten Server-Paginierungsparameter.

## Lokale Abfragen

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Zurückgegebene ID URL-kodieren; keine fortlaufenden IDs oder UUID-Anwendungs-IDs voraussetzen. DTO: `id`, `name`, `state`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `location`. Gründe, Aktualität und Berechenbarkeit ebenfalls im Backend, noch nicht vollständig in UI genutzt. Stadt darf null sein; unvollständige Altbestände: `location: null`.

## Fehler

| HTTP / Code | Bedeutung |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | Leere/ungültige ID gemäß Route; ungültige Erfassungs-UUID ebenfalls 400. |
| 404 / APPLICATION_NOT_FOUND | Unbekannte Anwendung. |
| 404 / COLLECTION_NOT_FOUND | Beobachtung für diese Anwendung fehlt. |
| 503 / CATALOG_UNAVAILABLE | Katalog-Lesefehler. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Beleg-Lesefehler. |

Strukturierte Codes/Status nutzen; Meldungen sind kein Übersetzungsvertrag. Fehler nicht durch leer/Null ersetzen.

## Grenzen

Nur Backend greift auf Quellen zu; [versionierte Verträge](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). Keine zukünftigen Energie-/Auth-/Admin-Endpunkte veröffentlicht. JWT-Administration ist [EP06](../backlog/ep06)-Anforderung, keine angenommene verfügbare API. Siehe [Betrieb](../operations) für URL/CORS/Diagnose und [Methodik](../product/methodology).
