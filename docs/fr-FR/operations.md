# Exploitation et diagnostic

Mécanismes existants, sans SLA de production. Installation : [Démarrage](./getting-started) ; contrat : [API](./reference/api).

## Configuration

| Paramètre | Usage |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Ports publiés par Compose. |
| DATABASE_URL | Backend hôte/cloud ; Compose utilise le service interne `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Sources exclusives du backend. |
| CORS_ORIGIN | Origine frontend autorisée, correspondant à l’accès réel. |
| VITE_API_URL | URL incorporée au build ou environnement de développement frontend. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Scheduler backend, défaut 60 secondes. |
| MONITORING_METRICS_CONCURRENCY | Concurrence par processus, défaut initial 2 ; pas quota externe. |

Paramètres de suivi : entiers positifs. Compose ne transmet pas automatiquement ces deux clés de `.env` ; les surcharger nécessite un mapping explicite. Identifiants d’exemple réservés au local.

## Vérifier l’environnement

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

Découverte manuelle répétable sans doublon d’identité. Scheduler après premier intervalle ; protection contre chevauchement par processus, pas entre réplicas. Polling UI et collecte indépendants.

`/health` ne prouve ni catalogue rempli, ni source accessible, ni calcul possible. Vérifier `/applications`, preuves et logs des cycles.

## Diagnostic

| Symptôme | Vérification |
| --- | --- |
| Containers ne démarrent pas | Docker, ports, variables, migrations. |
| UI ouverte, catalogue en échec | URL du build, CORS, API, base. |
| Catalogue vide | Découverte/agrégateur ; vide n’est pas une erreur HTTP. |
| Anciennes données | Heure d’observation, échec actuel, résumé du cycle. |
| Pipeline en échec, API accessible | Qualité, package, deploy ou smoke test ; publication possible avant échec ultérieur. |

## Publication et reprise

Staging depuis `develop`, avec CI requise et jobs séparés API (Azure App Service)/frontend (Static Web Apps). Smoke test après publication API. Enregistrer run, SHA, étape et diagnostic avant relance.

Pages utilise VitePress et `DOCS_BASE=/ABP-3DSM/` ; build local ne prouve pas publication. Les workflows ne démontrent pas de restauration automatique de base. Avant rollback/migration destructive : compatibilité et sauvegarde récupérable. Rétention/essais de restauration sont [en attente](./product/decisions). `npm run dev:down` conserve le volume ; supprimer les volumes supprime la base locale.
