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

D01 and the EP00 restructuring were confirmed on 2026-10-15. Other rules are recorded in the backlog and versioned contracts.

## Pending product or integration decisions

| Topic | Unresolved question | Affected deliverables |
| --- | --- | --- |
| Energy | Formula, coefficients, conversion units and assumptions. | #49/#53/#58 |
| Time and coverage | Boundaries, timezone, granularity, rounding and partial results. | #49/#156/#174/#175/#178 |
| Recalculation preview | Permission, volume/period limits and factor-selection policy. | #91/#263/#264 |
| Access and accounts | Role matrix, bootstrap, sessions, password/recovery policies. | #90/#91/#158/#160/#245 |
| Sources and operations | Quotas and concurrency limits still require confirmation with API owners. The #243 timeout/retry/delay policy is approved. | #155/#243 |
| Continuity | Retention, backup/restore and availability/performance targets. | #110/#120/#125/#166 |
| Prototype extras | CSV, configurable columns, previous period and efficiency per transaction. | #61/#248/#252 |

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
