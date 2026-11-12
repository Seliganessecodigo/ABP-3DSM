# Architecture

This part of the documentation is for development and operations. It covers the local environment, contracts and checks. To learn how to use the product, read the user guide.

## Technical documentation {#components}

React 19/TypeScript/Vite presents data; NestJS/TypeORM/PostgreSQL 18 integrates and persists it. Only the backend contacts auxiliary sources. Controllers handle transport, services coordinate use cases, adapters validate sources and repositories persist data. Global authentication/role guards protect routes; `PublicRoute` marks public exceptions. Preferences belong to the authenticated user; shared audit lives in `backend/src/shared/audit/` and joins successful mutation transactions.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Sign in {#security}

Dashboard and environmental queries are public. At `/login`, use email/password or Google when enabled. Admin must set up or confirm a six-digit TOTP before a session, including after Google. Analyst and Visitor receive no administrative authorization. The frontend holds sessions in memory; reloading requires login again. The backend checks JWT, session, current role and account status; missing/invalid credentials return 401, insufficient role 403. New routes are protected by default.

An Admin in the same organization can change accounts between `ACTIVE`, `BLOCKED`, `DEACTIVATED`, supplying `expectedStatus` and a reason. Blocking/deactivation revokes every session; reactivation requires a fresh login. Self-protection and the last active Admin are enforced. A mismatched expected state returns 409; an already reached target is idempotent success. Shared audit writes success in the mutation transaction and denials outside rolled-back transactions, with an explicit actor and no secrets. This route does not deliver full role management or password recovery.

## Periods and history {#data}

`from` and `to` require RFC 3339 with an explicit timezone. `[from,to)` is normalized to UTC. Series accept `hour`, `day`, `month`, `year`, with up to 10,000 points; excess is rejected. Saved results are prorated by overlap. Conflicts use the latest `collectedAt`, then ascending lexical ID, without falling back to an earlier observation if the winner cannot support a metric.

Source metrics have no measurement timestamp. The interval derives from receipt minus `collection_interval_seconds`. Factor query time does not establish validity; unpublished source and validity remain unknown. Energy, factor and emissions persist eight decimal places; coverage four. No intermediate rounding occurs. Energy and emissions retain separate coverage and original snapshots.

## Related reading {#related}

[API reference](./reference/api) · [Getting started](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
