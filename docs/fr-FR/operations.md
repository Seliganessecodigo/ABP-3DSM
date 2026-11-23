# Exploitation et diagnostic

Cette partie s’adresse au développement et à l’exploitation. Elle décrit environnement local, contrats et vérifications. Pour apprendre à utiliser le produit, consultez le guide d’utilisation.

## Configuration {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## Surveillance automatique {#monitoring}

La surveillance commence après le premier intervalle, sans cycles simultanés par processus. Intervalle/parallélisme sont des entiers positifs. Compose ne transmet pas automatiquement `MONITORING_SCHEDULE_INTERVAL_SECONDS` et `MONITORING_METRICS_CONCURRENCY` de `.env` à l’API ; un mappage explicite est nécessaire. `/health` vérifie HTTP, pas découverte/calcul. Consulter catalogue, preuves et logs. Une panne source ne confirme pas suppression ; rétablissement après trois observations valides consécutives.

La première absence dans un snapshot complet et valide confirme la suppression. Chaque appel externe a un délai total de 30 secondes et au plus trois tentatives HTTP, initiale comprise ; seuls les échecs temporaires sont réessayés.

## Se connecter {#authentication}

Node.js 24+, npm, Docker Compose v2. Copier `.env.example` vers `.env` ; lancer `npm run dev`. Compose applique les migrations et tente la découverte ; une panne de source n’empêche pas le démarrage. Configurer SMTP pour invitations/confirmations. Premier Admin : script `organizations:create-invitation` dans `backend/`, avec `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Aucun Admin universel de production.

Le premier accès au site comporte deux étapes : ouvrir l’invitation sur `/setup-admin`, saisir le nom et l’e-mail, puis ouvrir la confirmation sur `/confirm-email` pour créer le mot de passe. Connectez-vous ensuite et configurez l’authentificateur obligatoire de l’Admin. Les liens invalides, expirés ou utilisés indiquent comment en demander un nouveau ; les jetons sont retirés de l’URL et restent uniquement en mémoire. Après un rechargement, rouvrez le lien original de l’e-mail. SMTP doit livrer à une véritable boîte ; les adresses `.test` sont des exemples. Sur Azure, l’opérateur émet la première invitation depuis la console du backend configuré avec `npm run organizations:create-invitation:prod` ; la personne invitée termine son inscription sur le site. `APP_BASE_URL` doit désigner le frontend publié. `frontend/public/staticwebapp.config.json` permet l’accès direct aux routes hébergées.

Dans **Utilisateurs** (`/administration/users`), l’administrateur consulte les comptes de l’organisation et envoie des invitations Google. **Associer mon compte Google** remplit le formulaire avec ses informations ; confirmez l’envoi puis ouvrez le lien avec le compte Google de même adresse. Une adresse identique ne suffit jamais à associer une identité. Les nouveaux comptes apparaissent après acceptation ; les invitations en attente ne sont pas des comptes. Un nouvel envoi annule l’invitation précédente. Les comptes existants conservent nom, rôle et mot de passe ; TOTP reste obligatoire pour les administrateurs. Staging lit `VITE_GOOGLE_SSO_ENABLED` dans les variables GitHub : activez `true` seulement après configuration des identifiants et URL du backend. `GOOGLE_CALLBACK_URL` utilise l’adresse publique de l’API suivie de `/auth/sso/google/callback`, et `SSO_RETURN_URL` celle du frontend suivie de `/sso/callback`.

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

Enregistrer dans Google Cloud l’URI exacte `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` active seulement le bouton, sans configurer le backend ni créer de compte : le lien exige une invitation. `GOOGLE_CLIENT_SECRET`, JWT, pepper et clés TOTP restent secrets côté backend ; utiliser des valeurs indépendantes et conserver les versions nécessaires. SMTP livre invitations/confirmations. Le support utilise `authentication:recover-admin-totp` après validation indépendante de l’autorité ; sessions révoquées et opération auditée.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## Diagnostic {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Publication et reprise {#release}

Staging part de `develop` après CI : API dans Azure App Service, frontend dans Static Web Apps, vérification des endpoints après l’API. Documentation sur GitHub Pages avec `DOCS_BASE=/ABP-3DSM/`. Identifier l’étape en échec avant de répéter. Aucun rétablissement automatique de base. `npm run dev:down` conserve le volume ; le supprimer efface les données locales.

## Lectures associées {#related}

[Démarrage](./getting-started) · [Référence de l’API](./reference/api)

## Diagnostiquer les lenteurs {#response-performance}

Comparez le délai du premier octet, la taille de la réponse et le plan d’exécution avant d’incriminer la base. Le Dashboard consulte `/analysis/summary` avec `includeProvenance=false` : valeurs, couverture et série sont conservées ; la réponse indique `provenanceIncluded=false` et exclut les listes de traçabilité. La requête complète reste disponible par défaut. La projection compacte ne transfère pas les facteurs de chaque collecte ; le calcul trie les intervalles et évite un second tri dans la base.
