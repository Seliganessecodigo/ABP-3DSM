# Riferimento API GreenER

Rotte verificate nel codice `develop` il 23/10/2026 (commit `1633ca2`). Swagger locale `http://localhost:3000/docs`, schema `/openapi.json`. DTO completi nell’OpenAPI dell’ambiente integrato.

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

Solo backend chiama fonti; [contratti versionati](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). Nessun futuro endpoint energia/auth/amministrazione pubblicato qui. JWT amministrativo è requisito [EP06](../backlog/ep06), non API presunta disponibile. [Operazione](../operations) per URL/CORS/diagnosi, [Metodologia](../product/methodology) per intervalli.

## Consultare l’analisi ambientale

`GET /applications/{id}/analysis` richiede `from` e `to` come timestamp RFC 3339 con fuso orario esplicito. L’inizio è incluso, la fine esclusa; entrambi sono normalizzati in UTC. La risposta include `status` (`available` o `empty`), periodo, energia, emissioni, coperture separate e provenienza (metodologie, fattori consultati e motivi). `null` significa che non esiste un risultato utilizzabile; zero è un valore valido.

| HTTP / codice | Significato |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Timestamp non valido o senza fuso, oppure `to` minore o uguale a `from`. |
| 404 / APPLICATION_NOT_FOUND | Applicazione sconosciuta. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Errore di lettura dell’analisi o dei risultati persistiti. |

Riepilogo e serie per applicazione sono integrati nel dettaglio. Anche la query dei contributi per bucket è usata lì; il frontend richiede attualmente la prima pagina, mentre la paginazione interattiva è ancora da consegnare.

## Consultare la serie ambientale

`GET /applications/{id}/analysis/series` richiede `from`, `to` e `granularity` (`hour`, `day`, `month` o `year`). La risposta contiene `points`, `events`, totali e copertura. I bucket seguono il calendario UTC, contano solo la sovrapposizione con il periodo e possono essere parziali. Periodi che genererebbero oltre 10.000 punti sono rifiutati; il server non tronca né cambia granularità.

`GET /applications/{id}/analysis/series/contributions` richiede anche `bucketStart`; `page` predefinita 1 e `pageSize` predefinito 10. Dimensioni consentite: `5`, `10`, `15`, `20`, `all`; `all` è valido solo alla pagina 1. La risposta include contributi ed esclusioni con snapshot salvati di metodologia e fattore.

## Consultare il riepilogo aggregato

`GET /analysis/summary` richiede `from` e `to`. Filtri opzionali ripetibili: `states`, `regionCodes` e `applicationIds`. La risposta include totali, copertura, conteggi per stato, applicazioni, `dataAsOf` e provenienza. L’endpoint esiste, ma l’interfaccia non ha ancora una schermata di dashboard aggregata.

## Consultare gli incidenti di monitoraggio

`GET /monitoring/incidents` accetta `applicationId`, `source`, `integration`, `status`, `page` e `limit`. Gli stati sono `OPEN`, `RECOVERING` e `RESOLVED`; i valori predefiniti sono pagina 1 e limite 20. La risposta contiene `items`, `total`, `page` e `limit`. Consulta OpenAPI per limiti ed enumerazioni aggiornati.
