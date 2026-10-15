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
