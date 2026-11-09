# Requisitos transversales y aceptación

[EP00](../backlog/ep00) organiza fundamentos y calidad. Un RNF es permanente; su task entrega un artefacto finito. Terminar la configuración del banco no termina la obligación de mantener integridad.

## Evidencias de calidad

| Requisito | Evidencia |
| --- | --- |
| RNF-01 — Tecnologías | React/TypeScript y NestJS/TypeScript compilables. |
| RNF-02 — Responsabilidades | UI presenta; backend decide; adapters validan; repositories persisten. |
| RNF-03 — Historial | Migrations y pruebas de identidad, integridad y versiones. |
| RNF-04 — Seguridad | Secretos fuera de Git y autorización en backend. |
| RNF-05 — Reproducibilidad | Entorno documentado, CI verificable y publicación validada. |
| RNF-06 — Fallos | Distinguir éxito, vacío, error, ausencia y stale. |
| RNF-07 — Experiencia | Teclado, foco, contraste, texto/iconos además de color, responsive y doce idiomas. |

Pendientes: comparación dedicada de dos aplicaciones, simulación regional, gestión general de usuarios/roles, recuperación autónoma de contraseña, configuración global/pausa de monitorización y CSV. La ordenación por impacto ya existe. Faltan cuotas externas, retención, backup/restauración y metas operativas; sin SLA declarado. Recuperación TOTP por soporte no es reset de contraseña.

## Escenarios de demostración

| Dado / cuando | Resultado | Referencia |
| --- | --- | --- |
| Aplicación conocida ausente de snapshot completo y válido | Registrar retirada, conservar historial. | US-02 |
| Fuente falla o payload inválido | No confirmar retirada ni fabricar ceros. | US-02/05 |
| Observación válida y siguiente intento fallido | Conservar observación y distinguir frescura. | US-03/04 |
| Energía válida sin factor | No inventar CO₂e ni descartar energía. | US-07/08 |
| Solicitud de vista previa de recálculo | Original intacto; vista previa no persistida. | US-12 |
| Operación administrativa sin permiso | Backend rechaza cambio. | US-18/19/20 |

Los requisitos planificados necesitan implementación y pruebas antes de anunciarse entregados.

## Preparación, conclusión y gate

Antes de iniciar: entrega, consumidores, criterios, contrato y dependencias reales identificados. Coeficientes y permisos pendientes no son supuestos técnicos. El diseño exige estados, navegación y handoff verificable.

Conclusión: demostrar criterios, revisar código, probar fallos relevantes, actualizar contrato/documentación y adjuntar evidencias. Abrir PR no cierra la issue. Planning, review y feedback pertenecen a #134.

PRs a `develop`: checks pertinentes y SonarQube Cloud, cobertura nueva ≥ 80%, duplicación ≤ 3%, ratings A y hotspots revisados al 100%. Backend ejecutable requiere pruebas y LCOV. Véanse [CI](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/.github/quality-gates.md) y [Contribuir](../contributing). CI no sustituye aceptación funcional ni evaluación de usabilidad.

## CI — c343698

CI valida documentación, lint/test/build frontend, lint/typecheck/tests PostgreSQL/cobertura/build/migrations backend y flujo integrado real en navegador. `TEST_DATABASE_URL` requiere PostgreSQL aislado; sin ella, Jest omite suites de banco y el navegador integrado falla. SonarQube obligatorio en PR a `develop`: cobertura nueva ≥ 80%, duplicación ≤ 3%, ratings A y hotspots 100% revisados. No sustituye evaluación de usabilidad ni aceptación.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
