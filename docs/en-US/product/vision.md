# Product vision and scope

GreenER addresses three questions: which applications are monitored, what evidence supports their consumption, and how to interpret estimated energy and emissions. Discovery, metrics, regional context and history support investigation and prioritization.

## Audiences

| Audience | Need |
| --- | --- |
| Infrastructure management | Identify applications and track changes in the environment. |
| Operational and environmental analysis | Investigate periods, compare compatible results and understand gaps. |
| Administrative operations | Change parameters and access with authorization and traceability. |
| Development and assessment team | Reproduce the environment and demonstrate acceptance criteria. |

These audiences describe needs; the full role and permission matrix is a [pending product decision](./decisions).

## Scope and availability

Documentation baseline: 2026-10-15, `develop` source. Environments may run different revisions; a closed issue does not establish production availability.

| Capability | Documented position |
| --- | --- |
| Catalog, search/state filter, navigation and eight languages | Implemented in the interface. |
| Discovery, lifecycle events, periodic collection and persistence | Implemented in the backend. |
| Operational status and collection evidence queries | Exposed by the API; complete UI presentation has separate tasks. |
| Environmental dashboard, energy/CO₂e, series, ranking and comparison | Planned scope; not advertised as available features. |
| Themes, authentication, administration, regional simulation and recalculation preview | Planned scope, with backlog dependencies. |

## Journeys and value

1. Find an application and open its detail to confirm identity, location and status.
2. Investigate a change by distinguishing the latest attempt, last valid observation and missing data.
3. In the planned environmental scope, select a period, read coverage and methodology, and compare applications within the same context.
4. In planned administration, change authorized parameters without rewriting historical results.

The [user guide](../guide/monitoring) covers existing behavior; [epics](../roadmap) describe expected capabilities.

## Product boundaries

Environmental estimates are neither direct electricity measurements nor proof of savings caused by an action. Efficiency per transaction requires workload data. CSV export, configurable columns and previous-period comparisons do not enter the MVP solely because they appear in a prototype. A map is optional.

## Assessing outcomes

At reviews, check whether people can locate an application, distinguish zero from missing data, and trace a result to its period, unit and evidence. Record evaluated tasks, difficulties, feedback and changes in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) and [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Time, satisfaction and performance targets need a baseline and approval; this documentation sets no arbitrary numbers.
