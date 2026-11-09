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
| D06 | Los fallos de monitorización tienen un incidente por identidad y se recuperan tras tres observaciones válidas consecutivas. | Límite total de 30 s por llamada externa, hasta tres intentos HTTP contando el inicial y reintentos solo ante fallos transitorios; los ciclos no se solapan y se conservan las observaciones válidas. #243. |
| D07 | Consultas con zona explícita normalizada a UTC, [from,to), buckets UTC por hora/día/mes/año, referencia única de ventana y rechazo sobre 10.000 puntos. | #174/#235. |
| D08 | Las series usan resultados guardados prorrateados, sin recalcular historia; conflictos por recopilación reciente/ID ascendente; conservar huecos y snapshots. | #164/#174/#235. |

D01 y EP00 se confirmaron el 15/10/2026; las demás reglas constan en backlog y contratos versionados.

## Pendientes

| Tema | Decisión necesaria | Entregas |
| --- | --- | --- |
| Fuentes/operación | Confirmar cuotas y límites de concurrencia con los responsables de las API. La política de timeout/retry/retrasos de #243 está aprobada. | #155/#243 |
| Continuidad | Retención, backup/restauración, disponibilidad/rendimiento. | #110/#120/#125/#166 |
| Extras Figma | CSV, columnas y eficiencia por transacción. El detalle ya superpone la serie con el período anterior equivalente; la comparación entre aplicaciones y el dashboard temporal siguen siendo otro alcance. | #61/#248/#252 |

El PO decide alcance/comportamiento con responsables técnicos; contratos externos requieren proveedor. No se asignan fechas ni personas por suposición.

## Fuentes y cambios

Markdown: visión y reglas. Issues: criterios, tasks, dependencias y discusión. Projects: prioridad, estado, Sprint, fechas y PRs; no prueba implementación. Figma: intención visual/handoff; números ilustrativos no son contratos. OpenAPI/código: revisión ejecutable. Contratos externos: schemas/unidades con versión y fecha.

Ante conflicto, explicitarlo, resolver con el responsable y actualizar fuentes afectadas juntas. Figma no autoriza inventar endpoints. Issue/PR debe registrar decisión, motivo, alternativas relevantes, impacto en historias/datos/compatibilidad y evidencia. Decisiones arquitectónicas duraderas requieren ADR. Consulte [backlog](../roadmap) y [calidad](./quality).

## Decisiones y dependencias — c343698

En `/administration/calculations`, compare original y vista previa por aplicación y fechas. El día final incluye todo el día UTC; la API recibe `[from,to)`. La operación pública aplica modelo actual y factores actuales a regiones históricas, sin guardar resultados. Límites: 30 días y 10.000 observaciones. Devuelve `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fallo del factor conserva energía y deja CO₂e indisponible. Porcentajes requieren unidades/coberturas iguales y referencia positiva.

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.

Pendientes: comparación dedicada de dos aplicaciones, simulación regional, gestión general de usuarios/roles, recuperación autónoma de contraseña, configuración global/pausa de monitorización y CSV. La ordenación por impacto ya existe. Faltan cuotas externas, retención, backup/restauración y metas operativas; sin SLA declarado. Recuperación TOTP por soporte no es reset de contraseña.
