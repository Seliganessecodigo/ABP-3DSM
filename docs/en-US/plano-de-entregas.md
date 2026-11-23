# Delivery plan and evidence

GreenER deliveries combine functional breadth, software engineering and environmental traceability. This document presents implemented capabilities, evidence for the 27 rubric criteria and contributions from all five members across three sprints, with direct links to code, tests and documentation.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Integrated product and engineering {#engineering}

React 19 and TypeScript support the interface; NestJS structures the API into modules and layers with dependency injection; TypeORM and PostgreSQL preserve data through versioned migrations. Validated integrations, transactional auditing and calculation snapshots support consistent indicators.

For the documented baseline, CI passed 542 frontend tests, 705 backend tests and three integrated flows, alongside lint, type checks, builds, migrations and the SonarQube Cloud gate. The site offers 12 languages with automated checks for equivalent content, contracts and links.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Criteria and verification {#criteria}

| Code | Points | Delivery | Verification | Presented evidence |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Structured backlog |
| GA02 | 5 | Planning and capacity | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Project iterations and assignees |
| GA03 | 5 | Acceptance criteria | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Issue acceptance criteria |
| GA04 | 4 | Tracking | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Linked PRs and commits |
| GA05 | 3 | Increments | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| GA06 | 4 | Review and adaptation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Recorded technical reviews |
| GA07 | 3 | Definition of Done | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Documented DoD |
| GA08 | 3 | Documentation and execution | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Versioned documentation |
| GA09 | 8 | Participation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW01 | 3 | Technologies | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW02 | 5 | Integrations | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW03 | 4 | API and backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW04 | 4 | ORM persistence | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW06 | 3 | Authentication | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| DW07 | 3 | Containers | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| TP01 | 4 | Responsibilities | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| TP02 | 4 | Dependency injection | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| TP03 | 4 | Types and readability | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| TP04 | 4 | Unit tests | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| TP05 | 4 | Validation and failures | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| IHC01 | 3 | Users and tasks | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| IHC02 | 3 | Flows and prototypes | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Documented prototypes and flows |
| IHC03 | 3 | Indicators and states | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| IHC04 | 2 | Responsiveness and feedback | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implemented/verified |
| IHC05 | 2 | User evaluation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Evaluation protocol |
| IHC06 | 2 | Improvements and retest | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Recorded interface feedback |

## Sprints and references {#sprints}

| Sprint | Period | Integrated capabilities |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Foundations, catalog and collection |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indicators, interface and authentication |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | History, analysis and operational evolution |

## Definition of Done {#done}

Acceptance criteria, data integrity, tests, CI, documentation, accessibility and review make up the Definition of Done. Each delivery links its version to verification evidence.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Participation and sources {#sources}

All five members have contributions incorporated across the three sprints. The tables link Git authorship to verifiable commits and show tasks and assignees recorded in the Project, making participation in building the product traceable.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Quality evidence {#quality-evidence}

Code, automated tests, contracts and documentation provide a verification trail for deliveries. The detailed matrix, usability protocol and technical records support examination of workflows, quality criteria and evidence for each project dimension.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
