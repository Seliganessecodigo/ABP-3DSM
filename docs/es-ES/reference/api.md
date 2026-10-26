# Referencia de la API GreenER

Rutas comprobadas en `develop` el 23/10/2026 (commit `1633ca2`). Swagger local: `http://localhost:3000/docs`; schema: `/openapi.json`. El OpenAPI del entorno integrado proporciona los DTOs completos.

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

Solo backend accede a fuentes; [contratos versionados](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md). No se publican endpoints futuros de energía, autenticación o administración. JWT administrativo es requisito de [EP06](../backlog/ep06), no API disponible presupuesta. Consulte [Operación](../operations) para URL/CORS/diagnóstico y [Metodología](../product/methodology) para intervalos.

## Consultar análisis ambiental

`GET /applications/{id}/analysis` requiere `from` y `to` como timestamps RFC 3339 con zona horaria explícita. El inicio se incluye y el final se excluye; ambos se normalizan a UTC. La respuesta contiene `status` (`available` o `empty`), período, energía, emisiones, cobertura separada y procedencia (metodologías, factores consultados y motivos). `null` significa que no hay un resultado utilizable; cero es válido.

| HTTP / código | Significado |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | Timestamp inválido o sin zona horaria, o `to` menor o igual que `from`. |
| 404 / APPLICATION_NOT_FOUND | Aplicación desconocida. |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | Error al consultar análisis o resultados persistidos. |

El resumen y la serie por aplicación están integrados en el detalle. La consulta de contribuciones por bucket también se usa allí; actualmente el frontend solicita la primera página y la paginación interactiva sigue pendiente.


## Consultar serie ambiental

`GET /applications/{id}/analysis/series` requiere `from`, `to` y `granularity` (`hour`, `day`, `month` o `year`). Devuelve `points`, `events`, totales y cobertura. Los buckets usan calendario UTC, cuentan solo la superposición con el período y pueden ser parciales. Se rechazan períodos que generarían más de 10.000 puntos; el servidor no trunca ni cambia la granularidad.

`GET /applications/{id}/analysis/series/contributions` también requiere `bucketStart`; `page` es 1 por defecto y `pageSize` es 10. Los tamaños permitidos son `5`, `10`, `15`, `20` y `all`; `all` solo se acepta en la página 1. La respuesta incluye contribuciones y exclusiones con snapshots guardados de metodología y factor.

## Consultar resumen agregado

`GET /analysis/summary` requiere `from` y `to`. Los filtros repetibles opcionales son `states`, `regionCodes` y `applicationIds`. Devuelve totales, cobertura, recuento por estado, aplicaciones, `dataAsOf` y procedencia. El endpoint ya existe, pero aún no hay una pantalla de dashboard agregado en la interfaz.

## Consultar incidentes de monitorización

`GET /monitoring/incidents` acepta `applicationId`, `source`, `integration`, `status`, `page` y `limit`. Los estados son `OPEN`, `RECOVERING` y `RESOLVED`; por defecto, página 1 y límite 20. La respuesta contiene `items`, `total`, `page` y `limit`. Consulta OpenAPI para límites y enumeraciones vigentes.
