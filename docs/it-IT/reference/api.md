# Riferimento API GreenER

Riferimento: `origin/develop`, commit `c343698`, verificato l’08/11/2026. Gli ambienti possono usare revisioni diverse; merge non dimostra pubblicazione. Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

## Letture esistenti

| Metodo e rotta | Risultato |
| --- | --- |
| GET /health | Salute HTTP del servizio. |
| GET /applications | Array persistito; `[]` valido. |
| GET /applications/{id} | Applicazione, stato, orari, posizione. |
| GET /applications/{id}/collections/latest | Ultima osservazione valida e contesto. |
| GET /applications/{id}/collections/{collectionId} | Osservazione di quella applicazione; collectionId UUID. |
| GET /applications/{id}/analysis?from=…&to=… | Risultato ambientale persistito per un’applicazione e un periodo. |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | Serie ambientale per applicazione. |
| GET /applications/{id}/analysis/series/contributions?… | Contributi ed esclusioni di un bucket, con paginazione. |
| GET /analysis/summary?from=…&to=… | Riepilogo ambientale aggregato con filtri opzionali. |
| GET /monitoring/incidents | Incidenti di integrazione con filtri e paginazione. |
| GET /openapi.json | Contratto per strumenti. |

Le letture usano dati persistiti; le query ambientali aggregano risultati salvati senza ricalcolare lo storico. Le serie usano granularità UTC e conservano lacune ed eventi. Ricerca e paginazione del catalogo sono nel frontend.

## Richieste locali

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Usare l’ID restituito e codificarlo nell’URL; non presumere ID sequenziali o UUID applicazione. Il DTO include `id`, `name`, `state`, `reason`, `lastObservationAt`, `isStale`, `isCalculable`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `updatedAt` e `location`. Il dettaglio usa i campi operativi per spiegare stato, freschezza e calcolabilità; tipi e nullabilità sono in OpenAPI. Città nulla ammessa; record legacy incompleto: `location: null`.

## Errori

| HTTP / codice | Significato |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | ID vuoto/invalido secondo rotta; UUID raccolta invalido dà anche 400. |
| 404 / APPLICATION_NOT_FOUND | Applicazione sconosciuta. |
| 404 / COLLECTION_NOT_FOUND | Osservazione assente per quella applicazione. |
| 503 / CATALOG_UNAVAILABLE | Errore lettura catalogo. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Errore lettura evidenze. |

Usare codici strutturati/status; messaggi non sono contratto di traduzione. Non sostituire errore con vuoto/zero.

## Confini

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

## Consultare l’analisi ambientale

`GET /applications/{id}/analysis` richiede `from` e `to` come timestamp RFC 3339 con fuso orario esplicito. L’inizio è incluso, la fine esclusa; entrambi sono normalizzati in UTC. La risposta include `status` (`available` o `empty`), periodo, energia, emissioni, coperture separate e provenienza (metodologie, fattori consultati e motivi). `null` significa che non esiste un risultato utilizzabile; zero è un valore valido.

| HTTP / codice | Significato |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Timestamp non valido o senza fuso, oppure `to` minore o uguale a `from`. |
| 404 / APPLICATION_NOT_FOUND | Applicazione sconosciuta. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Errore di lettura dell’analisi o dei risultati persistiti. |

In `/history`, scegliere l’applicazione; `applicationId`, periodo e granularità conservano contesto URL. Serie persistita con filtri, fuso di visualizzazione, eventi, pagine numerate e ispezione dei bucket. Contributi con paginazione interattiva di 5, 10, 15, 20 o tutti. Bucket sempre UTC; il fuso visivo non raggruppa nuovamente. Il dettaglio sovrappone il periodo precedente equivalente della stessa applicazione.

## Consultare la serie ambientale

`GET /applications/{id}/analysis/series` richiede `from`, `to` e `granularity` (`hour`, `day`, `month` o `year`). La risposta contiene `points`, `events`, totali e copertura. I bucket seguono il calendario UTC, contano solo la sovrapposizione con il periodo e possono essere parziali. Periodi che genererebbero oltre 10.000 punti sono rifiutati; il server non tronca né cambia granularità.

`GET /applications/{id}/analysis/series/contributions` richiede anche `bucketStart`; `page` predefinita 1 e `pageSize` predefinito 10. Dimensioni consentite: `5`, `10`, `15`, `20`, `all`; `all` è valido solo alla pagina 1. La risposta include contributi ed esclusioni con snapshot salvati di metodologia e fattore.

## Consultare il riepilogo aggregato

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. In `/dashboard`, scegliere 24 ore, 7, 30 o 90 giorni, stato e regione. Totali, copertura, conteggi per stato e composizione emissioni a barre/anello. Tabella con ricerca, filtri, ordinamento energia/CO₂e e paginazione; i filtri tabella non ridefiniscono i totali. Aprire un’applicazione per le evidenze. Aggiornamento periodico di `GET /analysis/summary`, senza reload.

## Consultare gli incidenti di monitoraggio

`GET /monitoring/incidents` accetta `applicationId`, `source`, `integration`, `status`, `page` e `limit`. Gli stati sono `OPEN`, `RECOVERING` e `RESOLVED`; i valori predefiniti sono pagina 1 e limite 20. La risposta contiene `items`, `total`, `page` e `limit`. Consulta OpenAPI per limiti ed enumerazioni aggiornati.

## Riferimento API — JWT

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

Dashboard e consultazioni ambientali pubblici. `/login`: e-mail/password o Google abilitato. Admin configura/conferma TOTP di sei cifre anche dopo Google; Analyst/Visitor non ottengono permessi amministrativi. Sessione frontend in memoria: reload richiede login. Backend verifica JWT, sessione, ruolo/stato attuali; 401 per credenziali assenti/invalide, 403 per ruolo insufficiente. Nuove rotte protette per default.

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.

## Riferimento API — POST /applications/{id}/analysis/recalculation-preview

In `/administration/calculations`, confrontare originale/anteprima per applicazione e date. Data finale inclusiva dell’intero giorno UTC; API `[from,to)`. Anteprima pubblica con modello attuale e fattori attuali delle regioni storiche, senza salvare. Limiti: 30 giorni, 10.000 osservazioni. Campi `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fattore mancante conserva energia calcolabile e CO₂e indisponibile. Percentuali richiedono unità/coperture uguali e riferimento positivo.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## Riferimento API — /me/preferences

`/methodology` offre energia, emissioni, copertura, analisi con esempi e preferenze personali. Qualsiasi ruolo autenticato salva solo le proprie schede con revisione ottimistica; 409 per conflitto. Soglie visive non modificano configurazione globale, calcoli o notifiche esterne. Periodo/granularità salvati completano solo URL senza scelta. Metodologia storica: `/services/:id/methodology`, con `collectionId` selezionato.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
