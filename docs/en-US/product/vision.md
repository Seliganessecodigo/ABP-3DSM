# Vision and scope

GreenER helps monitor applications and understand their estimated energy consumption and carbon dioxide equivalent emissions (CO₂e). It brings together indicators, location and history to support assessment of the environmental impact of digital services.

## Who it is for {#readers}

| Audience | Need |
| --- | --- |
| Infrastructure management | Identify applications and track changes in the environment. |
| Environmental and operational analysis | Investigate consumption, emissions and data quality for a period. |
| Development and assessment | Check product behavior and reproduce its results. |

## Available features {#features}

| Feature | Reference |
| --- | --- |
| Catalog and search | [Find an application](../guide/monitoring#catalog) |
| Automatic monitoring | [Interpret the data](../guide/monitoring#data) |
| Environmental dashboard | [Read the dashboard](../guide/monitoring#dashboard) |
| Application details | [Investigate application details](../guide/monitoring#detail) |
| History and composition | [Explore history](../guide/monitoring#history) |
| Recalculation preview | [Compare with a recalculation preview](../guide/monitoring#preview) |
| Personal preferences | [Personalize analysis](../guide/monitoring#preferences) |
| Login and second factor | [Sign in](../guide/monitoring#access) |
| Sorting by impact | [Read the dashboard](../guide/monitoring#dashboard) |

## Analysis journey {#journey}

Start with the environmental summary, identify an application that needs attention and open its details. Use history to investigate the period and methodology to understand how values were estimated. Always consider coverage before comparing results.

## Usage limits {#limits}

Energy is estimated by a simplified model using CPU, memory, disk and network during the observation interval. Estimated power becomes energy according to duration. Emissions equal energy multiplied by regional carbon intensity. Coefficients belong to the academic model; they are neither direct electricity measurements nor official regional factors. Results retain the methodology and factor used at their origin.

Coverage is the proportion of a period supported by valid observations. Energy and emissions have separate coverage: estimated energy may exist even when a carbon factor is missing for emissions. Compare compatible periods, units and coverage. Low coverage signals partial analysis, not proven lower consumption.

## Planned improvements {#planned}

Planned improvements include dedicated cross-application comparison, simulation in another region, complete user and role management, self-service password recovery, global monitoring controls. CSV export requires a scope decision. The dashboard already sorts applications by energy or emissions. Priorities are maintained in the backlog; this documentation sets no delivery dates for these improvements.

## Related reading {#related}

[User guide](../guide/monitoring) · [Methodology and data](../product/methodology) · [Product backlog](../roadmap)
