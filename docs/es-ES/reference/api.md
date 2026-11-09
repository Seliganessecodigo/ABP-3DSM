# Referencia de la API GreenER

Referencia: `origin/develop`, commit `c343698`, verificado el 08/11/2026. Cada entorno puede ejecutar otra revisión; merge no demuestra despliegue. Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

## Lecturas existentes

| Método y ruta | Resultado |
| --- | --- |
| GET /health | Salud HTTP del servicio. |
| GET /applications | Array persistido; `[]` es válido. |
| GET /applications/{id} | Aplicación, estado, horarios y ubicación. |
| GET /applications/{id}/collections/latest | Última observación válida y contexto operativo. |
| GET /applications/{id}/collections/{collectionId} | Observación de esa aplicación; collectionId UUID. |
| GET /applications/{id}/analysis?from=…&to=… | Resultado ambiental persistido para una aplicación y un período. |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | Serie ambiental por aplicación. |
| GET /applications/{id}/analysis/series/contributions?… | Contribuciones y exclusiones de un bucket, paginadas. |
| GET /analysis/summary?from=…&to=… | Resumen ambiental agregado con filtros opcionales. |
| GET /monitoring/incidents | Incidentes de integración con filtros y paginación. |
| GET /openapi.json | Contrato para herramientas. |

Las lecturas usan datos persistidos; las consultas ambientales agregan resultados guardados y no recalculan el historial. Las series usan granularidad UTC y conservan lagunas y eventos. La búsqueda/paginación del catálogo se hace en el frontend.

## Consulta local

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Use un ID devuelto y codifíquelo en la URL; no presuponga IDs secuenciales ni UUID para aplicaciones. El DTO incluye `id`, `name`, `state`, `reason`, `lastObservationAt`, `isStale`, `isCalculable`, `firstSeenAt`, `lastCheckedAt`, `removedAt`, `updatedAt` y `location`. El detalle usa los campos operativos para explicar estado, frescura y calculabilidad; consulta OpenAPI para tipos y nulabilidad. Ciudad puede ser nula; registro legado incompleto, `location: null`.

## Errores

| HTTP / código | Significado |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | ID vacío/inválido según ruta; UUID de recopilación inválido también da 400. |
| 404 / APPLICATION_NOT_FOUND | Aplicación desconocida. |
| 404 / COLLECTION_NOT_FOUND | Observación inexistente para esa aplicación. |
| 503 / CATALOG_UNAVAILABLE | Fallo al leer catálogo. |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | Fallo al leer evidencias. |

Use códigos estructurados/status; mensajes no son contratos de traducción. No sustituya fallo por vacío o cero.

## Fronteras

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

## Consultar análisis ambiental

`GET /applications/{id}/analysis` requiere `from` y `to` como timestamps RFC 3339 con zona horaria explícita. El inicio se incluye y el final se excluye; ambos se normalizan a UTC. La respuesta contiene `status` (`available` o `empty`), período, energía, emisiones, cobertura separada y procedencia (metodologías, factores consultados y motivos). `null` significa que no hay un resultado utilizable; cero es válido.

| HTTP / código | Significado |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Timestamp inválido o sin zona horaria, o `to` menor o igual que `from`. |
| 404 / APPLICATION_NOT_FOUND | Aplicación desconocida. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Error al consultar análisis o resultados persistidos. |

En `/history`, elija una aplicación. `applicationId`, período y granularidad conservan contexto en la URL. Ofrece serie persistida, filtros, zona horaria visual, eventos, páginas numeradas e inspección. Las contribuciones tienen paginación interactiva de 5, 10, 15, 20 o todos. Los buckets siguen en UTC; cambiar la zona visual no reagrupa datos. El detalle compara la misma aplicación con la ventana anterior equivalente.

## Consultar serie ambiental

`GET /applications/{id}/analysis/series` requiere `from`, `to` y `granularity` (`hour`, `day`, `month` o `year`). Devuelve `points`, `events`, totales y cobertura. Los buckets usan calendario UTC, cuentan solo la superposición con el período y pueden ser parciales. Se rechazan períodos que generarían más de 10.000 puntos; el servidor no trunca ni cambia la granularidad.

`GET /applications/{id}/analysis/series/contributions` también requiere `bucketStart`; `page` es 1 por defecto y `pageSize` es 10. Los tamaños permitidos son `5`, `10`, `15`, `20` y `all`; `all` solo se acepta en la página 1. La respuesta incluye contribuciones y exclusiones con snapshots guardados de metodología y factor.

## Consultar resumen agregado

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. En `/dashboard`, elija 24 horas, 7, 30 o 90 días, estado y región. Consulte totales, cobertura, estados y composición de emisiones en barras o anillo. La tabla permite búsqueda, filtros, ordenación por energía/CO₂e y paginación; sus filtros no redefinen los totales. Abra una aplicación para investigar. Consume `GET /analysis/summary` con actualización periódica sin reload.

## Consultar incidentes de monitorización

`GET /monitoring/incidents` acepta `applicationId`, `source`, `integration`, `status`, `page` y `limit`. Los estados son `OPEN`, `RECOVERING` y `RESOLVED`; por defecto, página 1 y límite 20. La respuesta contiene `items`, `total`, `page` y `limit`. Consulta OpenAPI para límites y enumeraciones vigentes.

## Referencia de la API — JWT

| HTTP | URI | JWT / credential |
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
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.

## Referencia de la API — POST /applications/{id}/analysis/recalculation-preview

En `/administration/calculations`, compare original y vista previa por aplicación y fechas. El día final incluye todo el día UTC; la API recibe `[from,to)`. La operación pública aplica modelo actual y factores actuales a regiones históricas, sin guardar resultados. Límites: 30 días y 10.000 observaciones. Devuelve `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fallo del factor conserva energía y deja CO₂e indisponible. Porcentajes requieren unidades/coberturas iguales y referencia positiva.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## Referencia de la API — /me/preferences

`/methodology` ofrece pestañas de energía, emisiones, cobertura y análisis con ejemplos y preferencias personales. Cualquier rol autenticado guarda solo sus propias pestañas, con revisión optimista y 409 ante conflicto. Los límites visuales no cambian cálculos, configuración global ni notificaciones externas. Período/granularidad guardados completan solo parámetros ausentes en URL. Evidencia histórica: `/services/:id/methodology`, con `collectionId` seleccionado.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
