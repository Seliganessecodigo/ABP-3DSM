# Contribuer

Cette partie s’adresse au développement et à l’exploitation. Elle décrit environnement local, contrats et vérifications. Pour apprendre à utiliser le produit, consultez le guide d’utilisation.

## Critères de validation {#workflow}

Épopées, récits et tâches structurent le produit avec des critères vérifiables et des références au code. Issues, pull requests et commits relient exigences, implémentation et tests ; la documentation rassemble architecture, contrats, exploitation et preuves dans un ensemble versionné.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Vérifications {#quality}

CI vérifie documentation, lint/tests/build frontend, lint/typecheck/tests PostgreSQL/couverture/build/migrations backend et flux navigateur intégré réel. `TEST_DATABASE_URL` exige PostgreSQL isolé ; sans cette variable, Jest ignore les suites de base et le navigateur intégré échoue. SonarQube obligatoire vers `develop` : couverture nouvelle ≥ 80 %, duplication ≤ 3 %, notes A, hotspots 100 % revus.

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
npm run test:integration --prefix frontend
```

## Documentation technique {#documentation}

L’interface associe les indicateurs à leur période, unité, couverture et méthodologie, tout en conservant les filtres et le contexte de navigation. Chargement, absence de résultats, erreurs et données anciennes sont traités explicitement. Clavier, focus visible, texte en complément des couleurs, mobile, thèmes et 12 langues font partie de l’expérience.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Lectures associées {#related}

[Qualité et acceptation](./product/quality) · [Backlog du produit](./roadmap)

[Plan et preuves](./plano-de-entregas)
