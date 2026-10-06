# CI and quality gates

## Pull request checks

- Frontend lint and production build.
- Backend lint, typecheck, production build, and database migrations against a temporary PostgreSQL service.
- SonarQube Cloud analysis. The scan waits for the configured quality gate and fails the workflow when the gate fails.

The `Deploy staging` workflow calls this same CI workflow as a required job. It only builds deployable artifacts and deploys to Azure after every CI job succeeds. A push to `develop` no longer starts an independent deployment that can race the CI workflow.

## Connect SonarQube Cloud

1. Sign in to SonarQube Cloud with the GitHub organization account and import `Seliganessecodigo/ABP-3DSM` as a public project.
2. Create an analysis token for the project.
3. In GitHub, open **Settings → Environments** and create an environment named `quality`.
4. In that environment, add the secret `SONAR_TOKEN` with the token value, and add these variables using the values shown by SonarQube Cloud:
   - `SONAR_ORGANIZATION`
   - `SONAR_PROJECT_KEY`
5. Open a pull request to `develop`. The `SonarQube Cloud quality gate` job must complete successfully before the PR can merge.

Until these three Sonar values are configured, Sonar analysis will fail closed and block CI and staging deployment. Do not put the token in the repository or in a workflow file.

## Protect `develop` and `main`

In GitHub, open **Settings → Rules → Rulesets → New branch ruleset** and create a ruleset for `develop`. Require pull requests and these checks:

- `Frontend build and lint`
- `Backend build, lint, typecheck, and migrations`
- `SonarQube Cloud quality gate`

Also block force pushes and branch deletion. Apply an equivalent ruleset to `main` when production release protection is needed. The GitHub connector available here can read repository settings but cannot create rulesets, so this last step must be saved in the repository settings UI.

## Tests

The current repository has no automated unit or integration test scripts. Add those suites with feature work, then add their commands to the existing frontend/backend CI jobs so regressions fail before merge.
