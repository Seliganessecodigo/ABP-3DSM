# API-Referenz

Referenz zur GreenER-API-Integration. Vollständige Typen, optionale Felder und Grenzen unter `/openapi.json`, Swagger unter `/docs`. Katalog/Verlauf lesen gespeicherte Daten. Vorschau und CO₂-Routen können die Intensitätsquelle abfragen.

## Öffentliche Abfragen {#public}

| HTTP | URI | Zugang |
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

## Zeiträume und Verlauf {#queries}

`from` und `to` benötigen RFC 3339 mit expliziter Zeitzone. `[from,to)` wird UTC-normalisiert. Zeitreihe: `hour`, `day`, `month`, `year`, höchstens 10.000 Punkte; Überschreitung wird abgelehnt. Gespeicherte Werte werden nach Überlappung verteilt. Neuester `collectedAt` gewinnt, dann aufsteigende lexikalische ID; kein Rückgriff auf ältere Beobachtungen bei ungeeignetem Gewinner.

| URI | Parameter |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

Quellmetriken haben keinen Messzeitpunkt. Intervall: Empfang minus `collection_interval_seconds`. Faktorabfrage beweist keine Gültigkeit; unveröffentlichte Quelle/Gültigkeit bleiben unbekannt. Energie/Faktor/Emissionen speichern acht Dezimalstellen, Abdeckung vier. Keine Zwischenrundung. Getrennte Abdeckungen und ursprüngliche Snapshots bleiben erhalten.

## Anmelden {#login}

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

| HTTP | URI | Zugang |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Geschützte Operationen {#protected}

| HTTP | URI | Zugang |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Konten über die API verwalten {#accounts}

Nur ein aktiver Admin derselben Organisation darf Konten auflisten, erstellen oder Rollen ändern. Die Erstellung nimmt `name`, `email`, `role` und `reason` entgegen, ohne Passwort oder automatische E-Mail-Bestätigung. Der Kontoinhaber legt das Passwort im bestehenden Bestätigungsablauf fest; der Versand der Bestätigung wird separat angefordert. Verwaltungsoberfläche und Passwortwiederherstellung bleiben eigene Lieferungen.

Suche und Filter werden vor Sortierung und Seiteneinteilung angewendet. Standard sind 10 Einträge; verfügbar sind 5, 10, 15, 20 und `all` für die vollständige gefilterte Menge. Übersetzte Bezeichnungen müssen in Enum-Codes und lokale Datumsangaben in RFC 3339 mit Zeitzonenoffset umgewandelt werden. Fehlende Werte stehen in beiden Richtungen am Ende; Gleichstände entscheidet die Kennung.

Rollenänderungen erfordern `expectedRole` und `reason`. Die Änderung widerruft Sitzungen und temporäre TOTP-Zugangsdaten, erhält das Audit und verhindert den Entzug des eigenen Zugriffs oder des letzten aktiven Admins mit bestätigter E-Mail. Unbestätigte Konten ersetzen diesen Administrator nicht. Die Zuweisung von Admin behält die TOTP-Pflicht bei.

## Mit einer Neuberechnungsvorschau vergleichen {#preview}

Unter `/administration/calculations` Anwendung/Datum wählen und Original/Vorschau vergleichen. Enddatum umfasst den ganzen UTC-Tag; API verwendet `[from,to)`. Öffentliche Vorschau mit aktuellem Modell und aktuellen Faktoren historischer Regionen, ohne Speicherung. Grenzen: 30 Tage, 10.000 Beobachtungen. Antwort: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Faktorfehler erhält berechenbare Energie; CO₂e bleibt nicht verfügbar. Prozente verlangen gleiche Einheiten/Abdeckung und positiven Referenzwert.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Analyse anpassen {#preferences}

`/methodology` bietet Energie, Emissionen, Abdeckung und Analyse mit Beispielen/persönlichen Einstellungen. Jede angemeldete Rolle speichert nur eigene Register mit optimistischer Revision; 409 bei Konflikt. Anzeigegrenzen ändern weder globale Parameter noch Berechnungen oder externe Benachrichtigungen. Gespeicherter Zeitraum/Granularität ergänzen nur fehlende URL-Werte. Historische Methodik: `/services/:id/methodology`, gegebenenfalls mit `collectionId`.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |

## Fehlerbehandlung {#errors}

Fehler mit HTTP-Status und strukturierten Codes behandeln; Meldungen sind kein Übersetzungsvertrag. `null` bedeutet fehlend, nicht Nullverbrauch. Leere Liste ist gültig und unterscheidet sich von Fehlern. Codes im Operationskontext auswerten.

| HTTP | Code |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## HTTP-Vertrag {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Weiterführende Seiten {#related}

[Betrieb und Diagnose](../operations) · [Methodik und Daten](../product/methodology)
