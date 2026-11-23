# Engineering principles

Epics, stories and tasks organize the product around verifiable criteria and code references. Issues, pull requests and commits connect requirements, implementation and tests; the documentation brings architecture, contracts, operations and evidence into a versioned collection.

## Product rules {#rules}

| Rule | Meaning |
| --- | --- |
| Preserved history | Changing preferences or generating a preview never replaces original results. |
| Explicit missing data | Failures, missing metrics and older data remain distinct from zero. |
| Public queries | Reading indicators requires no login; saving preferences and administering accounts requires authorized access. |

## Integrated capabilities {#planned}

The platform offers application comparison, environmental ranking, regional simulation, user and role management, password recovery and monitoring controls. JWT authentication, Google SSO and a TOTP second factor protect administrative workflows, while environmental queries remain public.

## Estimation model {#method}

Energy is estimated by a simplified model using CPU, memory, disk and network during the observation interval. Estimated power becomes energy according to duration. Emissions equal energy multiplied by regional carbon intensity. Coefficients belong to the academic model; they are neither direct electricity measurements nor official regional factors. Results retain the methodology and factor used at their origin.

## Acceptance criteria {#acceptance}

The interface connects indicators to their period, unit, coverage and methodology while preserving filters and navigation context. Loading, empty, failure and stale-data states receive explicit handling. Keyboard navigation, visible focus, text beyond color, mobile devices, themes and 12 languages are part of the user experience.

## Related reading {#related}

[Product backlog](../roadmap) · [Methodology and data](../product/methodology)
