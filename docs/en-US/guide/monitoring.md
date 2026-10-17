# Use the catalog and investigate an application

This guide covers the existing catalog and operational detail. Environmental dashboards, analysis and administration remain planned in the [epics](../roadmap).

## Find an application

1. Open the environment's frontend; for local use, follow [Getting started](../getting-started).
2. Search by name, ID, regional code or region and combine the search with the state filter.
3. Use pagination for larger result sets. Clear filters before interpreting no matches as an empty catalog.
4. Open the application and confirm its ID and location. A null city does not invalidate a record; incomplete legacy locations are unknown.

Search, state and page are stored in the URL (`q`, `state`, `page`). Save the link to recover that context. These filters currently run in the frontend over the API's complete list.

## Follow updates

Catalog and detail request the API on entry and schedule the next request 60 seconds after each attempt finishes. This polling is independent of backend collection and the interval reported by the aggregator. A screen refresh does not guarantee a new observation.

The interface shows attempt and valid-response times. A failure following success preserves previous data; it is not a new observation. The catalog's manual refresh retries without reloading the page. Leaving the screen cancels pending requests.

## Interpret outcomes

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

The API already exposes collection evidence; full metric and freshness presentation has separate UI deliverables. Read [Methodology and data meaning](../product/methodology) before interpreting indicators.

## Language and reporting problems

The selector offers eight languages and stores the preference in this browser. Changing language does not create another application or change observation instants.

Report environment, application ID, filters, time with timezone, action and expected/observed result. Attach screenshots without credentials or private data. For environment failures, follow [Operations and diagnosis](../operations).

## Theme preference

In the navigation preferences, use the **Dark mode** switch: off applies light; on applies dark. On the first visit, GreenER follows the system appearance, including changes while the app is open, until you use the switch. Your explicit choice then takes precedence; this interface has no action to restore system tracking.

The choice applies to the catalog, details and global layout without changing filters or data. It is saved in this browser under `greener-theme` for the next visit. If storage is blocked, the choice still works during the session but may not survive a reload.
