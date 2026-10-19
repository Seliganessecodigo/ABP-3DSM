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
| Recalculation preview | Use identified current configuration without saving or replacing the original. Permissions, limits and factor policy remain pending. |
| Regional simulation | Keep energy constant and evaluate another regional factor separately from official results. |

Totals, rankings and comparisons need compatible periods and coverage. Gaps do not receive zeros; percentages require a valid denominator. Approved temporal semantics are described above. In persistence, energy, emissions in grams and factor use eight decimal places; coverage, as a fraction from zero to one, uses four. Calculations do not round intermediate values, and JSON snapshots preserve their original representation.
