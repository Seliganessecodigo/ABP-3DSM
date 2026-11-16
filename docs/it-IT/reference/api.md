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
| GET | `/analysis/comparison` | — |
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
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/analysis/comparison` | `from`, `to`, `applicationIds` (2–5 IDs), `referenceApplicationId` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

`GET /analysis/comparison` richiede da 2 a 5 ID univoci e un riferimento selezionato. Restituisce energia, emissioni, coperture separate, metriche e snapshot storici della posizione per lo stesso periodo. Le differenze sono applicazione meno riferimento; le percentuali richiedono un riferimento positivo. I valori assenti restano espliciti e lo stato è `empty`, `partial` o `complete`.

Metriche senza timestamp misurazione di origine. Intervallo da ricevimento meno `collection_interval_seconds`. Ora richiesta fattore non prova validità; fonte/validità non pubblicate restano ignote. Energia/fattore/emissioni a otto decimali, copertura a quattro. Nessun arrotondamento intermedio. Coperture separate e snapshot originali conservati.

## Serie e spiegazione del calcolo {#environmental-presentation}

In `/analysis/summary`, il parametro facoltativo `granularity` include `series.points` con lo stesso periodo e gli stessi filtri dei totali. Ogni intervallo somma i risultati persistiti delle applicazioni e mantiene coperture indipendenti. I valori mancanti restano `null`.

In `/applications/{id}/analysis`, `calculation.energyKwh` indica l’energia dei segmenti con emissioni calcolate; `calculation.intensity` è il fattore equivalente in gCO₂e/kWh, ottenuto dividendo tali emissioni per l’energia corrispondente. Con energia zero o assente, il fattore resta nullo. Risultati e fattori storici vengono conservati.

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
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Amministrare gli account tramite API {#accounts}

Solo un Admin attivo della stessa organizzazione può elencare e creare account o cambiare ruoli. La creazione riceve `name`, `email`, `role` e `reason`, senza password né conferma automatica dell’e-mail. Il titolare imposta la password nel flusso di conferma esistente; l’invio della conferma viene richiesto separatamente. La schermata di gestione e il recupero della password restano consegne distinte.

La lista applica ricerca e filtri prima di ordinamento e paginazione. Il valore predefinito è 10 elementi, con opzioni 5, 10, 15, 20 e `all` per l’intero insieme filtrato. Le etichette tradotte vanno convertite in codici enum e le date locali in RFC 3339 con fuso orario. I valori assenti restano in fondo in entrambe le direzioni; le parità si risolvono con l’identificatore.

Cambiare ruolo richiede `expectedRole` e `reason`. La modifica revoca sessioni e credenziali TOTP temporanee, conserva l’audit e impedisce di rimuovere il proprio accesso o l’ultimo Admin attivo con e-mail confermata. Gli account non confermati non sostituiscono tale amministratore. L’assegnazione di Admin mantiene il requisito TOTP.

## Confrontare con un’anteprima di ricalcolo {#preview}

In `/administration/calculations`, confrontare originale/anteprima per applicazione e date. Data finale inclusiva dell’intero giorno UTC; API `[from,to)`. Anteprima pubblica con modello attuale e fattori attuali delle regioni storiche, senza salvare. Limiti: 30 giorni, 10.000 osservazioni. Campi `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fattore mancante conserva energia calcolabile e CO₂e indisponibile. Percentuali richiedono unità/coperture uguali e riferimento positivo.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personalizzare l’analisi {#preferences}

In `/methodology`, configura limiti di energia ed emissioni per applicazione, soglie di copertura e impostazioni iniziali di analisi. Scegli le ultime 24 ore, 7, 30 o 90 giorni, il mese corrente UTC o un intervallo personalizzato con inizio incluso e fine esclusa. L’anteprima consulta dati reali senza salvare e usa lo stesso pannello di avvisi delle applicazioni e del Dashboard. Il salvataggio richiede l’accesso e riguarda solo il tuo account; calcoli, cronologia e stati operativi restano invariati. Gli avvisi usano il periodo di ciascun limite indipendentemente dai filtri. Le impostazioni iniziali completano solo le opzioni mancanti nell’URL del Dashboard e del dettaglio. Dati parziali sotto il limite non dimostrano il suo rispetto; dati mancanti non significano mai zero.

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
| energy | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled, period: {kind}}`; 0–100 |
| analysis | `{period: {kind}, granularity: "hour" / "day"}` |

```json
{ "period": { "kind": "custom", "from": "2026-11-01T00:00:00Z", "to": "2026-11-08T00:00:00Z" } }
```

```text
period.kind = 24h | 7d | 30d | 90d | month | custom
GET /me/preferences/alerts (JWT)
POST /me/preferences/alerts/preview (public, read-only)
{ energy, emissions, coverage } -> { configured, evaluatedAt, applications }
```

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
