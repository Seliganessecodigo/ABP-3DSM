# Decisions, dependencies and sources

This register keeps product choices visible without treating gaps as approved features. PDF v1.1 is a historical reference; published Markdown evolves through PRs and must stay aligned with issues when behavior changes.

## Confirmed decisions

| ID | Decision | Consequence |
| --- | --- | --- |
| D01 | Recalculation preview is not saved. | Preserve originals; previews do not enter totals/history. US-12, #263/#264. |
| D02 | First absence in a complete valid snapshot confirms removal. | Source failures and metrics 404 do not remove applications. US-02, #171. |
| D03 | GreenER receipt time is not a source timestamp. | Identify derived intervals; never invent factor validity. #154/#155. |
| D04 | NFRs are cross-cutting; EP00 groups foundations and quality. | Completed technical tasks do not waive later quality requirements. |
| D05 | Regional simulation keeps energy constant. | A scenario factor does not alter measurements or official results. US-15. |
| D06 | Monitoring failures have one incident per identity and recover after three consecutive valid observations. | 30-second total deadline per external call, at most three HTTP attempts including the initial call, retries limited to transient failures; cycles never overlap and valid observations are preserved. #243. |
| D07 | Queries use explicit-offset timestamps normalized to UTC, [from,to), UTC hourly/daily/monthly/yearly buckets, one moving-window anchor, and rejection above 10,000 points. | #174/#235. |
| D08 | Series use saved results prorated by overlap, without historical recalculation; resolve conflicts by latest collection/ascending lexical ID; preserve gaps and snapshots. | #164/#174/#235. |

D01 and the EP00 restructuring were confirmed on 2026-10-15. Other rules are recorded in the backlog and versioned contracts.

## Pending product or integration decisions

| Topic | Unresolved question | Affected deliverables |
| --- | --- | --- |
| Sources and operations | Quotas and concurrency limits still require confirmation with API owners. The #243 timeout/retry/delay policy is approved. | #155/#243 |
| Continuity | Retention, backup/restore and availability/performance targets. | #110/#120/#125/#166 |
| Prototype extras | CSV, configurable columns and efficiency per transaction. Application detail already overlays the series with the equivalent previous period; cross-application comparison and a period dashboard remain separate scope. | #61/#248/#252 |

The PO resolves scope and behavior with technical owners; source contracts require provider confirmation. This table assumes neither deadlines nor individual assignments.

## Reading the sources

- Website Markdown: reference vision, behavior and rules.
- Issues: delivery acceptance criteria, tasks, dependencies and discussion.
- Projects: priority, status, Sprint, dates and linked PRs; these fields alone do not establish implementation.
- Figma: visual intent, flows and handoff; illustrative numbers are not contracts.
- OpenAPI and code: behavior exposed by a revision.
- External contracts: source schemas/units, preserving version and consultation date.

When sources conflict, identify the disagreement, obtain the appropriate decision and update affected sources together. A Figma screen does not authorize inventing an endpoint.

## Recording changes

The issue or PR should explain the decision, reason, relevant alternatives, effects on stories/data/compatibility and acceptance evidence. Durable architectural decisions receive an ADR near their implementation. See the [backlog](../roadmap) and [quality criteria](./quality).

## Decisions and dependencies — c343698

At `/administration/calculations`, select an application and dates to compare original and preview. The UI end date includes the whole UTC day; the API receives `[from,to)`. Preview is public, uses the current model and current factors for historical regions, and saves or replaces no results. Limits: 30 days and 10,000 observations. Response fields are `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Factor failure preserves calculable energy while CO₂e remains unavailable. Percentages require matching units/coverage and a positive reference.

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.

Still outside delivery: dedicated comparison of at least two applications, regional simulation, general user/role management, self-service password recovery, global monitoring configuration/pause and CSV export. Dashboard sorting by impact is available. External quotas, retention, backup/restore and operational targets need decisions; no SLA is declared. TOTP recovery is a support operation, not a password reset.
