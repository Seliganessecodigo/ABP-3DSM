# Référence de l’API GreenER

Routes vérifiées dans `develop` le 15/10/2026. Swagger local : `http://localhost:3000/docs` ; schéma : `/openapi.json`. Consulter l’OpenAPI de l’environnement cible pour les DTOs complets.

## Lectures existantes

| Méthode et route | Résultat |
| --- | --- |
| GET /health | Santé HTTP du service. |
| GET /applications | Tableau persisté ; `[]` valide. |
| GET /applications/{id} | Application, état, horaires, localisation. |
| GET /applications/{id}/collections/latest | Dernière observation valide et contexte. |
| GET /applications/{id}/collections/{collectionId} | Observation de cette application ; collectionId UUID. |
| GET /applications/{id}/collections/{collectionId}/methodology | Méthodologie appliquée avec version, formule, unités, paramètres et snapshot. |
| GET /openapi.json | Contrat exploitable par outils. |

Ces lectures ne déclenchent ni collecte ni calcul. Recherche/pagination actuelles dans le frontend ; aucun paramètre de pagination serveur documenté.

## Requêtes locales

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Utiliser un ID retourné, encodé pour l’URL ; ne supposer ni ID séquentiel ni UUID pour les applications. DTO : `id`, `name`, `state`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `location`. Motif, fraîcheur et calculabilité sont aussi exposés, mais pas tous consommés par l’UI. Ville nulle autorisée ; anciens enregistrements incomplets : `location: null`.

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
