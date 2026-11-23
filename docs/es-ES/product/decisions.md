# Decisiones y dependencias

Los cambios de alcance y reglas registran problema, resultado esperado y criterios de aceptación en las historias correspondientes. Las revisiones y evaluaciones de usabilidad registran dificultades, comentarios y mejoras. Aún deben definirse retención, backup y recuperación, metas operativas y cuotas externas.

## Reglas del producto {#rules}

| Regla | Significado |
| --- | --- |
| Historial preservado | Cambiar preferencias o generar una vista previa no reemplaza originales. |
| Ausencia explícita | Fallos, métricas ausentes y datos antiguos se distinguen de cero. |
| Consulta pública | Leer indicadores no requiere login; guardar preferencias y administrar cuentas requiere autorización. |

## Estado actual y dependencias {#planned}

La comparación, simulación regional, ranking, gestión de usuarios y roles, recuperación de contraseña y controles de monitorización están implementados. La administración exige autorización; SSO y correo dependen de la configuración del entorno. La exportación CSV y las políticas de retención, copia de seguridad y recuperación siguen siendo dependencias de producto.

## Modelo de estimación {#method}

La energía se estima con un modelo simplificado de CPU, memoria, disco y red durante el intervalo observado. La potencia se convierte en energía según la duración. Las emisiones multiplican energía por intensidad de carbono regional. Los coeficientes pertenecen al modelo académico, no son mediciones eléctricas ni factores regionales oficiales. Los resultados conservan su metodología y factor originales.

## Criterios de aceptación {#acceptance}

El producto debe permitir localizar una aplicación, distinguir cero de ausencia y rastrear un indicador hasta período, unidad, cobertura y metodología. Las consultas conservan contexto y comunican carga, vacío, fallo y datos antiguos. La evaluación incluye teclado, foco visible, texto además de color, móviles y los 12 idiomas.

## Lecturas relacionadas {#related}

[Backlog del producto](../roadmap) · [Metodología y datos](../product/methodology)
