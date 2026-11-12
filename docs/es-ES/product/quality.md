# Calidad y aceptación

El producto debe permitir localizar una aplicación, distinguir cero de ausencia y rastrear un indicador hasta período, unidad, cobertura y metodología. Las consultas conservan contexto y comunican carga, vacío, fallo y datos antiguos. La evaluación incluye teclado, foco visible, texto además de color, móviles y los 12 idiomas.

## Criterios de aceptación {#acceptance}

| Regla | Significado |
| --- | --- |
| Historial preservado | Cambiar preferencias o generar una vista previa no reemplaza originales. |
| Ausencia explícita | Fallos, métricas ausentes y datos antiguos se distinguen de cero. |
| Consulta pública | Leer indicadores no requiere login; guardar preferencias y administrar cuentas requiere autorización. |

## Interpretar los datos {#integrity}

Cero significa que existe una observación válida con ese valor. Una laguna indica que faltan datos utilizables, no consumo cero. Tras un fallo de actualización puede conservarse la última lectura válida con su hora original. Compruebe actualización y cobertura antes de decidir. Las pantallas consultan datos 60 segundos después de cada intento; eso no garantiza una medición nueva en cada actualización.

La cobertura es la proporción del período con observaciones válidas. Energía y emisiones tienen coberturas separadas: puede haber energía estimada sin factor de carbono para calcular emisiones. Compare períodos, unidades y coberturas compatibles. Una cobertura baja indica análisis parcial, no reducción demostrada del consumo.

## Criterios de validación {#assessment}

Los cambios de alcance y reglas registran problema, resultado esperado y criterios de aceptación en las historias correspondientes. Las revisiones y evaluaciones de usabilidad registran dificultades, comentarios y mejoras. Aún deben definirse retención, backup y recuperación, metas operativas y cuotas externas.

## Comprobaciones {#engineering}

[Contribuir](../contributing)

## Lecturas relacionadas {#related}

[Decisiones y dependencias](../product/decisions) · [Contribuir](../contributing)
