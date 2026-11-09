# Architecture

## Composants

L’environnement local utilise Docker Compose pour lancer trois services : le frontend, l’API et PostgreSQL.

| Zone | Responsabilité | Technologies |
| --- | --- | --- |
| `frontend/` | Interface, navigation et présentation | React 19, TypeScript, Vite, i18next |
| `backend/` | API, cas d’usage et intégrations externes | NestJS, TypeScript, TypeORM |
| PostgreSQL | Persistance des applications et des données métier | PostgreSQL 18 |

Le frontend appelle uniquement l’API GreenER. Seul le backend se connecte à l’agrégateur de métriques et au service d’intensité carbone.

## Organisation du code

- `frontend/src/pages/` regroupe chaque écran avec ses hooks, traductions et CSS Modules.
- `frontend/src/features/` contient les contrats métier, la validation, l’accès HTTP, le cache et les règles pures.
- `backend/src/modules/` regroupe les endpoints et cas d’usage par domaine.
- `backend/src/integrations/` adapte et valide les réponses des API auxiliaires.
- `backend/src/database/` contient les entités, migrations et repositories.

## Données et fiabilité

Le backend intègre les sources et persiste leurs données. Il respecte les contrats, schémas et unités documentés. Les erreurs, valeurs manquantes, réponses invalides, données périmées et zéros valides sont des états distincts ; les écrans doivent préserver cette distinction.

Consultez les [contrats des API externes dans le dépôt](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) et le [guide d’organisation du frontend](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md) pour les détails d’implémentation.

## Lectures associées

[Méthodologie et données](./product/methodology) · [Référence de l’API](./reference/api) · [Exploitation et diagnostic](./operations)

## Architecture — c343698

React 19/TypeScript/Vite présente ; NestJS/TypeORM/PostgreSQL 18 intègre et persiste. Seul le backend appelle les sources auxiliaires. Controllers : transport ; services : cas d’usage ; adapters : validation ; repositories : persistance. Guards globaux et exceptions `PublicRoute`. Préférences par utilisateur ; audit partagé dans `backend/src/shared/audit/`, transactionnel en cas de succès.

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
