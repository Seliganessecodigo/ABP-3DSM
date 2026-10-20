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

Referencia: código de `develop`, 15/10/2026. Los entornos pueden ejecutar revisiones diferentes; una issue cerrada no demuestra disponibilidad en producción.

| Capacidad | Situación |
| --- | --- |
| Catálogo, búsqueda/filtro de estado, navegación y ocho idiomas | Implementados en la interfaz. |
| Descubrimiento, eventos del ciclo de vida, recopilación periódica y persistencia | Implementados en el backend. |
| Estado operativo y evidencias de recopilación | Expuestos por la API; su presentación completa tiene tareas propias. |
| Dashboard ambiental, energía/CO₂e, series, ranking y comparación | Alcance planificado. |
| Temas, autenticación, administración, simulación regional y vista previa de recálculo | Planificados, con dependencias en el backlog. |

## Recorridos y valor

1. Encontrar una aplicación y abrir el detalle para confirmar identidad, ubicación y estado.
2. Investigar cambios distinguiendo último intento, última observación válida y ausencia.
3. En el alcance ambiental planificado, seleccionar período, comprobar cobertura/metodología y comparar el mismo contexto.
4. En la administración planificada, cambiar parámetros autorizados sin reescribir resultados históricos.

La [guía](../guide/monitoring) cubre lo existente; las [épicas](../roadmap), el comportamiento esperado.

## Límites y evaluación

Las estimaciones no son mediciones eléctricas directas ni prueba de ahorro causado por una acción. Eficiencia por transacción exige datos de trabajo realizado. CSV, columnas configurables y período anterior no entran en el MVP solo por aparecer en Figma. El mapa es opcional.

En las reviews, comprobar si las personas encuentran aplicaciones, distinguen cero de ausencia y rastrean resultados hasta período, unidad y evidencia. Registrar dificultades, feedback y cambios en [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) y [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Metas de tiempo, satisfacción y rendimiento necesitan baseline y aprobación.
