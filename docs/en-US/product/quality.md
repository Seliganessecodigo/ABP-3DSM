# Cross-cutting requirements and acceptance

[EP00](../backlog/ep00) organizes technical foundations and quality. An NFR is a continuing product constraint; its task delivers a finite artifact. Completing database setup does not end the need to preserve integrity in later features.

## Observable quality

| Requirement | Expected evidence |
| --- | --- |
| RNF-01 — Technologies | Buildable React/TypeScript frontend and NestJS/TypeScript backend. |
| RNF-02 — Responsibilities | UI presents; backend decides; adapters validate; repositories persist. |
| RNF-03 — History | Migrations and tests demonstrate identity, integrity and preserved versions. |
| RNF-04 — Security | Secrets outside Git; protected operations check authorization in the backend. |
| RNF-05 — Reproducibility | Documented environment, verifiable CI and evidence of deployment behavior. |
| RNF-06 — Failure handling | Success, empty, error, absence and stale remain distinguishable. |
| RNF-07 — Experience | Keyboard, focus, contrast, text/icons beyond color, responsiveness and twelve languages. |

Still outside delivery: dedicated comparison of at least two applications, regional simulation, general user/role management, self-service password recovery, global monitoring configuration/pause and CSV export. Dashboard sorting by impact is available. External quotas, retention, backup/restore and operational targets need decisions; no SLA is declared. TOTP recovery is a support operation, not a password reset.

## Essential demonstration scenarios

| Given / when | Expected outcome | Reference |
| --- | --- | --- |
| A known application is absent from a complete valid snapshot | Record removal and preserve history. | US-02 |
| Source failure or invalid payload | Neither confirm removal nor replace data with zero. | US-02/05 |
| A valid observation exists and the next attempt fails | Preserve the observation and distinguish freshness. | US-03/04 |
| Valid energy exists but the factor is unavailable | Neither fabricate CO₂e nor discard energy. | US-07/08 |
| A recalculation preview is requested | Keep the original intact and do not persist the preview. | US-12 |
| An administrative operation lacks permission | Backend denies the change. | US-18/19/20 |

These are product criteria; planned capabilities need implementation and tests before being announced as delivered.

## Readiness and completion

Before starting a task, identify deliverable, consumers, criteria, contract and real dependencies. A pending coefficient or permission must not become a technical assumption. Design requires states, navigation and a verifiable handoff.

Completion requires demonstrated criteria, review, relevant failure tests, updated contracts/documentation and evidence. An open PR is not a completed issue. Planning, review and feedback belong to process deliverable #134.

## Engineering gate

PRs to `develop` require applicable checks and SonarQube Cloud: new-code coverage ≥ 80%, duplication ≤ 3%, A ratings and 100% of security hotspots reviewed. Executable backend changes require tests and LCOV. See [complete CI rules](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/.github/quality-gates.md) and [Contributing](../contributing). Passing CI does not replace functional acceptance or usability evaluation.

## CI — c343698

CI checks the documentation build, frontend lint/tests/build, backend lint/typecheck/PostgreSQL tests/coverage/build/migrations and a real integrated browser flow. `TEST_DATABASE_URL` must point to isolated PostgreSQL; without it, Jest database suites skip and the integrated browser suite fails. SonarQube Cloud remains mandatory for PRs to `develop`: new-code coverage ≥ 80%, duplication ≤ 3%, A ratings and 100% reviewed hotspots. Automated checks do not replace usability evaluation or product acceptance.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
