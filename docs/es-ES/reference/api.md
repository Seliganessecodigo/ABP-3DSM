# Referencia de la API GreenER

Rutas comprobadas en `develop` el 15/10/2026. Swagger local: `http://localhost:3000/docs`; schema: `/openapi.json`. El OpenAPI del entorno integrado proporciona los DTOs completos.

## Lecturas existentes

| Método y ruta | Resultado |
| --- | --- |
| GET /health | Salud HTTP del servicio. |
| GET /applications | Array persistido; `[]` es válido. |
| GET /applications/{id} | Aplicación, estado, horarios y ubicación. |
| GET /applications/{id}/collections/latest | Última observación válida y contexto operativo. |
| GET /applications/{id}/collections/{collectionId} | Observación de esa aplicación; collectionId UUID. |
| GET /openapi.json | Contrato para herramientas. |

Leen persistencia sin recopilar ni calcular impacto. Búsqueda/paginación actuales son del frontend; no hay parámetros de paginación de servidor documentados.

## Consulta local

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

Use un ID devuelto y codifíquelo en la URL; no presuponga IDs secuenciales ni UUID para aplicaciones. DTO: `id`, `name`, `state`, `firstSeenAt`, `lastCheckedAt`, `removedAt` y `location`. El backend también expone motivo, frescura y calculabilidad, aún no consumidos completamente por la UI. Ciudad puede ser nula; registro legado incompleto, `location: null`.

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
