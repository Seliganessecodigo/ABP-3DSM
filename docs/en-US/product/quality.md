# Quality and acceptance

The interface connects indicators to their period, unit, coverage and methodology while preserving filters and navigation context. Loading, empty, failure and stale-data states receive explicit handling. Keyboard navigation, visible focus, text beyond color, mobile devices, themes and 12 languages are part of the user experience.

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

Epics, stories and tasks organize the product around verifiable criteria and code references. Issues, pull requests and commits connect requirements, implementation and tests; the documentation brings architecture, contracts, operations and evidence into a versioned collection.

## Checks {#engineering}

For the documented baseline, CI passed 542 frontend tests, 705 backend tests and three integrated flows, alongside lint, type checks, builds, migrations and the SonarQube Cloud gate. The site offers 12 languages with automated checks for equivalent content, contracts and links.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Contributing](../contributing)

## Related reading {#related}

[Engineering principles](../product/decisions) · [Contributing](../contributing)
