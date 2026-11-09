# Référence de l’API GreenER

Référence : `origin/develop`, commit `c343698`, vérifié le 08/11/2026. Un environnement peut exécuter une autre révision ; fusionner ne prouve pas le déploiement. Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

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

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

## Consulter l’analyse environnementale

`GET /applications/{id}/analysis` exige `from` et `to` au format RFC 3339 avec fuseau explicite. Le début est inclus, la fin est exclue, et les deux sont normalisés en UTC. La réponse contient `status` (`available` ou `empty`), la période, l’énergie, les émissions, les couvertures séparées et la provenance (méthodologies, facteurs consultés et motifs). `null` signifie qu’aucun résultat exploitable n’existe ; zéro est une valeur valide.

| HTTP / code | Signification |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Horodatage invalide ou sans fuseau, ou `to` inférieur ou égal à `from`. |
| 404 / APPLICATION_NOT_FOUND | Application inconnue. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Échec de lecture de l’analyse ou des résultats persistés. |

Dans `/history`, choisir une application. `applicationId`, période et granularité restent dans l’URL. Série persistée, filtres, fuseau d’affichage, événements, pages numérotées et inspection des buckets sont disponibles. Les contributions ont une pagination interactive de 5, 10, 15, 20 ou tous les éléments. Les buckets restent UTC ; changer l’affichage ne les regroupe pas. Le détail superpose la fenêtre précédente équivalente de la même application.

## Consulter les incidents de surveillance

`GET /monitoring/incidents` accepte `applicationId`, `source`, `integration`, `status`, `page` et `limit`. Les statuts sont `OPEN`, `RECOVERING` et `RESOLVED`; les valeurs par défaut sont page 1 et limite 20. La réponse contient `items`, `total`, `page` et `limit`. Consultez OpenAPI pour les limites et énumérations à jour.

## Consulter la série environnementale

`GET /applications/{id}/analysis/series` exige `from`, `to` et `granularity` (`hour`, `day`, `month` ou `year`). La réponse contient `points`, `events`, totaux et couvertures. Les buckets suivent le calendrier UTC, ne comptent que le chevauchement avec la période et peuvent être partiels. Les périodes qui généreraient plus de 10 000 points sont rejetées, sans troncature ni changement automatique de granularité.

`GET /applications/{id}/analysis/series/contributions` exige aussi `bucketStart` ; `page` vaut 1 par défaut et `pageSize` vaut 10. Tailles autorisées : `5`, `10`, `15`, `20` et `all` ; `all` n’est accepté qu’à la page 1. La réponse comprend contributions et exclusions avec les snapshots enregistrés de méthode et de facteur.

## Consulter le résumé agrégé

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. Dans `/dashboard`, choisir 24 heures, 7, 30 ou 90 jours, état et région. Consulter totaux, couverture, états et composition des émissions en barres ou anneau. Recherche, filtres de colonnes, tri énergie/CO₂e et pagination concernent la table ; ils ne redéfinissent pas les totaux. Ouvrir une application pour examiner les preuves. `GET /analysis/summary` est actualisé périodiquement sans rechargement.

## Référence de l’API — JWT

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

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

## Référence de l’API — POST /applications/{id}/analysis/recalculation-preview

Dans `/administration/calculations`, comparer original et aperçu par application et dates. Le dernier jour inclut la journée UTC entière ; l’API reçoit `[from,to)`. Aperçu public avec modèle actuel et facteurs actuels des régions historiques, sans sauvegarde. Limites : 30 jours et 10 000 observations. Réponse : `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Un facteur indisponible conserve l’énergie calculable. Les pourcentages exigent unités/couvertures égales et référence positive.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## Référence de l’API — /me/preferences

`/methodology` propose énergie, émissions, couverture et analyse, avec exemples et préférences personnelles. Tout rôle connecté sauvegarde ses propres onglets avec révision optimiste ; 409 signale un conflit. Les seuils d’affichage ne modifient ni calcul, ni configuration globale, ni notifications externes. Période/granularité complètent uniquement les paramètres URL absents. Méthodologie historique : `/services/:id/methodology` avec `collectionId` sélectionné.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
