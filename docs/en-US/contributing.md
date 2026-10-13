# Contributing

## Workflow

1. Read the issue and acceptance criteria before changing code.
2. Create a branch from `develop` and keep the change within the task scope.
3. Open a pull request targeting `develop`, using a Conventional Commit title and references to related issues.
4. Describe decisions, limitations, checks actually run, and visual evidence for interface changes.

## Checks

CI runs frontend and backend linting, tests, and builds, followed by the SonarQube Cloud quality gate. Fix new findings before completing a pull request. Report checks that were not run locally; never claim a check without an observed result.

## Interface changes

Keep each screen and its styles, hooks, and translations together. The frontend supports `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, and `zh-CN`. New user-facing text must be complete in all eight languages; English is the fallback.

## Integration or domain changes

Confirm contracts and decisions in issues and technical documents. Do not invent endpoints, schemas, units, environmental factors, or retry policies. Persistent schema changes require a migration; contract changes must update OpenAPI and documentation.

## Documentation site

Published content is maintained as Markdown in `docs/`. Update the equivalent page in all eight locales and validate the site with `npm run docs:build`.
