# Calidad y aceptación

La interfaz vincula los indicadores con su período, unidad, cobertura y metodología, conservando filtros y contexto de navegación. Los estados de carga, vacío, fallo y datos desactualizados tienen tratamiento explícito. Teclado, foco visible, texto además de color, dispositivos móviles, temas y 12 idiomas forman parte de la experiencia.

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

Épicas, historias y tareas organizan el producto con criterios verificables y referencias al código. Issues, pull requests y commits conectan requisitos, implementación y pruebas; la documentación reúne arquitectura, contratos, operación y evidencias en un conjunto versionado.

## Comprobaciones {#engineering}

En la base documentada, la CI aprobó 542 pruebas de frontend, 705 de backend y tres flujos integrados, además de lint, tipado, builds, migraciones y el gate SonarQube Cloud. El sitio ofrece 12 idiomas con comprobación automática de equivalencia de contenido, contratos y enlaces.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Contribuir](../contributing)

## Lecturas relacionadas {#related}

[Principios de ingeniería](../product/decisions) · [Contribuir](../contributing)
