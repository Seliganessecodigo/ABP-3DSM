# Riferimento API

Riferimento per integrare API GreenER. Tipi, campi opzionali e limiti completi in `/openapi.json`, Swagger in `/docs`. Catalogo/storico leggono dati persistiti. Anteprima e rotte carbonio possono interrogare la fonte d’intensità.

## Consultazioni pubbliche {#public}

| HTTP | URI | Accesso |
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

## Periodi e storico {#queries}

`from` e `to` richiedono RFC 3339 con fuso esplicito. `[from,to)` normalizzato UTC. Serie: `hour`, `day`, `month`, `year`, massimo 10.000 punti; eccesso rifiutato. Valori salvati ripartiti per sovrapposizione. Vince `collectedAt` più recente, poi ID lessicale crescente; nessun ripiego su osservazioni precedenti se la vincente non sostiene la metrica.

| URI | Parametro |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

Metriche senza timestamp misurazione di origine. Intervallo da ricevimento meno `collection_interval_seconds`. Ora richiesta fattore non prova validità; fonte/validità non pubblicate restano ignote. Energia/fattore/emissioni a otto decimali, copertura a quattro. Nessun arrotondamento intermedio. Coperture separate e snapshot originali conservati.

## Accedere {#login}

Dashboard e consultazioni ambientali pubblici. `/login`: e-mail/password o Google abilitato. Admin configura/conferma TOTP di sei cifre anche dopo Google; Analyst/Visitor non ottengono permessi amministrativi. Sessione frontend in memoria: reload richiede login. Backend verifica JWT, sessione, ruolo/stato attuali; 401 per credenziali assenti/invalide, 403 per ruolo insufficiente. Nuove rotte protette per default.

| HTTP | URI | Accesso |
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

## Operazioni protette {#protected}

| HTTP | URI | Accesso |
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

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Confrontare con un’anteprima di ricalcolo {#preview}

In `/administration/calculations`, confrontare originale/anteprima per applicazione e date. Data finale inclusiva dell’intero giorno UTC; API `[from,to)`. Anteprima pubblica con modello attuale e fattori attuali delle regioni storiche, senza salvare. Limiti: 30 giorni, 10.000 osservazioni. Campi `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fattore mancante conserva energia calcolabile e CO₂e indisponibile. Percentuali richiedono unità/coperture uguali e riferimento positivo.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personalizzare l’analisi {#preferences}

`/methodology` offre energia, emissioni, copertura, analisi con esempi e preferenze personali. Qualsiasi ruolo autenticato salva solo le proprie schede con revisione ottimistica; 409 per conflitto. Soglie visive non modificano configurazione globale, calcoli o notifiche esterne. Periodo/granularità salvati completano solo URL senza scelta. Metodologia storica: `/services/:id/methodology`, con `collectionId` selezionato.

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

## Gestione degli errori {#errors}

Gestire errori con HTTP e codici strutturati; messaggi non sono contratto di traduzione. `null` indica assenza, non zero. Lista vuota valida, distinta da errore. Interpretare codici nel contesto operativo.

| HTTP | Codice |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## Contratto HTTP {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Letture correlate {#related}

[Operazione e diagnosi](../operations) · [Metodologia e dati](../product/methodology)
