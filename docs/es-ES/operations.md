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

## Operación y diagnóstico — JWT / Google / SMTP

Node.js 24+, npm y Docker Compose v2. Copie `.env.example` a `.env`; ejecute `npm run dev`. Compose aplica migrations e intenta descubrimiento; fallo de origen no impide iniciar API. Configure SMTP para invitaciones/confirmaciones. Primer Admin: script `organizations:create-invitation` en `backend/`, con `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Sin Admin universal de producción.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Consultas ambientales y dashboard son públicos. `/login` acepta correo/contraseña o Google habilitado. Admin configura/confirma TOTP de seis dígitos, también tras Google; Analyst y Visitor no obtienen permisos administrativos. Sesión en memoria del frontend: recargar exige login. Backend valida JWT, sesión, rol y estado actuales; 401 indica credencial ausente/inválida, 403 rol insuficiente. Nuevas rutas protegidas por defecto.

Admin de la misma organización cambia cuentas entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` y motivo. Bloqueo/desactivación revocan sesiones; reactivación exige login nuevo. Se protege la propia cuenta y el último Admin activo. Conflicto: 409; destino ya alcanzado: éxito idempotente. Auditoría compartida: éxito en la transacción y denegación fuera del rollback, con actor explícito y sin secretos. No entrega gestión completa de roles ni recuperación de contraseña.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


Registre en Google Cloud la URI exacta de `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` solo habilita el botón; no configura backend ni crea cuentas: la vinculación requiere invitación. `GOOGLE_CLIENT_SECRET`, JWT, pepper y claves TOTP son secretos del backend; use valores independientes y conserve versiones necesarias. SMTP entrega invitaciones/confirmaciones. Soporte usa `authentication:recover-admin-totp` tras validar autoridad organizativa; revoca sesiones y genera auditoría.
