# Эксплуатация и диагностика

Эта часть для разработки и эксплуатации: локальная среда, контракты и проверки. Для использования продукта читайте руководство пользователя.

## Настройка {#environment}

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

## Автоматический мониторинг {#monitoring}

Мониторинг после первого интервала, без перекрытия на процесс. Интервал/параллелизм — положительные целые. Compose не передаёт автоматически `MONITORING_SCHEDULE_INTERVAL_SECONDS`, `MONITORING_METRICS_CONCURRENCY` из `.env`, нужно явное сопоставление. `/health` проверяет HTTP, не обнаружение/расчёт. Проверьте каталог, данные, логи. Сбой источника не подтверждает удаление; восстановление после трёх корректных наблюдений подряд.

Первое отсутствие в полном корректном снимке подтверждает удаление. Каждый внешний вызов имеет общий предел 30 секунд и максимум три HTTP-попытки, включая первую; повторяются только временные ошибки.

## Войти {#authentication}

Нужны Node.js 24+, npm, Docker Compose v2. Скопируйте `.env.example` в `.env`, выполните `npm run dev`. Compose применяет миграции и пробует обнаружение; сбой источника не мешает запуску API. SMTP нужен для приглашений/подтверждений. Первый Admin: `organizations:create-invitation` в `backend/`, переменные `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Универсальной производственной записи Admin нет.

Первый доступ на сайте состоит из двух этапов: открыть приглашение по `/setup-admin`, указать имя и почту, затем открыть подтверждение по `/confirm-email` и создать пароль. После этого войдите и настройте обязательный аутентификатор администратора. Для недействительных, просроченных или использованных ссылок показано, как запросить новую; токены удаляются из URL и остаются только в памяти страницы. После перезагрузки откройте исходную ссылку из письма. SMTP должен доставлять сообщения в настоящий почтовый ящик; адреса `.test` приведены для примера. В Azure оператор выдаёт первое приглашение из настроенной консоли backend командой `npm run organizations:create-invitation:prod`; приглашённый завершает регистрацию на сайте. `APP_BASE_URL` должен указывать на опубликованный frontend. `frontend/public/staticwebapp.config.json` обеспечивает прямой доступ к размещённым маршрутам.

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

Зарегистрируйте в Google Cloud точный URI `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` лишь включает кнопку, не настраивает backend и не создаёт аккаунты: привязка требует приглашения. `GOOGLE_CLIENT_SECRET`, JWT, pepper, ключи TOTP — секреты backend; используйте независимые значения и храните нужные старые версии. SMTP доставляет приглашения/подтверждения. Поддержка запускает `authentication:recover-admin-totp` после независимой проверки полномочий организации; сессии отзываются, операция аудируется.

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

## Диагностика {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Публикация и восстановление {#release}

Staging из `develop` после CI: API в Azure App Service, frontend в Static Web Apps, проверка endpoint после API. Документация: GitHub Pages, `DOCS_BASE=/ABP-3DSM/`. Перед повтором определите сбойный этап. Автовосстановления БД нет. `npm run dev:down` сохраняет том, удаление тома стирает локальные данные.

## Связанные страницы {#related}

[Начало работы](./getting-started) · [Справочник API](./reference/api)
