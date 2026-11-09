# Contributing

This part of the documentation is for development and operations. It covers the local environment, contracts and checks. To learn how to use the product, read the user guide.

## Validation criteria {#workflow}

Changes to scope and usage rules should record the problem, expected outcome and acceptance criteria in the relevant stories. Product reviews and usability assessments capture observed difficulties, feedback and improvements. Data retention, backup and recovery, operational targets and external source quotas still require decisions.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Checks {#quality}

CI checks the documentation build, frontend lint/tests/build, backend lint/typecheck/PostgreSQL tests/coverage/build/migrations and a real integrated browser flow. `TEST_DATABASE_URL` must point to isolated PostgreSQL; without it, Jest database suites skip and the integrated browser suite fails. SonarQube Cloud remains mandatory for PRs to `develop`: new-code coverage ≥ 80%, duplication ≤ 3%, A ratings and 100% reviewed hotspots. Automated checks do not replace usability evaluation or product acceptance.

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

The product must let people find an application, distinguish zero from missing data and trace an indicator to its period, unit, coverage and methodology. Queries must preserve navigation context and communicate loading, empty results, failures and older data. Assessment includes keyboard use, visible focus, text beyond color, mobile devices and all 12 languages.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Related reading {#related}

[Quality and acceptance](./product/quality) · [Product backlog](./roadmap)
