# CI and quality gates

## Pull request checks

- Documentation site production build, with dead-link validation and cross-locale content/contract checks.
- Frontend lint, Playwright tests, and production build.
- Backend lint, typecheck, unit/integration tests, production build, and database migrations against a temporary PostgreSQL service. This job also runs the browser flow against the real backend with local HTTP sources and a separate database created by real migrations (`frontend/npm run test:integration`; see `backend/test/README.md`).
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

- `Documentation site build`
- `Frontend build and lint`
- `Backend build, lint, typecheck, and migrations`
- `SonarQube Cloud quality gate`

Also block force pushes and branch deletion. Apply an equivalent ruleset to `main` when production release protection is needed. The GitHub connector available here can read repository settings but cannot create rulesets, so this last step must be saved in the repository settings UI.

## Backend tests

Frontend and backend CI jobs run in the official `mcr.microsoft.com/playwright:v1.64.0-noble` container, matching the version locked in `frontend/package-lock.json`. The image bundles browsers and their system dependencies, avoiding repeated Ubuntu package DNS failures during browser provisioning. When upgrading Playwright, update this image version together with the lockfile. The backend connects to the isolated PostgreSQL service through its `postgres` hostname inside the job network. Browser availability, frontend tests, backend coverage, integrated tests and Sonar remain mandatory. See the [Playwright Docker guide](https://playwright.dev/docs/docker) and [GitHub service networking](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).

The backend uses Jest with `ts-jest`. Run `npm test` from `backend`, use `npm run test:watch` while developing, or generate a coverage report with `npm run test:cov`. CI generates and uploads `backend/coverage/lcov.info` before Sonar analysis. Unit tests are stored beside their source files as `*.spec.ts`; add tests for new backend behavior with each feature. Frontend source is currently excluded from Sonar line coverage; Playwright tests run in CI but do not produce the LCOV used by Sonar. Declarative database entity/configuration files are also excluded; database migrations are excluded because CI applies them against PostgreSQL. Migration SQL is also excluded from duplication checks because repeated DDL structure is expected.
