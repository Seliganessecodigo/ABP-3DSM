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

El primer acceso por el sitio tiene dos pasos: abrir la invitación en `/setup-admin`, introducir nombre y correo y después abrir la confirmación en `/confirm-email` para crear la contraseña. A continuación, inicia sesión y configura el autenticador obligatorio del Admin. Los enlaces inválidos, caducados o usados indican cómo solicitar otro; los tokens se eliminan de la URL y solo permanecen en la memoria de la página. Tras recargar, abre el enlace original del correo. SMTP debe entregar a un buzón real; las direcciones `.test` son ejemplos. En Azure, el operador envía la primera invitación desde la consola del backend configurado con `npm run organizations:create-invitation:prod`; la persona invitada completa el registro en el sitio. `APP_BASE_URL` debe apuntar al frontend publicado. `frontend/public/staticwebapp.config.json` permite acceder directamente a las rutas alojadas.

En **Usuarios** (`/administration/users`), el administrador consulta las cuentas de la organización y envía invitaciones para Google. **Vincular mi cuenta de Google** rellena el formulario con sus datos; confirma el envío y abre el enlace con la cuenta de Google del mismo correo. La coincidencia del correo no vincula identidades automáticamente. Las cuentas nuevas aparecen tras aceptar; las invitaciones pendientes no son cuentas. Reenviar revoca la invitación anterior. Las cuentas existentes conservan nombre, rol y contraseña; los administradores siguen necesitando TOTP. Staging lee `VITE_GOOGLE_SSO_ENABLED` de las variables de GitHub: activa `true` solo tras configurar credenciales y URLs del backend. `GOOGLE_CALLBACK_URL` usa la dirección pública de la API más `/auth/sso/google/callback`; `SSO_RETURN_URL`, la del frontend más `/sso/callback`.

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
