# Contribuer

Cette partie s’adresse au développement et à l’exploitation. Elle décrit environnement local, contrats et vérifications. Pour apprendre à utiliser le produit, consultez le guide d’utilisation.

## Critères de validation {#workflow}

Les changements de périmètre et de règles consignent problème, résultat attendu et critères d’acceptation dans les récits concernés. Revues et évaluations d’utilisabilité enregistrent difficultés, retours et améliorations. Rétention, sauvegarde/reprise, objectifs opérationnels et quotas externes restent à définir.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Vérifications {#quality}

CI vérifie documentation, lint/tests/build frontend, lint/typecheck/tests PostgreSQL/couverture/build/migrations backend et flux navigateur intégré réel. `TEST_DATABASE_URL` exige PostgreSQL isolé ; sans cette variable, Jest ignore les suites de base et le navigateur intégré échoue. SonarQube obligatoire vers `develop` : couverture nouvelle ≥ 80 %, duplication ≤ 3 %, notes A, hotspots 100 % revus. Ne remplace ni utilisabilité ni acceptation produit.

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

Le produit doit permettre de trouver une application, distinguer zéro de l’absence et relier un indicateur à sa période, son unité, sa couverture et sa méthode. Les consultations préservent le contexte et indiquent chargement, vide, panne et données anciennes. L’évaluation inclut clavier, focus visible, texte au-delà des couleurs, mobiles et 12 langues.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Lectures associées {#related}

[Qualité et acceptation](./product/quality) · [Backlog du produit](./roadmap)
