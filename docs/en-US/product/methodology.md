# Methodology and data

Energy is estimated by a simplified model using CPU, memory, disk and network during the observation interval. Estimated power becomes energy according to duration. Emissions equal energy multiplied by regional carbon intensity. Coefficients belong to the academic model; they are neither direct electricity measurements nor official regional factors. Results retain the methodology and factor used at their origin.

## Interpret the data {#vocabulary}

| Concept | Meaning |
| --- | --- |
| Application | A service with a stable catalog identity. |
| Observation | A set of metrics associated with an interval. |
| Energy | Estimated quantity for a period, expressed in kWh. |
| Carbon intensity | A regional factor, expressed in gCO₂e/kWh. |
| Emissions | Equivalent CO₂ quantity, with a stated unit. |
| Coverage | The share of a period supported by valid evidence. |

## Estimation model {#model}

| Parameter | Value |
| --- | --- |
| CPU (100%) | 100 W |
| Memory | 0.375 W/GB |
| Disk | 0.01 W/GB |
| Network | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Understand coverage {#coverage}

Coverage is the proportion of a period supported by valid observations. Energy and emissions have separate coverage: estimated energy may exist even when a carbon factor is missing for emissions. Compare compatible periods, units and coverage. Low coverage signals partial analysis, not proven lower consumption.

Zero means a valid observation supports that value. A gap means usable data is missing; it must not be read as zero consumption. When an update fails, the system may retain the last valid reading with its original timestamp. Check freshness and coverage before using an indicator for a decision. Screens request new information 60 seconds after each attempt; this does not guarantee a new measurement on every update.

## Periods and history {#history}

| Rule | Meaning |
| --- | --- |
| Preserved history | Changing preferences or generating a preview never replaces original results. |
| Explicit missing data | Failures, missing metrics and older data remain distinct from zero. |
| Public queries | Reading indicators requires no login; saving preferences and administering accounts requires authorized access. |

In recalculation preview, select an application and dates to compare the original result with an estimate using the current model and current carbon factors for the observed regions. The last selected day is included in full, in UTC. Queries accept up to 30 days and 10,000 observations. The preview is not saved and never changes history. Percentage differences appear when units and coverage match and the original value is positive.

## Related reading {#related}

[User guide](../guide/monitoring) · [API reference](../reference/api)
