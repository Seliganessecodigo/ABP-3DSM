# Contributing

## Workflow

1. Read the issue and acceptance criteria before changing code.
2. Create a branch from `develop` and keep the change within the task scope.
3. Open a pull request targeting `develop`, using a Conventional Commit title and references to related issues.
4. Describe decisions, limitations, checks actually run, and visual evidence for interface changes.

## Checks

CI runs frontend and backend linting, tests, and builds, followed by the SonarQube Cloud quality gate. Fix new findings before completing a pull request. Report checks that were not run locally; never claim a check without an observed result.

## Interface changes

Keep each screen and its styles, hooks, and translations together. The frontend supports `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, and `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`. New user-facing text must be complete in all twelve languages; English is the fallback.

## Integration or domain changes

Confirm contracts and decisions in issues and technical documents. Do not invent endpoints, schemas, units, environmental factors, or retry policies. Persistent schema changes require a migration; contract changes must update OpenAPI and documentation.

## Documentation site

Published content is maintained as Markdown in `docs/`. Update the equivalent page in all twelve locales and validate the site with `npm run docs:build`.

## Git

Branches: `type/number-description` with an issue, or `type/description` without one; lowercase, unaccented kebab-case. Commits and PR titles: `type(scope): description`, with the description in Portuguese, starting with a verb and without a final period. Include `Refs #N`, decisions/limitations and observed checks. Full conventions and allowed types are in [AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md).

[Quality and acceptance](./product/quality) · [Decisions and dependencies](./product/decisions)

## CI

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
# Isolated PostgreSQL: TEST_DATABASE_URL
npm run test:integration --prefix frontend
```
