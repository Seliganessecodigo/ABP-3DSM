# Decisiones, dependencias y fuentes

El registro hace visibles las decisiones sin aprobar funcionalidades por omisión. PDF v1.1 es referencia histórica; Markdown evoluciona por PR y se alinea con issues cuando cambia el comportamiento.

## Decisiones confirmadas

| ID | Decisión | Consecuencia |
| --- | --- | --- |
| D01 | Recálculo como vista previa sin guardar. | Original intacto; vista previa fuera de totales/historial. US-12, #263/#264. |
| D02 | Primera ausencia en snapshot completo y válido confirma retirada. | Error de fuente/404 de métricas no retira. US-02, #171. |
| D03 | Recepción GreenER no es timestamp de origen. | Identificar intervalos derivados, no inventar vigencia. #154/#155. |
| D04 | RNFs transversales y fundamentos/calidad en EP00. | Tasks terminadas no eximen calidad futura. |
| D05 | Simulación regional conserva energía. | El escenario no altera mediciones ni resultados oficiales. US-15. |

D01 y EP00 se confirmaron el 15/10/2026; las demás reglas constan en backlog y contratos versionados.

## Pendientes

| Tema | Decisión necesaria | Entregas |
| --- | --- | --- |
| Energía | Fórmula, coeficientes, conversiones y supuestos. | #49/#53/#58 |
| Tiempo/cobertura | Bordes, zona horaria, granularidad, redondeo, parciales. | #49/#156/#174/#175/#178 |
| Recálculo | Permisos, límites de volumen/período y factor. | #91/#263/#264 |
| Acceso/cuentas | Papeles, bootstrap, sesión, contraseña y recuperación. | #90/#91/#158/#160/#245 |
| Fuentes/operación | Timeout, retry, cotas, concurrencia y retrasos. | #155/#243 |
| Continuidad | Retención, backup/restauración, disponibilidad/rendimiento. | #110/#120/#125/#166 |
| Extras Figma | CSV, columnas, período anterior, eficiencia por transacción. | #61/#248/#252 |

El PO decide alcance/comportamiento con responsables técnicos; contratos externos requieren proveedor. No se asignan fechas ni personas por suposición.

## Fuentes y cambios

Markdown: visión y reglas. Issues: criterios, tasks, dependencias y discusión. Projects: prioridad, estado, Sprint, fechas y PRs; no prueba implementación. Figma: intención visual/handoff; números ilustrativos no son contratos. OpenAPI/código: revisión ejecutable. Contratos externos: schemas/unidades con versión y fecha.

Ante conflicto, explicitarlo, resolver con el responsable y actualizar fuentes afectadas juntas. Figma no autoriza inventar endpoints. Issue/PR debe registrar decisión, motivo, alternativas relevantes, impacto en historias/datos/compatibilidad y evidencia. Decisiones arquitectónicas duraderas requieren ADR. Consulte [backlog](../roadmap) y [calidad](./quality).
