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

## Exploitation et diagnostic — JWT / Google / SMTP

Node.js 24+, npm, Docker Compose v2. Copier `.env.example` vers `.env` ; lancer `npm run dev`. Compose applique les migrations et tente la découverte ; une panne de source n’empêche pas le démarrage. Configurer SMTP pour invitations/confirmations. Premier Admin : script `organizations:create-invitation` dans `backend/`, avec `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Aucun Admin universel de production.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


Enregistrer dans Google Cloud l’URI exacte `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` active seulement le bouton, sans configurer le backend ni créer de compte : le lien exige une invitation. `GOOGLE_CLIENT_SECRET`, JWT, pepper et clés TOTP restent secrets côté backend ; utiliser des valeurs indépendantes et conserver les versions nécessaires. SMTP livre invitations/confirmations. Le support utilise `authentication:recover-admin-totp` après validation indépendante de l’autorité ; sessions révoquées et opération auditée.
