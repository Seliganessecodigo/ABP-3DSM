# Referencia de la API

Referencia para integrar con la API GreenER. El entorno publica tipos, campos opcionales y límites completos en `/openapi.json`; Swagger en `/docs`. Catálogo e historial leen datos persistidos. Vista previa y rutas de carbono pueden consultar la fuente de intensidad.

## Consultas públicas {#public}

| HTTP | URI | Acceso |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/analysis/comparison` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |

## Períodos e historial {#queries}

`from` y `to` exigen RFC 3339 con zona explícita. `[from,to)` se normaliza a UTC. La serie admite `hour`, `day`, `month`, `year`, hasta 10.000 puntos; el exceso se rechaza. Resultados guardados se prorratean por solapamiento. Gana el mayor `collectedAt` y luego ID léxico ascendente, sin recurrir a otra observación si la ganadora no sostiene la métrica.

| URI | Parámetro |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/analysis/comparison` | `from`, `to`, `applicationIds` (2–5 IDs), `referenceApplicationId` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

`GET /analysis/comparison` exige de 2 a 5 IDs únicos y una referencia seleccionada. Devuelve energía, emisiones, coberturas independientes, métricas y snapshots históricos de ubicación para el mismo período. Las diferencias son aplicación menos referencia; los porcentajes requieren una referencia positiva. Los valores ausentes permanecen explícitos y el estado es `empty`, `partial` o `complete`.

Las métricas no incluyen instante de medición de origen. Intervalo derivado de recepción menos `collection_interval_seconds`. Consulta del factor no demuestra vigencia; fuente/validez no publicadas siguen desconocidas. Energía, factor y emisiones guardan ocho decimales; cobertura cuatro. Sin redondeo intermedio. Coberturas separadas y snapshots originales conservados.

## Serie y explicación del cálculo {#environmental-presentation}

En `/analysis/summary`, el parámetro opcional `granularity` incluye `series.points` con el mismo período y filtros de los totales. Cada intervalo suma los resultados persistidos de las aplicaciones y mantiene coberturas independientes. Los valores ausentes siguen siendo `null`.

En `/applications/{id}/analysis`, `calculation.energyKwh` indica la energía de los segmentos con emisiones calculadas; `calculation.intensity` es el factor equivalente en gCO₂e/kWh, obtenido al dividir esas emisiones por la energía correspondiente. Con energía cero o ausente, el factor permanece nulo. Se conservan los resultados y factores históricos.

## Iniciar sesión {#login}

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

| HTTP | URI | Acceso |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Operaciones protegidas {#protected}

| HTTP | URI | Acceso |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Administrar cuentas mediante la API {#accounts}

Solo un Admin activo de la misma organización puede listar y crear cuentas o cambiar roles. La creación recibe `name`, `email`, `role` y `reason`, sin contraseña ni confirmación automática del correo. El titular define su contraseña mediante el flujo de confirmación existente; el envío de la confirmación se solicita por separado. La pantalla de gestión y la recuperación de contraseña siguen siendo entregas independientes.

La consulta aplica búsqueda y filtros antes de ordenar y paginar. El valor predeterminado es 10 elementos, con opciones 5, 10, 15, 20 y `all` para el conjunto filtrado completo. Las etiquetas traducidas deben convertirse en códigos de enumeración y las fechas locales en RFC 3339 con zona horaria. Los valores ausentes quedan al final en ambas direcciones; los empates se resuelven por identificador.

Cambiar un rol exige `expectedRole` y `reason`. El cambio revoca sesiones y credenciales TOTP temporales, conserva la auditoría e impide retirar el propio acceso o el último Admin activo con correo confirmado. Las cuentas sin confirmar no sustituyen a ese administrador. La asignación de Admin mantiene el requisito de TOTP.

## Comparar con una vista previa de recálculo {#preview}

En `/administration/calculations`, compare original y vista previa por aplicación y fechas. El día final incluye todo el día UTC; la API recibe `[from,to)`. La operación pública aplica modelo actual y factores actuales a regiones históricas, sin guardar resultados. Límites: 30 días y 10.000 observaciones. Devuelve `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fallo del factor conserva energía y deja CO₂e indisponible. Porcentajes requieren unidades/coberturas iguales y referencia positiva.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personalizar el análisis {#preferences}

En `/methodology`, configura límites de energía y emisiones por aplicación, la referencia de cobertura y los valores iniciales del análisis. Elige las últimas 24 horas, 7, 30 o 90 días, el mes actual en UTC o un intervalo personalizado con inicio incluido y fin excluido. La vista previa consulta datos reales sin guardar y utiliza el mismo panel de avisos que las aplicaciones y el Dashboard. Guardar exige iniciar sesión y afecta solo a tu cuenta; no modifica cálculos, historial ni estados operativos. Los avisos usan el período de cada límite independientemente de los filtros. Los valores iniciales solo completan opciones ausentes en la URL del Dashboard y del detalle. Los datos parciales inferiores al límite no demuestran su cumplimiento; la ausencia nunca equivale a cero.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled, period: {kind}}`; 0–100 |
| analysis | `{period: {kind}, granularity: "hour" / "day"}` |

```json
{ "period": { "kind": "custom", "from": "2026-11-01T00:00:00Z", "to": "2026-11-08T00:00:00Z" } }
```

```text
period.kind = 24h | 7d | 30d | 90d | month | custom
GET /me/preferences/alerts (JWT)
POST /me/preferences/alerts/preview (public, read-only)
{ energy, emissions, coverage } -> { configured, evaluatedAt, applications }
```

## Tratamiento de errores {#errors}

Trate errores por HTTP y códigos estructurados; el texto no es contrato de traducción. `null` significa ausencia y no se convierte en cero. Lista vacía es válida y distinta de fallo. Interprete los códigos según operación.

| HTTP | Código |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## Contrato HTTP {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Lecturas relacionadas {#related}

[Operación y diagnóstico](../operations) · [Metodología y datos](../product/methodology)
