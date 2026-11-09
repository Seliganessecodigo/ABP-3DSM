# Decisions and dependencies

Changes to scope and usage rules should record the problem, expected outcome and acceptance criteria in the relevant stories. Product reviews and usability assessments capture observed difficulties, feedback and improvements. Data retention, backup and recovery, operational targets and external source quotas still require decisions.

## Product rules {#rules}

| Rule | Meaning |
| --- | --- |
| Preserved history | Changing preferences or generating a preview never replaces original results. |
| Explicit missing data | Failures, missing metrics and older data remain distinct from zero. |
| Public queries | Reading indicators requires no login; saving preferences and administering accounts requires authorized access. |

## Planned improvements {#planned}

Planned improvements include dedicated cross-application comparison, simulation in another region, complete user and role management, self-service password recovery, global monitoring controls. CSV export requires a scope decision. The dashboard already sorts applications by energy or emissions. Priorities are maintained in the backlog; this documentation sets no delivery dates for these improvements.

## Estimation model {#method}

Energy is estimated by a simplified model using CPU, memory, disk and network during the observation interval. Estimated power becomes energy according to duration. Emissions equal energy multiplied by regional carbon intensity. Coefficients belong to the academic model; they are neither direct electricity measurements nor official regional factors. Results retain the methodology and factor used at their origin.

## Acceptance criteria {#acceptance}

The product must let people find an application, distinguish zero from missing data and trace an indicator to its period, unit, coverage and methodology. Queries must preserve navigation context and communicate loading, empty results, failures and older data. Assessment includes keyboard use, visible focus, text beyond color, mobile devices and all 12 languages.

## Related reading {#related}

[Product backlog](../roadmap) · [Methodology and data](../product/methodology)
