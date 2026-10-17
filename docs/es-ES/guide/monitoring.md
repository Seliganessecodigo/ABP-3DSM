# Usar el catálogo e investigar una aplicación

Esta guía cubre catálogo y detalle operativo existentes. Dashboard ambiental, análisis y administración siguen planificados en las [épicas](../roadmap).

## Encontrar una aplicación

1. Abra el frontend; para uso local, siga [Primeros pasos](../getting-started).
2. Busque por nombre, ID, código regional o región y combine el filtro de estado.
3. Use la paginación. Antes de interpretar cero coincidencias como catálogo vacío, quite los filtros.
4. Abra el detalle y confirme ID y ubicación. Ciudad nula es válida; ubicación histórica incompleta significa desconocida.

La URL conserva `q`, `state` y `page`. Guarde el enlace para recuperar el contexto. Los filtros actuales se ejecutan en el frontend sobre la lista de la API.

## Actualizaciones

Catálogo y detalle consultan al abrir y programan la siguiente consulta 60 segundos después de terminar cada intento. El polling es independiente de la recopilación del backend y del intervalo del agregador; actualizar la pantalla no garantiza una nueva observación.

La interfaz informa horas del intento y de la respuesta válida. Un fallo posterior conserva los datos anteriores, que no constituyen una observación nueva. La actualización manual del catálogo permite reintentar sin recargar. Salir cancela consultas pendientes.

## Interpretar situaciones

| Situación | Significado / acción |
| --- | --- |
| Catálogo vacío | La API no devolvió aplicaciones; revisar descubrimiento inicial. |
| Sin coincidencias | Ajustar filtros; puede haber otras aplicaciones. |
| Fallo inicial | No hay datos válidos; reintentar y revisar operación. |
| Fallo después de éxito | Conservar lectura anterior y consultar su hora. |
| Aplicación no encontrada | Comprobar ID/enlace; no equivale a aplicación conocida retirada. |
| Aplicación retirada | Identidad e historial se conservan; snapshot válido confirmó ausencia. |

## Estado, idioma y soporte

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` y `REMOVED` son estados operativos. Frescura, motivo y calculabilidad son dimensiones distintas. Una aplicación disponible puede carecer de factor de carbono; una no disponible puede tener historial válido. Las evidencias ya existen en la API; el bloque completo de métricas/frescura tiene tareas de UI. Consulte [Metodología](../product/methodology).

El selector ofrece ocho idiomas y guarda la preferencia en este navegador. Cambiar idioma no cambia identidades ni instantes.

Al comunicar un problema, incluya entorno, ID, filtros, fecha/hora con zona, acción y resultado esperado/observado. Evite credenciales/datos privados en capturas y siga [Operación](../operations).

## Preferencia de tema

En las preferencias de navegación, elija **Claro** u **Oscuro**. **Usar tema del sistema** restaura el seguimiento automático de la apariencia del sistema, incluidos los cambios durante el uso. En la primera visita, GreenER sigue el sistema.

La elección se aplica al catálogo, detalle y diseño global sin cambiar filtros ni datos. Se guarda en este navegador con la clave `greener-theme` para la próxima visita. Si el almacenamiento está bloqueado, la elección funciona durante la sesión, pero puede perderse al recargar.
