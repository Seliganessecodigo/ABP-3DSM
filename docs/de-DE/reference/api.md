# GreenER-API-Referenz

Stand: `origin/develop`, Commit `c343698`, geprüft am 08.11.2026. Umgebungen können andere Revisionen ausführen; Merge beweist kein Deployment. Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

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

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

## Umweltanalyse abfragen

`GET /applications/{id}/analysis` benötigt `from` und `to` als RFC-3339-Zeitstempel mit expliziter Zeitzone. Der Anfang ist eingeschlossen, das Ende ausgeschlossen; beide Werte werden nach UTC normalisiert. Die Antwort enthält `status` (`available` oder `empty`), Zeitraum, Energie, Emissionen, getrennte Abdeckungswerte und Herkunft (Methoden, abgefragte Faktoren und Gründe). `null` bedeutet, dass kein verwendbares Ergebnis vorliegt; null als Zahl ist ein gültiger Wert.

| HTTP / Code | Bedeutung |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Ungültiger Zeitstempel, fehlende Zeitzone oder `to` kleiner/gleich `from`. |
| 404 / APPLICATION_NOT_FOUND | Anwendung unbekannt. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Analyse oder gespeicherte Ergebnisse konnten nicht gelesen werden. |

Unter `/history` Anwendung wählen; `applicationId`, Zeitraum und Granularität bleiben in der URL. Gespeicherte Zeitreihe mit Filtern, Anzeigezeitzone, Ereignissen, nummerierten Seiten und Bucket-Inspektion. Beiträge haben interaktive Seiten mit 5, 10, 15, 20 oder allen Einträgen. Buckets bleiben UTC; Anzeigezeitzone gruppiert nicht neu. Die Detailüberlagerung vergleicht dieselbe Anwendung mit dem gleich langen Vorzeitraum.

## Umweltzeitreihe abfragen

`GET /applications/{id}/analysis/series` benötigt `from`, `to` und `granularity` (`hour`, `day`, `month` oder `year`). Die Antwort enthält `points`, `events`, Summen und Abdeckung. UTC-Kalender-Buckets zählen nur die Überlappung mit dem Zeitraum und können teilweise sein. Zeiträume mit mehr als 10.000 Punkten werden abgelehnt; der Server kürzt nicht und ändert die Granularität nicht automatisch.

`GET /applications/{id}/analysis/series/contributions` benötigt zusätzlich `bucketStart`; `page` ist standardmäßig 1 und `pageSize` 10. Zulässige Größen: `5`, `10`, `15`, `20` und `all`; `all` ist nur auf Seite 1 gültig. Die Antwort enthält Beiträge und Ausschlüsse mit gespeicherten Methoden- und Faktorsnapshots.

## Aggregierte Übersicht abfragen

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. Unter `/dashboard` 24 Stunden, 7, 30 oder 90 Tage, Status und Region wählen. Summen, Abdeckung, Statusanzahl und Emissionsanteile als Balken/Ring anzeigen. Tabelle mit Suche, Spaltenfiltern, Energie-/CO₂e-Sortierung und Seiten; Tabellenfilter ändern die Summen nicht. Anwendung zur Untersuchung öffnen. `GET /analysis/summary` wird regelmäßig ohne Neuladen abgefragt.

## Überwachungsfälle abfragen

`GET /monitoring/incidents` akzeptiert `applicationId`, `source`, `integration`, `status`, `page` und `limit`. Statuswerte sind `OPEN`, `RECOVERING` und `RESOLVED`; Standardwerte sind Seite 1 und Limit 20. Die Antwort enthält `items`, `total`, `page` und `limit`. Aktuelle Grenzen und Aufzählungen stehen in OpenAPI.

## API-Referenz — JWT

| HTTP | URI | JWT / credential |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.

## API-Referenz — POST /applications/{id}/analysis/recalculation-preview

Unter `/administration/calculations` Anwendung/Datum wählen und Original/Vorschau vergleichen. Enddatum umfasst den ganzen UTC-Tag; API verwendet `[from,to)`. Öffentliche Vorschau mit aktuellem Modell und aktuellen Faktoren historischer Regionen, ohne Speicherung. Grenzen: 30 Tage, 10.000 Beobachtungen. Antwort: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Faktorfehler erhält berechenbare Energie; CO₂e bleibt nicht verfügbar. Prozente verlangen gleiche Einheiten/Abdeckung und positiven Referenzwert.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## API-Referenz — /me/preferences

`/methodology` bietet Energie, Emissionen, Abdeckung und Analyse mit Beispielen/persönlichen Einstellungen. Jede angemeldete Rolle speichert nur eigene Register mit optimistischer Revision; 409 bei Konflikt. Anzeigegrenzen ändern weder globale Parameter noch Berechnungen oder externe Benachrichtigungen. Gespeicherter Zeitraum/Granularität ergänzen nur fehlende URL-Werte. Historische Methodik: `/services/:id/methodology`, gegebenenfalls mit `collectionId`.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
