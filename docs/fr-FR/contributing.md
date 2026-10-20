# Contribuer

## Flux de travail

1. Consultez l’issue et les critères d’acceptation avant de modifier le code.
2. Créez une branche basée sur `develop` et limitez la modification au périmètre de la tâche.
3. Ouvrez une pull request vers `develop`, avec un titre Conventional Commit et les références aux issues concernées.
4. Décrivez les décisions, limites, vérifications réellement exécutées et preuves visuelles pour les changements d’interface.

## Vérifications

La CI exécute le lint, les tests et les builds du frontend et du backend, puis le quality gate SonarQube Cloud. Corrigez les nouveaux constats avant de terminer la pull request. Indiquez les vérifications non exécutées localement ; ne déclarez pas de résultat sans l’avoir observé.

## Changements d’interface

Gardez chaque écran avec ses styles, hooks et traductions. Le frontend prend en charge `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` et `zh-CN`. Tout nouveau texte visible doit être complet dans les huit langues ; l’anglais sert de langue de repli.

## Changements d’intégration ou de domaine

Vérifiez les contrats et décisions dans les issues et documents techniques. N’inventez pas d’endpoints, schémas, unités, facteurs environnementaux ni politiques de nouvelle tentative. Les changements du schéma persistant exigent une migration ; les changements de contrat doivent mettre à jour OpenAPI et la documentation.

## Documentation du site

Le contenu publié est conservé en Markdown dans `docs/`. Mettez à jour la page correspondante dans les huit langues et validez le site avec `npm run docs:build`.

## Git

Branches : `type/numero-description` avec issue, ou `type/description` sans issue ; minuscules et kebab-case sans accents. Commits/titres PR : `type(portee): description`, description en portugais, verbe initial, sans point final. Inclure `Refs #N`, décisions/limites et contrôles observés. Voir [AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md).

[Qualité et acceptation](./product/quality) · [Décisions et dépendances](./product/decisions)
