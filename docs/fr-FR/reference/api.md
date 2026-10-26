# Référence de l’API GreenER

Routes vérifiées dans `develop` le 23/10/2026 (commit `1633ca2`). Swagger local : `http://localhost:3000/docs` ; schéma : `/openapi.json`. Consulter l’OpenAPI de l’environnement cible pour les DTOs complets.

## Lectures existantes

| Méthode et route | Résultat |
| --- | --- |
| GET /health | Santé HTTP du service. |
| GET /applications | Tableau persisté ; `[]` valide. |
| GET /applications/{id} | Application, état, horaires, localisation. |
| GET /applications/{id}/collections/latest | Dernière observation valide et contexte. |
| GET /applications/{id}/collections/{collectionId} | Observation de cette application ; collectionId UUID. |
| GET /applications/{id}/analysis?from=…&to=… | Résultat environnemental persisté pour une application et une période. |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | Série environnementale par application. |
| GET /applications/{id}/analysis/series/contributions?… | Contributions et exclusions d’un bucket, avec pagination. |
| GET /analysis/summary?from=…&to=… | Résumé environnemental agrégé avec filtres facultatifs. |
| GET /monitoring/incidents | Incidents d’intégration avec filtres et pagination. |
| GET /openapi.json | Contrat exploitable par outils. |

Les lectures utilisent les données persistées ; les requêtes environnementales agrègent les résultats enregistrés sans recalculer l’historique. Les séries utilisent des granularités UTC et préservent lacunes et événements. Recherche et pagination du catalogue restent dans le frontend.

## Requêtes locales

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Utiliser un ID retourné, encodé pour l’URL ; ne supposer ni ID séquentiel ni UUID pour les applications. Le DTO contient `id`, `name`, `state`, `reason`, `lastObservationAt`, `isStale`, `isCalculable`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `updatedAt` et `location`. Le détail utilise les champs opérationnels pour expliquer état, fraîcheur et calculabilité ; consulter OpenAPI pour les types et la nullabilité. Ville nulle autorisée ; anciens enregistrements incomplets : `location: null`.

## Erreurs

| HTTP / code | Sens |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | ID vide/invalide selon route ; UUID de collecte invalide également 400. |
| 404 / APPLICATION_NOT_FOUND | Application inconnue. |
| 404 / COLLECTION_NOT_FOUND | Observation absente pour cette application. |
| 503 / CATALOG_UNAVAILABLE | Échec de lecture du catalogue. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Échec de lecture des preuves. |

Traiter codes structurés/status, pas messages comme contrat de traduction. Ne pas remplacer erreur par vide/zéro.

## Frontières

Seul le backend appelle les sources ; [contrats versionnés](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). Aucun endpoint futur d’énergie, authentification ou administration n’est publié ici. JWT administratif est une exigence [EP06](../backlog/ep06), pas une API supposée disponible. Voir [Exploitation](../operations) pour URL/CORS/diagnostic et [Méthodologie](../product/methodology) pour les intervalles.

## Consulter l’analyse environnementale

`GET /applications/{id}/analysis` exige `from` et `to` au format RFC 3339 avec fuseau explicite. Le début est inclus, la fin est exclue, et les deux sont normalisés en UTC. La réponse contient `status` (`available` ou `empty`), la période, l’énergie, les émissions, les couvertures séparées et la provenance (méthodologies, facteurs consultés et motifs). `null` signifie qu’aucun résultat exploitable n’existe ; zéro est une valeur valide.

| HTTP / code | Signification |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Horodatage invalide ou sans fuseau, ou `to` inférieur ou égal à `from`. |
| 404 / APPLICATION_NOT_FOUND | Application inconnue. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Échec de lecture de l’analyse ou des résultats persistés. |

Le résumé et la série par application sont intégrés au détail. La requête des contributions d’un bucket y est aussi utilisée ; le frontend demande actuellement la première page, tandis que la pagination interactive reste à livrer.

## Consulter les incidents de surveillance

`GET /monitoring/incidents` accepte `applicationId`, `source`, `integration`, `status`, `page` et `limit`. Les statuts sont `OPEN`, `RECOVERING` et `RESOLVED`; les valeurs par défaut sont page 1 et limite 20. La réponse contient `items`, `total`, `page` et `limit`. Consultez OpenAPI pour les limites et énumérations à jour.

## Consulter la série environnementale

`GET /applications/{id}/analysis/series` exige `from`, `to` et `granularity` (`hour`, `day`, `month` ou `year`). La réponse contient `points`, `events`, totaux et couvertures. Les buckets suivent le calendrier UTC, ne comptent que le chevauchement avec la période et peuvent être partiels. Les périodes qui généreraient plus de 10 000 points sont rejetées, sans troncature ni changement automatique de granularité.

`GET /applications/{id}/analysis/series/contributions` exige aussi `bucketStart` ; `page` vaut 1 par défaut et `pageSize` vaut 10. Tailles autorisées : `5`, `10`, `15`, `20` et `all` ; `all` n’est accepté qu’à la page 1. La réponse comprend contributions et exclusions avec les snapshots enregistrés de méthode et de facteur.

## Consulter le résumé agrégé

`GET /analysis/summary` exige `from` et `to`. Filtres répétables facultatifs : `states`, `regionCodes` et `applicationIds`. La réponse réunit totaux, couverture, comptes par état, applications, `dataAsOf` et provenance. L’endpoint existe, mais l’interface ne propose pas encore d’écran de tableau de bord agrégé.
