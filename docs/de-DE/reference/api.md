# GreenER-API-Referenz

Routen im `develop`-Code am 23.10.2026 geprüft (Commit `1633ca2`). Lokal Swagger: `http://localhost:3000/docs`; Schema: `/openapi.json`. Vollständige DTOs im OpenAPI der Zielumgebung.

## Vorhandene Lesezugriffe

| Methode und Route | Ergebnis |
| --- | --- |
| GET /health | HTTP-Gesundheitsantwort. |
| GET /applications | Gespeichertes Array; `[]` ist gültig. |
| GET /applications/{id} | Anwendung, Zustand, Zeitpunkte, Standort. |
| GET /applications/{id}/collections/latest | Letzte gültige Beobachtung und Kontext. |
| GET /applications/{id}/collections/{collectionId} | Beobachtung dieser Anwendung; collectionId UUID. |
| GET /applications/{id}/analysis?from=…&to=… | Gespeichertes Umweltergebnis für eine Anwendung und einen Zeitraum. |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | Umweltzeitreihe je Anwendung. |
| GET /applications/{id}/analysis/series/contributions?… | Beiträge und Ausschlüsse eines Zeitreihen-Buckets, mit Seitennavigation. |
| GET /analysis/summary?from=…&to=… | Aggregierte Umweltübersicht mit optionalen Filtern. |
| GET /monitoring/incidents | Integrationsvorfälle mit Filtern und Seitennavigation. |
| GET /openapi.json | Maschinenlesbarer Vertrag. |

Lesezugriffe verwenden gespeicherte Daten; Umweltabfragen aggregieren gespeicherte Ergebnisse ohne Neuberechnung der Historie. Zeitreihen verwenden UTC-Granularitäten und erhalten Lücken und Ereignisse. Katalogsuche und Seitennavigation erfolgen im Frontend.

## Lokale Abfragen

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Zurückgegebene ID URL-kodieren; keine fortlaufenden IDs oder UUID-Anwendungs-IDs voraussetzen. Das DTO enthält `id`, `name`, `state`, `reason`, `lastObservationAt`, `isStale`, `isCalculable`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `updatedAt` und `location`. Die Detailansicht nutzt Betriebsfelder zur Erklärung von Zustand, Aktualität und Berechenbarkeit; Typen und Nullbarkeit stehen in OpenAPI. Stadt darf null sein; unvollständige Altbestände: `location: null`.

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

## Umweltanalyse abfragen

`GET /applications/{id}/analysis` benötigt `from` und `to` als RFC-3339-Zeitstempel mit expliziter Zeitzone. Der Anfang ist eingeschlossen, das Ende ausgeschlossen; beide Werte werden nach UTC normalisiert. Die Antwort enthält `status` (`available` oder `empty`), Zeitraum, Energie, Emissionen, getrennte Abdeckungswerte und Herkunft (Methoden, abgefragte Faktoren und Gründe). `null` bedeutet, dass kein verwendbares Ergebnis vorliegt; null als Zahl ist ein gültiger Wert.

| HTTP / Code | Bedeutung |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Ungültiger Zeitstempel, fehlende Zeitzone oder `to` kleiner/gleich `from`. |
| 404 / APPLICATION_NOT_FOUND | Anwendung unbekannt. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Analyse oder gespeicherte Ergebnisse konnten nicht gelesen werden. |

Zusammenfassung und Zeitreihe je Anwendung sind in die Detailansicht integriert. Die Abfrage der Bucket-Beiträge wird dort ebenfalls verwendet; das Frontend fordert derzeit die erste Seite an, interaktive Seitennavigation steht noch aus.

## Umweltzeitreihe abfragen

`GET /applications/{id}/analysis/series` benötigt `from`, `to` und `granularity` (`hour`, `day`, `month` oder `year`). Die Antwort enthält `points`, `events`, Summen und Abdeckung. UTC-Kalender-Buckets zählen nur die Überlappung mit dem Zeitraum und können teilweise sein. Zeiträume mit mehr als 10.000 Punkten werden abgelehnt; der Server kürzt nicht und ändert die Granularität nicht automatisch.

`GET /applications/{id}/analysis/series/contributions` benötigt zusätzlich `bucketStart`; `page` ist standardmäßig 1 und `pageSize` 10. Zulässige Größen: `5`, `10`, `15`, `20` und `all`; `all` ist nur auf Seite 1 gültig. Die Antwort enthält Beiträge und Ausschlüsse mit gespeicherten Methoden- und Faktorsnapshots.

## Aggregierte Übersicht abfragen

`GET /analysis/summary` benötigt `from` und `to`. Wiederholbare optionale Filter sind `states`, `regionCodes` und `applicationIds`. Die Antwort enthält Summen, Abdeckung, Zählungen nach Status, Anwendungen, `dataAsOf` und Herkunft. Der Endpunkt ist verfügbar, eine eigene Dashboard-Ansicht gibt es jedoch noch nicht.

## Überwachungsfälle abfragen

`GET /monitoring/incidents` akzeptiert `applicationId`, `source`, `integration`, `status`, `page` und `limit`. Statuswerte sind `OPEN`, `RECOVERING` und `RESOLVED`; Standardwerte sind Seite 1 und Limit 20. Die Antwort enthält `items`, `total`, `page` und `limit`. Aktuelle Grenzen und Aufzählungen stehen in OpenAPI.
