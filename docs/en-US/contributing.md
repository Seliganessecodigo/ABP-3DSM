# Contributing

This part of the documentation is for development and operations. It covers the local environment, contracts and checks. To learn how to use the product, read the user guide.

## Validation criteria {#workflow}

Epics, stories and tasks organize the product around verifiable criteria and code references. Issues, pull requests and commits connect requirements, implementation and tests; the documentation brings architecture, contracts, operations and evidence into a versioned collection.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Checks {#quality}

CI checks the documentation build, frontend lint/tests/build, backend lint/typecheck/PostgreSQL tests/coverage/build/migrations and a real integrated browser flow. `TEST_DATABASE_URL` must point to isolated PostgreSQL; without it, Jest database suites skip and the integrated browser suite fails. SonarQube Cloud remains mandatory for PRs to `develop`: new-code coverage ≥ 80%, duplication ≤ 3%, A ratings and 100% reviewed hotspots.

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

## Technical documentation {#documentation}

The interface connects indicators to their period, unit, coverage and methodology while preserving filters and navigation context. Loading, empty, failure and stale-data states receive explicit handling. Keyboard navigation, visible focus, text beyond color, mobile devices, themes and 12 languages are part of the user experience.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Related reading {#related}

[Quality and acceptance](./product/quality) · [Product backlog](./roadmap)

[Delivery plan and evidence](./plano-de-entregas)
