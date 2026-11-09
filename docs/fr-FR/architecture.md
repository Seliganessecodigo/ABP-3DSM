# Architecture

Cette partie s’adresse au développement et à l’exploitation. Elle décrit environnement local, contrats et vérifications. Pour apprendre à utiliser le produit, consultez le guide d’utilisation.

## Documentation technique {#components}

React 19/TypeScript/Vite présente ; NestJS/TypeORM/PostgreSQL 18 intègre et persiste. Seul le backend appelle les sources auxiliaires. Controllers : transport ; services : cas d’usage ; adapters : validation ; repositories : persistance. Guards globaux et exceptions `PublicRoute`. Préférences par utilisateur ; audit partagé dans `backend/src/shared/audit/`, transactionnel en cas de succès.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Se connecter {#security}

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

## Périodes et historique {#data}

`from` et `to` exigent RFC 3339 avec fuseau explicite. `[from,to)` est normalisé UTC. Série : `hour`, `day`, `month`, `year`, au plus 10 000 points ; excès refusé. Les valeurs sauvegardées sont proratisées par chevauchement. Le `collectedAt` le plus récent gagne, puis l’ID lexical croissant, sans recours à une observation antérieure si la gagnante ne permet pas la métrique.

Les métriques n’incluent pas l’heure de mesure source. L’intervalle dérive de la réception moins `collection_interval_seconds`. L’heure de requête du facteur ne prouve pas sa validité ; source/validité non publiées restent inconnues. Énergie, facteur, émissions : huit décimales ; couverture : quatre. Pas d’arrondi intermédiaire. Couvertures séparées et snapshots originaux conservés.

## Lectures associées {#related}

[Référence de l’API](./reference/api) · [Démarrage](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
