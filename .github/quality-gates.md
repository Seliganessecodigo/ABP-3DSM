# CI and quality gates

## Pull request checks

- Frontend lint and production build.
- Backend lint, typecheck, unit tests, production build, and database migrations against a temporary PostgreSQL service.
- SonarQube Cloud Quality Gate on pull requests to `develop`, with backend LCOV coverage, and main-branch analysis on pushes to `main`.

The `Deploy staging` workflow calls this same CI workflow as a required job. On pushes to `develop`, it skips SonarQube branch analysis because the current SonarQube plan only exposes analysis results for the main branch. Frontend/backend checks still gate staging deployment. Pull request analysis remains part of the merge checks, and pushes to `main` run SonarQube against the main branch.

## Connect SonarQube Cloud

1. Sign in to SonarQube Cloud with the GitHub organization account and import `Seliganessecodigo/ABP-3DSM` as a public project.
2. Create an analysis token for the project.
3. In GitHub, open **Settings → Environments** and create an environment named `quality`.
4. In that environment, add the secret `SONAR_TOKEN` with the token value, and add these variables using the values shown by SonarQube Cloud:
   - `SONAR_ORGANIZATION`
   - `SONAR_PROJECT_KEY`
5. Open a pull request to `develop`. The `SonarQube Cloud quality gate` job must complete successfully before the PR can merge. Merges to `develop` skip branch analysis; when the sprint is released to `main`, a push to `main` runs the main-branch analysis.

Until these three Sonar values are configured, Sonar analysis will fail closed and block CI and staging deployment. Do not put the token in the repository or in a workflow file.

## Protect `develop` and `main`

In GitHub, open **Settings → Rules → Rulesets → New branch ruleset** and create a ruleset for `develop`. Require pull requests and these checks:

- `Frontend build and lint`
- `Backend build, lint, typecheck, and migrations`
- `SonarQube Cloud quality gate`

Also block force pushes and branch deletion. Apply an equivalent ruleset to `main` when production release protection is needed. The GitHub connector available here can read repository settings but cannot create rulesets, so this last step must be saved in the repository settings UI.

## Backend tests

The backend uses Jest with `ts-jest`. Run `npm test` from `backend`, use `npm run test:watch` while developing, or generate a coverage report with `npm run test:cov`. CI generates and uploads `backend/coverage/lcov.info` before Sonar analysis. Unit tests are stored beside their source files as `*.spec.ts`; add tests for new backend behavior with each feature. Frontend source and declarative database entity/configuration files are excluded from line coverage until executable frontend behavior has a coverage-producing test suite; database migrations are excluded because CI applies them against PostgreSQL. Migration SQL is also excluded from duplication checks because repeated DDL structure is expected.
