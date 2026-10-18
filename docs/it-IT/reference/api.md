# Riferimento API GreenER

Rotte verificate nel codice `develop` il 15/10/2026. Swagger locale `http://localhost:3000/docs`, schema `/openapi.json`. DTO completi nell’OpenAPI dell’ambiente integrato.

## Letture esistenti

| Metodo e rotta | Risultato |
| --- | --- |
| GET /health | Salute HTTP del servizio. |
| GET /applications | Array persistito; `[]` valido. |
| GET /applications/{id} | Applicazione, stato, orari, posizione. |
| GET /applications/{id}/collections/latest | Ultima osservazione valida e contesto. |
| GET /applications/{id}/collections/{collectionId} | Osservazione di quella applicazione; collectionId UUID. |
| GET /applications/{id}/collections/{collectionId}/methodology | Metodologia applicata con versione, formula, unità, parametri e snapshot. |
| GET /openapi.json | Contratto per strumenti. |

Letture senza raccolta o calcolo. Ricerca/paginazione nel frontend; nessun parametro documentato di paginazione server.

## Richieste locali

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Usare ID restituito e codificarlo nell’URL; non presumere ID sequenziali o UUID applicazione. DTO: `id`, `name`, `state`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `location`. Backend espone anche motivo, freschezza, calcolabilità non ancora completamente usati dalla UI. Città nulla ammessa; record legacy incompleto: `location: null`.

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
