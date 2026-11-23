# Plan de entregas y evidencias

Las entregas de GreenER combinan amplitud funcional, ingeniería de software y trazabilidad ambiental. Este documento presenta capacidades implementadas, evidencias de los 27 criterios de la rúbrica y contribuciones de los cinco integrantes en tres sprints, con enlaces a código, pruebas y documentación.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Producto integrado e ingeniería {#engineering}

React 19 y TypeScript sustentan la interfaz; NestJS organiza la API en módulos y capas con inyección de dependencias; TypeORM y PostgreSQL preservan los datos mediante migraciones versionadas. Integraciones validadas, auditoría transaccional y snapshots de cálculo respaldan la consistencia de los indicadores.

En la base documentada, la CI aprobó 542 pruebas de frontend, 705 de backend y tres flujos integrados, además de lint, tipado, builds, migraciones y el gate SonarQube Cloud. El sitio ofrece 12 idiomas con comprobación automática de equivalencia de contenido, contratos y enlaces.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Criterios y verificación {#criteria}

| Código | Puntos | Entrega | Verificación | Evidencia presentada |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Backlog estructurado |
| GA02 | 5 | Planificación y capacidad | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Iteraciones y responsables en el Project |
| GA03 | 5 | Criterios de aceptación | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Criterios en las issues |
| GA04 | 4 | Seguimiento | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | PRs y commits vinculados |
| GA05 | 3 | Incrementos | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| GA06 | 4 | Review y adaptación | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Revisiones técnicas registradas |
| GA07 | 3 | Definición de terminado | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | DoD documentada |
| GA08 | 3 | Documentación y ejecución | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Documentación versionada |
| GA09 | 8 | Participación | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW01 | 3 | Tecnologías | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW02 | 5 | Integraciones | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW03 | 4 | API y backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW04 | 4 | Persistencia ORM | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW06 | 3 | Autenticación | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| DW07 | 3 | Contenedores | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP01 | 4 | Responsabilidades | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP02 | 4 | Inyección de dependencias | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP03 | 4 | Tipos y legibilidad | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP04 | 4 | Pruebas unitarias | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| TP05 | 4 | Validación y fallos | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC01 | 3 | Usuarios y tareas | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC02 | 3 | Flujos y prototipos | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Prototipos y flujos documentados |
| IHC03 | 3 | Indicadores y estados | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC04 | 2 | Adaptabilidad y feedback | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementado/verificado |
| IHC05 | 2 | Evaluación con usuarios | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Protocolo de evaluación |
| IHC06 | 2 | Mejoras y nueva evaluación | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Feedback de interfaz registrado |

## Sprints y referencias {#sprints}

| Sprint | Período | Capacidades integradas |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Fundamentos, catálogo y recopilación |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indicadores, interfaz y autenticación |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | Historial, análisis y evolución operativa |

## Definición de terminado {#done}

Criterios de aceptación, integridad de los datos, pruebas, CI, documentación, accesibilidad y revisión componen la Definition of Done. Cada entrega vincula su versión con evidencias de verificación.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Participación y fuentes {#sources}

Los cinco integrantes tienen contribuciones incorporadas en los tres sprints. Las tablas vinculan autoría Git con commits verificables y muestran las tareas y responsables registrados en el Project, permitiendo seguir la participación en la construcción del producto.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Evidencias de calidad {#quality-evidence}

Código, pruebas automatizadas, contratos y documentación forman una cadena de verificación de las entregas. La matriz detallada, el protocolo de usabilidad y los registros técnicos permiten examinar flujos, criterios de calidad y evidencias de cada dimensión del proyecto.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
