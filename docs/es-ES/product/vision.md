# Visión y alcance del producto

GreenER responde a tres preguntas: qué aplicaciones se supervisan, qué evidencias respaldan su consumo y cómo interpretar energía y emisiones estimadas. Descubrimiento, métricas, contexto regional e historial apoyan la investigación y la priorización.

## Públicos y necesidades

| Público | Necesidad |
| --- | --- |
| Gestión de infraestructura | Identificar aplicaciones y cambios del entorno. |
| Análisis operativo y ambiental | Investigar períodos, comparar resultados compatibles y entender lagunas. |
| Operación administrativa | Cambiar parámetros y acceso con autorización y trazabilidad. |
| Desarrollo y evaluación | Reproducir el entorno y demostrar criterios de aceptación. |

Son públicos, no una matriz definitiva de permisos; esta sigue [pendiente](./decisions).

## Alcance y disponibilidad

Referencia: código de `develop` del 23/10/2026 (commit `1633ca2`). Los entornos pueden ejecutar revisiones diferentes; una issue cerrada no demuestra disponibilidad en producción.

| Capacidad | Situación |
| --- | --- |
| Catálogo, búsqueda, filtros, paginación, navegación y ocho idiomas | Implementados en la interfaz. |
| Descubrimiento, ciclo de vida, recopilación periódica, incidentes y persistencia | Implementados en el backend. |
| Estado operativo, métricas de origen, evidencias y metodología de recopilación | Disponibles en la API y el detalle; una página explica el modelo, la fórmula, los parámetros y el factor registrados sin recalcular. Se distinguen fallos, ausencia y datos obsoletos. |
| Análisis ambiental, series temporales e inspección de contribuciones por aplicación | Disponibles en la API e integrados en el detalle de la aplicación. |
| Resumen ambiental agregado | Endpoint disponible en la API (`GET /analysis/summary`); aún no hay dashboard agregado en la interfaz. |
| Ranking y comparación entre aplicaciones | Planificados. |
| Tema claro/oscuro | Disponible como preferencia de interfaz. |
| Autenticación, administración, simulación regional y vista previa de recálculo | Planificados, con dependencias en el backlog. |

## Recorridos y valor

1. Encontrar una aplicación y abrir el detalle para confirmar identidad, ubicación y estado.
2. Investigar cambios distinguiendo último intento, última observación válida y ausencia.
3. En el detalle, seleccionar período y granularidad, interpretar serie/cobertura e investigar las contribuciones de un bucket sin convertir lagunas en cero.
4. En el alcance planificado, resumir las aplicaciones, ordenarlas por impacto y comparar resultados compatibles.
5. En la administración planificada, cambiar parámetros autorizados sin reescribir resultados históricos.

La [guía](../guide/monitoring) cubre lo existente; las [épicas](../roadmap), el comportamiento esperado.

## Límites y evaluación

Las estimaciones no son mediciones eléctricas directas ni prueba de ahorro causado por una acción. Eficiencia por transacción exige datos de trabajo realizado. La serie del detalle compara una aplicación con la ventana inmediatamente anterior de igual duración; esto no ofrece comparación entre aplicaciones ni comparación de períodos en un dashboard. La exportación CSV y las columnas configurables no entran en el MVP solo por aparecer en Figma. El mapa es opcional.

En las reviews, comprobar si las personas encuentran aplicaciones, distinguen cero de ausencia y rastrean resultados hasta período, unidad y evidencia. Registrar dificultades, feedback y cambios en [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) y [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Metas de tiempo, satisfacción y rendimiento necesitan baseline y aprobación.
