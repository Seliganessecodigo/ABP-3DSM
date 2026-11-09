# Operación y diagnóstico

Esta parte está destinada a desarrollo y operación. Presenta entorno local, contratos y comprobaciones. Para aprender a utilizar el producto, consulte la guía de uso.

## Configuración {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## Monitorización automática {#monitoring}

La monitorización comienza tras el primer intervalo e impide ciclos solapados por proceso. Intervalo/concurrencia deben ser enteros positivos. Compose no pasa automáticamente `MONITORING_SCHEDULE_INTERVAL_SECONDS` y `MONITORING_METRICS_CONCURRENCY` de `.env` a API: requieren mapeo explícito. `/health` verifica HTTP, no descubrimiento ni cálculo. Revise catálogo, evidencias y logs. Fallos de origen no confirman eliminación; recuperación tras tres observaciones válidas consecutivas.

La primera ausencia en un snapshot completo y válido confirma eliminación. Cada llamada externa tiene plazo total de 30 segundos y como máximo tres intentos HTTP contando el inicial; solo se reintentan fallos temporales.

## Iniciar sesión {#authentication}

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

Registre en Google Cloud la URI exacta de `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` solo habilita el botón; no configura backend ni crea cuentas: la vinculación requiere invitación. `GOOGLE_CLIENT_SECRET`, JWT, pepper y claves TOTP son secretos del backend; use valores independientes y conserve versiones necesarias. SMTP entrega invitaciones/confirmaciones. Soporte usa `authentication:recover-admin-totp` tras validar autoridad organizativa; revoca sesiones y genera auditoría.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## Diagnóstico {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Publicación y recuperación {#release}

Staging parte de `develop` tras CI: API en Azure App Service, frontend en Static Web Apps, con comprobación de endpoints tras API. Documentación en GitHub Pages con `DOCS_BASE=/ABP-3DSM/`. Identifique la etapa fallida antes de repetir. No hay restauración automática de base. `npm run dev:down` conserva volumen; eliminarlo borra datos locales.

## Lecturas relacionadas {#related}

[Primeros pasos](./getting-started) · [Referencia de la API](./reference/api)
