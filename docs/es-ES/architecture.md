# Arquitectura

## Componentes

El entorno local utiliza Docker Compose para iniciar tres servicios: frontend, API y PostgreSQL.

| Área | Responsabilidad | Tecnologías |
| --- | --- | --- |
| `frontend/` | Interfaz, navegación y presentación | React 19, TypeScript, Vite, i18next |
| `backend/` | API, casos de uso e integraciones externas | NestJS, TypeScript, TypeORM |
| PostgreSQL | Persistencia de aplicaciones y datos del dominio | PostgreSQL 18 |

El frontend solo llama a la API de GreenER. Únicamente el backend se conecta al Agregador de Métricas y al Servicio de Intensidad de Carbono.

## Organización del código

- `frontend/src/pages/` mantiene cada pantalla junto con sus hooks, traducciones y CSS Modules.
- `frontend/src/features/` contiene contratos de dominio, validación, acceso HTTP, caché y reglas puras.
- `backend/src/modules/` agrupa endpoints y casos de uso por dominio.
- `backend/src/integrations/` adapta y valida las respuestas de las API auxiliares.
- `backend/src/database/` contiene entidades, migraciones y repositorios.

## Datos y fiabilidad

El backend integra las fuentes de datos y los persiste. Sigue los contratos, esquemas y unidades documentados. Los errores, los valores ausentes, las respuestas no válidas, los datos desactualizados y los ceros válidos son estados distintos; las pantallas deben conservar esa diferencia.

Consulta los [contratos de las API externas en el repositorio](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) y la [guía de organización del frontend](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md) para ver los detalles de implementación.
