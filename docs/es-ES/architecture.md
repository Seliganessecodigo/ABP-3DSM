# Arquitectura

Esta parte está destinada a desarrollo y operación. Presenta entorno local, contratos y comprobaciones. Para aprender a utilizar el producto, consulte la guía de uso.

## Documentación técnica {#components}

React 19/TypeScript/Vite presenta; NestJS/TypeORM/PostgreSQL 18 integra y persiste. Solo backend llama fuentes auxiliares. Controllers: transporte; services: casos de uso; adapters: validación; repositories: persistencia. Guards globales de sesión/roles y excepciones `PublicRoute`. Preferencias por usuario; auditoría compartida en `backend/src/shared/audit/`, transaccional para mutaciones exitosas.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Iniciar sesión {#security}

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.

## Períodos e historial {#data}

`from` y `to` exigen RFC 3339 con zona explícita. `[from,to)` se normaliza a UTC. La serie admite `hour`, `day`, `month`, `year`, hasta 10.000 puntos; el exceso se rechaza. Resultados guardados se prorratean por solapamiento. Gana el mayor `collectedAt` y luego ID léxico ascendente, sin recurrir a otra observación si la ganadora no sostiene la métrica.

Las métricas no incluyen instante de medición de origen. Intervalo derivado de recepción menos `collection_interval_seconds`. Consulta del factor no demuestra vigencia; fuente/validez no publicadas siguen desconocidas. Energía, factor y emisiones guardan ocho decimales; cobertura cuatro. Sin redondeo intermedio. Coberturas separadas y snapshots originales conservados.

## Lecturas relacionadas {#related}

[Referencia de la API](./reference/api) · [Primeros pasos](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
