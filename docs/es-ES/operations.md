# Operación y diagnóstico

Mecanismos existentes, sin SLA de producción. Instalación: [Primeros pasos](./getting-started); contrato: [API](./reference/api).

## Configuración

| Configuración | Uso |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Puertos publicados por Compose. |
| DATABASE_URL | Backend host/nube; Compose utiliza servicio interno `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Fuentes exclusivas del backend. |
| CORS_ORIGIN | Origen frontend permitido; corresponde al acceso real. |
| VITE_API_URL | URL incorporada al build o entorno de desarrollo frontend. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Scheduler backend, predeterminado 60 segundos. |
| MONITORING_METRICS_CONCURRENCY | Concurrencia por proceso, inicialmente 2; no cota externa. |

Parámetros de monitorización: enteros positivos. Compose no pasa automáticamente esas dos claves desde `.env`; para sobrescribirlas necesita mapeo explícito. Credenciales del ejemplo son solo locales.

## Comprobar entorno

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

Descubrimiento manual repetible sin duplicar identidades. Scheduler comienza tras primer intervalo; bloqueo de superposición por proceso, no entre réplicas. Polling de UI y recopilación son independientes.

`/health` no prueba catálogo lleno, fuente accesible ni cálculo posible. Comprobar `/applications`, evidencias y logs del ciclo.

## Diagnóstico

| Síntoma | Comprobar |
| --- | --- |
| Containers no inician | Docker, puertos, variables, migrations. |
| UI abre; catálogo falla | URL en build, CORS, API, banco. |
| Catálogo vacío | Descubrimiento y agregador; vacío no es error HTTP. |
| Datos antiguos | Hora de observación, fallo del intento y resumen del ciclo. |
| Pipeline falla; API responde | Etapa de calidad, paquete, deploy o smoke; publicación puede preceder fallo posterior. |

## Publicación y recuperación

Staging parte de `develop`, depende de CI y separa API (Azure App Service) y frontend (Static Web Apps). Smoke test consulta endpoints tras publicar API. Antes de repetir, registrar run, SHA, etapa y diagnóstico.

Pages usa VitePress y `DOCS_BASE=/ABP-3DSM/`; build local no prueba publicación. Workflows no demuestran restauración automática de banco. Antes de rollback/migration destructiva comprobar compatibilidad y backup recuperable. Retención/ensayos de restauración son [pendencias](./product/decisions). `npm run dev:down` conserva volumen; eliminarlo elimina el banco local.
