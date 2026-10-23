# Product vision and scope

GreenER addresses three questions: which applications are monitored, what evidence supports their consumption, and how to interpret estimated energy and emissions. Discovery, metrics, regional context and history support investigation and prioritization.

## Audiences

| Audience | Need |
| --- | --- |
| Infrastructure management | Identify applications and track changes in the environment. |
| Operational and environmental analysis | Investigate periods, compare compatible results and understand gaps. |
| Development and assessment team | Reproduce the environment and demonstrate acceptance criteria. |

These audiences describe needs; the full role and permission matrix is a [pending product decision](./decisions).

## Scope and availability

Documentation baseline: `develop` source on 2026-10-23 (commit `1633ca2`). Environments may run different revisions; a closed issue does not establish production availability.

| Capability | Documented position |
| --- | --- |
| Catalog, search, filters, pagination, navigation and eight languages | Implemented in the interface. |
| Discovery, lifecycle events, periodic collection, incidents and persistence | Implemented in the backend. |
| Operational status, source metrics, collection evidence and methodology | Available through the API and application detail; a dedicated page explains the recorded model, formula, parameters and factor without recalculation. Failures, missing data and stale data remain distinct. |
| Per-application environmental analysis, time series and contribution inspection | Available in the API and integrated into application detail. |
| Aggregate environmental summary | API endpoint available (`GET /analysis/summary`); no dedicated aggregate dashboard in the interface yet. |
| Light/dark theme | Available as an interface preference. |

## Journeys and value

1. Find an application and open its detail to confirm identity, location and status.
2. Investigate a change by distinguishing the latest attempt, last valid observation and missing data.
3. In application detail, select a period and granularity, interpret the series and coverage, and inspect a bucket's contributions without turning gaps into zero.

The [user guide](../guide/monitoring) covers existing behavior; [epics](../roadmap) describe expected capabilities.

## Product boundaries

Environmental estimates are neither direct electricity measurements nor proof of savings caused by an action. Efficiency per transaction requires workload data. The detail series compares one application with the immediately preceding window of equal duration; this does not provide cross-application or dashboard-level period comparison. A map is optional.

## Assessing outcomes

At reviews, check whether people can locate an application, distinguish zero from missing data, and trace a result to its period, unit and evidence. Record evaluated tasks, difficulties, feedback and changes in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) and [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Time, satisfaction and performance targets need a baseline and approval; this documentation sets no arbitrary numbers.
