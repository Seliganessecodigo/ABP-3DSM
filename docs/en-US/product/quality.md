# Quality and acceptance

The product must let people find an application, distinguish zero from missing data and trace an indicator to its period, unit, coverage and methodology. Queries must preserve navigation context and communicate loading, empty results, failures and older data. Assessment includes keyboard use, visible focus, text beyond color, mobile devices and all 12 languages.

## Acceptance criteria {#acceptance}

| Rule | Meaning |
| --- | --- |
| Preserved history | Changing preferences or generating a preview never replaces original results. |
| Explicit missing data | Failures, missing metrics and older data remain distinct from zero. |
| Public queries | Reading indicators requires no login; saving preferences and administering accounts requires authorized access. |

## Interpret the data {#integrity}

Zero means a valid observation supports that value. A gap means usable data is missing; it must not be read as zero consumption. When an update fails, the system may retain the last valid reading with its original timestamp. Check freshness and coverage before using an indicator for a decision. Screens request new information 60 seconds after each attempt; this does not guarantee a new measurement on every update.

Coverage is the proportion of a period supported by valid observations. Energy and emissions have separate coverage: estimated energy may exist even when a carbon factor is missing for emissions. Compare compatible periods, units and coverage. Low coverage signals partial analysis, not proven lower consumption.

## Validation criteria {#assessment}

Changes to scope and usage rules should record the problem, expected outcome and acceptance criteria in the relevant stories. Product reviews and usability assessments capture observed difficulties, feedback and improvements. Data retention, backup and recovery, operational targets and external source quotas still require decisions.

## Checks {#engineering}

[Contributing](../contributing)

## Related reading {#related}

[Decisions and dependencies](../product/decisions) · [Contributing](../contributing)
