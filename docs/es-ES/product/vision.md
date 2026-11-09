# Visión y alcance del producto

GreenER responde a tres preguntas: qué aplicaciones se supervisan, qué evidencias respaldan su consumo y cómo interpretar energía y emisiones estimadas. Descubrimiento, métricas, contexto regional e historial apoyan la investigación y la priorización.

## Públicos y necesidades

| Público | Necesidad |
| --- | --- |
| Gestión de infraestructura | Identificar aplicaciones y cambios del entorno. |
| Análisis operativo y ambiental | Investigar períodos, comparar resultados compatibles y entender lagunas. |
| Desarrollo y evaluación | Reproducir el entorno y demostrar criterios de aceptación. |

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

## Alcance y disponibilidad

Referencia: `origin/develop`, commit `c343698`, verificado el 08/11/2026. Cada entorno puede ejecutar otra revisión; merge no demuestra despliegue.

| Capacidad | Situación |
| --- | --- |
| Catálogo, búsqueda, filtros, paginación, navegación y doce idiomas | Implementados en la interfaz. |
| Descubrimiento, ciclo de vida, recopilación periódica, incidentes y persistencia | Implementados en el backend. |
| Estado operativo, métricas de origen, evidencias y metodología de recopilación | Disponibles en la API y el detalle; una página explica el modelo, la fórmula, los parámetros y el factor registrados sin recalcular. Se distinguen fallos, ausencia y datos obsoletos. |
| Análisis ambiental, series temporales e inspección de contribuciones por aplicación | Disponibles en la API e integrados en el detalle de la aplicación. |
| `/dashboard` · `GET /analysis/summary` | En `/dashboard`, elija 24 horas, 7, 30 o 90 días, estado y región. Consulte totales, cobertura, estados y composición de emisiones en barras o anillo. La tabla permite búsqueda, filtros, ordenación por energía/CO₂e y paginación; sus filtros no redefinen los totales. Abra una aplicación para investigar. Consume `GET /analysis/summary` con actualización periódica sin reload. |
| Tema claro/oscuro | Disponible como preferencia de interfaz. |

## Recorridos y valor

1. Encontrar una aplicación y abrir el detalle para confirmar identidad, ubicación y estado.
2. Investigar cambios distinguiendo último intento, última observación válida y ausencia.
3. En el detalle, seleccionar período y granularidad, interpretar serie/cobertura e investigar las contribuciones de un bucket sin convertir lagunas en cero.

La [guía](../guide/monitoring) cubre lo existente; las [épicas](../roadmap), el comportamiento esperado.

## Límites y evaluación

Las estimaciones no son mediciones eléctricas directas ni prueba de ahorro causado por una acción. Eficiencia por transacción exige datos de trabajo realizado. La serie del detalle compara una aplicación con la ventana inmediatamente anterior de igual duración; esto no ofrece comparación entre aplicaciones ni comparación de períodos en un dashboard. El mapa es opcional.

En las reviews, comprobar si las personas encuentran aplicaciones, distinguen cero de ausencia y rastrean resultados hasta período, unidad y evidencia. Registrar dificultades, feedback y cambios en [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) y [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Metas de tiempo, satisfacción y rendimiento necesitan baseline y aprobación.

## Guía de uso

En `/history`, elija una aplicación. `applicationId`, período y granularidad conservan contexto en la URL. Ofrece serie persistida, filtros, zona horaria visual, eventos, páginas numeradas e inspección. Las contribuciones tienen paginación interactiva de 5, 10, 15, 20 o todos. Los buckets siguen en UTC; cambiar la zona visual no reagrupa datos. El detalle compara la misma aplicación con la ventana anterior equivalente.

En `/administration/calculations`, compare original y vista previa por aplicación y fechas. El día final incluye todo el día UTC; la API recibe `[from,to)`. La operación pública aplica modelo actual y factores actuales a regiones históricas, sin guardar resultados. Límites: 30 días y 10.000 observaciones. Devuelve `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fallo del factor conserva energía y deja CO₂e indisponible. Porcentajes requieren unidades/coberturas iguales y referencia positiva.

`/methodology` ofrece pestañas de energía, emisiones, cobertura y análisis con ejemplos y preferencias personales. Cualquier rol autenticado guarda solo sus propias pestañas, con revisión optimista y 409 ante conflicto. Los límites visuales no cambian cálculos, configuración global ni notificaciones externas. Período/granularidad guardados completan solo parámetros ausentes en URL. Evidencia histórica: `/services/:id/methodology`, con `collectionId` seleccionado.

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.
