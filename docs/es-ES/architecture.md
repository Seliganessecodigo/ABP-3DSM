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

## Lecturas relacionadas

[Metodología y datos](./product/methodology) · [Referencia de la API](./reference/api) · [Operación y diagnóstico](./operations)

## Arquitectura — c343698

React 19/TypeScript/Vite presenta; NestJS/TypeORM/PostgreSQL 18 integra y persiste. Solo backend llama fuentes auxiliares. Controllers: transporte; services: casos de uso; adapters: validación; repositories: persistencia. Guards globales de sesión/roles y excepciones `PublicRoute`. Preferencias por usuario; auditoría compartida en `backend/src/shared/audit/`, transaccional para mutaciones exitosas.

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
