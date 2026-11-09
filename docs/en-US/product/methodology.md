# Methodology and data meaning

Evidence must retain its meaning: missing, failed and stale data are not zero. Energy is estimated by the simplified model with versioned parameters; it is not a real electrical measurement, and its parameters are not an official regional factor. The CO₂e conversion relationship is implemented under #49/#53.

## Vocabulary and units

| Concept | Meaning |
| --- | --- |
| Application | Stable catalog identity; name and location can change. |
| Observation/collection | Persisted metrics tied to an application and interval. |
| Cycle | Discovery, reconciliation and collection execution; not one measurement. |
| Energy | Quantity accumulated over a period, in kWh. Power and energy are different quantities. |
| Carbon intensity | Regional factor in gCO₂e/kWh supplied by the source. |
| CO₂e | Equivalent emissions with an identified unit and factor. |
| Coverage | Portion of the requested period supported by valid evidence, calculated separately for energy and CO₂e. |
| Stale | A preserved earlier valid observation, not success of the current attempt. |

The documented aggregator provides CPU in %, and memory, disk and network in GB. These metrics are not kWh; conversion needs a documented model, coefficients and assumptions.

## Time and provenance

The metrics source publishes no measurement timestamp. GreenER records receipt time and derives `[receivedAt - collection_interval_seconds, receivedAt]`. This does not establish the source's exact measurement instants.

Latest attempt, last valid observation and registration update are different timestamps. A carbon-factor lookup time does not establish official validity. Snapshots preserve the received value, internal identity, contract and lookup time; unpublished bibliography and validity remain unknown.

## Environmental time rules

Queries use ISO timestamps with explicit offsets normalized to UTC and interval [from,to). UTC hourly/daily/monthly/yearly buckets count only overlap, including partial edge buckets. Presets 24h/7d/30d/90d are exact moving windows with one anchor for KPIs and series. Limit: 10,000 points; excess requests are rejected without truncation or granularity changes. Series prorate saved results by overlap without recalculating observations; overlaps choose latest collectedAt then ascending lexical ID, with no fallback when the winner lacks a usable measure. No extra rounding; coverage and original snapshots remain separate and preserved.

## Energy and emissions

The implemented dimensional relationship is:

    CO₂e [g] = energy [kWh] × intensity [gCO₂e/kWh]

Illustrative only: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0.2 kgCO₂e. These numbers are neither approved factors nor GreenER readings. This relationship does not define energy estimation from CPU, memory, disk and network.

When a factor is missing, valid energy remains valid, while CO₂e can be non-calculable. Zero requires valid evidence.

## History, recalculation and simulation

| Result | Product rule |
| --- | --- |
| Original | Preserve observations, configuration, methodology and factor used. |
| Regional simulation | Keep energy constant and evaluate another regional factor separately from official results. |

Totals, rankings and comparisons need compatible periods and coverage. Gaps do not receive zeros; percentages require a valid denominator. Approved temporal semantics are described above. In persistence, energy, emissions in grams and factor use eight decimal places; coverage, as a fraction from zero to one, uses four. Calculations do not round intermediate values, and JSON snapshots preserve their original representation.

## Methodology and data — simplified-energy v1

The implemented model is `simplified-energy`, version `1`: CPU at 100% = 100 W; memory = 0.375 W/GB; disk = 0.01 W/GB; network = 0.02 W/GB. These simplified-model parameters are neither electricity measurements nor official regional factors. Power sums the contributions; energy = W × hours / 1000; CO₂e[g] = kWh × gCO₂e/kWh. Snapshots record the method and factor used. Preview requests current factors without rewriting original snapshots.

At `/administration/calculations`, select an application and dates to compare original and preview. The UI end date includes the whole UTC day; the API receives `[from,to)`. Preview is public, uses the current model and current factors for historical regions, and saves or replaces no results. Limits: 30 days and 10,000 observations. Response fields are `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Factor failure preserves calculable energy while CO₂e remains unavailable. Percentages require matching units/coverage and a positive reference.

At `/methodology`, energy, emissions, coverage and analysis tabs provide examples and personal preferences. Any authenticated role can save its own tab using optimistic revisions; 409 means conflict. Thresholds affect presentation, not global settings, calculations or external notifications. Saved period/granularity only fill missing detail URL options. Recorded methodology remains at `/services/:id/methodology`, with `collectionId` when selected.
