# GreenER glossary

## Incident

A persisted record that a specific monitoring source or application integration has failed and has not yet met the recovery rule. An incident belongs to one identity and one integration; closing it does not close another incident.

## Integration

A GreenER connection to an external service for a defined operation, such as listing registered services, collecting application metrics, or reading a regional carbon factor.

## Incident identity

The source scope and integration that determine which failures share one incident. The service catalog operation has a global identity; metrics and carbon-factor operations have identities per application and integration.

## Valid observation

An external response that passes the documented contract and is successfully processed and persisted by GreenER. A valid response alone does not count as recovery when its required persistence fails.

## Recovery sequence

The number of consecutive valid observations for the same incident identity and integration. A failed observation resets only that integration's sequence. The approved monitoring rule requires three consecutive valid observations in distinct cycles to close an incident.

## Stale observation

Previously valid data that remains available but is older than the latest monitoring attempt. A failure or missing value is not represented as zero.

**Environmental temporal coverage**:
The fraction of the requested period supported by usable results, calculated independently for energy and CO₂e across the selected application scope. It describes time coverage, not the number or share of applications.
_Avoid_: Application coverage, data share
