# Usar el catálogo e investigar una aplicación

Esta guía cubre el catálogo, el detalle operativo y el análisis ambiental por aplicación, disponibles en la interfaz.

## Encontrar una aplicación

1. Abra el frontend; para uso local, siga [Primeros pasos](../getting-started).
2. Busque por nombre, ID, código regional o región y combine el filtro de estado.
3. Use la paginación. Antes de interpretar cero coincidencias como catálogo vacío, quite los filtros.
4. Abra el detalle y confirme ID y ubicación. Ciudad nula es válida; ubicación histórica incompleta significa desconocida.

La URL conserva `q`, `state` y `page`. Guarde el enlace para recuperar el contexto. Los filtros actuales se ejecutan en el frontend sobre la lista de la API.

## Actualizaciones

Catálogo y detalle consultan al abrir y programan la siguiente consulta 60 segundos después de terminar cada intento. El polling es independiente de la recopilación del backend y del intervalo del agregador; actualizar la pantalla no garantiza una nueva observación.

La interfaz informa horas del intento y de la respuesta válida. Un fallo posterior conserva los datos anteriores, que no constituyen una observación nueva. La actualización manual del catálogo permite reintentar sin recargar. Salir cancela consultas pendientes.

## Analizar resultados ambientales

En el detalle de la aplicación, elija una ventana móvil de 24 horas, 7, 30 o 90 días y una granularidad horaria, diaria, mensual o anual. La serie muestra energía y CO₂e de resultados persistidos. La superposición compara la ventana seleccionada con la inmediatamente anterior de igual duración. Es una comparación temporal de una aplicación, no un ranking ni una comparación entre aplicaciones.

Use los filtros y el orden de la tabla para localizar intervalos. Inspeccione uno para ver las contribuciones incluidas y las exclusiones con sus motivos. La tabla pagina los resultados; la interfaz carga actualmente solo la primera página de contribuciones. Los huecos y las exclusiones no significan cero. Sin evidencia calculable, el resultado sigue sin estar disponible.

## Interpretar situaciones

Para rastrear un indicador, abra **Ver metodología completa** en el detalle de la aplicación. También puede elegir **Metodología** en la navegación y seleccionar una aplicación. La página presenta el modelo, la fórmula, los parámetros y supuestos registrados, además de los datos del factor de carbono cuando están disponibles. El enlace del detalle usa la recopilación seleccionada; la navegación usa la recopilación válida más reciente. La página explica la evidencia guardada y no recalcula el resultado.

| Situación | Significado / acción |
| --- | --- |
| Catálogo vacío | La API no devolvió aplicaciones; revisar descubrimiento inicial. |
| Sin coincidencias | Ajustar filtros; puede haber otras aplicaciones. |
| Fallo inicial | No hay datos válidos; reintentar y revisar operación. |
| Fallo después de éxito | Conservar lectura anterior y consultar su hora. |
| Aplicación no encontrada | Comprobar ID/enlace; no equivale a aplicación conocida retirada. |
| Aplicación retirada | Identidad e historial se conservan; snapshot válido confirmó ausencia. |

## Estado, idioma y soporte

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` y `REMOVED` son estados operativos. Frescura, motivo y calculabilidad son dimensiones distintas. Una aplicación disponible puede carecer de factor de carbono; una no disponible puede tener historial válido. El detalle muestra el estado, las métricas, los resultados ambientales, la serie histórica y las contribuciones consultables por período. Consulte la [referencia de la API](../reference/api) y la [metodología](../product/methodology) para distinguir ausencia, error y cero.

El selector ofrece ocho idiomas y guarda la preferencia en este navegador. Cambiar idioma no cambia identidades ni instantes.

Al comunicar un problema, incluya entorno, ID, filtros, fecha/hora con zona, acción y resultado esperado/observado. Evite credenciales/datos privados en capturas y siga [Operación](../operations).

## Preferencia de tema

En las preferencias de navegación, use el interruptor **Modo oscuro**: desactivado aplica claro; activado aplica oscuro. En la primera visita, GreenER sigue la apariencia del sistema, incluidos sus cambios durante el uso, hasta que accione el interruptor. Después prevalece su elección explícita; esta interfaz no ofrece una acción para volver a seguir el sistema.

La elección se aplica al catálogo, detalle y diseño global sin cambiar filtros ni datos. Se guarda en este navegador con la clave `greener-theme` para la próxima visita. Si el almacenamiento está bloqueado, la elección funciona durante la sesión, pero puede perderse al recargar.
