# Vision and scope

GreenER brings continuous monitoring, energy and CO₂e estimates, and environmental analysis into one integrated platform. A dynamic catalog, dashboard, history, ranking, comparison and regional simulation connect the overview to investigation of individual applications, with indicators traceable to their source data and methodology.

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
| Personal preferences | [Personalize analysis](../guide/monitoring#preferences) |
| Login and second factor | [Sign in](../guide/monitoring#access) |
| Environmental ranking | [Environmental ranking](../guide/monitoring#other) |
| Application comparison | [Application comparison](../guide/monitoring#other) |
| Regional simulation | [Regional simulation](../guide/monitoring#other) |
| Accounts and password recovery | [Accounts and password recovery](../guide/monitoring#other) |

## Analysis journey {#journey}

Start with the environmental summary, identify an application that needs attention and open its details. Use history to investigate the period and methodology to understand how values were estimated. Always consider coverage before comparing results.

## Usage limits {#limits}

Energy is estimated by a simplified model using CPU, memory, disk and network during the observation interval. Estimated power becomes energy according to duration. Emissions equal energy multiplied by regional carbon intensity. Coefficients belong to the academic model; they are neither direct electricity measurements nor official regional factors. Results retain the methodology and factor used at their origin.

Coverage is the proportion of a period supported by valid observations. Energy and emissions have separate coverage: estimated energy may exist even when a carbon factor is missing for emissions. Compare compatible periods, units and coverage. Low coverage signals partial analysis, not proven lower consumption.

## Integrated capabilities {#planned}

The platform offers application comparison, environmental ranking, regional simulation, user and role management, password recovery and monitoring controls. JWT authentication, Google SSO and a TOTP second factor protect administrative workflows, while environmental queries remain public.

## Related reading {#related}

[User guide](../guide/monitoring) · [Methodology and data](../product/methodology) · [Product backlog](../roadmap)
