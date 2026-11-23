# User guide

Start with the environmental summary, identify an application that needs attention and open its details. Use history to investigate the period and methodology to understand how values were estimated. Always consider coverage before comparing results.

## Find an application {#catalog}

In the catalog, search by name, identifier or region and filter by application state. Browse table pages and open an application to inspect its data. If the search finds no matches, review the filters. The page address retains the search and pagination so you can share or resume the query.

## Read the dashboard {#dashboard}

On the dashboard, choose a period, region and state to view energy, CO₂e, collection success and applications by state. Collection success is the share of recorded attempts that returned valid metrics and were saved; without records, the rate is unavailable. The indicator shows the first record in the period. Temporal coverage remains in analyses and the table, with partial-data warnings. Charts, search, filters and pagination retain the selected context.

In the time series, switch between energy and CO₂e or open the interval table. The 24-hour window uses hourly grouping; other windows use daily grouping. Intervals follow UTC and use the same filters as the indicators. Gaps remain without values.

## Investigate application details {#detail}

Open application details to check identity, location, state and update times. Examine metrics and environmental results for the same period. Recorded methodology shows the model, parameters and carbon factor used in the calculation without changing the result. If the city is unavailable, the other location details remain useful.

The equivalent factor summarizes the applied regional factors, weighted by energy with calculated emissions. The calculation explanation uses this energy, which may be lower than total energy when factors are missing for part of the period. Consult the methodology to check values and sources by region. The factor card keeps the same height as the other indicators, without expanding inside the card.

## Explore history {#history}

In history, choose an application, a period and hourly, daily, monthly or yearly grouping. Use filters and pagination to find intervals, then open an interval's composition to inspect included observations and exclusions. The timezone changes date display; grouping remains UTC. The detail overlay compares the application with the preceding period of equal duration.

## Calculation preview {#preview}

Cross-application comparison must use compatible periods, units and coverage. Regional simulation keeps observed energy, changes the scenario carbon factor and presents results separately from official indicators.

## Personalize analysis {#preferences}

In Methodology, explore energy, emissions, coverage and analysis defaults. Previews query real data and identify missing results or failures; they do not change history or formulas. Sign in to save personal thresholds and initial options. Explicit dates, filters and grouping in the address take precedence over saved defaults.

## Sign in {#access}

The catalog, dashboard and environmental queries are accessible without signing in. To save preferences, sign in with email and password or Google when enabled and your account has been linked through an invitation. Administrators also confirm a six-digit code from an authenticator app. Reloading the page ends the interface session and requires signing in again. Administrative permissions depend on the account's role.

## Language and appearance {#appearance}

Use the selector to choose from 12 languages. Your choice stays in this browser. The dark-mode switch changes appearance; before an explicit choice, the interface follows the system. If browser storage is blocked, these preferences may be lost on reload. Changing language formats dates and numbers while preserving observation instants.

## Interpret the data {#data}

Zero means a valid observation supports that value. A gap means usable data is missing; it must not be read as zero consumption. When an update fails, the system may retain the last valid reading with its original timestamp. Check freshness and coverage before using an indicator for a decision. Screens request new information 60 seconds after each attempt; this does not guarantee a new measurement on every update.

| State | Meaning |
| --- | --- |
| Available | The application returned usable metrics. |
| Unavailable | The current attempt failed; valid history may exist. |
| No metrics | The application is known, but the attempt has no usable metrics. |
| Removed | Absence was confirmed in the source catalog; identity and history remain. |

Coverage is the proportion of a period supported by valid observations. Energy and emissions have separate coverage: estimated energy may exist even when a carbon factor is missing for emissions. Compare compatible periods, units and coverage. Low coverage signals partial analysis, not proven lower consumption.

## Diagnosis {#support}

When reporting a problem, provide the application, period, filters, time with timezone and action taken. Describe expected and observed outcomes. Screenshots help when they contain no credentials or private data.

## Other analyses and settings {#other}

Ranking orders results by energy or CO₂e for the period. Comparison combines applications and a reference; regional simulation keeps energy unchanged and presents a separate scenario. In Settings, authorized users access monitoring, accounts and change auditing. The personal account allows password changes; login offers recovery with a temporary token.

## Related reading {#related}

[Methodology and data](../product/methodology) · [API reference](../reference/api)
