# User guide

Start with the environmental summary, identify an application that needs attention and open its details. Use history to investigate the period and methodology to understand how values were estimated. Always consider coverage before comparing results.

## Find an application {#catalog}

In the catalog, search by name, identifier or region and filter by application state. Browse table pages and open an application to inspect its data. If the search finds no matches, review the filters. The page address retains the search and pagination so you can share or resume the query.

## Read the dashboard {#dashboard}

On the dashboard, select 24 hours, 7, 30 or 90 days, a region and a state. Review energy, emissions, coverage and application counts by state. The chart shows emissions shares as bars or a donut. Search, filter and sort the table by impact; table filters change the displayed rows while summary totals retain the selected scope.

## Investigate application details {#detail}

Open application details to check identity, location, state and update times. Examine metrics and environmental results for the same period. Recorded methodology shows the model, parameters and carbon factor used in the calculation without changing the result. If the city is unavailable, the other location details remain useful.

## Explore history {#history}

In history, choose an application, a period and hourly, daily, monthly or yearly grouping. Use filters and pagination to find intervals, then open an interval's composition to inspect included observations and exclusions. The timezone changes date display; grouping remains UTC. The detail overlay compares the application with the preceding period of equal duration.

## Compare with a recalculation preview {#preview}

In recalculation preview, select an application and dates to compare the original result with an estimate using the current model and current carbon factors for the observed regions. The last selected day is included in full, in UTC. Queries accept up to 30 days and 10,000 observations. The preview is not saved and never changes history. Percentage differences appear when units and coverage match and the original value is positive.

## Personalize analysis {#preferences}

In Methodology, explore energy, emissions, coverage and analysis tabs. Demonstrations use sample data labeled on screen. Sign in to save presentation thresholds and initial period and grouping options. Each person changes only their own preferences; calculations and global settings remain preserved. If saving conflicts, reload the preference before retrying. Options already selected in the analysis address take priority over saved preferences.

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

## Related reading {#related}

[Methodology and data](../product/methodology) · [API reference](../reference/api)
