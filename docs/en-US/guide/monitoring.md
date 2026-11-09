# Use the catalog and investigate an application

This guide covers the catalog, operational detail and per-application environmental analysis available in the interface.

## Find an application

1. Open the environment's frontend; for local use, follow [Getting started](../getting-started).
2. Search by name, ID, regional code or region and combine the search with the state filter.
3. Use pagination for larger result sets. Clear filters before interpreting no matches as an empty catalog.
4. Open the application and confirm its ID and location. A null city does not invalidate a record; incomplete legacy locations are unknown.

Search, state and page are stored in the URL (`q`, `state`, `page`). Save the link to recover that context. These filters currently run in the frontend over the API's complete list.

## Follow updates

Catalog and detail request the API on entry and schedule the next request 60 seconds after each attempt finishes. This polling is independent of backend collection and the interval reported by the aggregator. A screen refresh does not guarantee a new observation.

The interface shows attempt and valid-response times. A failure following success preserves previous data; it is not a new observation. The catalog's manual refresh retries without reloading the page. Leaving the screen cancels pending requests.

## Analyze environmental results

In application detail, choose a rolling window of 24 hours, 7, 30 or 90 days and an hourly, daily, monthly or yearly granularity. The series shows energy and CO₂e from persisted results. Its overlay compares the selected window with the immediately preceding window of equal duration. This is a time comparison for one application, not a ranking or a comparison across applications.

## Interpret outcomes

To trace an indicator, open **View full methodology** from application detail. You can also choose **Methodology** in navigation and select an application. The page presents the recorded model, formula, parameters and assumptions, plus carbon-factor details when available. The detail link uses the selected collection; navigation uses the latest valid collection. The page explains saved evidence and does not recalculate the result.

| Situation | Meaning and next step |
| --- | --- |
| Empty catalog | The API returned no applications; check initial discovery. |
| No filtered matches | Adjust search/state; other applications may exist. |
| Initial failure | No valid data is available; retry and check operations. |
| Failure after success | Keep the previous reading and inspect its time. |
| Application not found | Check the ID/link; this differs from a known removed application. |
| Removed application | Identity and history remain known; a valid snapshot confirmed absence. |

## Status is not consumption

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` and `REMOVED` describe operational state. Freshness, attempt reason and calculability are separate dimensions. An available application may lack a carbon factor; an unavailable one may have valid history.

The detail screen shows operational status, source metrics, environmental results, a time series and period-based contribution inspection. Read the [API reference](../reference/api) and [methodology](../product/methodology) to distinguish missing data, failures and zero.

## Language and reporting problems

The selector offers twelve languages and stores the preference in this browser. Changing language does not create another application or change observation instants.

Report environment, application ID, filters, time with timezone, action and expected/observed result. Attach screenshots without credentials or private data. For environment failures, follow [Operations and diagnosis](../operations).

## Theme preference

In the navigation preferences, use the **Dark mode** switch: off applies light; on applies dark. On the first visit, GreenER follows the system appearance, including changes while the app is open, until you use the switch. Your explicit choice then takes precedence; this interface has no action to restore system tracking.

The choice applies to the catalog, details and global layout without changing filters or data. It is saved in this browser under `greener-theme` for the next visit. If storage is blocked, the choice still works during the session but may not survive a reload.

## Dashboard

At `/dashboard`, select 24 hours, 7, 30 or 90 days, state and region. The summary shows totals, coverage, state counts and emissions composition as bars or a donut. The table supports search, column filters, energy/CO₂e sorting and pagination. Table filters restrict rows without redefining summary totals. Open an application to investigate evidence. The dashboard calls `GET /analysis/summary` and refreshes periodically without reloading.

## User guide

At `/history`, select an application; `applicationId`, period and granularity retain URL context. The screen reuses the persisted detail series with filters, display timezone, events, numbered pages and bucket inspection. Contributions also support interactive pagination of 5, 10, 15, 20 or all items. Backend buckets remain UTC; changing display timezone does not regroup the series. The detail overlay compares the same application with the preceding equivalent window.

At `/administration/calculations`, select an application and dates to compare original and preview. The UI end date includes the whole UTC day; the API receives `[from,to)`. Preview is public, uses the current model and current factors for historical regions, and saves or replaces no results. Limits: 30 days and 10,000 observations. Response fields are `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Factor failure preserves calculable energy while CO₂e remains unavailable. Percentages require matching units/coverage and a positive reference.

At `/methodology`, energy, emissions, coverage and analysis tabs provide examples and personal preferences. Any authenticated role can save its own tab using optimistic revisions; 409 means conflict. Thresholds affect presentation, not global settings, calculations or external notifications. Saved period/granularity only fill missing detail URL options. Recorded methodology remains at `/services/:id/methodology`, with `collectionId` when selected.

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.
